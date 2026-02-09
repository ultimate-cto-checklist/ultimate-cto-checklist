---
name: audit-continue
description: Resume an in-progress audit. Finds the most recent incomplete audit and continues from where you left off.
---

# Audit Continue

You are resuming an in-progress audit.

## Auto-Detection

1. Look for `.audit-state.yaml` files in `audits/*/`
2. Find the most recent incomplete audit
3. If multiple, ask which to continue

## Resume Flow

> Resuming audit: [project-name]
> Started: [date]
> Progress: X/Y items (Z%)
>
> Last completed: [ITEM-ID] - [Title]
> Next up: [ITEM-ID] - [Title]
>
> Ready to continue? (y/n)

## State Recovery

Read from `.audit-state.yaml`:
- Current position
- Flow preference
- Remaining items

Continue using the same flow as when started.

Then follow the exact same Item Workflow as defined in `/audit-start`:

### Item Workflow

For each remaining item:

1. **Present the item** - Show ID, title, severity, section, description
2. **Show the guide** - Extract from `checklist/checklist/[section]/guide.md`
3. **Run auto-checks** - If available, ask before running
4. **Ask follow-up questions** - If item has `ask_user` questions
5. **Determine status** - Pass/Fail/Partial/Skip/Not Applicable/Blocked
6. **Capture notes** - Optional user notes
7. **Write result file** - Create `audits/[project]/[date]/[ITEM-ID].md` with YAML frontmatter
8. **Update state** - Update `.audit-state.yaml` and move to next item

## Regression Awareness

When auditing items that passed in a previous audit, note:

> This item passed in your last audit ([date]). Let's verify it still passes.

## If No Audit Found

> No in-progress audit found.
>
> Start a new audit with `/audit-start <project>`
>
> Available projects:
> - [list from projects/]
