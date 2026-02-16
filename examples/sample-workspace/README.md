# Sample Audit Workspace

This is an example workspace showing the expected directory structure and file formats for the CTO Audit Workflow.

## What's Here

```
sample-workspace/
├── org.yaml                     # Organization config (from /audit-init)
├── CLAUDE.md                    # Claude Code instructions for this workspace
├── STATUS.md                    # Dashboard summary
├── docs/                        # Generated documentation
│   ├── org-context.md
│   ├── audit-workflow.md
│   ├── commands.md
│   └── preferences.md
├── projects/                    # Registered projects
│   ├── acme-api.yaml            # Backend API project
│   └── acme-web.yaml            # Frontend project (no audits yet)
└── audits/                      # Audit results
    ├── _org/                    # Organization-level audits
    │   └── 2026-02-01/          # 3 items audited
    └── acme-api/                # Project-level audits
        ├── 2026-01-15/          # First audit: 8 items (4 pass, 3 fail, 1 skip)
        └── 2026-02-01/          # Second audit: 8 items (6 pass, 1 fail, 1 partial)
```

## Try It with the Dashboard

Point the dashboard at this workspace to see audit results in the UI:

```bash
# From the dashboard directory:
echo "AUDIT_WORKSPACE=$(pwd)/../examples/sample-workspace" > .env.local
pm2 restart cto-checklist-dashboard-dev
```

Then open http://localhost:6555/audits to browse:
- Project list with latest scores
- Audit history showing improvement over time
- Individual results with evidence and notes
- Org-level audit results

## File Formats

### Project Config (`projects/*.yaml`)

```yaml
name: acme-api          # Used as directory name in audits/
path: /path/to/code     # Local checkout path
type: backend           # backend, frontend, mobile, etc.
repo: org/repo          # GitHub repo identifier
```

### Audit Result (`audits/<project>/<date>/<ITEM-ID>.md`)

Markdown with YAML frontmatter:

```yaml
---
item_id: GIT-001
title: Clone and run immediately
status: pass            # pass, fail, partial, skip, not-applicable, blocked
severity: critical      # critical, recommended
section: 01-git-repo-setup
audited_at: 2026-02-01T10:00:00Z
---

## Evidence
(What was checked and found)

## Notes
(Additional context)
```
