---
name: audit-start
description: Begin a new audit for a project. Creates dated audit folder and guides through items based on chosen flow.
---

# Audit Start

You are starting a new audit for a project.

**Note:** Usually called from `/audit <project>`, which handles workspace init and project validation. Can also be called directly.

## Usage

```
/audit-start <project-name>
/audit-start              # prompts for project
```

## Pre-flight Checks

1. Verify `org.yaml` exists — if not, read and follow `checklist/skills/audit-init/SKILL.md` first
2. Verify project exists in `projects/` — if not, read and follow `checklist/skills/audit-add-project/SKILL.md`
3. Check for in-progress audit (warn if exists)
4. **Read the project config** (`projects/<name>.yaml`) and extract the `repo` field

## Autonomous Evidence Gathering

**CRITICAL: Do NOT ask the user for evidence you can gather yourself.**

When a project has a `repo` field in its config (e.g., `acme-corp/acme-api`):

1. **Clone the repo** to a temp directory at the start of the audit:
   ```bash
   CLONE_DIR="/tmp/audit-$(date +%s)"
   git clone git@github.com:<owner>/<repo>.git "$CLONE_DIR"
   # Fall back to HTTPS if SSH fails:
   # git clone https://github.com/<owner>/<repo>.git "$CLONE_DIR"
   ```
2. Use the cloned directory for all file-based checks (README, .gitignore, env files, etc.)
3. Use `gh api repos/<owner>/<repo>/...` for GitHub API checks (branch protection, settings, etc.)
4. Spawn subagents for heavy tasks (clone & run, secret scanning, etc.)
5. Only ask the user when you genuinely cannot determine the answer yourself (e.g., "Is this key a sandbox key or production?")
6. Clean up the temp clone when the audit session ends

## Flow Selection

> How would you like to work through the audit?
>
> 1. **Sequential** - Sections in order (1 -> 2 -> 3...)
> 2. **Priority-based** - Critical items first, then recommended
> 3. **Section-at-a-time** - Pick a section, complete it, pick next
> 4. **Free-form** - Jump around, I'll track what's done

## Audit Setup

### Create audit folder

```
audits/[project-name]/[YYYY-MM-DD]/
```

### Determine applicable items

1. Load all items from `checklist/checklist/*/items.yaml`
2. Filter by project scope (from project config)
3. Filter by item scope (project or both, not org-only)
4. Check for waivers - exclude waived items
5. Load any custom items from `custom-items/`

### Track state

Create `.audit-state.yaml` in the audit folder:

```yaml
project: [name]
started_at: [ISO datetime]
flow: [sequential/priority/section/freeform]
phase: [auto-check/interactive/complete]    # Current workflow phase
current_item: [ID or null]                  # Only meaningful during interactive phase
items_total: [count]
items_completed: [count]
items_remaining:
  - [list of item IDs]
active_sections: []                         # Sections being auto-checked by subagents
last_auto_check_at: [ISO datetime or null]  # When parallel phase last ran
```

- **`phase`** — tracks whether we're in `auto-check` (parallel subagents), `interactive` (sequential user review), or `complete`
- **`current_item`** — only used during `interactive` phase; set to `null` during `auto-check`
- **`active_sections`** — section numbers currently being processed by subagents; cleared when phase ends
- **`last_auto_check_at`** — timestamp for detecting stale in-flight work on crash recovery

## Parallel Auto-Check Phase

After setup is complete and the repo is cloned:

### 1. Group remaining items by section

Items from the same section share the same `guide.md`, so group them together.

### 2. Update state for auto-check phase

Before launching subagents, update `.audit-state.yaml`:
```yaml
phase: auto-check
active_sections: [list of section numbers being dispatched]
current_item: null
last_auto_check_at: [current ISO datetime]
```

### 3. Launch parallel subagents

Launch one subagent per section (or group of small sections), up to **8 concurrent agents**.

Each subagent receives this prompt:

```
You are auditing section [N]: [Name] for project [project-name].

Repo cloned at: [clone_dir]
Repo: [owner]/[repo]

Items to check:
[list of item IDs and titles]

Guide: Read checklist/checklist/[section]/guide.md for verification steps.
Items: Read checklist/checklist/[section]/items.yaml for item details.

For EACH item:
1. Read the guide.md section for this item
2. Run the verification commands in [clone_dir]
3. Use `gh api repos/[owner]/[repo]/...` for GitHub API checks
4. Determine status: pass / fail / partial / blocked
5. Write result to audits/[project]/[date]/[ITEM-ID].md following
   checklist/schema/audit-result.schema.yaml (item_id not id, lowercase
   status, ## Summary required, ## Evidence required, ## Reason for
   Failure/Partial required per status)
6. Validate the result file: run `npx tsx checklist/schema/validate.ts <path> --fix`
   and fix any errors before moving to the next item

If you CANNOT determine the result autonomously (needs user judgment,
needs access you don't have, subjective quality call), set status
to `blocked` and explain what you need from the user in the Summary.

Return a summary: {item_id, status, one-line evidence} for each item.
```

### 4. Collect results and update state

```
## Auto-Check Results

**Completed:** X items across Y sections
**Pass:** A | **Fail:** B | **Partial:** C | **Blocked:** D

### Failures (require attention):
- SEC-005: HSTS header missing (FAIL)
- GIT-017: Found potential secrets (FAIL)

### Blocked — Needs Your Input (Z items):
- PERF-003: Is this response time acceptable?
- PROC-002: What's your deployment approval process?

Review auto-check results? (y = review details / n = accept and continue)
```

After collecting all subagent results, update `.audit-state.yaml`:
```yaml
phase: interactive       # or 'complete' if no blocked items remain
active_sections: []
items_completed: [updated count from result files on disk]
items_remaining: [only blocked items]
```

### 5. User reviews

The user can:
- **Accept all** — auto-checked results are finalized
- **Review failures** — drill into specific failures to override or add notes
- **Drill into any item** — inspect evidence and change status if needed

### 6. Continue to interactive items

Items marked `blocked` are processed sequentially using the Interactive Item Workflow below.

---

## Interactive Item Workflow

For items that couldn't be auto-resolved (marked `blocked` or skipped by subagents):

### 1. Present the item

```
## [ITEM-ID]: [Title]
**Severity:** [Critical/Recommended]
**Section:** [Section name]

[Description from items.yaml]

---
```

### 2. Show the guide

Extract the item's section from `checklist/checklist/[section]/guide.md`

### 3. Run auto-checks (if available)

If item has `auto_checks`, run them and show results.

### 4. Ask follow-up questions (if needed)

If item has `ask_user` questions, ask them.

### 5. Determine status

> Based on the checks, what's the status?
>
> 1. **Pass** - Meets all criteria
> 2. **Fail** - Does not meet criteria
> 3. **Partial** - Some criteria met
> 4. **Waived** - Doesn't apply (requires waiver via `/audit-waiver`)
> 5. **Blocked** - Can't verify (access issue, dependency)

### 6. Capture notes

> Any notes to add? (Enter to skip)

### 7. Write result file

Create `audits/[project]/[date]/[ITEM-ID].md` following `checklist/schema/audit-result.schema.yaml`.

Key rules:
- Use `item_id` (not `id`) in frontmatter
- Status must be **lowercase**: `pass`, `fail`, `partial`, `blocked`, `waived`
- Filename must match `item_id` (e.g., `GIT-001.md`)
- `## Summary` is **required for all statuses** — 1-3 sentences explaining the result
- `## Evidence` is required for pass/fail/partial
- `## Reason for Failure` is required for fail
- `## Reason for Partial` is required for partial
- `## Recommendations` and `## Notes` are optional

### 7b. Validate result file

Run `npx tsx checklist/schema/validate.ts <result-file-path> --fix` and fix any errors before continuing.

### 8. Update state and continue

Update `.audit-state.yaml` and move to next item.

## Regression Check

If previous audit exists, compare:
- Items that passed before but might fail now
- Flag these prominently

## Session End

When user wants to stop:

> Audit progress saved!
>
> **Completed:** X/Y items (Z%)
> **Remaining:** [count] items
>
> Resume anytime with `/audit-continue`
