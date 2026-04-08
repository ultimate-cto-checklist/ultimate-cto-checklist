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

Present the available sections grouped by category:

> Here are the 14 org-level sections I can audit:
>
> **Compliance & Legal**
> - 37: GDPR & Privacy Compliance (11 items)
> - 24: Data Retention (5 items)
>
> **Security**
> - 11: Access Control (3 items)
> - 13: Infrastructure Security (7 items)
> - 25: Intrusion Detection (4 items)
> - 29: Secrets Management (6 items)
>
> **Operations**
> - 35: Incident Response (7 items)
> - 26: High Availability & Backups (6 items)
> - 20: Email Infrastructure (8 items)
> - 38: Cost Monitoring & Budget Alerts (5 items)
>
> **Team & Process**
> - 15: Admin Features (6 items)
> - 39: Developer Onboarding (9 items)
> - 40: Technical Debt Tracking (8 items)
> - 16: CTO Workspace (1 item)
>
> Run all 14? Or pick specific sections? (e.g., "just security" or "37, 35, 39")

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

For EACH item:
1. Follow the guide's verification steps
2. Run auto_checks commands from items.yaml if available
3. Use `gh api` for GitHub checks where applicable
4. Determine status: pass / fail / partial / skip
5. Write result to audits/_org/<date>/<ITEM-ID>.md
6. Validate: npx tsx checklist/schema/validate.ts <path> --fix

If you CANNOT determine the result autonomously (needs user judgment,
needs access you don't have), set status to "skip" with skip_reason
explaining what you need from the user.

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

## Review Results

After all checks complete, present a summary:

```
## Org Audit Results — <date>

Pass: X | Fail: Y | Partial: Z | Skipped: W

### Failures (need attention):
- <ITEM-ID>: <title> (FAIL)

### Skipped (need your input):
- <ITEM-ID>: <what's needed from the user>

Want to review the failures in detail, or address the skipped items first?
```

For skipped items, ask the user the relevant questions from `ask_user` in items.yaml, then update the result files.

## Commit and Push

```bash
git add audits/_org/<date>/ org.yaml
git commit -m "audit(org): <date>"
git push
```

Tell the user: **Sync results in the CTO Checklist app to update your dashboard.**
