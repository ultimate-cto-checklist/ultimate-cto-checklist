---
name: audit-history
description: Show audit history for a project. Lists past audits with dates, pass rates, and trends.
---

# Audit History

You are showing audit history.

## Usage

```
/audit-history
/audit-history backend-api
```

## Output

### With Project Specified

> ## Audit History: [project-name]
>
> | Date | Items | Pass | Fail | Blocked | Rate |
> |------|-------|------|------|---------|------|
> | 2026-02-04 | 45 | 41 | 2 | 2 | 91.1% |
> | 2026-01-15 | 42 | 32 | 8 | 2 | 76.2% |
> | 2025-12-01 | 38 | 25 | 10 | 3 | 65.8% |
>
> **Trend:** +25.3% improvement over 3 audits
>
> ### Visualization
>
> ```
> Dec '25  ████████████████░░░░░░░░░  65.8%
> Jan '26  ███████████████████░░░░░░  76.2%
> Feb '26  ███████████████████████░░  91.1%
> ```
>
> ### Consistently Failing Items
> These items have failed in multiple audits:
> - [ID]: [Title] (failed 3/3 audits)
> - [ID]: [Title] (failed 2/3 audits)
>
> ---
> Compare audits: `/audit-diff [project] [date1] [date2]`

### Without Project Specified

Show all projects:

> ## Audit History
>
> | Project | Audits | Latest | Score | Trend |
> |---------|--------|--------|-------|-------|
> | backend-api | 3 | 2026-02-04 | 91% | +25% |
> | mobile-app | 2 | 2026-01-20 | 78% | +12% |
> | internal-tools | 1 | 2025-12-01 | 65% | - |
>
> View details: `/audit-history <project>`

### No History

> No audit history for [project].
>
> Start the first audit: `/audit-start [project]`

## How to Build History

1. List date folders in `audits/[project]/` (matching YYYY-MM-DD pattern)
2. For each date folder, read all result `.md` files
3. Parse YAML frontmatter to count pass/fail/blocked
4. Sort by date descending
5. Calculate trend (difference between first and last audit)
6. Find items that fail across multiple audits (consistently failing)
