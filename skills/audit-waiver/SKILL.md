---
name: audit-waiver
description: Create a waiver for a checklist item that doesn't apply. Documents why and sets a review date.
---

# Audit Waiver

You are creating a waiver for a checklist item.

## Usage

```
/audit-waiver AUTH-003
/audit-waiver AUTH-003 --project internal-tools
```

## Flow

### Step 1: Identify Item

Find the item in `checklist/checklist/*/items.yaml` and confirm:

> Creating waiver for: [ITEM-ID] - [Title]
> Section: [section name]
> Severity: [critical/recommended]
>
> Is this correct? (y/n)

### Step 2: Scope

> Does this waiver apply to:
>
> 1. All projects (global waiver)
> 2. Specific projects (select which)

If specific, show project list from `projects/` and let them select.

### Step 3: Reason

> Why doesn't this item apply?
>
> 1. Using alternative approach
> 2. Not applicable to our architecture
> 3. Covered by another control
> 4. Risk accepted
> 5. Other (specify)
>
> Please explain:

### Step 4: Conditions

> Under what conditions would this waiver be void?
> (Enter conditions, or skip)

### Step 5: Approval

> Who is approving this waiver?
>
> Name and title:

### Step 6: Review Date

> When should this waiver be reviewed?
>
> 1. 3 months
> 2. 6 months
> 3. 1 year
> 4. Custom date

## Generate Waiver

Create file based on scope:
- Global: `waivers/[ITEM-ID].md`
- Project-specific: `waivers/[project]/[ITEM-ID].md`

```markdown
---
item_id: [ID]
title: [Title]
status: not-applicable
applies_to:
  - [project list or "all"]
approved_by: [Name (Title)]
approved_at: [ISO date]
review_date: [ISO date]
---

## Reason

[Detailed reason]

## Alternative Controls

[If applicable - what they're doing instead]

## Conditions

This waiver is void if:
- [condition 1]
- [condition 2]

## Review History

| Date | Reviewer | Decision |
|------|----------|----------|
| [date] | [name] | Created |
```

## After Creation

> Waiver created: waivers/[path]/[ITEM-ID].md
>
> This item will be excluded from future audits for:
> - [project list or "all projects"]
>
> Review scheduled for: [date]
>
> To edit: open waivers/[path]/[ITEM-ID].md
> To delete: remove the file

## Listing Existing Waivers

If invoked without an item ID:

> Existing waivers:
>
> | Item | Applies To | Approved | Review Date |
> |------|-----------|----------|-------------|
> | AUTH-003 | internal-tools | 2026-01-15 | 2026-07-15 |
> | SEC-002 | all | 2026-02-01 | 2027-02-01 |
>
> Create new waiver: `/audit-waiver <ITEM-ID>`

## Waiver Expiry Warning

When a waiver's review date has passed or is within 30 days, warn:

> Warning: Waiver for [ITEM-ID] is due for review ([date]).
> Please review and either renew or remove it.
