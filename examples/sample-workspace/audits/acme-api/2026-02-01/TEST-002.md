---
item_id: TEST-002
title: Integration tests with real dependencies
status: partial
severity: critical
section: 08-testing-code-metrics
audited_at: 2026-02-01T10:40:00Z
auditor: claude-session
---

## Evidence

```bash
$ npm run test:integration
  PASS  tests/integration/auth.test.ts
  PASS  tests/integration/users.test.ts

Tests: 12 passed, 12 total
```

Integration tests now exist for auth and users modules using testcontainers.

## Notes

Progress from last audit (was fail, now partial). Database integration tests added but API integration tests and order service tests still missing. Recommend extending to cover orders and external API calls.
