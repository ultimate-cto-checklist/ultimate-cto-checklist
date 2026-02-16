# Acme Corp Audit Workspace

This workspace is configured for auditing Acme Corp's technical infrastructure.

## Quick Reference

See `org.yaml` for structured configuration.

## Documentation

- `docs/org-context.md` - Organization context and setup
- `docs/audit-workflow.md` - How to run audits
- `docs/commands.md` - Available commands
- `docs/preferences.md` - Your preferences

## Getting Started

1. Add a project: `/audit-add-project`
2. Start an audit: `/audit-start <project-name>`
3. Check progress: `/audit-status`

## Checklist Reference

The checklist is in `checklist/` (submodule). Browse items at:
- `checklist/checklist/` - All sections
- `checklist/dashboard/` - Web UI (run `pnpm dev`)
