# CTO Checklist - Notes

*Collecting Rodric's requirements and ideas*

---

## 1. Git Repo Setup

### Clone & Run
- [ ] Clone and run immediately without external systems
- [ ] Sandbox env vars ready out of the box (or in `.env.example`)
- [ ] Graceful failure with clear warnings if keys missing
- [ ] No cryptic errors requiring env var hunting

### Branch Protection (GitHub)
- [ ] Branch protections enabled on master/staging
- [ ] No direct push to protected branches
- [ ] PRs require at least 1 approval review
- [ ] Admin bypass: allowed now, but ideally disabled long-term

### Branch Strategy
- [ ] Only `master` and `staging` branches (no `dev` branch)
- [ ] Feature branches for all work
- [ ] Feature branches deleted after merge
- [ ] Stale branch audit: branches with no push for 30-45 days reviewed/deleted

### CI/CD
- [ ] CI jobs for linting
- [ ] CI jobs for automated tests

### Documentation
- [ ] README.md present
- [ ] CLAUDE.md or AGENTS.md for AI agent context

### Local Development
- [ ] Automated tests configured
- [ ] Linting configured
- [ ] Docker Compose for third-party services (Postgres, Redis, etc.)

### Repo Cleanliness
- [ ] No useless/outdated files (only needed or evergreen content)
- [ ] No outdated planning documents
- [ ] Test results gitignored
- [ ] No credentials in repo
- [ ] No local engineer settings committed
- [ ] Proper `.gitignore` configured

---

## 2. Dependencies & Code Quality

### Dependency Management
- [ ] Dependencies kept up to date
- [ ] System to track dependency updates (e.g., Dependabot, Renovate)
- [ ] No dependencies with known CVEs
- [ ] Prefer newer, maintained libraries

### Language & Tooling
- [ ] TypeScript over JavaScript where possible
- [ ] ESLint/linting rules follow community best practices
- [ ] **pnpm** over npm for Node projects

---

## 3. Authentication & Endpoints

### Auth System
- [ ] Auth system is simple, not convoluted
- [ ] Auth system is documented
- [ ] AI agents can verify auth implementation
- [ ] Comprehensive tests on auth system

### HTTP Endpoints / Webhooks
- [ ] All endpoints documented
- [ ] Endpoints easily auditable
- [ ] Follow auth best practices
- [ ] Fail fast: no heavy work before auth validation
- [ ] Auth check is cheap (no expensive CPU before validation)
- [ ] Webhooks verify signatures (if bypassing Zero Trust)

---

## 4. Environments

### Environment Tiers
- [ ] **Production** - live environment
- [ ] **Staging** - pre-prod testing, as close to prod as possible
- [ ] **Dev** - one or multiple dev environments for QA

### Dev vs Prod
- [ ] Dev environment: verbose logging, dev mode OK
- [ ] Staging environment: production mode enabled
- [ ] Prod environment: minimal logs, user-friendly errors

### Staging Requirements
- [ ] Staging runs in production mode
- [ ] Same env vars as production (except payment gateways in sandbox)
- [ ] Email should use real settings, not sandbox
- [ ] As stable as possible

### Environment Protection
- [ ] Dev & staging protected with Cloudflare Zero Trust
- [ ] Webhooks can bypass but must verify signatures

---

## 5. Database & Connections

### Database
- [ ] Proper connection pooling configured
- [ ] Optimized database connections

### Database Migrations
- [ ] CI steps verify migrations work
- [ ] AI agent reviews each migration for safety
- [ ] AI flags require human validation override
- [ ] Check for business-breaking changes (altering columns, etc.)

### Database Users & Permissions
- [ ] Document all database users
- [ ] App user cannot DROP DATABASE
- [ ] App user ideally cannot DELETE (mark for deletion instead)
- [ ] Separate service handles actual deletions
- [ ] Redis connections documented if storing critical data

### Database Admin Access
- [ ] phpMyAdmin/similar on-demand only (turn off when not needed)
- [ ] Protected behind Cloudflare Zero Trust
- [ ] Read-only password available
- [ ] Admin password restricted to critical people only

---

## 6. Resilience

### Third-Party Service Handling
- [ ] App doesn't crash if external service fails
- [ ] Graceful degradation: other requests still work
- [ ] Handle unavailable dependencies without full failure
- [ ] 500s okay for affected features, but app stays up

---

## 7. Health Endpoints

### Two Health Endpoints
- [ ] **Basic health** (`/health`): Is the app running?
- [ ] **Deep health** (auth-protected): Can app connect to all services?
  - Database connectivity
  - Third-party service connectivity
  - Requires special token for access

---

## 8. Testing & Code Metrics

### Test Coverage
- [ ] Automated tests with coverage tracking
- [ ] Aim for ~100% code coverage

### Test Requirements
- [ ] Bug fix commits **must** include regression tests
- [ ] New feature commits **must** include tests
- [ ] End-to-end tests for business-critical paths:
  - Revenue-generating features
  - User retention features
  - Core user journeys
- [ ] Smaller features: unit tests sufficient

### CRAP Score
- [ ] Calculate CRAP score (Change Risk Anti-Patterns) for components
- [ ] Establish baseline/benchmark per project
- [ ] Keep CRAP score as low as possible

### Agent Skills (Future)
- [ ] Skills to run tests
- [ ] Skills to check/fix CRAP score
- [ ] Skills to run linting

---

## 9. Development Workflow

### PR Process
- [ ] Create feature branch
- [ ] Open clear PR
- [ ] PR reviewed by AI agent + human
- [ ] At least 1 approval required (more optional)
- [ ] Test on dev environment before merge

### Commit Messages
- [ ] Follow agreed project format
- [ ] Clear, descriptive messages

### Merge Strategy
- [ ] **Regular merge** for feature → staging (no rebase, no squash)
- [ ] **Fast-forward preferred** for staging → production
- [ ] Preserve full Git history
- [ ] Clean up history in branch *before* merge, not after
- [ ] Feature branch → Dev → Staging → Production

---

## 10. Deployments

### Build & Deploy Pipeline
- [ ] Clear, stable workflow
- [ ] Measure and track deployment failures
- [ ] Auto-notify team on deploy (success or failure)
- [ ] Fix pipeline issues immediately
- [ ] Build pipeline caches aggressively
- [ ] Fast builds (like local environment)

### Deployment Tags
- [ ] **Tag every production deployment**
- [ ] Track all production releases via tags
- [ ] Staging deployments don't need tags

---

## 11. Access Control

### Production Access
- [ ] Minimal access to production logs (1-2 people)
- [ ] Prod access requires security posture testing
- [ ] Tighter security standard for prod access

### Tiered Access
- [ ] **Prod logs/DB**: Very limited access
- [ ] **Staging logs/DB**: More people can access
- [ ] **Dev logs/DB**: Broader access

---

## 12. Monitoring

### Infrastructure Monitoring
- [ ] CPU monitoring for all services
- [ ] Disk space monitoring for all services
- [ ] Database health monitoring
- [ ] Connection pool monitoring
- [ ] Redis monitoring

### Database Performance
- [ ] Slow query logging enabled
- [ ] Find queries not using indexes
- [ ] Identify high-CPU queries

### HTTP Logging
- [ ] Log all HTTP requests
- [ ] See patterns in request traffic
- [ ] Flag 404s and 500s

### Alerting
- [ ] Alert on high volume of 404s
- [ ] Alert on **any** 500s (even small amounts)

### Log Retention
- [ ] Keep logs for max 2 weeks
- [ ] No need for longer retention

### Status Pages
- [ ] Status page for production
- [ ] Status page for staging
- [ ] Alerts when deployments are down

---

## 13. Infrastructure Security

### Cloudflare
- [ ] All environments behind Cloudflare (prod, staging, dev)
- [ ] No direct IP exposure
- [ ] Cloudflare respects server's cache-control headers

### Security Headers
- [ ] Don't leak tech stack in response headers
- [ ] Minimal headers exposed
- [ ] HTTPS-only headers (HSTS)
- [ ] Content hash on script/CSS tags (SRI)

### SSL/Certificates
- [ ] SSL transparency reports (alerts when new certs issued)

---

## 14. Documentation

### Live Documentation
- [ ] Document all features (human + AI readable)
- [ ] Complex systems documented:
  - Payment gateways
  - Order fulfillment
  - Admin features
- [ ] Kept up to date (live)

---

## 15. Admin Features

### Admin Parity
- [ ] Every user-facing feature has corresponding admin feature
- [ ] Admin can manage/view/debug user features

### Admin Panel Security
- [ ] Frequent audits of admin users
- [ ] Track login IPs and login frequency
- [ ] Audit trail for admin requests (at least recent)
- [ ] Easy to disable admin users immediately
- [ ] Periodic access audits (who should have access?)
- [ ] Easy to suspend users who shouldn't have access
- [ ] Claude skill to audit admin access

---

## 16. CTO Workspace

### Project Briefings
- [ ] Ask Claude/agent: "What happened since last check-in?"
- [ ] Automated discovery of changes, PRs, deployments
- [ ] On-demand project status briefs

---

## 17. Performance Monitoring

### Response Time
- [ ] Graph response times for all endpoints
- [ ] Identify and optimize slowest endpoints

### Memory Monitoring
- [ ] Track memory usage over time
- [ ] Detect gradual increases (memory leaks)
- [ ] Heap dumps available (protected with token/header)

---

## 18. Analytics

### Server-Side Tracking
- [ ] Own your analytics data
- [ ] Server-side tracking (not client-only)

### Data Pipeline
- [ ] Analytics data → BigQuery
- [ ] GitHub data → BigQuery (PRs, commits, contributors)
- [ ] Reports via Metabase

### Git Analytics
- [ ] Track PR activity
- [ ] Track who's committing
- [ ] Analytics strategy for repos

---

## 19. Error Reporting (Sentry)

### Setup
- [ ] Sentry or similar error tracking
- [ ] Configure PII handling
- [ ] Configure stack traces
- [ ] Configure source maps
- [ ] Integrate deployments with Sentry

### AI-Driven Fixes
- [ ] Claude periodically reviews Sentry errors
- [ ] Auto-create PRs for fixes
- [ ] Automated error triage

---

## 20. Domain & Email Infrastructure

### DNS Records
- [ ] Proper MX records
- [ ] SPF (Sender Policy Framework)
- [ ] DKIM (email signing)
- [ ] DMARC (email authentication)

### Email Monitoring
- [ ] SpamAssassin or similar for email scoring
- [ ] Periodic placement tests (fresh Gmail accounts)
- [ ] Full control over transactional emails
- [ ] Logs: bounces, open rates, click rates
- [ ] Marketing email logs (who, when, opens, clicks)
- [ ] Email log retention: 2 weeks to 1 month

---

## 21. Caching

### Static Assets
- [ ] JS, CSS, images fully cached by Cloudflare
- [ ] Cache busters when resources change
- [ ] Content hashes for cache invalidation

---

## 22. Front-End Performance

### Page Rendering (SEO)
- [ ] Lighthouse reports (automated)
- [ ] First paint optimization
- [ ] No Cumulative Layout Shift (CLS)
- [ ] Track front-end load speed

### Resource Loading
- [ ] Preload tags/headers for fonts
- [ ] Preload CSS (above the fold)

---

## 23. Client-Side Security & Storage

### Cookies
- [ ] Server-only cookies (HttpOnly) when needed
- [ ] Avoid JavaScript-accessible cookies

### Storage
- [ ] Avoid local storage (except user preferences)
- [ ] Use session storage where appropriate

### JWT Best Practices
- [ ] Document JWT handling practices
- [ ] Periodic audits for compliance
- [ ] Part of the checklist

---

## 24. Data Retention

### Soft Deletes
- [ ] Critical data uses soft deletes (never hard delete)
- [ ] Queries ignore soft-deleted data
- [ ] Data remains in database

### Cleanup
- [ ] Periodic review of old soft-deleted data
- [ ] Actually delete after review period
- [ ] Keep if legally required

---

## 25. Intrusion Detection

### Data Exfiltration Alerts
- [ ] Research IDS (Intrusion Detection Systems) for smaller budgets
- [ ] Alert on high data download volumes from IPs
- [ ] Alert on large database data pulls
- [ ] Immediate warnings to concerned parties
- [ ] "Hey, you probably want to look at this"

---

## 26. High Availability & Backups

### High Availability (when serious money involved)
- [ ] Production database: HA setup
- [ ] Production servers: 2+ data center regions
- [ ] Not tied to one location
- [ ] Immediate failover/promotion capability

### Database Backups
- [ ] Always backup production database
- [ ] Move backups off cloud provider (off-site)
- [ ] Backup window that makes sense
- [ ] Read replica elsewhere (low-cost option)
- [ ] SQL dump files as cheap backup
- [ ] **Point-in-time recovery** for production

---

## 27. Database Tooling

### Visualization & Exploration
- [ ] Tool to visualize database diagrams (ERD)
- [ ] Ability to query/explore data from any table

---

## 28. Code Architecture

### SOLID Principles
- [ ] Code follows SOLID principles
- [ ] Regular audits/measurements for SOLID compliance
  - Single Responsibility
  - Open-Closed
  - Liskov Substitution
  - Interface Segregation
  - Dependency Inversion

### Code Quality Tools
- [ ] Code quality measurement tools
- [ ] Code duplication detection
- [ ] Code complexity measurement
- [ ] Know if code is healthy/understandable
- [ ] Don't ignore complexity issues

### Build Performance
- [ ] Build time: couple of minutes max
- [ ] With caching: couple of seconds

---

## 29. Secrets Management

### Secret Storage
- [ ] Use Secret Manager or equivalent
- [ ] Secrets loaded into process environment
- [ ] **Not stored on file system**

---

## 30. Rate Limiting

### Best Practices
- [ ] Rate limiting configured per endpoint
- [ ] Different limits for authenticated vs anonymous
- [ ] Graceful handling when limits hit (429 responses)
- [ ] Consider per-user, per-IP, per-API-key limits
- [ ] Document limits for API consumers

---

## 31. API Design

### Versioning (Optional)
- [ ] API versioning if backward compatibility needed
- [ ] Version in URL (`/v1/`) or header
- [ ] Deprecation strategy for old versions
- [ ] *Not necessary for all projects*

### Input Validation
- [ ] **All user input sanitized**
- [ ] Never trust client data
- [ ] Validate on server side (not just client)
- [ ] SQL injection prevention
- [ ] XSS prevention

### API Gateway
- [ ] Prefer API gateway/proxy over CORS
- [ ] CORS fine to start, gateway for scale
- [ ] Centralized auth, rate limiting, logging

---

## 32. Content Security Policy

### CSP Headers (Recommended, Optional)
- [ ] Full CSP headers configured
- [ ] Report-only mode first to test
- [ ] Block inline scripts where possible
- [ ] Whitelist trusted sources

---

## 33. Feature Flags & Rollouts

### GrowthBook (or similar)
- [ ] Feature flags for gradual rollouts
- [ ] A/B testing capability
- [ ] Kill switches for quick disable
- [ ] Percentage-based rollouts
- [ ] User segment targeting

---

## 34. Rollback & Recovery

### Rollback Strategy
- [ ] Rollback procedure documented
- [ ] Rollback tested regularly
- [ ] Can rollback in < 2 minutes
- [ ] Database migration rollback plan

### Emergency Recovery
- [ ] Document: "Server down → back up from backups"
- [ ] Recovery procedure tested
- [ ] Know RTO (Recovery Time Objective)
- [ ] Know RPO (Recovery Point Objective)

---

## 35. Incident Response

### On-Call & Escalation
- [ ] On-call rotation defined
- [ ] Escalation paths documented
- [ ] Contact list for emergencies
- [ ] PagerDuty/Opsgenie or similar

### Runbooks
- [ ] Common incidents have runbooks
- [ ] "Server down" playbook
- [ ] "Database issues" playbook
- [ ] "High traffic" playbook

### Post-Mortems
- [ ] Blameless post-mortems after incidents
- [ ] Document what happened, why, how to prevent
- [ ] Action items tracked to completion

---

## 36. Load & Stress Testing

### Performance Testing
- [ ] Load testing before major releases
- [ ] Establish baseline performance metrics
- [ ] Test at 2x, 5x, 10x expected traffic
- [ ] Identify bottlenecks before they hit production

### Tools & Practices
- [ ] k6, Artillery, or similar load testing tool
- [ ] Automated load tests in CI (smoke level)
- [ ] Full load tests before major launches
- [ ] Document capacity limits per service

### Stress Testing
- [ ] Know breaking points of each service
- [ ] Graceful degradation under extreme load
- [ ] Auto-scaling triggers tested

---

## 37. GDPR & Privacy Compliance

### Right to Be Forgotten
- [ ] Mechanism for users to request data deletion
- [ ] Process documented for handling deletion requests
- [ ] Audit trail of deletion requests
- [ ] Timelines defined (30 days typically)
- [ ] Related data across services also deleted

### Data Export
- [ ] Users can export their data
- [ ] Machine-readable format (JSON/CSV)
- [ ] Complete data covered

### Consent Management
- [ ] **Google Tag Manager consent flags** configured
- [ ] Backend respects consent flags
- [ ] No tracking before consent given
- [ ] Consent stored and auditable
- [ ] Easy consent withdrawal mechanism

### Privacy Documentation
- [ ] Privacy policy up to date
- [ ] Data processing records maintained
- [ ] Third-party data processors documented

---

## 38. Cost Monitoring & Budget Alerts

### Cloud Costs
- [ ] Budget alerts for every cloud provider
- [ ] Monthly budget defined per project
- [ ] Alert at 50%, 80%, 100% of budget
- [ ] Anomaly detection for spend spikes

### Tool-by-Tool Budgets
- [ ] Every tech tool has a budget
- [ ] Track costs over time (trending)
- [ ] Monthly cost reports per service
- [ ] Unexpected cost alerts

### Cost Visibility
- [ ] Dashboard for all tech costs
- [ ] Cost attribution to projects/teams
- [ ] Regular cost reviews (monthly)

---

## 39. Developer Onboarding

### Day 1 Productive
- [ ] New dev → productive in **first day**
- [ ] Onboarding checklist documented
- [ ] All access requests pre-defined
- [ ] Local setup script/guide tested

### Documentation for New Devs
- [ ] Architecture overview document
- [ ] Key systems explained (payments, auth, etc.)
- [ ] "How we work" guide (PR process, branching, etc.)
- [ ] Who to ask for what

### Access & Tooling
- [ ] List of required accounts/access
- [ ] Automated access provisioning where possible
- [ ] IDE setup guide
- [ ] Common troubleshooting FAQ

---

## 40. Technical Debt Tracking

### Debt Visibility
- [ ] Explicit "tech debt" list maintained
- [ ] Each debt item has:
  - Description
  - Impact (why it matters)
  - Estimated effort
  - Priority
- [ ] Regular debt review (quarterly)

### Debt Management
- [ ] Allocate time for debt reduction (e.g., 20% of sprints)
- [ ] Track debt paid down over time
- [ ] Don't let debt compound indefinitely

### Metrics
- [ ] CRAP score (already in section 8)
- [ ] Code complexity trends
- [ ] Dependency age/health
- [ ] TODO/FIXME count in codebase

---

## 41. Accessibility (If User-Facing)

### WCAG Compliance
- [ ] WCAG 2.1 Level AA target (if applicable)
- [ ] Automated accessibility testing (axe, Lighthouse)
- [ ] Screen reader testing for critical paths
- [ ] Keyboard navigation works

### Testing
- [ ] Accessibility audit before major releases
- [ ] Color contrast checks
- [ ] Alt text for images
- [ ] Form labels and ARIA attributes

### Documentation
- [ ] Accessibility standards documented
- [ ] Known issues tracked
- [ ] Remediation plan for gaps

---

## 42. Internationalization (i18n)

### Multi-Language Support (If Needed)
- [ ] i18n framework in place (if multi-language)
- [ ] String extraction automated
- [ ] Translation workflow documented
- [ ] Fallback language defined

### Best Practices
- [ ] No hardcoded strings in code
- [ ] Date/time/currency formatting localized
- [ ] RTL support if needed
- [ ] Plural forms handled correctly

### Testing
- [ ] Test with different locales
- [ ] Pseudo-localization for catching issues
- [ ] Layout tested with long strings

---

## Raw Transcripts

Source of truth: `transcripts/` folder

- `01-git-repo-setup.txt` - Git repo best practices
- `02-dependencies-auth-environments.txt` - Dependencies, auth, environments
- `03-database-resilience-health.txt` - Database, resilience, health endpoints
- `04-repo-cleanliness-pnpm.txt` - Repo cleanliness, pnpm
- `05-test-coverage-crap-score.txt` - Test coverage, CRAP score, agent skills
- `06-dev-workflow-merge-strategy.txt` - Dev workflow, merge strategy, environments
- `07-deployments-access-monitoring.txt` - Deployments, access control, monitoring
- `08-http-logs-cloudflare.txt` - HTTP logs, alerting, Cloudflare, log retention
- `09-testing-docs-admin-status.txt` - Testing requirements, documentation, admin, status pages
- `10-cto-briefings-deploy-tags.txt` - CTO briefings, deployment tags
- `11-performance-analytics-sentry.txt` - Performance, analytics, Sentry
- `12-ssl-email-caching.txt` - SSL, email infrastructure, caching
- `13-frontend-performance-cookies.txt` - Front-end performance, cookies, storage
- `14-soft-deletes.txt` - Soft deletes, data retention
- `15-db-users-admin-security.txt` - Database users, admin security
- `16-intrusion-detection.txt` - Intrusion detection, data exfiltration
- `17-high-availability-backups.txt` - High availability, backups
- `18-db-visualization.txt` - Database visualization
- `19-solid-principles.txt` - SOLID principles
- `20-code-quality-build-times.txt` - Code quality tools, build times
- `21-secrets-management.txt` - Secrets management

---

## Next Steps

- [ ] More voice notes from Rodric
- [ ] Organize into categories
- [ ] Later: Use subagents + research to expand
