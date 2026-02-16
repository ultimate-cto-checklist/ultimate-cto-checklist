---
name: audit-item
description: Jump to a specific checklist item by ID. Useful for re-auditing a specific item or checking something out of order.
---

# Audit Item

You are jumping to a specific audit item.

## Usage

```
/audit-item GIT-005
/audit-item COST-001
```

## Flow

1. Parse the item ID from args
2. Find the item in `checklist/checklist/*/items.yaml` files
3. Determine if it's org-level or project-level (check `default_scope` and item `scope`)
4. If project-level, ask which project (if multiple configured in `projects/`)
5. Show the item and run through the standard item workflow (same as `/audit-start`)
6. Save result to appropriate audit folder:
   - Org-level: `audits/_org/[YYYY-MM-DD]/[ITEM-ID].md`
   - Project-level: `audits/[project]/[YYYY-MM-DD]/[ITEM-ID].md`

## Autonomous Evidence Gathering

**CRITICAL: Do NOT ask the user for evidence you can gather yourself.**

Before running the item workflow:

1. **Read the project config** (`projects/<name>.yaml`) and extract the `repo` field
2. If the item requires codebase access, **clone the repo** to a temp directory:
   ```bash
   CLONE_DIR="/tmp/audit-$(date +%s)"
   git clone git@github.com:<owner>/<repo>.git "$CLONE_DIR"
   # Fall back to HTTPS if SSH fails
   ```
3. Use the cloned directory for all file-based checks
4. Use `gh api repos/<owner>/<repo>/...` for GitHub API checks
5. Only ask the user when you genuinely cannot determine the answer yourself

## Item Workflow

Same as `/audit-start`:

1. **Present the item** - Show ID, title, severity, section, description
2. **Show the guide** - Extract from `checklist/checklist/[section]/guide.md`
3. **Run auto-checks** - Clone the repo and run checks yourself, don't ask the user for evidence
4. **Ask follow-up questions** - Only if you genuinely cannot determine the answer from the codebase
5. **Determine status** - Pass/Fail/Partial/Skip/Not Applicable/Blocked
6. **Capture notes** - Optional user notes
7. **Write result file** - Per `checklist/schema/audit-result.schema.yaml` (item_id not id, lowercase status, always include ## Summary, required headings per status)
8. **Validate result file** - Run `npx tsx checklist/schema/validate.ts <result-file-path> --fix` and fix any errors before continuing
9. **Update state** - If active audit exists, update `.audit-state.yaml`:
   - If `phase` is `auto-check`: do NOT update `current_item` (parallel work in progress).
     Just remove the item from `items_remaining` and increment `items_completed`.
   - If `phase` is `interactive`: update `current_item` to the next remaining item as before.

## If No Active Audit

> No active audit. Create a one-off check or start an audit?
>
> 1. One-off check (save to today's folder)
> 2. Start full audit with `/audit-start`

## Item Not Found

If the exact ID isn't found, search for similar items:

> Item "[ID]" not found.
>
> Did you mean:
> - GIT-005: Branch protections configured
> - GIT-006: ...
>
> Or search by keyword: `/audit-item --search "branch"`

## Search Mode

If `--search` flag is used, search item titles and descriptions:

```
/audit-item --search "branch protection"
```

Show matching items and let user select one.
