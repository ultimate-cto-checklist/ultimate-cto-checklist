# Handoff Notes

## What's Done

**Section 01 - Git Repo Setup** is complete:
- `checklist/01-git-repo-setup/guide.md` - 18 items with detailed verification steps
- `checklist/01-git-repo-setup/items.yaml` - Structured item list

**Section 02 - Dependencies & Code Quality** is complete:
- `checklist/02-dependencies/guide.md` - 7 items with detailed verification steps
- `checklist/02-dependencies/items.yaml` - Structured item list
- Merged original "dependencies up to date" + "no CVEs" into single DEP-001 (vulnerability scanning + lockfile freshness)
- Added DEP-007 (Turborepo for monorepos) - checks for hidden apps, proper workspace config

**Section 03 - Authentication & Endpoints** is complete:
- `checklist/03-authentication-endpoints/guide.md` - 10 items with detailed verification steps
- `checklist/03-authentication-endpoints/items.yaml` - Structured item list
- AUTH-001: Evidence is a clear explanation/diagram of auth flow, not just file counts
- AUTH-005: Docs should exist but NOT be accessible in production unless intentional
- AUTH-006: Use framework CLI commands (e.g., `rails routes`, `php artisan route:list`) when available

**Section 04 - Environments** is complete:
- `checklist/04-environments/guide.md` - 9 items with detailed verification steps
- `checklist/04-environments/items.yaml` - Structured item list
- ENV-001/002/003: Split into separate items per tier, each documents deployment method via CI history (`gh api`, `gh run list`)
- ENV-008: Use agent-browser skill to verify Zero Trust protection, plus Cloudflare API to list Access apps
- No dedicated Cloudflare CLI for Zero Trust - use API or Terraform state

**Section 05 - Database & Connections** is complete:
- `checklist/05-database-connections/guide.md` - 9 items with detailed verification steps
- `checklist/05-database-connections/items.yaml` - Structured item list
- Merged "connection pooling" + "optimized connections" into DB-001
- Merged "AI reviews migrations" + "human override" + "business-breaking changes" into DB-003
- Merged "no DELETE" + "separate deletion service" into DB-006 (soft delete pattern)
- Merged "read-only password" into DB-004 (database users documentation)
- Merged "Zero Trust protected" into DB-008 (DB admin tools)

**Section 06 - Resilience** is complete:
- `checklist/06-resilience/guide.md` - 1 item with detailed verification steps
- `checklist/06-resilience/items.yaml` - Structured item list
- Merged all 4 original items into single RES-001 (third-party service resilience)
- Tests startup resilience, runtime resilience, endpoint isolation, process stability
- Cross-references section 7 (health endpoints) and section 5 (database)

**Section 07 - Health Endpoints** is complete:
- `checklist/07-health-endpoints/guide.md` - 2 items with detailed verification steps
- `checklist/07-health-endpoints/items.yaml` - Structured item list
- HEALTH-001: Basic health endpoint - 50ms threshold, 200 OK acceptable, no auth required
- HEALTH-002: Deep health endpoint - auth-protected, checks all external services, returns 503 with details when dependency down

**Section 08 - Testing & Code Metrics** is complete:
- `checklist/08-testing-code-metrics/guide.md` - 6 items with detailed verification steps
- `checklist/08-testing-code-metrics/items.yaml` - Structured item list
- TEST-001: Coverage tracking with CI threshold enforcement (not just coverage exists)
- TEST-002/003: Kept separate for granular tracking (fixes vs features)
- TEST-002/003: Check adjacent commits (±1) in case tests added in separate commit
- TEST-004: Search for documented critical paths before asking user
- TEST-005: CRAP score with TODO cross-references to sections 28 and 40 (not yet developed)
- TEST-006: Agent skills for test automation marked Optional (future but important)

**Section 09 - Development Workflow** is complete:
- `checklist/09-development-workflow/guide.md` - 6 items with detailed verification steps
- `checklist/09-development-workflow/items.yaml` - Structured item list
- FLOW-001: Feature branch workflow - cross-refs GIT-004/005/006 for branch protection (no duplication)
- FLOW-002: AI + human review - Recommended severity (teams can function without AI review)
- FLOW-003: Dev environment testing before merge - checks deployment timestamps vs merge timestamps
- FLOW-004: Commit conventions - merged "follow format" + "clear messages" into one item
- FLOW-005: Merge strategy - merged 4 items (no squash/rebase, fast-forward, preserve history, cleanup before merge)
- FLOW-006: Branch flow documented - separate item for process documentation

**Section 10 - Deployments** is complete:
- `checklist/10-deployments/guide.md` - 4 items with detailed verification steps
- `checklist/10-deployments/items.yaml` - Structured item list
- DEPLOY-001: Merged "clear workflow" + "fix issues immediately" - stability includes current health + failure rate
- DEPLOY-002: Merged "track failures" + "notify team" - both success AND failure notifications required
- DEPLOY-003: Merged "caching" + "fast builds" - single build performance item
- DEPLOY-004: Merged all 3 tagging items - only production gets tags, staging excluded

**Section 11 - Access Control** is complete:
- `checklist/11-access-control/guide.md` - 3 items with detailed verification steps
- `checklist/11-access-control/items.yaml` - Structured item list
- ACCESS-001: Tiered access model documented and approved - uses gcloud/aws CLI to verify IAM, asks user for DB access evidence
- ACCESS-002: Production access is minimal (1-2 people for logs) - enforces specific threshold
- ACCESS-003: Security requirements for prod access holders - device security, account security, access security checklists

**Section 12 - Monitoring** is complete:
- `checklist/12-monitoring/guide.md` - 6 items with detailed verification steps
- `checklist/12-monitoring/items.yaml` - Structured item list
- Merged 18 raw items into 6: infrastructure metrics, DB performance, HTTP logging, alerting, retention, status pages
- MON-001: Requires documented service inventory from CLI + monitoring coverage matrix
- MON-002: Requires dashboard/report OR audit record (not just logging enabled)
- MON-003: Source-agnostic (app, CDN, APM - whatever works)
- MON-004: 404s = volume threshold, 500s = any within 1-minute window
- MON-005: Minimum 2 weeks retention (not max)
- MON-006: Production status page Critical, staging Recommended

**Section 13 - Infrastructure Security** is complete:
- `checklist/13-infrastructure-security/guide.md` - 7 items with detailed verification steps
- `checklist/13-infrastructure-security/items.yaml` - Structured item list
- Merged "don't leak tech stack" + "minimal headers" into SEC-004 (response header hygiene)
- SEC-001/002: Cloudflare API with read-only token preferred for checking zones/DNS
- SEC-002: Origin must reject direct connections - firewall to Cloudflare IPs only
- SEC-003: Browser Cache TTL = 0 means "Respect Existing Headers"
- SEC-005: HSTS must have max-age >= 1 year for preload eligibility
- SEC-006: GTM cannot have SRI - requires access controls, CSP restrictions instead
- SEC-007: CT monitoring via Cert Spotter, Cloudflare, or crt.sh

**Section 14 - Documentation** is complete:
- `checklist/14-documentation/guide.md` - 3 items with detailed verification steps
- `checklist/14-documentation/items.yaml` - Structured item list
- DOC-001: Feature documentation - in-repo preferred, external acceptable if AI-accessible
- DOC-002: Complex systems documented (e.g., payments, fulfillment, admin) - Critical severity
- DOC-003: Documentation is current - spot-check via git history of referenced files

**Section 15 - Admin Features** is complete:
- `checklist/15-admin-features/guide.md` - 6 items with detailed verification steps
- `checklist/15-admin-features/items.yaml` - Structured item list
- ADM-001: Admin feature parity - merged "every feature has admin" + "admin can manage/view/debug"
- ADM-002: Admin access auditing - merged "frequent audits" + "periodic review" + "easy suspend"
- ADM-003: Track login IPs and login frequency - authentication tracking
- ADM-004: Audit trail for admin requests - action logging (distinct from login tracking)
- ADM-005: Easy to disable admin users immediately - emergency response capability
- ADM-006: Claude skill to audit admin access - Optional severity (future automation)

**Section 16 - CTO Workspace** is complete:
- `checklist/16-cto-workspace/guide.md` - 1 item with detailed verification steps
- `checklist/16-cto-workspace/items.yaml` - Structured item list
- CTO-001: Merged all 3 items (ask agent, automated discovery, on-demand briefs) into single AI-assisted project briefings item
- Recommended severity (not Optional) - important CTO tooling
- Prescriptive: must be Claude skill or CLAUDE.md, must query git log + gh pr list + gh run list, must synthesize output

**Section 17 - Performance Monitoring** is complete:
- `checklist/17-performance-monitoring/guide.md` - 4 items with detailed verification steps
- `checklist/17-performance-monitoring/items.yaml` - Structured item list
- PERF-001: Merged "graph response times" + "identify slowest endpoints" into single item
- PERF-001: Soft warning (not fail) if any endpoint averages >500ms
- PERF-002: Memory usage tracking over time - requires historical data (not just point-in-time)
- PERF-003: Memory leak detection alerting - requires automated alerts (manual review not sufficient)
- PERF-004: Heap dump capability - Optional severity, only useful when debugging leaks, but if exists must be protected

**Section 18 - Analytics** is complete:
- `checklist/18-analytics/guide.md` - 5 items with detailed verification steps
- `checklist/18-analytics/items.yaml` - Structured item list
- ANA-001: Merged "own your analytics data" + "server-side tracking" - same principle (data ownership)
- ANA-002: Analytics data → warehouse (BigQuery recommended, Dataform for transformations)
- ANA-003: GitHub data → warehouse - Optional severity (mature practice, not universal)
- ANA-004: BI reporting layer - Metabase recommended, self-serve for non-engineers
- ANA-005: Merged "track PR activity" + "track commits" + "analytics strategy" into single git analytics item

**Section 19 - Error Reporting (Sentry)** is complete:
- `checklist/19-error-reporting/guide.md` - 8 items with detailed verification steps
- `checklist/19-error-reporting/items.yaml` - Structured item list
- ERR-001: Error tracking tool installed (Sentry or alternative) - Critical severity
- ERR-002: PII handling configured - intentional decision, not accident
- ERR-003: Stack traces configured - includes performance tracing sample rate
- ERR-004: Source maps configured - upload via CI/CD, readable stack traces
- ERR-005: Deployment integration - releases created, deploy notifications, filterable by release
- ERR-006: AI periodically reviews errors - Recommended severity (not Optional)
- ERR-007: Auto-create PRs for fixes - AI proposes fixes, human reviews
- ERR-008: Automated error triage - prioritization, routing, ignore rules, issue tracker integration

**Section 20 - Email Infrastructure** is complete:
- `checklist/20-email-infrastructure/guide.md` - 8 items with detailed verification steps
- `checklist/20-email-infrastructure/items.yaml` - Structured item list
- EMAIL-001: MX records configured - verify existence, resolution, and port 25 reachability
- EMAIL-002: SPF configured - authorized senders, hard fail (-all) or documented soft fail (~all)
- EMAIL-003: DKIM configured - use DNS API access to discover all selectors (don't guess)
- EMAIL-004: DMARC configured - enforcement policy, reporting, subdomain coverage
- EMAIL-005: Email deliverability testing - merged spam scoring + placement tests; automated recommended, manual acceptable
- EMAIL-006: Transactional email control and logging - Critical severity, tracking required unless documented exception
- EMAIL-007: Marketing email logging - separate from transactional, N/A if no marketing emails
- EMAIL-008: Email log retention - intentional decision, 2-4 weeks typical, outside range just noted

**Section 21 - Caching** is complete:
- `checklist/21-caching/guide.md` - 2 items with detailed verification steps
- `checklist/21-caching/items.yaml` - Structured item list
- CACHE-001: Static assets cached by CDN - check Cache-Control headers and CDN cache status (CF-Cache-Status, x-cache, etc.)
- CACHE-002: Content hashes for cache invalidation - merged "cache busters" + "content hashes" (same concept)
- Both items Recommended severity (performance, not security)
- Section focused on static assets only (no API caching, Redis, etc. per user direction)

**Section 22 - Front-End Performance** is complete:
- `checklist/22-frontend-performance/guide.md` - 4 items with detailed verification steps
- `checklist/22-frontend-performance/items.yaml` - Structured item list
- FEP-001: Automated Lighthouse reports - CI integration for performance regression detection
- FEP-002: Core Web Vitals optimized - merged "first paint" + "CLS" + "load speed" (all measured together)
- FEP-003: Preload critical fonts - above-the-fold fonts with correct preload attributes or font-display fallback
- FEP-004: Preload critical CSS - inlined critical CSS or preload to minimize render-blocking
- All items Recommended severity (performance/SEO, not security)
- Uses PageSpeed Insights API (free, no auth) for automated checks

**Section 23 - Client-Side Security & Storage** is complete:
- `checklist/23-client-side-security/guide.md` - 3 items with detailed verification steps
- `checklist/23-client-side-security/items.yaml` - Structured item list
- CSS-001: HttpOnly cookies for sensitive data - Critical severity (XSS prevention)
- CSS-002: Browser storage used appropriately - merged "avoid localStorage" + "use sessionStorage" into single item
- CSS-003: JWT handling documented and followed - merged 3 JWT items (document, audit, checklist)
- Investigation is codebase-focused: grep for cookie config, storage usage, JWT libraries
- Cross-refs CSS-001 ↔ CSS-002 ↔ CSS-003 (all relate to where tokens are stored)

**Section 24 - Data Retention** is complete:
- `checklist/24-data-retention/guide.md` - 5 items with detailed verification steps
- `checklist/24-data-retention/items.yaml` - Structured item list
- RET-001: Critical data uses soft deletes - ask user which tables are critical, provide educated guesses
- RET-002: Queries exclude deleted records by default - merged "queries ignore" + "data remains" (same concept)
- RET-003: Periodic review of soft-deleted data - process (automated or manual) to review old deleted records
- RET-004: Hard delete after review period - capability to purge, retention period defined, auditable
- RET-005: Legal retention requirements respected - Critical severity (compliance risk)
- Cross-refs: RET-001 ↔ RET-002 (soft delete implementation), RET-003 → RET-004 → RET-005 (cleanup flow)
- Cross-refs: DB-006 (app user permissions), GDPR-001 (right to be forgotten tension)

**Section 25 - Intrusion Detection** is complete:
- `checklist/25-intrusion-detection/guide.md` - 4 items with detailed verification steps
- `checklist/25-intrusion-detection/items.yaml` - Structured item list
- IDS-001: General IDS solution evaluated/deployed - WAF, SIEM, cloud-native, or open-source options
- IDS-002: Network-level data transfer monitoring - outbound data volume per IP/session, thresholds, alerts
- IDS-003: Database query anomaly detection - query logging with row counts, large result set alerts
- IDS-004: Exfiltration alert routing - merged "immediate warnings" + "actionable context" into single alerting item
- All items Recommended severity with note: "Critical for big projects"
- Focus is data exfiltration detection (smaller budget IDS), not full enterprise SIEM
- Cross-refs: SEC-001 (Cloudflare), MON-002/003/004 (monitoring), INC-001 (on-call), DB-004 (database users)

**Section 26 - High Availability & Backups** is complete:
- `checklist/26-high-availability-backups/guide.md` - 6 items with detailed verification steps
- `checklist/26-high-availability-backups/items.yaml` - Structured item list
- HA-001: Production database HA configured - Multi-AZ, regional HA, or streaming replication
- HA-002: Multi-region server deployment with failover - merged "2+ regions" + "not tied to one location" + "immediate failover"
- HA-003: Production database backup configured - Critical severity (non-negotiable)
- HA-004: Off-site backup storage - must be **different provider** (not just cross-region within same cloud)
- HA-005: Point-in-time recovery enabled - Critical severity for production
- HA-006: Backup window appropriate for RPO - timing intentional, aligns with business requirements
- HA items Recommended severity with note: "Critical when serious money involved"
- Backup items (HA-003, HA-005) always Critical regardless of project scale
- Merged "read replica elsewhere" + "SQL dump files" into HA-004 as low-cost options for off-site storage
- Cross-refs: Section 34 (Rollback & Recovery - RTO/RPO), DB-001 (connection pooling), MON-002 (DB performance)

**Section 27 - Database Tooling** is complete:
- `checklist/27-database-tooling/guide.md` - 2 items with detailed verification steps
- `checklist/27-database-tooling/items.yaml` - Structured item list
- DBT-001: Tool to visualize database diagrams (ERD) - Recommended severity
- DBT-002: Ability to query/explore data from any table - Recommended severity
- Kept items separate: ERD visualization vs data exploration are different concerns
- DBT-002: Emphasized production access must be controlled and audited
- Small section - developer productivity tooling, not security-critical
- Cross-refs: DB-001 (connection pooling), Section 15 (Admin dashboard), Section 25/30 (Security)

**Section 28 - Code Architecture** is complete:
- `checklist/28-code-architecture/guide.md` - 3 items with detailed verification steps
- `checklist/28-code-architecture/items.yaml` - Structured item list
- ARCH-001: SOLID principles audited regularly - merged 2 items (follows SOLID + regular audits)
- ARCH-001: Emphasis on AI agent doing the assessment (during PR review or periodic audits)
- ARCH-001: Proxy metrics (file size, import counts) as heuristics, not definitive checks
- ARCH-002: Code quality tools - merged 5 items (tools, duplication, complexity, healthy code, don't ignore)
- ARCH-002: Reported with visibility is minimum, enforced gates is recommended
- ARCH-003: Build performance - merged 2 items (build time + caching)
- ARCH-003: Benchmarks: clean < 3 min, cached < 30 sec
- All items Recommended severity (code health, not security)
- Cross-refs: TEST-005 (CRAP score), FLOW-002 (AI review), DEPLOY-003 (CI build performance)

**Section 29 - Secrets Management** is complete:
- `checklist/29-secrets-management/guide.md` - 6 items with detailed verification steps
- `checklist/29-secrets-management/items.yaml` - Structured item list
- SEC-001: Use Secret Manager or equivalent - Critical severity, includes rotation and audit trail requirements
- SEC-002: Secrets loaded into process environment - Critical severity, env vars not files
- SEC-003: Not stored on file system - Critical severity, includes TLS certs (managed by infra, not committed)
- SEC-004: No secrets committed to git - Critical severity, secret scanning required
- SEC-005: Different secrets per environment - Recommended severity, env isolation
- SEC-006: Least privilege access to secrets - Recommended severity, service accounts and audit trails
- 4 Critical items (core security), 2 Recommended items (mature practices)
- Cross-refs: GIT-016 (no credentials), ACCESS-001/002 (access control), ENV-001/003 (environments)

**Section 30 - Rate Limiting** is complete:
- `checklist/30-rate-limiting/guide.md` - 3 items with detailed verification steps
- `checklist/30-rate-limiting/items.yaml` - Structured item list
- RATE-001: Rate limiting configured - Critical severity, merged items 1, 2, and 4 from raw notes
- RATE-002: Graceful 429 handling - Recommended severity, requires actually testing the limit
- RATE-003: Rate limits documented - Recommended severity, either headers or written docs
- 1 Critical item (existence of rate limiting), 2 Recommended items (UX and documentation)
- Cross-refs: AUTH-001 (authentication), INFRA-001 (Cloudflare), MON-003 (HTTP logging)

**Section 31 - API Design** is complete:
- `checklist/31-api-design/guide.md` - 6 items with detailed verification steps
- `checklist/31-api-design/items.yaml` - Structured item list
- API-001: API versioning strategy - Optional severity (not all projects need versioning)
- API-002: API deprecation strategy - Optional severity (separate from versioning existence)
- API-003: Server-side input validation - Critical severity (never trust client)
- API-004: SQL injection prevention - Critical severity (parameterized queries or ORM)
- API-005: XSS prevention - Critical severity (sanitize user content before rendering)
- API-006: API gateway / proxy configuration - Recommended severity (gateway OR proper CORS)
- 3 Critical items (input validation, SQL injection, XSS), 2 Optional items (versioning), 1 Recommended item (gateway)
- Cross-refs: Section 32 (CSP), RATE-001 (rate limiting at gateway), AUTH-001 (auth at gateway)

**Section 32 - Content Security Policy** is complete:
- `checklist/32-content-security-policy/guide.md` - 4 items with detailed verification steps
- `checklist/32-content-security-policy/items.yaml` - Structured item list
- CSP-001: Full CSP headers configured - Recommended severity, must include key directives (default-src, script-src, frame-ancestors)
- CSP-002: Report-only mode for testing - Recommended severity, test before enforcing, collect violation reports
- CSP-003: Block inline scripts where possible - Recommended severity, use nonces/hashes instead of unsafe-inline
- CSP-004: Whitelist trusted sources - Recommended severity, 'self' baseline, no wildcards, periodic audit
- All 4 items Recommended severity (defense-in-depth, not blocking requirement)
- Includes guidance on style-src unsafe-inline for CSS-in-JS (acceptable)
- Includes Google Tag Manager strategy (nonce propagation, server-side GTM, whitelist approach)
- Includes unsafe-eval guidance (avoid unless Vue runtime templates, Angular JIT, legacy code)
- Cross-refs: API-005 (XSS), SEC-001 (Cloudflare), API-006 (gateway)

**Section 33 - Feature Flags & Rollouts** is complete:
- `checklist/33-feature-flags/guide.md` - 2 items with detailed verification steps
- `checklist/33-feature-flags/items.yaml` - Structured item list
- FF-001: Feature flag system configured - merged 4 original items (flags, A/B testing, percentage rollouts, user targeting)
- FF-001: Small projects can use env vars, larger projects need GrowthBook or similar
- FF-001: Capabilities to verify: A/B testing, percentage rollouts, sticky assignment, user segment targeting
- FF-002: Kill switches for quick disable - kept separate (critical incident response tool)
- FF-002: Must be toggleable in < 5 minutes without deploy
- FF-002: Critical features (payments, external APIs, new features) should have kill switches
- Both items Recommended severity
- Cross-refs: DEPLOY-001 (deployments), Section 35 (incident response runbooks)

**Section 34 - Rollback & Recovery** is complete:
- `checklist/34-rollback-recovery/guide.md` - 8 items with detailed verification steps
- `checklist/34-rollback-recovery/items.yaml` - Structured item list
- RR-001: Rollback procedure documented - Critical severity
- RR-002: Rollback tested regularly - Recommended severity (quarterly minimum)
- RR-003: Can rollback in < 2 minutes - Critical severity, no blocking approval gates
- RR-004: Database migration rollback plan - Critical severity, includes destructive migration strategy
- RR-005: Recovery from backups documented - Critical severity, full stack coverage required
- RR-006: Recovery procedure tested - Critical severity, must include database restore
- RR-007: Know RTO - Recommended severity, must be achievable with current infrastructure
- RR-008: Know RPO - Recommended severity, backup frequency must support it
- 5 Critical items (RR-001, RR-003, RR-004, RR-005, RR-006), 3 Recommended items (RR-002, RR-007, RR-008)
- Cross-refs: Section 26 (backups), FF-002 (kill switches as faster alternative), Section 35 (incident response)

**Section 35 - Incident Response** is complete:
- `checklist/35-incident-response/guide.md` - 7 items with detailed verification steps
- `checklist/35-incident-response/items.yaml` - Structured item list
- IR-001: On-call rotation defined - Recommended severity
- IR-002: Escalation paths documented - Recommended severity
- IR-003: Contact list for emergencies - Critical severity (must be accessible during outages)
- IR-004: PagerDuty/Opsgenie or similar - Recommended severity (small teams can use Slack alerts)
- IR-005: Common incidents have runbooks - Critical severity (merged 4 runbook items into one)
- IR-006: Blameless post-mortems after incidents - Recommended severity
- IR-007: Action items tracked to completion - Recommended severity
- 2 Critical items (IR-003, IR-005), 5 Recommended items
- Merged 11 raw items into 7: combined 4 runbook items (server down, database issues, high traffic, common incidents)
- Cross-refs: Section 12 (monitoring/alerting), Section 34 (rollback), Section 40 (tech debt for unfinished action items)

**Section 36 - Load & Stress Testing** is complete:
- `checklist/36-load-stress-testing/guide.md` - 8 items with detailed verification steps
- `checklist/36-load-stress-testing/items.yaml` - Structured item list
- LST-001: Load testing tool configured - Recommended severity (k6, Artillery, Locust, etc.)
- LST-002: Baseline performance metrics established - Recommended severity
- LST-003: Load testing before major releases - Recommended severity
- LST-004: Automated smoke load tests in CI - Optional severity
- LST-005: Capacity limits documented - Recommended severity
- LST-006: Breaking points identified (stress testing) - Recommended severity
- LST-007: Graceful degradation under load - Recommended severity
- LST-008: Auto-scaling triggers tested - Recommended severity
- 0 Critical items, 7 Recommended items, 1 Optional item
- Merged "load testing before major releases" + "full load tests before major launches" into LST-003 (same thing)
- Merged "test at 2x, 5x, 10x expected traffic" + "identify bottlenecks" into methodology details within LST-003/LST-006
- Cross-refs: Section 17 (performance monitoring), Section 21 (caching), Section 26 (HA), Section 30 (rate limiting), Section 33 (feature flags)

**Section 37 - GDPR & Privacy Compliance** is complete:
- `checklist/37-gdpr-privacy-compliance/guide.md` - 11 items with detailed verification steps
- `checklist/37-gdpr-privacy-compliance/items.yaml` - Structured item list
- GDPR-001: Data deletion request mechanism - Critical severity
- GDPR-002: Deletion request audit trail - Recommended severity
- GDPR-003: Deletion timelines defined - Critical severity (GDPR requires 30 days)
- GDPR-004: Cross-service data deletion - Critical severity
- GDPR-005: Data export / portability - Critical severity (GDPR Article 20)
- GDPR-006: Consent enforced before tracking - Critical severity
- GDPR-007: Consent stored and auditable - Critical severity
- GDPR-008: Consent withdrawal mechanism - Critical severity
- GDPR-009: Privacy policy current and complete - Critical severity
- GDPR-010: Data processing records maintained - Critical severity (Article 30 ROPA)
- GDPR-011: Third-party processors documented - Critical severity
- 10 Critical items, 1 Recommended item (heavy on compliance requirements)
- 4 subsections: Right to Be Forgotten (4), Data Export (1), Consent Management (3), Privacy Documentation (3)
- Merged "mechanism exists" + "process documented" into GDPR-001
- Merged "machine-readable format" + "complete data" into GDPR-005
- Merged "GTM consent" + "backend respects" + "no tracking before consent" into GDPR-006
- Cross-refs: RET-001 (data retention), Section 22/32 (frontend/CSP for consent banners)

**Section 38 - Cost Monitoring & Budget Alerts** is complete:
- `checklist/38-cost-monitoring-budget-alerts/guide.md` - 5 items with detailed verification steps
- `checklist/38-cost-monitoring-budget-alerts/items.yaml` - Structured item list
- COST-001: Cloud provider budget alerts configured - Critical severity
- COST-002: Anomaly detection and unexpected cost alerts - Recommended severity
- COST-003: Tool budgets defined - Recommended severity
- COST-004: Cost visibility and reporting - Recommended severity
- COST-005: Cost governance - Recommended severity
- 1 Critical item, 4 Recommended items
- 4 subsections: Cloud Budget Alerts (1), Anomaly Detection (1), Tool Budgets (1), Cost Visibility (1), Cost Governance (1)
- Merged items 1-3 (budget alerts + budgets defined + thresholds) into COST-001
- Merged item 4 (cloud anomaly) + item 8 (SaaS unexpected alerts) into COST-002
- Merged items 6, 7, 9 (trending + reports + dashboard) into COST-004
- Merged items 10-11 (attribution + regular reviews) into COST-005
- Cross-refs: COST-001 ↔ COST-002 (alerts complement each other), COST-004 ↔ COST-005 (visibility feeds governance)

**Section 39 - Developer Onboarding** is complete:
- `checklist/39-developer-onboarding/guide.md` - 9 items with detailed verification steps
- `checklist/39-developer-onboarding/items.yaml` - Structured item list
- DEV-001: Onboarding checklist documented - Critical severity
- DEV-002: Access requirements documented and pre-defined - Critical severity
- DEV-003: Architecture overview documented - Recommended severity
- DEV-004: Key systems documented - Recommended severity
- DEV-005: Development workflow documented - Recommended severity
- DEV-006: Team contacts and ownership documented - Optional severity
- DEV-007: Access provisioning automated - Optional severity
- DEV-008: IDE/editor setup documented - Optional severity
- DEV-009: Troubleshooting FAQ documented - Optional severity
- 2 Critical items, 3 Recommended items, 4 Optional items
- 4 subsections: Onboarding Documentation (2), Technical Documentation (3), Team & Support (1), Access & Tooling (3)
- Folded "Day-one productivity" into intro as north star (not separate item)
- Merged "Access requests pre-defined" + "List of required accounts" into DEV-002
- Dropped "Local setup script/guide tested" - already covered by GIT-001 through GIT-003
- Cross-refs: GIT-001/002/003 (clone-and-run), DOC-001/002 (documentation), FLOW items (workflow)

**Section 40 - Technical Debt Tracking** is complete:
- `checklist/40-technical-debt-tracking/guide.md` - 8 items with detailed verification steps
- `checklist/40-technical-debt-tracking/items.yaml` - Structured item list
- DEBT-001: Explicit tech debt list maintained - Critical severity
- DEBT-002: Each debt item has required fields - Recommended severity
- DEBT-003: Regular debt review with stale item cleanup - Recommended severity
- DEBT-004: Allocate time for debt reduction - Recommended severity
- DEBT-005: Track debt paid down over time - Optional severity
- DEBT-006: Code complexity trends - Optional severity
- DEBT-007: Dependency age/health - Recommended severity
- DEBT-008: TODO/FIXME count in codebase - Optional severity
- 1 Critical item, 4 Recommended items, 3 Optional items
- 3 subsections: Debt Visibility (2), Debt Management (3), Debt Metrics (3)
- Merged "don't let debt compound indefinitely" into DEBT-003 (stale item cleanup is the mechanism)
- CRAP score is cross-reference only to Section 8 (no duplicate item)
- Cross-refs: Section 2 (dependency management), Section 8 (CRAP score), Section 28 (code quality tools)

**Section 41 - Accessibility (If User-Facing)** is complete:
- `checklist/41-accessibility/guide.md` - 11 items with detailed verification steps
- `checklist/41-accessibility/items.yaml` - Structured item list
- A11Y-001: WCAG 2.1 Level AA target documented - Recommended severity
- A11Y-002: Automated accessibility testing in CI - Recommended severity
- A11Y-003: Screen reader testing for critical paths - Recommended severity
- A11Y-004: Keyboard navigation works - Recommended severity
- A11Y-005: Accessibility audit before major releases - Recommended severity
- A11Y-006: Color contrast checks - Recommended severity
- A11Y-007: Alt text for images - Recommended severity
- A11Y-008: Form labels and ARIA attributes - Recommended severity
- A11Y-009: Accessibility standards documented - Recommended severity
- A11Y-010: Known accessibility issues tracked - Recommended severity
- A11Y-011: Remediation plan for gaps - Recommended severity
- 0 Critical items, 11 Recommended items (severity escalates for legal/contractual requirements)
- 3 subsections: WCAG Compliance (4), Testing (4), Documentation (3)
- Applicability gate upfront: user-facing applications only
- Automated tools (axe-core, Lighthouse, jsx-a11y) emphasized for catching 30-40% of issues
- Manual testing (screen readers, keyboard) acknowledged for what automation misses
- Cross-refs: Section 8 (testing), Section 14 (documentation), Section 22 (Lighthouse), Section 40 (debt tracking patterns)

**Project infrastructure**:
- `WORKFLOW.md` - Documents how we build sections together
- `CLAUDE.md` - Updated with new structure
- `audits/` directory ready for reports

## What's Next

**Section 42 - Internationalization (i18n)** from NOTES.md — the final section!

## How to Continue

Start new session with:

```
Let's do section 42 (Internationalization).

Read WORKFLOW.md for the process, then read section 42 from NOTES.md.

Walk me through each item one by one. I'll give feedback, we'll refine, then write the files.

The handoff file includes key context (rigor, subagents, merging, cross-references) so the new session picks up the patterns we established.

Make sure to follow same format as previous guides (check checklist/41-accessibility/guide.md for reference).
```

## Key Context

- Items should be **rigorous** - actually test things, don't just check files exist
- Use **subagents** to verify commands work before including them
- **Merge** overlapping items (e.g., DEP-001 merged "up to date" + "no CVEs")
- **Cross-reference** between items (e.g., env vars should match docker-compose)
- Sandbox/dev exceptions are OK but must be documented
- Branch flow is: feature-branch → staging → main (production)
- Follow the **exact format** from previous sections (check guide.md structure)
- Item IDs follow pattern: SECTION-NNN (e.g., GIT-001, DEP-001, AUTH-001, ENV-001, DB-001, RES-001, HEALTH-001, TEST-001)
- **Check code instead of asking user** whenever possible

## Patterns Established

### Section 02 Decisions
- Vulnerability scanning is the source of truth for "up to date" (not arbitrary version thresholds)
- Check lockfile age to verify active maintenance
- For monorepos: scan 2-3 levels deep for hidden apps/package.json files
- Flag nested node_modules as red flag (apps installing deps independently)
- Turborepo preferred over Nx/Lerna/Rush

### Section 03 Decisions
- Auth simplicity measured by ability to explain flow, not file counts
- Evidence should be clear explanations/diagrams, not just metrics
- API docs should exist but be dev-only (not exposed in production) unless public API
- Use framework route-listing CLI commands when available
- Webhooks without signature verification OK if behind Zero Trust (document exception)

### Section 04 Decisions
- Split environment tiers into separate items (ENV-001/002/003) - each documents deployment method
- Check CI history via `gh api repos/{owner}/{repo}/deployments` and `gh run list`
- Use agent-browser skill to verify Zero Trust protection (visit URL, capture screenshot of access gate)
- Cloudflare API for listing Access apps (no dedicated CLI for Zero Trust)
- Terraform state as alternative if `cloudflare_access_application` resources used
- Email must use real provider settings in staging (not sandbox) - catches deliverability issues
- Payment gateways in sandbox mode is acceptable for staging

### Section 05 Decisions
- Prisma is the ORM to check for (pool config via `connection_limit`, `pool_timeout`)
- CI must actually apply migrations to Docker-based ephemeral test DB (not just dry-run)
- AI migration review: flag DROP, ALTER COLUMN, DELETE, TRUNCATE, removing NOT NULL
- Database users: guided manual check where user provides `SHOW GRANTS` output
- Read-only user must exist as part of DB user documentation
- App user cannot DROP DATABASE (critical, no exceptions)
- Soft delete pattern recommended but exceptions documented
- Redis: check code for critical patterns (sessions, queues) vs cache-only - don't just ask user
- DB admin tools (phpMyAdmin, Adminer, pgAdmin): on-demand only AND behind Zero Trust
- Admin credentials: 1-2 people max, stored in secret manager

### Section 06 Decisions
- Merged all 4 resilience items into single comprehensive RES-001
- Test both startup resilience (can app start with service down) and runtime resilience (what happens if service dies mid-operation)
- Check for error handling patterns: try/catch, .catch(), timeouts, circuit breakers
- Classify dependencies as critical vs optional - critical can fail startup, optional must degrade gracefully
- Process must stay alive - check for uncaughtException handlers, avoid process.exit on errors
- Cross-reference with health endpoints (section 7) - deep health should report service status

### Section 07 Decisions
- Only 2 items - basic health and deep health (kept separate, both critical)
- Basic health: 50ms threshold locally, 200 OK acceptable (no JSON body required), no auth
- Deep health: must require auth, must check ALL external services app depends on
- Deep health must return 503 (not 200) when any dependency is down
- Deep health response must include details of what's down
- Basic health must still work (return 200) when dependencies are down

### Section 08 Decisions
- TEST-001: CI must enforce coverage threshold (not just track coverage)
- TEST-002/003: Kept separate (fixes vs features) for granular tracking
- TEST-002/003: Check ±1 adjacent commits for associated test changes (devs sometimes split into separate commits)
- TEST-004: Search docs/README/CLAUDE.md for documented critical paths before asking user
- TEST-005: CRAP score - cross-references to sections 28 (Code Architecture) and 40 (Technical Debt) as TODO
- TEST-006: Agent skills marked Optional but kept (important for future AI-assisted workflows)
- Skipped "unit tests sufficient for smaller features" - covered by TEST-001 coverage requirements

### Section 09 Decisions
- FLOW-001: Cross-refs GIT-004/005/006 for branch protection - no duplication, focuses on PR quality/naming
- FLOW-002: AI review is Recommended not Critical - teams can function without it
- FLOW-003: Check deployment timestamps vs merge timestamps to verify dev testing happened first
- FLOW-004: Merged "follow agreed format" + "clear descriptive messages" into single item
- FLOW-005: Merged 4 merge strategy items (no squash, no rebase, preserve history, cleanup before merge)
- FLOW-006: Branch flow as separate Recommended item - process documentation distinct from enforcement
- "At least 1 approval required" already covered by GIT-006 - not duplicated

### Section 10 Decisions
- DEPLOY-001: Merged "clear workflow" + "fix issues immediately" - stability = documented + currently passing + low failure rate
- DEPLOY-002: Merged "track failures" + "notify team" - must notify on BOTH success and failure
- DEPLOY-003: Merged "caching" + "fast builds" - check cache keys include lockfile hash, measure actual durations
- DEPLOY-004: Merged all 3 tagging items - only production gets tags, staging explicitly excluded
- Check for alternative CI systems (Jenkinsfile, .gitlab-ci.yml) if no GitHub Actions
- Cross-refs Section 19 (Sentry deployment integration) for deployment tracking

### Section 11 Decisions
- Merged 6 items into 3: tiered access, minimal prod access, security requirements
- ACCESS-001: Use cloud CLI (gcloud, aws) to verify IAM bindings per environment
- ACCESS-001: For DB access, ask user to run queries and provide evidence if no direct access
- ACCESS-001: Access must be both documented AND approved (sign-off required)
- ACCESS-002: Enforces specific threshold - 1-2 people for prod logs, minimal for DB
- ACCESS-002: Each prod access holder needs documented justification
- ACCESS-003: Security requirements checklist - device security, account security, access security
- ACCESS-003: Requirements must be enforced (not just documented) with periodic verification
- Cross-refs DB-004 (database users), ADMIN-002 (admin audits), ENV-004 (Zero Trust)

### Section 12 Decisions
- Merged 18 items into 6: infrastructure metrics, DB performance, HTTP logging, alerting, retention, status pages
- MON-001: Requires documented service inventory from CLI (kubectl, docker, aws, gcloud)
- MON-001: Coverage matrix showing each service has CPU, memory, disk, plus DB pool and Redis metrics
- MON-002: Slow query logging enabled is not enough - must have dashboard/report OR audit record of reviews
- MON-002: Last review must be within 3 months
- MON-003: Source-agnostic - app logs, CDN logs, APM all acceptable
- MON-003: Must be able to filter by status code and see traffic patterns
- MON-004: 404 alerting = team-defined volume threshold
- MON-004: 500 alerting = any 500s within 1-minute window (not high-volume only)
- MON-005: Minimum 2 weeks retention (corrected from "max 2 weeks" in transcript)
- MON-006: Production status page is Critical, staging is Recommended
- MON-006: Uptime monitors should check health endpoints, not just any HTTP 200
- Cross-refs HEALTH-001/002, DB-001, Section 35 (Incident Response), Section 19 (Sentry)

### Section 13 Decisions
- Merged 8 items into 7: "don't leak tech stack" + "minimal headers" → SEC-004 (response header hygiene)
- SEC-001: Cloudflare API with read-only token preferred for checking zones/DNS records
- SEC-001: Check `proxied: true` in DNS records OR `cf-ray` header presence
- SEC-002: Origin must block direct connections - firewall should only allow Cloudflare IP ranges
- SEC-002: Check DNS history tools for leaked origin IPs (SecurityTrails, DNSdumpster)
- SEC-003: Browser Cache TTL = 0 means "Respect Existing Headers" (CF setting)
- SEC-003: Can't curl origin directly to compare headers if SEC-002 passes (origin blocks non-CF)
- SEC-004: Flag X-Powered-By, Server with version, framework-specific headers
- SEC-005: HSTS max-age >= 31536000 (1 year) required for preload list eligibility
- SEC-006: GTM cannot have SRI (Google updates it dynamically) - mitigate with access controls + CSP
- SEC-006: GTM access is effectively admin-level access - audit who can add tags
- SEC-006: Severity escalates to Critical if third-party CDNs or uncontrolled GTM
- SEC-007: CT monitoring via Cert Spotter (free), Cloudflare (Pro+), or crt.sh (no alerting)
- Cross-refs Section 22 (Caching), Section 30 (API Security/CSP), Section 15 (Admin Security)

### Section 14 Decisions
- Only 3 items - feature docs, complex systems, documentation freshness
- DOC-001: In-repo docs preferred but external (Notion, GitBook, wiki) acceptable if AI-accessible
- DOC-001: Merged "human readable" + "AI readable" into single item
- DOC-002: Complex systems (payments, fulfillment, admin) kept as examples, not required checklist
- DOC-002: Cross-refs Section 3 (Auth) and Section 15 (Admin) with TODO placeholders for item IDs
- DOC-003: Spot-check freshness by comparing doc last-commit to referenced source file last-commit
- DOC-003: If referenced source files changed after doc was last updated, doc may be stale

### Section 15 Decisions
- Merged 9 items into 6: admin parity (2→1), access auditing (3→1), kept login/audit/disable/skill separate
- ADM-001: Merged "every feature has admin" + "admin can manage/view/debug" - same underlying concept
- ADM-002: Merged "frequent audits" + "periodic access audits" + "easy to suspend" - same workflow
- ADM-003: Login tracking (authentication) kept separate from ADM-004 (action logging)
- ADM-004: Audit trail for admin actions - who, what, when, affected resource
- ADM-005: Emergency response capability - emphasis on "immediately" for incident response
- ADM-006: Claude skill for audits - Optional severity (nice to have, not core security)
- Cross-refs: DOC-002 (complex systems), ACCESS-001/002 (access control), MON-005 (log retention)

### Section 16 Decisions
- Merged all 3 items into single CTO-001 (AI-assisted project briefings)
- Recommended severity (not Optional) - important CTO tooling for staying informed
- Prescriptive requirements: must be Claude skill or CLAUDE.md section
- Must query: git log (commits), gh pr list (PRs), gh run list (deployments)
- Must synthesize output into readable brief (not raw command dumps)
- Cross-refs: DEPLOY-001 (deployment workflow), FLOW-001 (feature branch workflow)

### Section 17 Decisions
- Merged "graph response times" + "identify slowest endpoints" into single PERF-001
- PERF-001: Soft 500ms warning threshold for slowest endpoints (flag for review, not fail)
- PERF-002: Memory tracking must show historical trends (hours/days), not just current value
- PERF-003: Memory leak detection requires automated alerting - manual review alone not sufficient
- PERF-003: OOM-kill as detection = fail (too late)
- PERF-004: Heap dumps Optional - only useful when debugging memory leaks
- PERF-004: If heap dump mechanism exists but is unprotected = security fail
- PERF-004: SSH/exec into container acceptable as heap dump mechanism (if access restricted)
- Cross-refs: MON-001 (infrastructure monitoring), SEC-001 (Zero Trust)

### Section 18 Decisions
- Merged "own your analytics data" + "server-side tracking" into ANA-001 (same underlying principle)
- ANA-001: Client-only analytics (GA4 frontend-only) = fail; must have server-side component
- ANA-001: Data must be queryable (raw events via SQL), not locked in SaaS dashboard
- ANA-002: BigQuery recommended warehouse; Dataform for SQL transformations
- ANA-002: Pipeline must be automated (not manual CSV exports)
- ANA-003: GitHub data → warehouse is Optional (mature practice, not universal yet)
- ANA-004: Metabase recommended as BI tool; self-serve for non-engineers is the goal
- ANA-004: Engineers-only dashboards = Partial pass (not full fail)
- ANA-005: Merged 3 git analytics items (PR activity, commits, strategy) into single item
- ANA-005: Optional severity - valuable for scaling teams, early-stage can rely on GitHub Insights
- ANA-005: DORA metrics as north star for engineering analytics
- Cross-refs: ANA-001 → ANA-002 (ownership requires warehouse), ANA-002 → ANA-004 (warehouse needs BI)

### Section 19 Decisions
- 8 items total: 5 Setup items, 3 AI-Driven Error Handling items
- ERR-001: Critical severity - error tracking is essential for production visibility
- ERR-001: Check for Sentry AND alternatives (Bugsnag, Rollbar, Raygun, etc.)
- ERR-002: PII handling must be intentional decision - either scrubbed or enabled with rationale
- ERR-002: Cross-refs Section 37 (GDPR) for compliance requirements
- ERR-003: Stack traces + performance tracing (tracesSampleRate) - low rate acceptable if documented
- ERR-004: Source maps uploaded via CI/CD - check for build plugins OR sentry-cli
- ERR-004: Backend Node.js may not need source maps (already readable)
- ERR-005: Releases tie source maps to deployments - cross-refs DEPLOY-004 (deployment tags)
- ERR-006/007/008: AI-driven items kept as Recommended (not Optional) per user request
- ERR-006: AI review via Sentry API on schedule (daily/weekly), output to Slack/issues/PRs
- ERR-007: AI creates labeled PRs, human review required before merge
- ERR-008: Triage includes prioritization, routing, ignore rules, issue tracker integration
- Cross-refs: DEPLOY-004 (releases), MON-004 (500 alerting), FLOW-002 (PR review), Section 35 (incident response)

### Section 20 Decisions
- 8 items total: 4 DNS Authentication (Critical), 4 Email Monitoring (mixed severity)
- Key prerequisite: User must provide domain inventory (root + subdomains that send email)
- Key prerequisite: DNS API access (Cloudflare, Route53, etc.) enables automated discovery
- EMAIL-001: MX records must exist, resolve, AND be reachable on port 25 (extra rigor)
- EMAIL-002: SPF soft fail (~all) acceptable short-term, but note duration and plan for hard fail (-all)
- EMAIL-002: Check subdomains that send email, not just root domain
- EMAIL-003: Use DNS API to discover all `_domainkey` records - don't guess selectors
- EMAIL-003: Without API access, check common provider selectors (google, selector1, smtpapi, etc.)
- EMAIL-004: DMARC checked for root and subdomains; `p=none` OK during rollout with plan to enforce
- EMAIL-004: Reporting address (rua=) required - must actually review reports
- EMAIL-005: Merged spam scoring + placement tests into single deliverability item
- EMAIL-005: Automated testing recommended, manual acceptable - note cadence
- EMAIL-006: Transactional email logging Critical - open/click tracking required unless documented exception
- EMAIL-006: Documented exceptions for privacy-sensitive emails (password reset, 2FA) acceptable
- EMAIL-007: Marketing email logging separate from transactional - different systems, different requirements
- EMAIL-007: N/A if no marketing emails sent - document explicitly
- EMAIL-008: Retention is intentional decision, not "whatever default"; 2-4 weeks typical
- EMAIL-008: Outside range just noted (not fail) - may have compliance reasons for longer

### Section 21 Decisions
- Only 2 items - lean section focused exclusively on static asset caching
- Merged "cache busters" + "content hashes" into CACHE-002 (same underlying concept)
- CACHE-001: CDN caching - check Cache-Control headers AND CDN-specific headers (CF-Cache-Status, x-cache, etc.)
- CACHE-001: Provider-agnostic - Cloudflare, CloudFront, Fastly, Vercel all covered
- CACHE-002: Content hashes in filenames are the modern cache invalidation strategy
- CACHE-002: Query string cache busting (`?v=123`) is less reliable - flag as partial
- Both items Recommended severity (performance optimization, not security)
- Scope limited to static assets per user direction - no API caching, Redis, database caching
- Cross-refs: CACHE-001 ↔ CACHE-002 (hashed assets should have long TTLs)

### Section 22 Decisions
- 4 items total: 2 Page Rendering, 2 Resource Loading
- Merged "first paint optimization" + "no CLS" + "track load speed" into FEP-002 (Core Web Vitals)
- FEP-001: Lighthouse CI in pipeline - catches regressions before deployment
- FEP-001: Check for alternatives (Calibre, SpeedCurve, WebPageTest) if no Lighthouse CI
- FEP-002: Uses PageSpeed Insights API (free, no auth) for automated Core Web Vitals checks
- FEP-002: Test multiple key pages, not just homepage (ask user for SEO-critical pages)
- FEP-002: Thresholds from Google: FCP <1.8s, LCP <2.5s, CLS <0.1 (good); <3s, <4s, <0.25 (acceptable)
- FEP-003: Font preloading OR font-display fallback - either approach acceptable
- FEP-003: Preload must have `crossorigin` attribute for fonts (common mistake)
- FEP-003: N/A if only using system fonts
- FEP-004: Critical CSS inlined OR preloaded OR minimal render-blocking - multiple valid approaches
- FEP-004: Check for build tools (critters, vite-plugin-critical) that automate this
- All items Recommended severity (SEO/UX, not security)
- Cross-refs: CACHE-001/002 (caching affects repeat visits), FEP items reference each other

### Section 23 Decisions
- 3 items total: 1 Cookies, 1 Storage, 1 JWT Handling
- Merged "HttpOnly cookies" + "avoid JS-accessible cookies" into CSS-001 (same underlying concern)
- Merged "avoid localStorage" + "use sessionStorage" into CSS-002 (proper storage hygiene)
- Merged 3 JWT items (document practices, periodic audits, part of checklist) into CSS-003
- CSS-001: Critical severity - XSS can steal non-HttpOnly session cookies
- CSS-001: Codebase-focused investigation - grep for cookie config, not just HTTP headers
- CSS-001: Check auth libraries (iron-session, next-auth, express-session) for cookie settings
- CSS-001: document.cookie usage should be limited to non-sensitive data only
- CSS-002: Recommended severity - localStorage is XSS-accessible but less severe than cookies
- CSS-002: Acceptable localStorage: theme, locale, UI state, feature flags, analytics IDs
- CSS-002: Not acceptable: JWTs, auth tokens, session IDs, PII, API keys
- CSS-003: Recommended severity - documentation and process, not immediate security risk
- CSS-003: Check JWT library (jsonwebtoken, jose, next-auth), expiration config, signing algorithm
- CSS-003: RS256/ES256 preferred over HS256 for production
- CSS-003: Short-lived access tokens (15min-1hr) with refresh flow is best practice
- Cross-refs: CSS-001 ↔ CSS-002 ↔ CSS-003 (all relate to token storage location)

### Section 24 Decisions
- 5 items total: 2 Soft Delete Implementation, 2 Data Cleanup, 1 Legal Compliance
- Merged "queries ignore soft-deleted data" + "data remains in database" into RET-002 (same concept)
- RET-001: Critical severity - data loss is unrecoverable
- RET-001: Ask user which tables are critical, provide educated guesses (users, orders, payments, subscriptions)
- RET-001: Check for soft delete columns (deleted_at, deletedAt, is_deleted) and ORM config
- RET-001: Flag hard DELETE operations on critical tables as red flag
- RET-002: Critical severity - deleted data leaking to users is a data integrity bug
- RET-002: Check ORM auto-filtering (Prisma middleware, TypeORM @DeleteDateColumn, Sequelize paranoid)
- RET-002: Must have "include deleted" escape hatch for admin/audit use cases
- RET-003: Recommended severity - data hygiene, not immediate risk
- RET-003: Look for scheduled jobs, scripts, or admin UI for reviewing old deleted records
- RET-003: Ask user about manual process if no automation found
- RET-004: Recommended severity - capability must exist but shouldn't be automatic
- RET-004: Hard delete mechanism, defined retention period, auditable purges
- RET-004: Purge must be gated (review/approval) not fully automatic
- RET-005: Critical severity - compliance violation risk (GDPR, HIPAA, SOX, tax laws)
- RET-005: Legal hold mechanism (flag to prevent deletion) must exist
- RET-005: Retention periods defined per data type where legally required
- RET-005: Purge process must check legal holds before deleting
- Cross-refs: DB-006 (app user permissions), GDPR-001 (right to be forgotten tension)

### Section 25 Decisions
- 4 items total: 1 General Security Monitoring, 2 Data Exfiltration Detection, 1 Alerting
- Merged "immediate warnings to concerned parties" + "hey you probably want to look at this" into IDS-004
- All items Recommended severity with note: "Critical for big projects handling sensitive data or at scale"
- IDS-001: General IDS - WAF, SIEM, cloud-native (GuardDuty, Security Command Center), or open-source (Wazuh, OSSEC)
- IDS-001: Check Cloudflare, AWS WAF, Terraform security resources, Docker Compose for security tools
- IDS-001: Someone must be responsible for reviewing security alerts
- IDS-002: Network-level data transfer monitoring - outbound data volume per IP/session
- IDS-002: Check Cloudflare analytics/alerts, VPC Flow Logs, application-level response size tracking
- IDS-002: Thresholds must be defined (e.g., >100MB in 1 hour from single IP)
- IDS-003: Database query anomaly detection - large result sets indicate potential exfiltration
- IDS-003: Check pgaudit, MySQL audit plugin, application-level query logging with row counts
- IDS-003: Thresholds must be defined (e.g., single query returning >10,000 rows)
- IDS-004: Alert routing - security alerts must reach right people immediately
- IDS-004: Alerts must include actionable context (what, where, why suspicious, what to do)
- IDS-004: Not just "high bandwidth detected" but "IP x.x.x.x downloaded 500MB in 10 minutes from /api/users"
- IDS-004: Escalation path required if primary contact unavailable
- Focus is data exfiltration detection for smaller budgets, not full enterprise IDS/SIEM
- Cross-refs: SEC-001 (Cloudflare), MON-002/003/004 (monitoring), INC-001 (on-call), DB-004 (database users)

### Section 26 Decisions
- 6 items total: 2 High Availability, 4 Backups
- Kept database HA (HA-001) separate from server HA (HA-002) - different infrastructure layers
- Merged "2+ data center regions" + "not tied to one location" + "immediate failover" into HA-002
- HA-001/002: Recommended severity with "Critical when serious money involved" note
- HA-003/005: Always Critical regardless of project scale (backups are non-negotiable)
- HA-004: Off-site backups must be **different provider** - cross-region within same cloud doesn't count
- HA-004: Merged "read replica elsewhere" + "SQL dump files" as low-cost options for achieving off-site
- HA-004: Suggested providers: Backblaze B2, Wasabi, Cloudflare R2
- HA-005: PITR is enabled via backup retention > 0 for managed DBs; self-hosted needs WAL archiving
- HA-006: Backup window should be intentional (low-traffic), frequency must align with business RPO
- HA-006: If PITR enabled, fills gap between snapshots (near-zero RPO)
- Cross-refs: Section 34 (RTO/RPO), DB-001 (connection pooling during failover), MON-002/006 (DB monitoring, status pages)

### Section 27 Decisions
- 2 items total: 1 Visualization, 1 Exploration
- Kept items separate: ERD visualization (schema structure) vs data exploration (querying actual data)
- DBT-001: ERD visualization - check for Prisma, DBML files, ERD docs, database IDEs (DBeaver, DataGrip, TablePlus)
- DBT-001: Recommended severity - developer productivity, not security
- DBT-002: Data exploration - check for Prisma Studio, admin panels (pgAdmin, Adminer, Django Admin)
- DBT-002: Emphasized production access must be controlled AND audited
- DBT-002: "SSH + raw psql" with no access controls = fail
- Small section focused on developer tooling for database visibility
- Cross-refs: DB-001 (connection pooling), Section 15 (Admin features), Section 25/30 (Security)

### Section 28 Decisions
- 3 items total: 1 SOLID Principles, 1 Code Quality, 1 Build Performance
- Merged 2 SOLID items (follows SOLID + regular audits) into ARCH-001 - audit is the mechanism
- Merged 5 code quality items (tools, duplication, complexity, healthy, don't ignore) into ARCH-002
- Merged 2 build performance items (build time + caching) into ARCH-003
- ARCH-001: Emphasis on AI agent doing the assessment - during PR review or periodic audits
- ARCH-001: Proxy metrics (file size >500 lines, imports >20) are heuristics, not definitive
- ARCH-001: Check for CLAUDE.md/AGENTS.md with architecture guidelines
- ARCH-002: Quality tools include SonarQube, CodeClimate, jscpd, ESLint complexity rules
- ARCH-002: "Reported with visibility" is minimum pass, "enforced gates" is better but optional
- ARCH-002: Duplication detection (jscpd) should be part of tooling
- ARCH-003: Benchmarks - clean build <3min, cached <30sec, CI <5min
- ARCH-003: Check for Turborepo, Nx, Webpack cache, Vite, esbuild, swc
- ARCH-003: Use subagent to actually measure build times if needed
- All items Recommended severity (code health practices, not security)
- Cross-refs: TEST-005 (CRAP score), FLOW-002 (AI review), DEPLOY-003 (CI build performance)

### Section 29 Decisions
- 6 items total: 3 Secret Storage (Critical), 3 Secret Security (2 Critical, 1 Recommended)
- Expanded from 3 raw items to 6: added rotation/audit (SEC-001), no git commits (SEC-004), env separation (SEC-005), least privilege (SEC-006)
- SEC-001: Must have rotation capability (even if manual) and audit trail for secret access
- SEC-001: Check for GCP Secret Manager, AWS Secrets Manager, Vault, Doppler, Infisical, 1Password
- SEC-002: dotenv acceptable for local dev only - production must use environment injection
- SEC-002: Centralized config pattern with startup validation is recommended
- SEC-003: TLS certificates still shouldn't be in codebase - managed by infrastructure (Cloudflare, cert-manager) or secret manager
- SEC-003: Check Dockerfile for COPY .env anti-pattern
- SEC-004: Secret scanning required - pre-commit hooks (gitleaks, trufflehog) or CI-based
- SEC-004: GitHub secret scanning should be enabled
- SEC-004: Check git history for past leaks - secrets in history are still exposed
- SEC-005: Recommended severity - each environment must have separate credentials
- SEC-005: "If staging DB password leaked, would prod be compromised?" - answer must be no
- SEC-006: Recommended severity - least privilege, dedicated service accounts, audit trails
- SEC-006: Developers should not be able to read prod secrets directly without approval
- 4 Critical items (SEC-001 through SEC-004) - core security requirements
- 2 Recommended items (SEC-005, SEC-006) - mature practices, important for scale
- Cross-refs: GIT-016 (no credentials), ACCESS-001/002 (access control), ENV-001/003 (environments), ADMIN-002 (audit trails)

### Section 30 Decisions
- 3 items total: 1 Critical (rate limiting exists), 2 Recommended (graceful handling, documentation)
- Merged 5 raw items into 3: items 1, 2, 4 → RATE-001 (rate limiting configured)
- RATE-001: Infrastructure-level rate limiting (Cloudflare, nginx, API Gateway) is sufficient - app-level not required
- RATE-001: Global limits are acceptable - per-endpoint granularity is nice-to-have, not required
- RATE-001: Auth differentiation (higher limits for authenticated) is Recommended, not required
- RATE-001: Keying strategy must isolate clients (IP, user, API key) - global counter = fail
- RATE-002: Actually test hitting the rate limit in dev environment (rigor)
- RATE-002: Retry-After header is nice-to-have, not required
- RATE-002: Must return 429, not 500 or crash
- RATE-003: Either response headers (X-RateLimit-*) OR written docs satisfies documentation requirement
- Lean section - rate limiting is straightforward, no transcript for additional context
- Cross-refs: AUTH-001 (authentication), INFRA-001 (Cloudflare), MON-003 (HTTP logging for 429s)

### Section 31 Decisions
- 6 items total: 2 Optional (versioning), 3 Critical (validation/injection), 1 Recommended (gateway)
- Split versioning into 2 items: API-001 (versioning strategy) and API-002 (deprecation strategy)
- API-001: Optional severity - not all projects need versioning (internal APIs, early-stage, single-consumer)
- API-001: If versioning exists, must be consistent (all routes use same approach)
- API-001: Mixed versioning (some `/v1/`, some unversioned) = fail
- API-002: Optional severity - only relevant if multiple versions exist
- API-002: Deprecation headers (RFC 8594 Deprecation, Sunset) or documented policy acceptable
- API-003: Critical severity - server-side validation is non-negotiable
- API-003: Check for validation libraries (Zod, Joi, Yup, Pydantic, class-validator)
- API-003: Frontend-only validation = fail; must validate on server
- API-004: Critical severity - SQL injection is OWASP Top 10
- API-004: ORM usage is inherently safe; check for raw query patterns
- API-004: Template literals with `${var}` in SQL = immediate fail
- API-004: `$queryRawUnsafe` / `$executeRawUnsafe` needs justification and audit
- API-005: Critical severity - XSS is OWASP Top 10
- API-005: React/Vue/Angular auto-escape by default - check for bypasses
- API-005: `dangerouslySetInnerHTML`, `v-html`, `[innerHTML]` must use sanitized content
- API-005: DOMPurify or sanitize-html required if user content rendered as HTML
- API-006: Recommended severity - gateway is better but CORS is acceptable
- API-006: CORS with `*` origin in production = fail
- API-006: Gateway centralizes auth/rate-limiting/logging - reduces duplication
- Cross-refs: Section 32 (CSP), RATE-001 (gateway rate limiting), AUTH-001 (gateway auth), DB-004 (limited DB permissions)

### Section 32 Decisions
- 4 items total: all Recommended severity (defense-in-depth, not blocking requirement)
- CSP-001: Full CSP headers - must include key directives: default-src, script-src, frame-ancestors
- CSP-001: Ask user where CSP is configured (code, nginx, Cloudflare, Vercel/Netlify)
- CSP-001: `default-src *` = fail (provides no protection)
- CSP-001: Missing `frame-ancestors` = clickjacking vulnerability
- CSP-002: Report-only mode before enforcing - use Content-Security-Policy-Report-Only header
- CSP-002: Reporting services: Sentry, report-uri.com, uri.report, or custom endpoint
- CSP-002: Mature CSP can skip report-only (already completed testing phase)
- CSP-002: Report-only without anyone reviewing reports = fail
- CSP-003: Block inline scripts - `unsafe-inline` without nonce/hash = fail
- CSP-003: Nonce-based CSP is modern approach - build pipeline adds nonces to script tags
- CSP-003: `strict-dynamic` allows nonce-loaded scripts to load other scripts
- CSP-003: style-src `unsafe-inline` often needed for CSS-in-JS (acceptable, less dangerous than scripts)
- CSP-003: Google Tag Manager strategy required if GTM used (nonce propagation, server-side GTM, or whitelist)
- CSP-004: Whitelist trusted sources - `default-src 'self'` as baseline
- CSP-004: No wildcards in script-src or default-src
- CSP-004: `data:` in script-src needs justification
- CSP-004: `unsafe-eval` needs documented reason (Vue runtime templates, Angular JIT, legacy eval)
- CSP-004: Quarterly whitelist review recommended - remove unused domains
- Cross-refs: API-005 (XSS), SEC-001 (Cloudflare edge headers), API-006 (gateway)

### Section 33 Decisions
- 2 items total: both Recommended severity
- Merged 5 raw items into 2: FF-001 (system + capabilities) and FF-002 (kill switches)
- FF-001: Merged feature flags + A/B testing + percentage rollouts + user segment targeting
- FF-001: Small projects can use env var flags (FEATURE_*, ENABLE_*) - acceptable
- FF-001: Larger projects need dedicated service - GrowthBook recommended
- FF-001: Capabilities to verify: A/B testing, percentage rollouts, sticky assignment (user ID hashing), segment targeting
- FF-001: Library installed but never used = fail
- FF-002: Kill switches kept separate - critical for incident response
- FF-002: Must be toggleable in < 5 minutes without deploy (instant via dashboard preferred)
- FF-002: Env var flags require restart = not suitable for kill switches
- FF-002: Critical features need kill switches: payments, external APIs, new features
- FF-002: Documentation required - "how to disable feature X in emergency"
- FF-002: Hybrid approach: feature flag service + env var override as backup
- Cross-refs: DEPLOY-001 (deployments), Section 35 (incident response runbooks)

### Section 34 Decisions
- 8 items total: 5 Critical (RR-001, RR-003, RR-004, RR-005, RR-006), 3 Recommended (RR-002, RR-007, RR-008)
- Two subsections: Rollback Strategy (4 items), Emergency Recovery (4 items)
- RR-001: Rollback procedure documented - Critical severity, platform-aware (Vercel/Railway have built-in)
- RR-001: Documentation OR platform with known rollback mechanism satisfies requirement
- RR-002: Rollback tested regularly - quarterly minimum, multiple team members should have done it
- RR-002: "Never tested" = fail, "Only one person knows how" = fail
- RR-003: Can rollback in < 2 minutes - Critical severity, speed matters during incidents
- RR-003: Instant (< 30 sec): Vercel, Railway, Fly.io, K8s rollout undo
- RR-003: Fast (< 2 min): Git revert + fast CI/CD
- RR-003: Slow (> 5 min): Manual process, long pipelines = fail
- RR-003: Approval gates that block emergency rollbacks = fail
- RR-003: Kill switches (FF-002) can be faster than rollback - use as complement
- RR-004: Database migration rollback plan - Critical severity
- RR-004: Prisma has no built-in down migrations - rollback = previous schema + manual SQL or backup
- RR-004: Destructive migrations (DROP) require backup restore strategy
- RR-004: Migrations must be tested on staging before production
- RR-005: Recovery from backups documented - Critical severity, "server down → back up from backups"
- RR-005: Must cover full stack: infrastructure, database, application
- RR-005: Backups stored separately from primary infrastructure (different provider preferred)
- RR-005: Infrastructure-as-code (Terraform, Pulumi) makes recovery easier
- RR-006: Recovery procedure tested - Critical severity, untested backups are Schrödinger's backups
- RR-006: Must include database restore, not just app redeploy
- RR-006: Annual minimum, document issues found and fix them
- RR-006: Measure time taken during drill (validates RTO)
- RR-007: Know RTO - Recommended severity, maximum acceptable downtime
- RR-007: RTO must be achievable with current infrastructure
- RR-007: Tiers: <1min (hot standby), <15min (warm standby), <1hr (pre-provisioned DR), <4hr (restore from backup)
- RR-008: Know RPO - Recommended severity, maximum acceptable data loss
- RR-008: Backup frequency must support RPO (daily backups = 24hr max RPO)
- RR-008: PITR enables near-zero RPO
- Cross-refs: Section 26 (backups), FF-002 (kill switches), Section 35 (incident response)

### Section 35 Decisions
- 7 items total: 4 On-Call & Escalation, 1 Runbooks, 2 Post-Mortems
- Merged 4 runbook items (common incidents, server down, database issues, high traffic) into single IR-005
- IR-001: On-call rotation - Recommended severity, documents who's responsible
- IR-001: "Founder handles everything" is acceptable for small teams if documented
- IR-001: Single point of failure with no backup = fail
- IR-002: Escalation paths - Recommended severity, clear criteria for when to escalate
- IR-002: Must have contact info for each tier
- IR-003: Contact list - Critical severity, must be accessible during outages
- IR-003: Multiple contact methods (phone + Slack/email) required
- IR-003: List only in production systems = fail (inaccessible during outage)
- IR-004: Incident management tool - Recommended severity, small teams can use Slack alerts
- IR-004: Tool must be integrated with monitoring/alerting if used
- IR-005: Runbooks - Critical severity, step-by-step for common incident types
- IR-005: Minimum coverage: server down, database issues, high traffic, security incident
- IR-005: Runbooks stored only in systems that could be down = fail
- IR-006: Post-mortems - Recommended severity, blameless culture
- IR-006: Must include root cause analysis (5 whys), not just timeline
- IR-006: Template or consistent format expected
- IR-007: Action items tracked - Recommended severity, must go into issue tracker
- IR-007: Action items staying in post-mortem doc only = fail
- IR-007: Same issues recurring indicates incomplete follow-through
- Cross-refs: Section 12 (monitoring/alerting), Section 34 (rollback), Section 40 (tech debt)

### Section 36 Decisions
- 8 items total: 2 Load Testing Setup, 2 Pre-Release Testing, 1 Capacity Planning, 3 Stress Testing
- Merged "load testing before major releases" + "full load tests before major launches" into LST-003 (same thing)
- Merged "test at 2x, 5x, 10x traffic" + "identify bottlenecks" into methodology within LST-003/LST-006
- LST-001: Load testing tool - Recommended severity, k6/Artillery/Locust/Gatling all acceptable
- LST-001: Tool installed but no scripts written = fail
- LST-001: External management (k6 Cloud) acceptable if documented
- LST-002: Baseline metrics - Recommended severity, must have actual measurements
- LST-002: Key metrics: p50/p95/p99 response time, throughput (RPS), error rate
- LST-002: "It feels fast" = fail (anecdotal not acceptable)
- LST-003: Pre-release load testing - Recommended severity, process for when to test
- LST-003: Define criteria: new DB queries, caching changes, infra changes, traffic increase
- LST-003: Not every release needs load testing, but criteria must exist
- LST-004: CI smoke tests - Optional severity (not all projects need this)
- LST-004: Characteristics: 10-50 VUs, 30-60 seconds, key endpoints only
- LST-004: Full load tests (LST-003) are separate from CI smoke tests
- LST-005: Capacity limits - Recommended severity, "how much can we handle?"
- LST-005: Must know the bottleneck (database, CPU, memory, external API)
- LST-005: Discovered limits only during outages = fail
- LST-006: Breaking points (stress testing) - Recommended severity
- LST-006: Different from load testing: intentionally exceed capacity to understand failure
- LST-006: Document failure modes: connection pool exhaustion, OOM, CPU saturation, DB locks
- LST-007: Graceful degradation - Recommended severity
- LST-007: Circuit breakers, load shedding, feature flags, cached fallbacks
- LST-007: System crashes completely under overload = fail
- LST-008: Auto-scaling tested - Recommended severity
- LST-008: "Configured but never triggered" = fail
- LST-008: Must know scale-up time, must check account quotas
- LST-008: Fixed capacity is fine if traffic is predictable
- No Critical items in this section (performance practices, not security)
- Cross-refs: Section 17 (performance monitoring), Section 21 (caching), Section 26 (HA), Section 30 (rate limiting), Section 33 (feature flags)

### Section 37 Decisions
- 11 items total: 4 Right to Be Forgotten, 1 Data Export, 3 Consent Management, 3 Privacy Documentation
- 10 Critical items, 1 Recommended item - heavily compliance-focused section
- GDPR-001: Merged "mechanism exists" + "process documented" - both needed for compliance
- GDPR-001: Self-service deletion OR documented email process - both acceptable
- GDPR-002: Recommended severity - audit trail important but not legally mandated
- GDPR-003: 30 days is GDPR default, 90 days max for complex requests with notification
- GDPR-004: Data map required - inventory of where user data lives across all services
- GDPR-004: Backups exempted if disclosed in privacy policy (delete on restore)
- GDPR-004: Cross-refs GDPR-010 (ROPA) and GDPR-011 (third-party processors)
- GDPR-005: Merged "users can export" + "machine-readable format" + "complete data" - all aspects of portability
- GDPR-005: JSON or CSV required - PDF is not machine-readable
- GDPR-005: Self-service ideal but request-based (email support) is compliant
- GDPR-006: Merged "GTM consent mode" + "backend respects" + "no tracking before consent"
- GDPR-006: Must verify tracking actually blocked - banner existing doesn't prove enforcement
- GDPR-006: Backend server-side tracking must also respect consent, not just frontend
- GDPR-007: Consent stored server-side, not just cookies (cookies can be cleared)
- GDPR-007: Must store: who, when, what categories, policy version
- GDPR-008: Withdrawal must be as easy as giving consent (GDPR requirement)
- GDPR-008: Footer link to re-open banner or settings page required
- GDPR-008: "Email us to opt out" = fail (too difficult)
- GDPR-009: Privacy policy must include GDPR disclosures (controller, legal basis, rights, etc.)
- GDPR-009: Updated within 12 months OR after significant changes
- GDPR-010: ROPA (Record of Processing Activities) - Article 30 requirement
- GDPR-010: Mandatory for 250+ employees OR sensitive data processing
- GDPR-010: Still best practice for smaller orgs - needed for responding to requests
- GDPR-011: DPAs required with all third-party processors
- GDPR-011: Processors must be disclosed in privacy policy
- GDPR-011: New vendor vetting process should include GDPR compliance check
- Cross-refs: RET-001 (data retention tension with right to deletion), Section 22/32 (frontend for consent banners)

### Section 38 Decisions
- 5 items total: 1 Critical (cloud budget alerts), 4 Recommended (anomaly detection, tool budgets, visibility, governance)
- Merged items 1-3 (alerts exist + budgets defined + multiple thresholds) into COST-001
- Merged item 4 (cloud anomaly detection) + item 8 (SaaS unexpected alerts) into COST-002 (both about catching spikes)
- Merged items 6, 7, 9 (cost trending + monthly reports + dashboard) into COST-004 (all about visibility)
- Merged items 10-11 (cost attribution + regular reviews) into COST-005 (both about governance)
- COST-001: Critical severity - runaway cloud costs are a real business risk
- COST-001: Must have defined budget amount, multiple thresholds (50%, 80%, 100%), monitored recipients
- COST-001: Check AWS budgets, GCP billing budgets, Azure consumption budgets, and IaC
- COST-002: Recommended severity - complements fixed thresholds
- COST-002: Check AWS Cost Anomaly Detection, third-party tools (Vantage, CloudHealth, Kubecost)
- COST-002: Identify usage-based services that could spike (AI APIs, SMS, bandwidth)
- COST-003: Recommended severity - SaaS tools add up beyond cloud
- COST-003: Tool inventory with expected costs and ownership required
- COST-004: Recommended severity - need unified view for decision-making
- COST-004: Historical trends, regular reports, not just checking cloud consoles
- COST-004: Maturity levels from scattered (Level 1) to optimized with forecasting (Level 5)
- COST-005: Recommended severity - visibility without action is pointless
- COST-005: Cost attribution via tagging, accounts, or manual allocation
- COST-005: Tagging must be enforced if used (many untagged resources = fail)
- COST-005: Regular reviews (monthly minimum) must lead to actions
- Cross-refs: COST-001 ↔ COST-002 (different detection methods), COST-004 ↔ COST-005 (visibility feeds governance)

### Section 39 Decisions
- 9 items total: 2 Critical, 3 Recommended, 4 Optional
- 4 subsections: Onboarding Documentation (2), Technical Documentation (3), Team & Support (1), Access & Tooling (3)
- Folded "Day-one productivity" into guide intro as north star (not a separate checkable item)
- Merged "Access requests pre-defined" + "List of required accounts/access" into DEV-002 (same concept)
- Dropped "Local setup script/guide tested" - already covered by GIT-001/002/003 (clone-and-run)
- DEV-001: Critical severity - onboarding checklist must be actionable (not just prose)
- DEV-001: Updated within 6 months OR after most recent hire
- DEV-001: Must cover: access, local setup, first tasks, who to ask
- DEV-002: Critical severity - all access pre-defined, achievable day one
- DEV-002: Common categories: code (GitHub), cloud (AWS/GCP), monitoring (Sentry), comms (Slack), PM (Linear)
- DEV-003: Recommended severity - architecture overview with diagrams
- DEV-003: Must be understandable without prior context
- DEV-004: Recommended severity - critical systems (payments, auth, integrations) need dedicated docs
- DEV-004: Cross-refs DOC-002 (complex systems documentation)
- DEV-005: Recommended severity - development workflow (branching, PRs, reviews, deploys)
- DEV-005: Cross-refs FLOW items and GIT branch protection items
- DEV-006: Optional severity - team contacts/ownership more important at 5+ engineers
- DEV-006: CODEOWNERS acceptable if discoverable for questions (not just PR routing)
- DEV-007: Optional severity - access automation is maturity indicator
- DEV-007: Maturity levels from manual (Level 1) to fully automated SSO+SCIM (Level 5)
- DEV-008: Optional severity - IDE config (.vscode/, .editorconfig) for consistency
- DEV-008: Editor-agnostic acceptable if linting enforced at CI level
- DEV-009: Optional severity - troubleshooting FAQ for common gotchas
- DEV-009: Should be actively maintained (new issues added when discovered)
- Cross-refs: GIT-001/002/003 (clone-and-run), DOC-001/002 (documentation), FLOW items (workflow)

### Section 40 Decisions
- 8 items total: 1 Critical, 4 Recommended, 3 Optional
- 3 subsections: Debt Visibility (2), Debt Management (3), Debt Metrics (3)
- Merged "don't let debt compound indefinitely" into DEBT-003 (stale item cleanup is the mechanism)
- CRAP score is cross-reference only to Section 8 (no duplicate item created)
- DEBT-001: Critical severity - explicit debt tracking is foundational
- DEBT-001: Check for dedicated label/board/document, must be actively maintained (updated within quarter)
- DEBT-001: "We just know" = fail; debt must be explicitly tracked
- DEBT-002: Recommended severity - items need structure to prioritize
- DEBT-002: Required fields: description, impact, estimated effort, priority
- DEBT-002: Title-only items = fail (can't prioritize without context)
- DEBT-003: Recommended severity - merged regular review + stale item cleanup
- DEBT-003: Quarterly minimum cadence, must actually happen (not just documented)
- DEBT-003: No debt items older than 12 months without explicit decision to keep
- DEBT-003: Backlog only grows, never shrinks = fail
- DEBT-004: Recommended severity - allocation must be protected
- DEBT-004: Target allocation (10-20% of sprints, dedicated sprints, etc.) must be defined
- DEBT-004: Evidence of debt work: closed items, debt-related PRs
- DEBT-004: "We'll get to it eventually" = fail
- DEBT-005: Optional severity - tracking validates allocation is real
- DEBT-005: Can query closed debt items with dates, sense of trend
- DEBT-006: Optional severity - complexity as leading indicator
- DEBT-006: Check ESLint complexity rule, SonarQube, CodeClimate
- DEBT-006: Cross-refs Section 8 (CRAP score), Section 28 (code quality)
- DEBT-007: Recommended severity - outdated deps are compounding debt with security risk
- DEBT-007: Check Dependabot/Renovate, npm audit, outdated command
- DEBT-007: Cross-refs Section 2 (dependency management)
- DEBT-008: Optional severity - TODO/FIXME as informal debt markers
- DEBT-008: Count should be known, old TODOs periodically reviewed
- DEBT-008: Hundreds of orphaned TODOs = fail
- Cross-refs: Section 2 (dependencies), Section 8 (CRAP score), Section 28 (code quality), Section 35 (action items from post-mortems)

### Section 41 Decisions
- 11 items total: 0 Critical, 11 Recommended (severity escalates for legal/contractual requirements)
- 3 subsections: WCAG Compliance (4), Testing (4), Documentation (3)
- Applicability gate: user-facing applications only (internal tools, CLIs, backends can skip)
- A11Y-001: Target documented - even "we aim for WCAG 2.1 AA" counts
- A11Y-001: Severity escalates to Critical if legal (ADA, EAA) or contractual requirements
- A11Y-002: Automated testing catches ~30-40% of issues - axe-core, jest-axe, Lighthouse CI
- A11Y-002: Tools installed but no tests written = fail
- A11Y-002: Use subagent to verify tests actually run if config exists
- A11Y-003: Screen reader testing is manual - can't automate interaction/flow issues
- A11Y-003: Critical paths (signup, checkout, core flows) must be tested
- A11Y-003: "axe catches everything" = fail (it catches 30-40%)
- A11Y-004: Keyboard navigation - Tab, Enter, Escape, Arrow keys work for core flows
- A11Y-004: `outline: none` globally = red flag (hides focus indicators)
- A11Y-004: Skip-to-content link required for content-heavy pages
- A11Y-004: Modal focus trapping must work
- A11Y-005: Major releases get deeper review than CI automation
- A11Y-005: Blocking criteria should exist (can't release with critical a11y issues)
- A11Y-006: Color contrast checked by axe-core/Lighthouse; also verify design system colors validated
- A11Y-006: WCAG requirements: 4.5:1 for normal text, 3:1 for large text
- A11Y-007: jsx-a11y ESLint plugin enforces alt text
- A11Y-007: `alt=""` for decorative images is correct; missing alt entirely = fail
- A11Y-007: Alt text placeholders ("image", "photo", filename) = fail
- A11Y-008: Form labels via htmlFor/id or wrapping label
- A11Y-008: Error messages connected via aria-describedby
- A11Y-008: Prefer semantic HTML (`<button>`) over ARIA (`<div role="button">`)
- A11Y-009: Documented standards for developers - even lightweight guidelines count
- A11Y-009: Should align with stated target (A11Y-001)
- A11Y-010: Dedicated label/tag for a11y issues, visible backlog
- A11Y-010: Same patterns as Section 40 (technical debt tracking)
- A11Y-011: Remediation plan with prioritization, ownership, timelines
- A11Y-011: Severity escalates to Critical if compliance deadline exists
- A11Y-011: Same patterns as DEBT-003/004 from Section 40
- Maturity assessment: Level 1 (Unaware) → Level 5 (Embedded)
- Cross-refs: Section 8 (testing), Section 14 (docs), Section 22 (Lighthouse), Section 40 (debt patterns)

## File Locations

```
checklist/
├── 01-git-repo-setup/           ✅ Complete (18 items)
│   ├── guide.md
│   └── items.yaml
├── 02-dependencies/             ✅ Complete (7 items)
│   ├── guide.md
│   └── items.yaml
├── 03-authentication-endpoints/ ✅ Complete (10 items)
│   ├── guide.md
│   └── items.yaml
├── 04-environments/             ✅ Complete (9 items)
│   ├── guide.md
│   └── items.yaml
├── 05-database-connections/     ✅ Complete (9 items)
│   ├── guide.md
│   └── items.yaml
├── 06-resilience/               ✅ Complete (1 item)
│   ├── guide.md
│   └── items.yaml
├── 07-health-endpoints/         ✅ Complete (2 items)
│   ├── guide.md
│   └── items.yaml
├── 08-testing-code-metrics/     ✅ Complete (6 items)
│   ├── guide.md
│   └── items.yaml
├── 09-development-workflow/     ✅ Complete (6 items)
│   ├── guide.md
│   └── items.yaml
├── 10-deployments/              ✅ Complete (4 items)
│   ├── guide.md
│   └── items.yaml
├── 11-access-control/           ✅ Complete (3 items)
│   ├── guide.md
│   └── items.yaml
├── 12-monitoring/               ✅ Complete (6 items)
│   ├── guide.md
│   └── items.yaml
├── 13-infrastructure-security/  ✅ Complete (7 items)
│   ├── guide.md
│   └── items.yaml
├── 14-documentation/            ✅ Complete (3 items)
│   ├── guide.md
│   └── items.yaml
├── 15-admin-features/           ✅ Complete (6 items)
│   ├── guide.md
│   └── items.yaml
├── 16-cto-workspace/            ✅ Complete (1 item)
│   ├── guide.md
│   └── items.yaml
├── 17-performance-monitoring/   ✅ Complete (4 items)
│   ├── guide.md
│   └── items.yaml
├── 18-analytics/                ✅ Complete (5 items)
│   ├── guide.md
│   └── items.yaml
├── 19-error-reporting/          ✅ Complete (8 items)
│   ├── guide.md
│   └── items.yaml
├── 20-email-infrastructure/     ✅ Complete (8 items)
│   ├── guide.md
│   └── items.yaml
├── 21-caching/                  ✅ Complete (2 items)
│   ├── guide.md
│   └── items.yaml
├── 22-frontend-performance/     ✅ Complete (4 items)
│   ├── guide.md
│   └── items.yaml
├── 23-client-side-security/     ✅ Complete (3 items)
│   ├── guide.md
│   └── items.yaml
├── 24-data-retention/           ✅ Complete (5 items)
│   ├── guide.md
│   └── items.yaml
├── 25-intrusion-detection/      ✅ Complete (4 items)
│   ├── guide.md
│   └── items.yaml
├── 26-high-availability-backups/ ✅ Complete (6 items)
│   ├── guide.md
│   └── items.yaml
├── 27-database-tooling/         ✅ Complete (2 items)
│   ├── guide.md
│   └── items.yaml
├── 28-code-architecture/        ✅ Complete (3 items)
│   ├── guide.md
│   └── items.yaml
├── 29-secrets-management/       ✅ Complete (6 items)
│   ├── guide.md
│   └── items.yaml
├── 30-rate-limiting/            ✅ Complete (3 items)
│   ├── guide.md
│   └── items.yaml
├── 31-api-design/               ✅ Complete (6 items)
│   ├── guide.md
│   └── items.yaml
├── 32-content-security-policy/  ✅ Complete (4 items)
│   ├── guide.md
│   └── items.yaml
├── 33-feature-flags/            ✅ Complete (2 items)
│   ├── guide.md
│   └── items.yaml
├── 34-rollback-recovery/        ✅ Complete (8 items)
│   ├── guide.md
│   └── items.yaml
├── 35-incident-response/        ✅ Complete (7 items)
│   ├── guide.md
│   └── items.yaml
├── 36-load-stress-testing/      ✅ Complete (8 items)
│   ├── guide.md
│   └── items.yaml
├── 37-gdpr-privacy-compliance/       ✅ Complete (11 items)
│   ├── guide.md
│   └── items.yaml
├── 38-cost-monitoring-budget-alerts/ ✅ Complete (5 items)
│   ├── guide.md
│   └── items.yaml
├── 39-developer-onboarding/          ✅ Complete (9 items)
│   ├── guide.md
│   └── items.yaml
├── 40-technical-debt-tracking/       ✅ Complete (8 items)
│   ├── guide.md
│   └── items.yaml
├── 41-accessibility/                 ✅ Complete (11 items)
│   ├── guide.md
│   └── items.yaml
├── 42-internationalization/          ⏳ Next (final section!)
│   ├── guide.md
│   └── items.yaml
```
