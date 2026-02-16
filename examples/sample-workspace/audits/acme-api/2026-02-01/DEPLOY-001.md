---
item_id: DEPLOY-001
title: Automated deployment pipeline
status: fail
severity: critical
section: 10-deployments
audited_at: 2026-02-01T11:00:00Z
auditor: claude-session
---

## Evidence

```bash
$ gh api repos/acme-corp/acme-api/actions/workflows --jq '.workflows[].name'
CI
Deploy Staging
```

No production deployment workflow. Staging deploys on merge to staging branch, but production is deployed manually via SSH.

## Notes

Critical gap. Production deployments should be automated. Manual SSH deploys are error-prone and unauditable. Recommend adding a production deployment workflow triggered by GitHub releases or tags.
