---
name: audit-diff
description: Compare two audits and show what changed. Highlights improvements, regressions, and new items.
---

# Audit Diff

You are comparing two audits.

## Usage

```
/audit-diff backend-api 2026-01-15 2026-02-04
/audit-diff backend-api   # compares two most recent
```

## Output

> ## Audit Comparison: [project-name]
>
> **From:** [date1]
> **To:** [date2]
>
> ---
>
> ### Improvements ([count] items fixed)
>
> | Item | Title | Was | Now |
> |------|-------|-----|-----|
> | GIT-003 | Branch naming convention | fail | pass |
> | AUTH-002 | Token rotation | fail | pass |
> | DB-004 | Connection pooling | fail | pass |
>
> ### Regressions ([count] items)
>
> | Item | Title | Was | Now |
> |------|-------|-----|-----|
> | (none) | | | |
>
> ### New Items Audited ([count])
>
> | Item | Title | Status |
> |------|-------|--------|
> | COST-001 | Budget alerts | pass |
> | COST-002 | Anomaly detection | fail |
>
> ### Still Failing ([count])
>
> | Item | Title | Audits Failed |
> |------|-------|---------------|
> | SEC-005 | WAF configuration | 2 |
> | MON-003 | Alert escalation | 2 |
>
> ### No Longer Audited ([count])
>
> Items that were in [date1] but not [date2]:
> - [ID]: [Title] - [reason if waiver exists]
>
> ---
>
> **Summary:** [rate1]% -> [rate2]% ([+/-X]%)

## How to Build the Diff

1. Read all result files from both audit dates
2. Parse YAML frontmatter from each
3. Create maps of item_id -> status for both audits
4. Compare:
   - **Improvements:** Items that were fail/partial in date1 but pass in date2
   - **Regressions:** Items that were pass in date1 but fail/partial in date2
   - **New items:** Items in date2 but not in date1
   - **Still failing:** Items that fail in both audits
   - **No longer audited:** Items in date1 but not in date2
5. Calculate overall pass rates for both audits

## If Only One Audit Exists

> Only one audit found for [project] ([date]).
>
> Run another audit to enable comparison: `/audit-start [project]`

## Auto-Select Dates

If no dates provided, use the two most recent audit dates:

```
/audit-diff backend-api
# Automatically compares the latest two audits
```

If only one date provided, compare it to the most recent other audit.
