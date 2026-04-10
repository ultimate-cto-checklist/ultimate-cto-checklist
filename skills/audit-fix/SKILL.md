---
name: audit-fix
description: Work through failed and partial audit items interactively. Helps resolve findings by gathering better evidence or waiving items.
---

# Audit Fix

You are helping the user resolve failed and partial audit items from a completed audit. This is a collaborative process — the user provides guidance, evidence, or context that the automated audit couldn't gather on its own.

## Usage

```
/audit-fix
/audit-fix backend-api
```

## Step 1: Discover Scopes and Counts

Scan the audit results to build a picture of what needs fixing:

1. List all directories under `audits/` (each is a scope — projects + `_org`)
2. For each scope, find the most recent dated folder (`YYYY-MM-DD`)
3. Read the YAML frontmatter (first ~10 lines) from each `.md` result file
4. Tally counts of `status: fail` and `status: partial`, grouped by `severity`

If an arg was passed, skip to Step 2 using that scope.

### Pick scope

Present scopes that have unresolved items, with org first:

```
Which scope do you want to work on?

1. Org-level items (3 failed, 2 partial)
2. backend-api (8 failed, 4 partial)
3. mobile-app (1 failed, 0 partial)
```

Hide scopes with zero failed + partial. If only one scope has unresolved items, auto-select it.

### No unresolved items

If nothing is failed or partial across all scopes:

```
No failed or partial items found across any scope.
Nothing to fix!
```

## Step 2: Pick Status Filter

```
What do you want to work on?

1. Failed items (8)
2. Partial items (4)
3. Both (12)
```

## Step 3: Pick Severity Filter

```
Filter by severity?

1. Critical (5)
2. Recommended (7)
3. All (12)
```

Counts reflect the status filter from Step 2.

## Step 4: Select and Prioritize Items

Present the filtered items and let the user pick which to work on and in what order:

```
Select items to work on (comma-separated, or "all"):

1. GIT-005: Branch protections configured (critical, fail)
2. SEC-003: HSTS headers enabled (critical, fail)
3. AUTH-010: MFA enforced for admin accounts (critical, fail)
4. DEP-012: Outdated dependencies flagged (critical, partial)
5. MON-003: Alerting configured for errors (critical, fail)

> 2,4,1
```

The order typed becomes the work order. `2,4,1` means SEC-003 first, then DEP-012, then GIT-005.

`all` works through them in default order (by section number, then item number).

---

## Per-Item Workflow

For each item in the work queue:

### 1. Show Context Block

Display the item with its previous audit result:

```
## [1/3] SEC-003: HSTS headers enabled
**Severity:** Critical | **Section:** 30-security-headers

### Previous Audit Result (2026-02-15)
**Status:** fail
**Summary:** No HSTS header found on any response...
**Evidence:** curl -I showed no Strict-Transport-Security header...
**Reason for Failure:** HSTS not configured on CDN or origin...
```

Read the full content of the existing result file (`audits/<scope>/<date>/ITEM-ID.md`) to show the complete previous findings.

### 2. Show Guide Excerpt

Read `checklist/checklist/[section]/guide.md` and extract the relevant verification steps for this item. Show what "pass" looks like so the user understands the criteria.

### 3. Ask How to Resolve

```
How do you want to resolve this?

1. Provide evidence (guide Claude to find it or attach proof)
2. Waive this item (hands off to `/audit-waiver`)
```

### If "Provide evidence"

The user gives instructions. This could be:
- Guidance for Claude: "check the Cloudflare dashboard settings", "run curl against staging.example.com instead", "look at the nginx config in /etc/nginx/conf.d/"
- Attached screenshots or files for Claude to analyze
- Direct statements: "We use Cloudflare's automatic HSTS — here's the config"

Follow the user's guidance to gather evidence. Then re-determine the status based on the new evidence.

**Write the updated result file:** Overwrite the existing `audits/<scope>/<date>/ITEM-ID.md` with:
- Updated `status` (pass, partial, or fail if still insufficient)
- Updated `audited_at` to today's date
- New `## Evidence` section reflecting what was found
- `## Summary` updated to reflect new findings
- All required headings per the status (per `checklist/schema/audit-result.schema.yaml`)

**Validate:** Run `npx tsx checklist/schema/validate.ts <result-file-path> --fix` and fix any errors.

Show the user the new determination before advancing:

```
Updated: SEC-003 → pass
Evidence: Cloudflare HSTS enabled with max-age=31536000, includeSubDomains...
```

### If "Waive"

Hand off to the `/audit-waiver` flow for this item. After the waiver is created, auto-advance.

---

## Auto-Advance

After each item is resolved, immediately show the next item in the queue. The user can say "stop" or "done" at any point to exit.

## Session End

When the queue is exhausted or the user stops:

```
Fix session complete.

Progress: 3/3 items resolved
- Re-audited as pass: 2
- Waived: 1

Remaining unresolved across this scope: 9 items
Resume with /audit-fix
```

## Autonomous Evidence Gathering

When the user provides guidance that involves checking a repo:

1. **Read the project config** (`projects/<name>.yaml`) and extract the `repo` field
2. **Clone the repo** if not already cloned:
   ```bash
   CLONE_DIR="/tmp/audit-fix-$(date +%s)"
   git clone git@github.com:<owner>/<repo>.git "$CLONE_DIR"
   # Fall back to HTTPS if SSH fails
   ```
3. Use the clone for file-based checks
4. Use `gh api repos/<owner>/<repo>/...` for GitHub API checks
5. Reuse the clone across items in the same session
