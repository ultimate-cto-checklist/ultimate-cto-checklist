# Checklist Development Workflow

How we build audit guides together, section by section.

## Overview

Each section in NOTES.md becomes a folder in `checklist/` with:
- `guide.md` - Detailed verification steps Claude follows during audits
- `items.yaml` - Structured item list for tracking and reporting

## The Process

### 1. Load the Section

Read the section from NOTES.md and its source transcript (if available) to understand:
- What items exist
- Original context and intent
- Any nuances from the voice notes

### 2. Walk Through Each Item

For each checklist item, Claude proposes:
- **Verification approach** - How to check this (auto vs manual)
- **Commands/checks** - Specific commands, file patterns, API calls
- **Pass/fail criteria** - What counts as passing
- **Evidence to capture** - What to record in the audit

User reviews and provides feedback:
- Add missing checks
- Correct wrong assumptions
- Request more rigor (e.g., "actually run it, don't just check files exist")
- Add edge cases or exceptions

### 3. Refine Together

Common refinements:
- **Merge overlapping items** - If two items test the same thing, combine them
- **Add cross-references** - Link items that inform each other (e.g., README accuracy checked against actual clone experience)
- **Verify commands work** - Use subagents to test `gh api` or other commands on real repos
- **Add exceptions** - Document acceptable cases (e.g., sandbox keys are OK to commit)

### 4. Write to Filesystem

Once all items are reviewed:
1. Write `items.yaml` with final item list
2. Write `guide.md` with all verification steps
3. Verify structure is correct

## Principles

### Rigor Over Convenience
Don't just check if files exist. Actually:
- Clone and run the app
- Execute the tests
- Run the linter
- Start the Docker services

### Verify Commands Work
Before including a `gh api` or other command in the guide:
- Use a subagent to test it on a real repo
- Document any permission requirements
- Note what the output looks like

### Cross-Reference Everything
Items should inform each other:
- GIT-001 (clone and run) results validate GIT-012 (README accuracy)
- GIT-014 (Docker Compose) should match GIT-002 (env vars)
- Findings in one item become evidence for others

### Exceptions Are OK, But Document Them
Real projects have valid exceptions:
- Sandbox keys committed intentionally
- Shared VS Code configs by team decision
- Admin bypass enabled temporarily

The guide should ask about these, not just fail them.

### User Provides Domain Knowledge
Claude proposes the structure; user provides:
- Correct workflows (feature → staging → main, not main → staging → prod)
- Missing items (sandbox key rotation)
- Real-world context (what actually matters vs theoretical)

## Item Structure

Each item in `guide.md` follows this template:

```markdown
### ITEM-ID: Title
**Severity**: Critical | Recommended | Optional

**Check automatically**:
[Commands and patterns to check]

**Cross-reference with**:
[Other items that relate]

**Pass criteria**:
[What counts as passing]

**Fail criteria**:
[What counts as failing]

**If [condition], ask user**:
[Questions to ask when automated check isn't enough]

**Evidence to capture**:
[What to record in the audit report]
```

## Merging Items

Merge when:
- Two items check the same underlying thing
- One item is a subset of another
- Keeping separate adds no value to the audit

Keep separate when:
- Items have different severities
- Granular pass/fail tracking is valuable
- Items are in different categories

## Session Flow

Typical session for one section:

1. "Let's do section X"
2. Claude reads NOTES.md section + transcript
3. Claude presents first item draft
4. User: "Add X, change Y, merge with Z"
5. Repeat for each item
6. Claude writes files
7. Quick review of structure
8. Move to next section (or end)

## File Locations

```
checklist/
├── 01-git-repo-setup/
│   ├── guide.md
│   └── items.yaml
├── 02-dependencies/
│   ├── guide.md
│   └── items.yaml
└── ...

audits/
└── YYYY-MM-DD-project-name.yaml
```
