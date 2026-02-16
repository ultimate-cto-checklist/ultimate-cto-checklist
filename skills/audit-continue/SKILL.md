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
- `phase` (auto-check / interactive / complete)
- Flow preference
- Remaining items

### If phase is `auto-check` (interrupted parallel run)

> ⚠ Previous auto-check was interrupted.
> Checking which items completed before interruption...

1. Diff `items_remaining` against existing result files on disk (`audits/<project>/<date>/<ITEM-ID>.md`)
2. Items WITH result files → completed (remove from `items_remaining`)
3. Items WITHOUT result files → need re-checking
4. Update `items_completed` count from result file count
5. Re-launch parallel auto-check on truly remaining items (proceeds to auto-check phase below)

### If phase is `interactive`

> Resuming interactive review...
> Last item: [current_item]
> Remaining: [count] items needing review

Continue from `current_item` in interactive workflow (skip to Interactive Item Workflow below).

### If phase is `complete`

> This audit is already complete.
> Start a new audit with `/audit-start`

---

Continue using the same flow as when started.

### Autonomous Evidence Gathering

**Before starting the first item**, read the project config (`projects/<name>.yaml`) and clone the repo:
```bash
CLONE_DIR="/tmp/audit-$(date +%s)"
git clone git@github.com:<owner>/<repo>.git "$CLONE_DIR"
# Fall back to HTTPS if SSH fails
```
Reuse this clone for all items. Do NOT ask the user for evidence you can gather yourself.

### Parallel Auto-Check on Remaining Items

Before walking through items interactively, run the parallel auto-check phase on remaining items:

1. **Diff `items_remaining` against existing result files** — skip items that already have result files on disk (`audits/<project>/<date>/<ITEM-ID>.md`)
2. **Group the truly remaining items by section**
3. **Launch parallel subagents** (up to 8 concurrent) — one per section, using the same subagent prompt template as `/audit-start`
4. **Present batch summary** of auto-check results
5. **User reviews** — accept all, review failures, or drill into specifics

### Interactive Item Workflow

For items marked `needs-review` by subagents (or items the user wants to revisit):

1. **Present the item** - Show ID, title, severity, section, description
2. **Show the guide** - Extract from `checklist/checklist/[section]/guide.md`
3. **Run auto-checks** - Run checks against the clone, don't ask the user for evidence
4. **Ask follow-up questions** - Only if you genuinely cannot determine the answer from the codebase
5. **Determine status** - Pass/Fail/Partial/Skip/Not Applicable/Blocked
6. **Capture notes** - Optional user notes
7. **Write result file** - Create `audits/[project]/[date]/[ITEM-ID].md` per `checklist/schema/audit-result.schema.yaml` (item_id not id, lowercase status, always include ## Summary, required headings per status)
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
