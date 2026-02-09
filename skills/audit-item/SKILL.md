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

## Item Workflow

Same as `/audit-start`:

1. **Present the item** - Show ID, title, severity, section, description
2. **Show the guide** - Extract from `checklist/checklist/[section]/guide.md`
3. **Run auto-checks** - If available, ask before running
4. **Ask follow-up questions** - If item has `ask_user` questions
5. **Determine status** - Pass/Fail/Partial/Skip/Not Applicable/Blocked
6. **Capture notes** - Optional user notes
7. **Write result file** - Markdown with YAML frontmatter
8. **Update state** - If active audit exists, update `.audit-state.yaml`

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
