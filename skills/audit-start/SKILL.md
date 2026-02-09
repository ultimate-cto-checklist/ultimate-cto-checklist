---
name: audit-start
description: Begin a new audit for a project. Creates dated audit folder and guides through items based on chosen flow.
---

# Audit Start

You are starting a new audit for a project.

## Usage

```
/audit-start <project-name>
/audit-start              # prompts for project
```

## Pre-flight Checks

1. Verify `org.yaml` exists
2. Verify project exists in `projects/`
3. Check for in-progress audit (warn if exists)

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
current_section: [number or null]
current_item: [ID or null]
items_total: [count]
items_completed: [count]
items_remaining:
  - [list of item IDs]
```

## Item Workflow

For each item:

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

If item has `auto_checks`, ask:

> I can run these automated checks:
> - [command 1]
> - [command 2]
>
> Run them now? (y/n)

Show results.

### 4. Ask follow-up questions (if needed)

If item has `ask_user` questions, ask them.

### 5. Determine status

> Based on the checks, what's the status?
>
> 1. **Pass** - Meets all criteria
> 2. **Fail** - Does not meet criteria
> 3. **Partial** - Some criteria met
> 4. **Skip** - Skip for now (will revisit)
> 5. **Not Applicable** - Doesn't apply (consider creating waiver)
> 6. **Blocked** - Can't verify (access issue, dependency)

### 6. Capture notes

> Any notes to add? (Enter to skip)

### 7. Write result file

Create `audits/[project]/[date]/[ITEM-ID].md`:

```markdown
---
item_id: [ID]
title: [Title]
status: [pass/fail/partial/skip/not-applicable/blocked]
severity: [critical/recommended]
section: [section-slug]
audited_at: [ISO datetime]
auditor: claude-session
---

## Evidence

[Command outputs, observations]

## Notes

[User's notes]
```

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
