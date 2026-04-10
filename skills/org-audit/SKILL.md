---
name: org-audit
description: Run an organization-level audit across all org-scoped checklist sections. Covers team processes, compliance, security posture, and operational readiness.
---

# Org Audit

Run an organization-level audit. This covers sections that apply to the whole org — not a single repo.

**Note:** This skill assumes org context is already set up in `org.yaml`. If called from `/audit`, that's handled automatically. If called directly and `org.yaml` is minimal, read and follow `checklist/skills/audit-init/SKILL.md` first.

## Usage

```
/org-audit
/org-audit 2026-04-08    # specific date
```

## Setup

1. Determine audit date: use argument if provided, otherwise `date +%Y-%m-%d`
2. Create output directory: `mkdir -p audits/_org/<date>`
3. Check for existing audit at that path — warn if results already exist
4. Read `org.yaml` for context (cloud providers, tools, GitHub org, etc.)

## Choose Scope

**Important:** The org audit has two tiers of items. Default to org-only.

### Tier 1: Org-only items (default)

These are items scoped exclusively to `org` — policies, processes, accounts, team structure. They don't require a specific project context.

Read each section's `items.yaml` and filter:
- Sections with `default_scope: org` → include ALL items
- Sections with `default_scope: [org, project]` → include ONLY items that don't have a per-item `scope: project` override
- Sections with `default_scope: project` → include ONLY items with per-item `scope: org` or `scope: [org, project]` override

Present what's included:

> **Org Audit — org-only items**
>
> I'll audit the items that apply at the organization level — policies, processes, tooling, and standards.
>
> [List sections with item counts, grouped by category — only counting org-scoped items per section]
>
> Ready to start? (Y / or pick specific sections)

### Tier 2: Org-level review of shared items (opt-in, after Tier 1)

After Tier 1 completes, offer:

> **Optional: Review org-level policies for shared items?**
>
> Some items are scoped to both org and project (`[org, project]`). At the org level, I'd check whether the *policy or standard* exists — not whether each project implements it (that happens in project audits).
>
> Examples:
> - Secrets Management: "Is there an org-wide secrets policy?" (not "does repo X use Vault?")
> - Access Control: "Is there a tiered access model?" (not "does repo X enforce it?")
>
> Want to review these too? (Y/N / pick sections)

If yes, audit the `[org, project]` items but **only the org-level aspect**: verify the policy/standard/process exists, not per-project compliance. Add a note in each result file:

```yaml
audit_scope: org-policy  # org-level policy check; per-project compliance verified in project audits
```

## Run the Audit

### For small scope (1-3 sections): Run sequentially

Walk through each item with the user. For each:
1. Read the guide: `checklist/checklist/<section>/guide.md`
2. Read the items: `checklist/checklist/<section>/items.yaml`
3. Run any `auto_checks` commands
4. Use `gh api` for GitHub checks
5. Ask the user for items that need judgment (use `ask_user` from items.yaml)
6. Write the result file and validate it

### For large scope (4+ sections): Use parallel subagents

Launch subagents in batches of **4-6** (not all at once). Each subagent:

```
You are auditing section <N>: <Name> for an org-level audit.

Organization context from org.yaml:
<paste relevant org.yaml fields>

Read the verification steps:  checklist/checklist/<section>/guide.md
Read the item definitions:    checklist/checklist/<section>/items.yaml

ONLY audit these specific items: <list of item IDs from the chosen tier>
Skip any items not in this list — they belong to a different scope.

For EACH item in the list:
1. Follow the guide's verification steps
2. Run auto_checks commands from items.yaml if available
3. Use `gh api` for GitHub checks where applicable
4. Determine status: pass / fail / partial / blocked
5. Write result to audits/_org/<date>/<ITEM-ID>.md
6. Validate: npx tsx checklist/schema/validate.ts <path> --fix

If you CANNOT determine the result autonomously (needs user judgment,
needs access you don't have), set status to "blocked" and explain
what you need from the user in the ## Summary.

Return a summary: {item_id, status, one-line description} for each item.
```

**Wait for the batch to finish before launching the next one.**

### Result file format

YAML frontmatter + markdown body per `checklist/schema/audit-result.schema.yaml`:

- `item_id`, `title`, `status` (lowercase), `severity`, `section`, `audited_at`, `auditor: claude-session`
- `## Summary` required for ALL statuses (1-3 sentences)
- `## Evidence` required for pass/fail/partial
- `## Reason for Failure` required for fail
- `## Reason for Partial` required for partial
- `## Recommendations` and `## Notes` optional

## Resolve Blocked Items

After all subagent batches complete, collect items with `status: blocked`. These need user input before the audit can finish.

For each blocked item:

1. **Present it:**
   ```
   ## <ITEM-ID>: <Title>
   **Status:** Blocked — needs your input
   **What the auditor found:** <summary from the result file>
   ```

2. **Ask the user** the relevant questions (from `ask_user` in items.yaml, or based on what the subagent couldn't determine)

3. **Resolve it:** Based on the user's answer, update the result file to `pass`, `fail`, or `partial` with proper evidence and required sections

4. **Or leave blocked:** If the user can't answer right now (e.g., needs to check with someone else), leave as `blocked`

5. **Or waive:** If the user decides the item doesn't apply, use `/audit-waiver`

## Review Results

After all checks complete (including interactive resolution of blocked items), present a summary:

```
## Org Audit Results — <date>

Pass: X | Fail: Y | Partial: Z | Blocked: W

### Failures (need attention):
- <ITEM-ID>: <title> (FAIL)

### Still Blocked (couldn't resolve):
- <ITEM-ID>: <what's still needed>

Want to review the failures in detail?
```

## Commit and Push

```bash
git add audits/_org/<date>/ org.yaml
git commit -m "audit(org): <date>"
git push
```

Tell the user: **Sync results in the CTO Checklist app to update your dashboard.**
