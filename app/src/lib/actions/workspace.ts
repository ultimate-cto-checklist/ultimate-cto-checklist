"use server";

import { auth, getGitHubToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireOrg } from "@/lib/auth/guard";
import { revalidatePath } from "next/cache";
import { Octokit } from "octokit";
import { getSkillTreeEntries } from "@/lib/audit/workspace-skills";

// ============================================================
// Read operations (called server-side from pages)
// ============================================================

export type GitHubOwner = { login: string; type: "user" | "org" };

/**
 * Fetch GitHub accounts the user can create repos under.
 * Returns null if the token is missing or lacks permissions (signals re-auth needed).
 */
export async function getGitHubOwners(): Promise<GitHubOwner[] | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const token = await getGitHubToken(session.user.id);
  if (!token) return null;

  const octokit = new Octokit({ auth: token });

  try {
    const { data: ghUser } = await octokit.rest.users.getAuthenticated();

    let ghOrgs: { login: string }[] = [];
    try {
      const { data } = await octokit.rest.orgs.listForAuthenticatedUser();
      ghOrgs = data;
    } catch {
      // read:org scope missing — just show personal account
    }

    return [
      { login: ghUser.login, type: "user" },
      ...ghOrgs.map((o) => ({ login: o.login, type: "org" as const })),
    ];
  } catch {
    return null;
  }
}

export type GitHubRepo = { fullName: string; private: boolean; description: string | null };

/**
 * Fetch repos the user has write access to (for the connect dropdown).
 * Returns null if token is missing.
 */
export async function getGitHubRepos(): Promise<GitHubRepo[] | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const token = await getGitHubToken(session.user.id);
  if (!token) return null;

  const octokit = new Octokit({ auth: token });

  try {
    // Fetch repos with push access (write), sorted by most recently updated
    const repos = await octokit.paginate(
      octokit.rest.repos.listForAuthenticatedUser,
      { sort: "updated", direction: "desc", per_page: 100 },
      (response, done) => {
        // Stop after 200 repos to keep it fast
        if (response.data.length >= 200) done();
        return response.data;
      },
    );

    return repos
      .filter((r) => r.permissions?.push || r.permissions?.admin)
      .map((r) => ({
        fullName: r.full_name,
        private: r.private,
        description: r.description,
      }));
  } catch {
    return null;
  }
}

// ============================================================
// Write operations (server actions)
// ============================================================

/**
 * Create a new workspace repo on GitHub and initialize it.
 */
export async function createWorkspaceRepo(
  orgSlug: string,
  owner: string,
  repoName: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const { org } = await requireOrg(orgSlug);
  if (org.workspaceRepo) throw new Error("Workspace already configured");

  const token = await getGitHubToken(session.user.id);
  if (!token) throw new Error("GitHub connection lost. Please sign out and sign in again.");

  const octokit = new Octokit({ auth: token });
  const name = repoName.trim() || "cto-workspace";
  const fullName = `${owner}/${name}`;

  // Determine if owner is user or org
  const { data: ghUser } = await octokit.rest.users.getAuthenticated();
  const isPersonal = owner === ghUser.login;

  try {
    if (isPersonal) {
      await octokit.rest.repos.createForAuthenticatedUser({
        name,
        description: `CTO Checklist workspace for ${org.name}`,
        private: true,
        auto_init: true,
      });
    } else {
      await octokit.rest.repos.createInOrg({
        org: owner,
        name,
        description: `CTO Checklist workspace for ${org.name}`,
        private: true,
        auto_init: true,
      });
    }
  } catch (err: any) {
    if (err.status === 422) {
      throw new Error(
        `The repo "${fullName}" already exists. Choose a different name or connect the existing repo instead.`
      );
    }
    if (err.status === 403) {
      throw new Error(
        `You don't have permission to create repos in "${owner}". Ask an org admin to grant you access.`
      );
    }
    throw new Error(`Failed to create repo: ${err.message}`);
  }

  // Initialize workspace structure
  await initializeWorkspaceFiles(octokit, owner, name, org.name, org.slug);

  // Save to org
  await db
    .update(organizations)
    .set({ workspaceRepo: fullName })
    .where(eq(organizations.id, org.id));

  revalidatePath(`/${orgSlug}`);
  return { success: true, repo: fullName };
}

/**
 * Connect an existing GitHub repo as the workspace.
 */
export async function connectWorkspaceRepo(
  orgSlug: string,
  repoFullName: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const { org } = await requireOrg(orgSlug);
  if (org.workspaceRepo) throw new Error("Workspace already configured");

  if (!repoFullName || !repoFullName.includes("/")) {
    throw new Error("Enter the repo as owner/repo (e.g. acme/cto-workspace).");
  }

  const token = await getGitHubToken(session.user.id);
  if (!token) throw new Error("GitHub connection lost. Please sign out and sign in again.");

  const octokit = new Octokit({ auth: token });
  const [owner, repo] = repoFullName.split("/");

  try {
    await octokit.rest.repos.get({ owner, repo });
  } catch (err: any) {
    if (err.status === 404) {
      throw new Error(
        `"${repoFullName}" doesn't exist or you don't have access. Check the name and try again.`
      );
    }
    throw new Error(`Failed to access repo: ${err.message}`);
  }

  // Check if org.yaml exists — if not, initialize
  try {
    await octokit.rest.repos.getContent({ owner, repo, path: "org.yaml" });
  } catch {
    await initializeWorkspaceFiles(octokit, owner, repo, org.name, org.slug);
  }

  await db
    .update(organizations)
    .set({ workspaceRepo: repoFullName })
    .where(eq(organizations.id, org.id));

  revalidatePath(`/${orgSlug}`);
  return { success: true, repo: repoFullName };
}

// ============================================================
// Helpers
// ============================================================

const CHECKLIST_REPO = "ultimate-cto-checklist/ultimate-cto-checklist";
const CHECKLIST_SUBMODULE_PATH = "checklist";

/**
 * Initialize workspace files in a single commit using the Git Data API.
 * This allows us to add a proper git submodule (which the Contents API can't do).
 */
async function initializeWorkspaceFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  orgName: string,
  orgSlug: string
) {
  // 1. Get the latest commit SHA on the default branch
  const { data: ref } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: "heads/main",
  }).catch(() =>
    // Some repos default to master
    octokit.rest.git.getRef({ owner, repo, ref: "heads/master" })
  );
  const baseSha = ref.object.sha;

  // 2. Get the latest tagged release of the checklist repo (for submodule pointer)
  const [checklistOwner, checklistRepo] = CHECKLIST_REPO.split("/");
  let checklistSha: string;
  try {
    const { data: tags } = await octokit.rest.repos.listTags({
      owner: checklistOwner, repo: checklistRepo, per_page: 1,
    });
    checklistSha = tags[0].commit.sha;
  } catch {
    const { data: checklistRef } = await octokit.rest.git.getRef({
      owner: checklistOwner, repo: checklistRepo, ref: "heads/main",
    });
    checklistSha = checklistRef.object.sha;
  }

  // 3. Build all file blobs
  const orgYaml = [
    `name: ${orgName}`,
    `slug: ${orgSlug}`,
    `created_at: ${new Date().toISOString()}`,
  ].join("\n");

  const readmeContent = [
    `# ${orgName} — CTO Workspace`,
    "",
    "This repository stores audit results from [CTO Checklist](https://www.cto-checklist.com).",
    "",
    "## Structure",
    "",
    "```",
    `${repo}/`,
    "├── checklist/            # CTO Checklist (submodule)",
    "├── org.yaml              # Organization config",
    "├── projects/             # Project configurations",
    "│   └── <project>.yaml",
    "├── audits/               # Audit results",
    "│   ├── _org/             # Org-level audits",
    "│   │   └── <date>/",
    "│   └── <project>/       # Project-level audits",
    "│       └── <date>/",
    "│           └── <ITEM-ID>.md",
    "└── waivers/              # Accepted risk waivers",
    "```",
    "",
    "Each audit result is a markdown file with YAML frontmatter containing the status, evidence, and recommendations.",
  ].join("\n");

  const gitmodules = [
    `[submodule "${CHECKLIST_SUBMODULE_PATH}"]`,
    `\tpath = ${CHECKLIST_SUBMODULE_PATH}`,
    `\turl = https://github.com/${CHECKLIST_REPO}.git`,
  ].join("\n") + "\n";

  // 4. Create the tree with all files + submodule in one shot
  const { data: tree } = await octokit.rest.git.createTree({
    owner,
    repo,
    base_tree: baseSha,
    tree: [
      {
        path: "README.md",
        mode: "100644",
        type: "blob",
        content: readmeContent,
      },
      {
        path: "org.yaml",
        mode: "100644",
        type: "blob",
        content: orgYaml,
      },
      {
        path: ".gitmodules",
        mode: "100644",
        type: "blob",
        content: gitmodules,
      },
      // Submodule entry: mode 160000, type "commit"
      {
        path: CHECKLIST_SUBMODULE_PATH,
        mode: "160000",
        type: "commit",
        sha: checklistSha,
      },
      // Directory placeholders
      {
        path: "projects/.gitkeep",
        mode: "100644",
        type: "blob",
        content: "",
      },
      {
        path: "audits/_org/.gitkeep",
        mode: "100644",
        type: "blob",
        content: "",
      },
      {
        path: "waivers/.gitkeep",
        mode: "100644",
        type: "blob",
        content: "",
      },
      // Claude Code skill wrappers (reference checklist submodule skills)
      ...getSkillTreeEntries(),
    ],
  });

  // 5. Create the commit
  const { data: commit } = await octokit.rest.git.createCommit({
    owner,
    repo,
    message: "Initialize CTO Checklist workspace",
    tree: tree.sha,
    parents: [baseSha],
  });

  // 6. Update the branch ref to point to the new commit
  await octokit.rest.git.updateRef({
    owner,
    repo,
    ref: "heads/main",
    sha: commit.sha,
  }).catch(() =>
    octokit.rest.git.updateRef({
      owner,
      repo,
      ref: "heads/master",
      sha: commit.sha,
    })
  );
}
