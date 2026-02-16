---
item_id: TEST-002
title: Integration tests with real dependencies
status: fail
severity: critical
section: 08-testing-code-metrics
audited_at: 2026-01-15T15:10:00Z
auditor: claude-session
---

## Evidence

No integration test directory or configuration found.

```bash
$ find . -name "*.integration.*" -o -name "*.e2e.*" | head -5
(no results)
```

## Notes

Unit tests mock all external dependencies. No tests verify actual database queries, API integrations, or service interactions. Recommend adding integration tests using testcontainers or a dedicated test database.
