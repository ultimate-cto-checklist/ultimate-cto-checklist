---
name: audit-skip
description: Skip an audit item with a documented reason. The item can be revisited later.
---

# Audit Skip

You are skipping an audit item.

## Usage

```
/audit-skip GIT-005
/audit-skip GIT-005 "Need to check with DevOps team first"
/audit-skip --section 15
```

## Flow

1. Parse item ID and optional reason from args
2. If no reason provided, ask:

> Why are you skipping this item?
>
> 1. Need more information
> 2. Waiting on someone else
> 3. Will do later
> 4. Other (specify)
>
> Please explain briefly:

3. Write result file with status: skip
4. Update audit state (if active audit exists)
5. Move to next item

## Result File

Create `audits/[project]/[date]/[ITEM-ID].md` per `checklist/schema/audit-result.schema.yaml`.

Key rules for skip results:
- Use `item_id` (not `id`), lowercase `status: skip`
- Filename must match `item_id` (e.g., `GIT-005.md`)
- `## Summary` is **required** — 1-3 sentences explaining why the item was skipped
- Include `skip_reason` in frontmatter (reason category)
- `## Notes` is optional — use for "will revisit when [condition]"

## Bulk Skip

When `--section` flag is used:

```
/audit-skip --section 15
```

1. List all items in the section
2. Show them to the user
3. Ask for confirmation:

> Skip all [count] items in Section 15 (Admin Features)?
>
> Reason for skipping this section:

4. Write skip result for each item with the same reason
5. Update audit state

## After Skipping

> Skipped: [ITEM-ID] - [Title]
> Reason: [reason]
>
> [Next item preview, if in active audit]
