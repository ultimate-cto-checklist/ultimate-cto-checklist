---
name: audit-process-notes
description: Process team notes left on audit items. Answers questions, evaluates disagreements, drafts remediation plans, and updates audit results accordingly.
---

# Audit Process Notes

You are processing notes that team members have left on audit items via the web dashboard. Notes are exported as markdown files in `audits/{scope}/{date}/notes/`. Each file contains one or more notes for a specific audit item.

## Usage

```
/audit-process-notes
/audit-process-notes backend-api
/audit-process-notes backend-api 2026-04-09
```

## Step 1: Discover Notes

Scan for notes files:

1. If scope and date given, look directly at `audits/{scope}/{date}/notes/*.md`
2. If only scope given, find the most recent dated folder under `audits/{scope}/` and check its `notes/` subdirectory
3. If no args, scan all `audits/*/` scopes for the most recent date with a `notes/` directory

### No notes found

```
No notes files found.

Notes are created from the web dashboard and pushed to the repo
via the "Push notes" button. Make sure notes have been synced.
```

### List available notes

```
Found notes for 5 items in backend-api/2026-04-09:

1. SEC-003 — 2 notes (1 question, 1 disagree)
2. AUTH-010 — 1 note (action)
3. GIT-005 — 3 notes (2 context, 1 question)
4. DEP-012 — 1 note (disagree)
5. MON-003 — 1 note (action)

Process all? (y/n, or pick numbers)
```

## Step 2: Process Each Item's Notes

For each selected item, read:

1. **The notes file** at `audits/{scope}/{date}/notes/{ITEM-ID}.md`
2. **The audit result** at `audits/{scope}/{date}/{ITEM-ID}.md`
3. **The checklist guide** at `checklist/checklist/{section}/guide.md` — extract the relevant section for this item
4. **The items.yaml** at `checklist/checklist/{section}/items.yaml` — get the item definition

### Note Types and How to Process Them

#### `context` — Additional information

The team is providing context the audit didn't have. Use this to:
- Re-evaluate the audit result with the new context
- If the context changes the status (e.g., there IS a policy, just not where the audit looked), update the result file

#### `disagree` — Team disputes the finding

The team believes the audit result is wrong. You must:
1. Read the original evidence carefully
2. Read the team's reasoning
3. Evaluate objectively — is the disagreement valid?
4. If valid: update the audit result with corrected status and new evidence
5. If not valid: explain why the original finding stands, with specific reasoning

Present your evaluation to the user:

```
## SEC-003: HSTS headers enabled

**Team says:** "We use Cloudflare's automatic HSTS — the header is added at
the edge, not by our origin server. The curl test was against the origin directly."

**Evaluation:** Valid disagreement. Cloudflare adds HSTS at the edge with
max-age=31536000 and includeSubDomains. The audit tested the origin directly,
missing the CDN layer.

**Recommended action:** Update to pass

Proceed? (y/n)
```

#### `question` — Team needs clarification

Answer the question using:
- The checklist guide for this item
- The audit evidence
- Your knowledge of best practices

Present the answer and ask if the user wants to save it back as a note or update the result.

#### `action` — Something to fix

The team has identified remediation work. Help by:
1. Reading the action item
2. If already marked `[resolved]`, acknowledge and skip
3. If not resolved, draft a remediation plan:
   - What needs to change
   - Where to make the change (specific files, configs, services)
   - Commands to verify the fix
4. Offer to create a GitHub issue if the user wants to track it

## Step 3: Update Audit Results

When processing changes the status of an item:

1. **Read the current result file** at `audits/{scope}/{date}/{ITEM-ID}.md`
2. **Update it** with:
   - New `status` in frontmatter
   - Updated `audited_at` to today
   - New/updated `## Evidence` section
   - New/updated `## Summary`
   - All required headings per status (see `checklist/schema/audit-result.schema.yaml`)
3. **Validate** with `npx tsx checklist/schema/validate.ts <path> --fix`

Always show the user the proposed change before writing:

```
Updating SEC-003:
  Status: fail → pass
  Summary: HSTS enabled via Cloudflare edge with recommended settings...

Write this update? (y/n)
```

## Step 4: Delete Processed Notes

After successfully processing all notes for an item:

1. Show what was done:
   ```
   SEC-003: Processed 2 notes
     - disagree: Accepted → status updated to pass
     - context: Incorporated into evidence

   Delete notes/SEC-003.md? (y/confirm/skip)
   ```

2. **Wait for explicit confirmation** before deleting. Accept `y`, `yes`, or `confirm`.
3. If confirmed, delete the notes file: `rm audits/{scope}/{date}/notes/{ITEM-ID}.md`
4. If the `notes/` directory is now empty, remove it too: `rmdir audits/{scope}/{date}/notes/`
5. If skipped, leave the file in place — user may want to re-process or keep for records

## Step 5: Session Summary

After all items are processed:

```
Notes processing complete.

Processed: 5 items
  - Status changes: 2 (SEC-003: fail→pass, DEP-012: partial→pass)
  - Questions answered: 2
  - Actions reviewed: 1
  - Notes deleted: 4
  - Notes kept: 1 (GIT-005 — skipped by user)

Tip: Commit these changes, then sync from the dashboard to see updates.
```

## Important Rules

- **Never auto-delete** — always ask for confirmation per item
- **Never auto-update results** — always show the proposed change and get a "y"
- **Be objective on disagreements** — the team may be right or wrong. Evaluate on evidence, not sentiment.
- **Preserve notes the user wants to keep** — if they skip deletion, don't ask again
- **Validate all result file changes** — run the schema validator after every update
