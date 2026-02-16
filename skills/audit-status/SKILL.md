---
name: audit-status
description: Show current audit progress including items completed, pass rate, and any blockers or regressions.
---

# Audit Status

You are showing the current audit status.

## Usage

```
/audit-status
/audit-status backend-api
```

## Output

### Active Audit

If an active audit is found (`.audit-state.yaml` exists):

> ## Audit Status: [project-name]
>
> **Started:** [date]
> **Progress:** [X]/[Y] items ([Z]%)
>
> ### By Status
> - Pass: [count]
> - Fail: [count]
> - Partial: [count]
> - Skip: [count]
> - Blocked: [count]
> - Remaining: [count]
>
> ### By Severity
> - Critical: [done]/[total]
> - Recommended: [done]/[total]
>
> ### By Section
> | Section | Done | Total | Status |
> |---------|------|-------|--------|
> | 01 Git Repo | 5 | 5 | Complete |
> | 02 Dependencies | 3 | 7 | In Progress |
> | ... | | | |
>
> ### Regressions
> [If previous audit exists, compare and flag items that passed before but fail now]
>
> ### Blockers
> - [ITEM-ID]: [reason]
>
> ---
> Continue with `/audit-continue`

### No Active Audit

If no `.audit-state.yaml` is found:

> No active audit found.
>
> **Recent audits:**
> | Project | Date | Pass Rate |
> |---------|------|-----------|
> | backend-api | 2026-02-04 | 91% |
> | mobile-app | 2026-01-20 | 78% |
>
> Start a new audit: `/audit-start <project>`

## Reading Results

To generate the status:

1. Find active audit via `.audit-state.yaml` in `audits/*/[latest-date]/`
2. Read `phase` from `.audit-state.yaml` and show phase-specific info:

   If `phase` is `auto-check`:
   > **Phase:** Auto-checking ([N] sections in parallel)
   > **Active sections:** [list from `active_sections`]
   > **Last started:** [last_auto_check_at]

   If `phase` is `interactive`:
   > **Phase:** Interactive review
   > **Current item:** [current_item]

   If `phase` is `complete`:
   > **Phase:** Complete

3. Read all result `.md` files in the audit folder
4. Parse YAML frontmatter from each to get status and severity
5. Group by section using the `section` field in frontmatter
6. Compare against previous audit (if exists) for regressions

## Update STATUS.md

After showing status, update the workspace `STATUS.md` file with current stats:

```markdown
# Workspace Status

**Last updated:** [current date]

## Projects

| Project | Last Audit | Pass Rate |
|---------|------------|-----------|
| [name] | [date] | [rate]% |

## Active Audits

| Project | Progress | Started |
|---------|----------|---------|
| [name] | X/Y (Z%) | [date] |

## Recent Activity

- [date]: Started audit for [project]
- [date]: Completed audit for [project] (X% pass rate)
```
