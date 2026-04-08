---
name: org-audit
description: Run an organization-level audit across all org-scoped checklist sections. Covers team processes, compliance, security posture, and operational readiness.
---

# Org Audit

Run an organization-level audit. This covers sections that apply to the whole org — not a single repo.

## Usage

```
/org-audit
/org-audit 2026-04-08    # specific date
```

## Pre-flight

1. Verify `org.yaml` exists at the workspace root
2. Verify `checklist/` submodule is present (run `ls checklist/checklist/` — if empty, run `git submodule update --init`)
3. Determine audit date: use argument if provided, otherwise `date +%Y-%m-%d`
4. Create output directory: `mkdir -p audits/_org/<date>`
5. Check for existing audit at that path — warn if results already exist

## Sections to Audit

Run ONLY sections where `default_scope` is `org` or `both` in items.yaml:

| # | Section | Scope |
|---|---------|-------|
| 11 | Access Control | both |
| 13 | Infrastructure Security | both |
| 15 | Admin Features | org |
| 16 | CTO Workspace | org |
| 20 | Email Infrastructure | org |
| 24 | Data Retention | both |
| 25 | Intrusion Detection | org |
| 26 | High Availability & Backups | both |
| 29 | Secrets Management | both |
| 35 | Incident Response | org |
| 37 | GDPR & Privacy Compliance | org |
| 38 | Cost Monitoring & Budget Alerts | org |
| 39 | Developer Onboarding | org |
| 40 | Technical Debt Tracking | org |

## Autonomous Evidence Gathering

**CRITICAL: Do NOT ask the user for evidence you can gather yourself.**

- Use `gh api` for GitHub org/repo checks (org settings, branch protection across repos, team membership)
- Read workspace files (org.yaml, docs/, waivers/) for documented processes
- Check for common config files and documentation patterns
- Only ask the user when you genuinely cannot determine the answer (e.g., "What's your incident response on-call rotation?")

## Execution

### Phase 1: Parallel auto-checks

Launch one subagent per section (up to 6 concurrent). Each subagent:

```
You are auditing section <N>: <Name> for an org-level audit.

Read the verification steps:  checklist/checklist/<section>/guide.md
Read the item definitions:    checklist/checklist/<section>/items.yaml

For EACH item:
1. Follow the guide's verification steps
2. Run auto_checks commands from items.yaml if available
3. Use `gh api` for GitHub checks
4. Determine status: pass / fail / partial / skip
5. Write result to audits/_org/<date>/<ITEM-ID>.md
6. Validate: npx tsx checklist/schema/validate.ts <path> --fix

If you CANNOT determine the result autonomously (needs user judgment,
needs access you don't have), set status to "skip" with skip_reason
explaining what you need from the user.

Return a summary: {item_id, status, one-line description} for each item.
```

Result file format — YAML frontmatter + markdown body per `checklist/schema/audit-result.schema.yaml`:

- `item_id`, `title`, `status` (lowercase), `severity`, `section`, `audited_at`, `auditor: claude-session`
- `## Summary` required for ALL statuses (1-3 sentences)
- `## Evidence` required for pass/fail/partial
- `## Reason for Failure` required for fail
- `## Reason for Partial` required for partial
- `## Recommendations` and `## Notes` optional

### Phase 2: Interactive review

After all subagents complete, present:

```
## Org Audit Results — <date>

Pass: X | Fail: Y | Partial: Z | Skipped: W

### Failures (need attention):
- <ITEM-ID>: <title> (FAIL)

### Skipped (need your input):
- <ITEM-ID>: <what's needed from the user>

Review details? (y = drill into specifics / n = accept and continue to skipped items)
```

For skipped items, ask the user the relevant questions from `ask_user` in items.yaml, then update the result files.

### Phase 3: Commit and push

```bash
git add audits/_org/<date>/
git commit -m "audit(org): <date>"
git push
```

Tell the user: **Sync results in the CTO Checklist app to update your dashboard.**
