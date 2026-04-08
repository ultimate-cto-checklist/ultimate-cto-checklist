---
name: audit
description: Main entry point for CTO Checklist audits. Detects workspace state and guides you to the right action — init, org audit, project audit, or resume.
---

# Audit

The main entry point for all audits. This command figures out where you are and what to do next.

## Usage

```
/audit              # Smart routing based on workspace state
/audit org          # Jump straight to org-level audit
/audit <project>    # Jump straight to auditing a specific project
```

## Flow

### 1. Check workspace state

Read the workspace to understand what exists:

- Does `org.yaml` exist? Is it fully configured (has cloud_providers, source_control, etc.) or minimal (just name/slug)?
- Does `checklist/` submodule exist and have content?
- What projects exist in `projects/`?
- Are there any in-progress audits? (Look for `.audit-state.yaml` in `audits/`)
- What completed audits exist? (List dated directories in `audits/`)

### 2. Route based on state

#### If submodule is empty
```bash
git submodule update --init
```
Then continue.

#### If no org.yaml or org.yaml is minimal (just name/slug/created_at)

> Welcome! Before running audits, let's set up your organization context.

Read and follow `checklist/skills/audit-init/SKILL.md`. After init completes, continue to the "ready" state below.

#### If the user specified `org` or a project name

Skip the menu — jump directly to:
- `org` → Go to **Run org audit** below
- `<project>` → Go to **Run project audit** below

#### If there's an in-progress audit

Show it and offer to continue:

> You have an in-progress audit:
>
> **[project-name]** — started [date], [X]/[Y] items done ([Z]%)
>
> 1. **Continue** this audit
> 2. **Start something new** (org audit or different project)

If they choose to continue, read and follow `checklist/skills/audit-continue/SKILL.md`.

#### Ready state (init done, no in-progress audit)

Show a brief status and offer choices:

> **[org-name]** workspace ready.
>
> [If previous audits exist:]
> Last audits:
> - Org: [date] — [score]/100
> - [project]: [date] — [score]/100
>
> [If no audits yet:]
> No audits yet — let's run your first one.
>
> What would you like to do?
>
> 1. **Org audit** — compliance, security, team processes (14 sections)
> 2. **Project audit** — audit a specific repo
>    [List projects from projects/, or "Add a project" if none]
> 3. **Review results** — look at previous audit findings

Wait for the user's choice.

### 3. Execute the chosen action

#### Run org audit

Read and follow `checklist/skills/org-audit/SKILL.md`.

#### Run project audit

If the user picked a project or typed `/audit <project>`:
- Verify the project exists in `projects/`. If not, offer to create it by reading `checklist/skills/audit-add-project/SKILL.md`.
- Then read and follow `checklist/skills/audit-start/SKILL.md` with that project.

#### Review results

Show completed audits and let the user drill in:

> **Completed audits:**
>
> | Type | Date | Score | Items |
> |------|------|-------|-------|
> | Org | 2026-04-08 | 72/100 | 45 pass, 12 fail, 8 partial |
> | acme-api | 2026-04-05 | 85/100 | 90 pass, 5 fail, 3 partial |
>
> Which audit would you like to review? Or run a new one?

If they pick one, show the detailed results from the audit folder. Offer to run `/audit-fix` on failures or `/audit-diff` to compare with a previous run.
