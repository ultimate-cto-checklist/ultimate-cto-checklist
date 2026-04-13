"use server";

import { auth, getGitHubToken } from "@/lib/auth";
import { requireOrg } from "@/lib/auth/guard";
import { Octokit } from "octokit";
import { revalidatePath } from "next/cache";
import { getSkillTreeEntries, SKILL_NAMES } from "@/lib/audit/workspace-skills";

// In-memory cache for workspace health checks (5 min TTL)
const healthCache = new Map<string, { checks: WorkspaceCheck[]; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000;

const CHECKLIST_REPO = "ultimate-cto-checklist/ultimate-cto-checklist";
const CHECKLIST_SUBMODULE_PATH = "checklist";

export type CheckStatus = "pass" | "fail" | "warn";

export type WorkspaceCheck = {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
  fixable: boolean;
};

/**
 * Run all workspace health checks against the connected repo.
 * Results are cached for 5 minutes per org to avoid repeated GitHub API calls.
 */
export async function auditWorkspace(orgSlug: string): Promise<WorkspaceCheck[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const { org } = await requireOrg(orgSlug);
  if (!org.workspaceRepo) return [];

  const token = await getGitHubToken(session.user.id);
  if (!token) {
    return [{
      id: "token",
      label: "GitHub access",
      status: "fail",
      detail: "GitHub token is missing. Please sign out and sign in again.",
      fixable: false,
    }];
  }

  // Check cache
  const cached = healthCache.get(org.id);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.checks;
  }

  const checks = await runWorkspaceChecks(org.workspaceRepo!, org.slug, token);
  healthCache.set(org.id, { checks, expiresAt: Date.now() + CACHE_TTL });
  return checks;
}

/** Invalidate the cached health check for an org. */
export async function invalidateWorkspaceHealth(orgId: string) {
  healthCache.delete(orgId);
}

async function runWorkspaceChecks(workspaceRepo: string, orgSlug: string, token: string): Promise<WorkspaceCheck[]> {
  const octokit = new Octokit({ auth: token });
  const [owner, repo] = workspaceRepo.split("/");
  const checks: WorkspaceCheck[] = [];

  // 1. Repo accessible
  let repoExists = false;
  try {
    await octokit.rest.repos.get({ owner, repo });
    repoExists = true;
    checks.push({
      id: "repo-access",
      label: "Repository accessible",
      status: "pass",
      detail: `${workspaceRepo} is accessible.`,
      fixable: false,
    });
  } catch {
    checks.push({
      id: "repo-access",
      label: "Repository accessible",
      status: "fail",
      detail: `Cannot access ${workspaceRepo}. It may have been deleted or permissions revoked.`,
      fixable: false,
    });
    return checks; // No point checking further
  }

  // 2. Checklist submodule (checks .gitmodules + submodule entry + version together)
  let hasGitmodules = false;
  let gitmodulesCorrect = false;
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner, repo, path: ".gitmodules",
    });
    if ("content" in data) {
      hasGitmodules = true;
      gitmodulesCorrect = Buffer.from(data.content, "base64").toString().includes(CHECKLIST_REPO);
    }
  } catch {}

  let submoduleSha: string | null = null;
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner, repo, path: CHECKLIST_SUBMODULE_PATH,
    });
    if ("sha" in data && !("content" in data)) {
      submoduleSha = data.sha;
    }
  } catch {}

  let latestTagSha: string | null = null;
  let latestTagName: string | null = null;
  try {
    const { data: tags } = await octokit.rest.repos.listTags({
      owner: CHECKLIST_REPO.split("/")[0],
      repo: CHECKLIST_REPO.split("/")[1],
      per_page: 1,
    });
    if (tags.length > 0) {
      latestTagSha = tags[0].commit.sha;
      latestTagName = tags[0].name;
    }
  } catch {}

  if (!hasGitmodules || !gitmodulesCorrect || !submoduleSha) {
    checks.push({
      id: "submodule",
      label: "Checklist submodule",
      status: "fail",
      detail: `The checklist submodule (${CHECKLIST_REPO}) is not set up.`,
      fixable: true,
    });
  } else if (latestTagSha && submoduleSha !== latestTagSha) {
    checks.push({
      id: "submodule",
      label: "Checklist submodule",
      status: "warn",
      detail: `Update available: ${latestTagName} (${latestTagSha!.slice(0, 7)}). Current: ${submoduleSha.slice(0, 7)}.`,
      fixable: true,
    });
  } else {
    checks.push({
      id: "submodule",
      label: "Checklist submodule",
      status: "pass",
      detail: `Up to date${latestTagName ? ` (${latestTagName})` : ` (${(submoduleSha || "").slice(0, 7)})`}.`,
      fixable: false,
    });
  }

  // 4. org.yaml exists and matches
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner, repo, path: "org.yaml",
    });
    if ("content" in data) {
      const content = Buffer.from(data.content, "base64").toString();
      if (content.includes(`slug: ${orgSlug}`)) {
        checks.push({
          id: "org-yaml",
          label: "Organization config (org.yaml)",
          status: "pass",
          detail: "org.yaml exists and matches this organization.",
          fixable: false,
        });
      } else {
        checks.push({
          id: "org-yaml",
          label: "Organization config (org.yaml)",
          status: "warn",
          detail: "org.yaml exists but the slug doesn't match this organization.",
          fixable: true,
        });
      }
    }
  } catch {
    checks.push({
      id: "org-yaml",
      label: "Organization config (org.yaml)",
      status: "fail",
      detail: "Missing org.yaml file.",
      fixable: true,
    });
  }

  // 5. Directory structure
  const requiredDirs = [
    { path: "projects", label: "projects/ directory" },
    { path: "audits", label: "audits/ directory" },
    { path: "waivers", label: "waivers/ directory" },
  ];

  for (const dir of requiredDirs) {
    try {
      await octokit.rest.repos.getContent({ owner, repo, path: dir.path });
      checks.push({
        id: `dir-${dir.path}`,
        label: dir.label,
        status: "pass",
        detail: `${dir.path}/ exists.`,
        fixable: false,
      });
    } catch {
      checks.push({
        id: `dir-${dir.path}`,
        label: dir.label,
        status: "fail",
        detail: `Missing ${dir.path}/ directory.`,
        fixable: true,
      });
    }
  }

  // 6. audits/_org/ directory
  try {
    await octokit.rest.repos.getContent({ owner, repo, path: "audits/_org" });
    checks.push({
      id: "dir-audits-org",
      label: "audits/_org/ directory",
      status: "pass",
      detail: "audits/_org/ exists for org-level audits.",
      fixable: false,
    });
  } catch {
    checks.push({
      id: "dir-audits-org",
      label: "audits/_org/ directory",
      status: "fail",
      detail: "Missing audits/_org/ directory for org-level audits.",
      fixable: true,
    });
  }

  // 7. Claude Code skills installed
  let skillsFound = 0;
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner, repo, path: ".claude/skills",
    });
    if (Array.isArray(data)) {
      skillsFound = data.filter((d) => d.type === "dir").length;
    }
  } catch {}

  if (skillsFound === 0) {
    checks.push({
      id: "skills",
      label: "Claude Code skills",
      status: "fail",
      detail: "No audit skills installed. Users won't be able to run /org-audit or other commands.",
      fixable: true,
    });
  } else if (skillsFound < SKILL_NAMES.length) {
    checks.push({
      id: "skills",
      label: "Claude Code skills",
      status: "warn",
      detail: `${skillsFound}/${SKILL_NAMES.length} skills installed. Some commands may be missing.`,
      fixable: true,
    });
  } else {
    checks.push({
      id: "skills",
      label: "Claude Code skills",
      status: "pass",
      detail: `All ${SKILL_NAMES.length} audit skills installed.`,
      fixable: false,
    });
  }

  return checks;
}

/**
 * Fix a specific workspace issue.
 */
export async function fixWorkspaceIssue(orgSlug: string, checkId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const { org } = await requireOrg(orgSlug);
  if (!org.workspaceRepo) throw new Error("No workspace configured");

  const token = await getGitHubToken(session.user.id);
  if (!token) throw new Error("GitHub token missing");

  const octokit = new Octokit({ auth: token });
  const [owner, repo] = org.workspaceRepo.split("/");

  // Get current HEAD
  const { data: ref } = await octokit.rest.git.getRef({
    owner, repo, ref: "heads/main",
  }).catch(() => octokit.rest.git.getRef({ owner, repo, ref: "heads/master" }));
  const baseSha = ref.object.sha;

  const treeEntries: any[] = [];

  if (checkId === "submodule") {
    // Fix submodule: point to latest tag (or fall back to HEAD)
    const [checklistOwner, checklistRepo] = CHECKLIST_REPO.split("/");
    let targetSha: string;
    try {
      const { data: tags } = await octokit.rest.repos.listTags({
        owner: checklistOwner, repo: checklistRepo, per_page: 1,
      });
      targetSha = tags[0].commit.sha;
    } catch {
      const { data: checklistRef } = await octokit.rest.git.getRef({
        owner: checklistOwner, repo: checklistRepo, ref: "heads/main",
      });
      targetSha = checklistRef.object.sha;
    }

    const gitmodules = [
      `[submodule "${CHECKLIST_SUBMODULE_PATH}"]`,
      `\tpath = ${CHECKLIST_SUBMODULE_PATH}`,
      `\turl = https://github.com/${CHECKLIST_REPO}.git`,
    ].join("\n") + "\n";

    treeEntries.push({
      path: ".gitmodules",
      mode: "100644",
      type: "blob",
      content: gitmodules,
    });
    treeEntries.push({
      path: CHECKLIST_SUBMODULE_PATH,
      mode: "160000",
      type: "commit",
      sha: targetSha,
    });
  }

  if (checkId === "org-yaml") {
    const orgYaml = [
      `name: ${org.name}`,
      `slug: ${org.slug}`,
      `created_at: ${new Date().toISOString()}`,
    ].join("\n");

    treeEntries.push({
      path: "org.yaml",
      mode: "100644",
      type: "blob",
      content: orgYaml,
    });
  }

  if (checkId === "dir-projects") {
    treeEntries.push({ path: "projects/.gitkeep", mode: "100644", type: "blob", content: "" });
  }

  if (checkId === "dir-audits") {
    treeEntries.push({ path: "audits/_org/.gitkeep", mode: "100644", type: "blob", content: "" });
  }

  if (checkId === "dir-audits-org") {
    treeEntries.push({ path: "audits/_org/.gitkeep", mode: "100644", type: "blob", content: "" });
  }

  if (checkId === "dir-waivers") {
    treeEntries.push({ path: "waivers/.gitkeep", mode: "100644", type: "blob", content: "" });
  }

  if (checkId === "skills") {
    treeEntries.push(...getSkillTreeEntries());
  }

  if (treeEntries.length === 0) {
    throw new Error("No fix available for this issue.");
  }

  // Create tree, commit, update ref
  const { data: tree } = await octokit.rest.git.createTree({
    owner, repo, base_tree: baseSha, tree: treeEntries,
  });

  const { data: commit } = await octokit.rest.git.createCommit({
    owner, repo,
    message: `fix: workspace health check — ${checkId}`,
    tree: tree.sha,
    parents: [baseSha],
  });

  await octokit.rest.git.updateRef({
    owner, repo, ref: "heads/main", sha: commit.sha,
  }).catch(() =>
    octokit.rest.git.updateRef({ owner, repo, ref: "heads/master", sha: commit.sha })
  );

  invalidateWorkspaceHealth(org.id);
  revalidatePath(`/${orgSlug}/settings/workspace`);
  return { success: true };
}

/**
 * Fix ALL failing workspace issues in a single commit.
 */
export async function fixAllWorkspaceIssues(orgSlug: string, checkIds: string[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const { org } = await requireOrg(orgSlug);
  if (!org.workspaceRepo) throw new Error("No workspace configured");

  const token = await getGitHubToken(session.user.id);
  if (!token) throw new Error("GitHub token missing");

  const octokit = new Octokit({ auth: token });
  const [owner, repo] = org.workspaceRepo.split("/");

  const { data: ref } = await octokit.rest.git.getRef({
    owner, repo, ref: "heads/main",
  }).catch(() => octokit.rest.git.getRef({ owner, repo, ref: "heads/master" }));
  const baseSha = ref.object.sha;

  const treeEntries: any[] = [];
  const needsSubmodule = checkIds.includes("submodule");

  if (needsSubmodule) {
    const [checklistOwner, checklistRepo] = CHECKLIST_REPO.split("/");
    let targetSha: string;
    try {
      const { data: tags } = await octokit.rest.repos.listTags({
        owner: checklistOwner, repo: checklistRepo, per_page: 1,
      });
      targetSha = tags[0].commit.sha;
    } catch {
      const { data: checklistRef } = await octokit.rest.git.getRef({
        owner: checklistOwner, repo: checklistRepo, ref: "heads/main",
      });
      targetSha = checklistRef.object.sha;
    }

    treeEntries.push({
      path: ".gitmodules",
      mode: "100644",
      type: "blob",
      content: [
        `[submodule "${CHECKLIST_SUBMODULE_PATH}"]`,
        `\tpath = ${CHECKLIST_SUBMODULE_PATH}`,
        `\turl = https://github.com/${CHECKLIST_REPO}.git`,
      ].join("\n") + "\n",
    });
    treeEntries.push({
      path: CHECKLIST_SUBMODULE_PATH,
      mode: "160000",
      type: "commit",
      sha: targetSha,
    });
  }

  if (checkIds.includes("org-yaml")) {
    treeEntries.push({
      path: "org.yaml",
      mode: "100644",
      type: "blob",
      content: `name: ${org.name}\nslug: ${org.slug}\ncreated_at: ${new Date().toISOString()}\n`,
    });
  }

  const dirMap: Record<string, string> = {
    "dir-projects": "projects/.gitkeep",
    "dir-audits": "audits/_org/.gitkeep",
    "dir-audits-org": "audits/_org/.gitkeep",
    "dir-waivers": "waivers/.gitkeep",
  };

  for (const id of checkIds) {
    if (dirMap[id]) {
      treeEntries.push({ path: dirMap[id], mode: "100644", type: "blob", content: "" });
    }
  }

  if (checkIds.includes("skills")) {
    treeEntries.push(...getSkillTreeEntries());
  }

  if (treeEntries.length === 0) return { success: true };

  const { data: tree } = await octokit.rest.git.createTree({
    owner, repo, base_tree: baseSha, tree: treeEntries,
  });

  const { data: commit } = await octokit.rest.git.createCommit({
    owner, repo,
    message: `fix: resolve ${checkIds.length} workspace health issue(s)`,
    tree: tree.sha,
    parents: [baseSha],
  });

  await octokit.rest.git.updateRef({
    owner, repo, ref: "heads/main", sha: commit.sha,
  }).catch(() =>
    octokit.rest.git.updateRef({ owner, repo, ref: "heads/master", sha: commit.sha })
  );

  invalidateWorkspaceHealth(org.id);
  revalidatePath(`/${orgSlug}/settings/workspace`);
  return { success: true };
}
