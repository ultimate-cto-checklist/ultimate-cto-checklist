# Ultimate CTO Checklist

A comprehensive collection of best practices, guides, and frameworks for technical leadership. Contains ~367 checklist items across 42 sections covering everything a CTO needs to verify, guide, and automate in production-grade technical projects.

## Purpose

1. **Verify** - Ensure essential elements exist in any technical project
2. **Guide** - Provide step-by-step instructions for teams to set things up
3. **Automate** - Create scripts and AI-compatible tools for auditing projects

## Structure

```
ultimate-cto-checklist/
├── README.md          # Project overview
├── NOTES.md           # Raw checklist (42 sections, ~367 items)
├── WORKFLOW.md        # How we build guides together
├── transcripts/       # Source of truth - 21 voice note transcripts
├── checklist/         # Audit guides (guide.md + items.yaml per section)
│   └── 01-git-repo-setup/
│       ├── guide.md   # Detailed verification steps
│       └── items.yaml # Structured item list
├── dashboard/         # Next.js dashboard app
└── audits/            # Dated audit reports
```

### Key Files

- **NOTES.md** - Raw checklist items from voice notes. Source material.
- **WORKFLOW.md** - How we develop checklist sections together.
- **transcripts/** - Raw voice note transcripts (01-21). Original context and intent.
- **checklist/** - Production audit guides. Each section has:
  - `guide.md` - Step-by-step verification instructions for Claude
  - `items.yaml` - Structured items for tracking and reporting

## Working in This Repository

### Building Checklist Sections

Follow WORKFLOW.md. The process:
1. Load section from NOTES.md + transcript
2. Walk through each item together
3. Claude proposes verification approach
4. User refines with feedback
5. Merge overlapping items
6. Verify commands work (use subagents)
7. Write guide.md + items.yaml

### Key Principles

- **Rigor over convenience** - Actually run things, don't just check files exist
- **Verify commands** - Test `gh api` etc. on real repos before including
- **Cross-reference** - Items should inform each other
- **Exceptions are OK** - Document them, don't just fail

### Section Organization

The 42 sections cover:

| Range | Domain |
|-------|--------|
| 1-4 | Infrastructure & Setup |
| 5-6 | Database & Data |
| 7-9 | Monitoring & Health |
| 10-11 | Deployment & Operations |
| 12-14 | Observability |
| 15-16 | Admin & Management |
| 17-18 | Performance & Analytics |
| 19-20 | Error Tracking & Reliability |
| 21-23 | Infrastructure Features |
| 24-25 | Data Management |
| 26-27 | High Availability & DR |
| 28-29 | Code Quality & Architecture |
| 30-35 | API & Security |
| 36-37 | Operations & Incident Management |
| 38-39 | Compliance & Legal |
| 40-42 | Team & Development |

### Future Planned

- `scripts/` - Automated verification and setup tools
- `skills/` - AI-compatible skills for project auditing

## Dashboard

The `dashboard/` directory contains a Next.js app for browsing the checklist.

### Development

The dashboard requires `AUDIT_WORKSPACE` to point to the workspace root (the directory containing `org.yaml`, `projects/`, and `audits/`). Without it, the dashboard shows only the checklist — no project or audit data.

```bash
# From a cto-workspace that uses this as a submodule:
AUDIT_WORKSPACE=$PWD pnpm --prefix checklist/dashboard dev -p 6555

# Or with pm2:
AUDIT_WORKSPACE=/path/to/cto-workspace pm2 start checklist/dashboard/ecosystem.config.js
pm2 logs cto-checklist-dashboard-dev
```

Runs on **http://localhost:6555**.

## Conventions

- Checklist items should be actionable (start with verbs)
- Each item should be independently verifiable
- Reference specific tools/services where applicable (Sentry, Cloudflare, etc.)
- Include both "what to check" and "why it matters"

### Audit Result File Format

All audit result files must follow `checklist/schema/audit-result.schema.yaml`. Key rules:

- **Frontmatter**: Use `item_id` (not `id`), lowercase `status`, filename matches `item_id`
- **`## Summary`** is required for all statuses — 1-3 sentences shown in the dashboard
- **`## Evidence`** is required for pass/fail/partial
- **`## Reason for Failure`** / **`## Reason for Partial`** required per status
- **`## Recommendations`** and **`## Notes`** are optional

Validate with: `npx tsx checklist/schema/validate.ts <path>` (use `--fix` for auto-corrections)
