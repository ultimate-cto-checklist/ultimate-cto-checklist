# Error Reporting Audit Guide

This guide walks you through auditing a project's error reporting capabilities, covering Sentry (or similar) setup, configuration, deployment integration, and AI-driven error handling.

## The Goal: Errors That Fix Themselves

Production errors should flow from detection to diagnosis to fix with minimal friction. A mature error pipeline means every error is tracked, readable, correlated to deploys, and triaged for action.

- **Captured** — error tracking tool installed, initialized early, and properly configured
- **Privacy-aware** — PII handling intentionally configured with scrubbing or documented justification
- **Readable** — stack traces and source maps show original code, not minified output
- **Correlated** — deployment integration ties errors to specific releases
- **Actionable** — AI-driven triage, prioritization, and auto-PR creation for fixes

## Before You Start

1. Identify the error tracking tool (Sentry, Bugsnag, Rollbar, Raygun, etc.)
2. Get access to the error tracking dashboard
3. Identify frontend vs backend error tracking (may be separate)

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## Setup

### ERR-001: Error tracking tool installed and configured
**Severity**: Critical

Error tracking is essential for production visibility. Without it, you're flying blind when users encounter errors.

**Check automatically**:

1. **Look for Sentry SDK**:
```bash
# Check for Sentry packages
grep -riE "@sentry|sentry-javascript|@sentry/node|@sentry/browser|@sentry/react|@sentry/nextjs" package.json 2>/dev/null

# Check for Sentry DSN configuration
grep -riE "SENTRY_DSN|sentry\.dsn|dsn.*sentry" .env.example .env* 2>/dev/null

# Check for Sentry initialization
grep -riE "Sentry\.init|sentry\.init" --include="*.ts" --include="*.js" --include="*.tsx" src/ lib/ app/ 2>/dev/null | head -10
```

2. **Check for alternative error tracking tools**:
```bash
# Bugsnag, Rollbar, Raygun, TrackJS, Airbrake
grep -riE "bugsnag|rollbar|raygun|trackjs|airbrake" package.json .env.example 2>/dev/null
```

3. **Verify initialization runs early**:
```bash
# Check entry points for early Sentry init
head -50 src/index.ts src/main.ts src/app.ts app/layout.tsx pages/_app.tsx 2>/dev/null | grep -iE "sentry|error.*tracking"
```

**If not found in code, ask user**:
- "What error tracking tool do you use?"
- "Is it configured for both frontend and backend?"

**Cross-reference with**:
- ERR-005 (deployment integration requires error tracking to exist)
- MON-004 (500 alerting may come from error tracker)

**Pass criteria**:
- Error tracking SDK installed and initialized
- DSN configured (or env var placeholder in .env.example)
- Initialization runs early in app startup (before route handlers)

**Fail criteria**:
- No error tracking tool found
- SDK installed but never initialized
- DSN missing with no placeholder

**Evidence to capture**:
- Error tracking tool name and version
- DSN env var configuration
- Initialization location in code

---

### ERR-002: PII handling configured
**Severity**: Recommended

Error reports may capture user data (emails, IPs, request bodies). PII handling must be an intentional decision, not an accident.

**Check automatically**:

1. **Check for PII/data scrubbing configuration**:
```bash
# Check for PII settings in Sentry config
grep -riE "sendDefaultPii|beforeSend|beforeBreadcrumb|scrubFields|denyUrls|ignoreErrors" --include="*.ts" --include="*.js" --include="*.tsx" src/ lib/ app/ config/ 2>/dev/null | head -15

# Check for explicit PII settings
grep -riE "sendDefaultPii.*false|sendDefaultPii.*true" --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules
```

2. **Check for data scrubbing hooks**:
```bash
# Look for beforeSend sanitization
grep -A 20 "beforeSend" --include="*.ts" --include="*.js" src/ lib/ app/ config/ 2>/dev/null | grep -iE "sanitize|redact|scrub|delete|remove|email|password|token"
```

**If not found in code, ask user**:
- "Is PII (emails, IPs, user data) sent to Sentry or scrubbed?"
- "Is this a deliberate choice or default behavior?"
- "Any compliance requirements (GDPR) that affect this decision?"

**Cross-reference with**:
- Section 37 (GDPR & Privacy Compliance)

**Pass criteria**:
- PII handling is explicitly configured (either enabled or disabled intentionally)
- `beforeSend` hook exists to scrub sensitive data, OR `sendDefaultPii: false` explicitly set
- Decision is documented or evident in code comments

**Fail criteria**:
- Default Sentry config with no PII consideration
- Sensitive user data visible in Sentry dashboard without intention

**Partial (acceptable)**:
- PII enabled intentionally for debugging - document the decision and ensure Sentry retention/access is locked down

**Evidence to capture**:
- PII configuration setting
- Any beforeSend/scrubbing logic
- Documented rationale if PII is enabled

---

### ERR-003: Stack traces configured
**Severity**: Recommended

Stack traces are essential for debugging. They should be enabled and useful (not minified garbage).

**Check automatically**:

1. **Check for stack trace configuration**:
```bash
# Check for stack trace and tracing settings
grep -riE "attachStacktrace|tracesSampleRate|normalizeDepth" --include="*.ts" --include="*.js" --include="*.tsx" src/ lib/ app/ config/ 2>/dev/null | head -10

# Check Sentry init for tracing
grep -A 30 "Sentry.init" --include="*.ts" --include="*.js" --include="*.tsx" src/ lib/ app/ 2>/dev/null | grep -iE "trace|stack|depth"
```

2. **Check if performance tracing is enabled**:
```bash
# Tracing packages and config
grep -riE "tracesSampleRate|BrowserTracing|@sentry/tracing|Sentry.*Integrations" --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules | head -10
```

**If not found in code, ask user**:
- "Are full stack traces being captured in Sentry?"
- "Is performance tracing (transactions) enabled?"
- "What's the tracesSampleRate?"

**Cross-reference with**:
- ERR-004 (source maps make stack traces readable)

**Pass criteria**:
- `attachStacktrace: true` or default behavior confirmed
- Stack traces visible and useful in Sentry dashboard
- For performance: `tracesSampleRate` configured (even if low, e.g., 0.1)

**Fail criteria**:
- Stack traces disabled
- Errors show up without stack context

**Partial (acceptable)**:
- Stack traces enabled but minified (needs source maps - see ERR-004)
- Low tracesSampleRate due to cost/volume concerns - document the rate

**Evidence to capture**:
- Stack trace configuration
- tracesSampleRate value
- Sample error from Sentry showing stack trace quality

---

### ERR-004: Source maps configured
**Severity**: Recommended

Without source maps, frontend stack traces show minified code (line 1, column 45678). Source maps translate back to original source.

**Check automatically**:

1. **Check for Sentry source map upload plugin**:
```bash
# Build plugins for source map upload
grep -riE "@sentry/webpack-plugin|@sentry/vite-plugin|@sentry/esbuild-plugin|@sentry/rollup-plugin|@sentry/nextjs" package.json webpack.config.* vite.config.* rollup.config.* next.config.* 2>/dev/null
```

2. **Check for sentry-cli in build/deploy scripts**:
```bash
# CLI-based source map upload
grep -riE "sentry-cli.*releases|sentry-cli.*sourcemaps|sourcemaps.*upload" package.json .github/workflows/*.yml 2>/dev/null
```

3. **Check for required auth tokens**:
```bash
# Auth token for uploads
grep -riE "SENTRY_AUTH_TOKEN|SENTRY_ORG|SENTRY_PROJECT" .env.example .env* .github/workflows/*.yml 2>/dev/null
```

4. **Check build config generates source maps**:
```bash
# Source map generation in build config
grep -riE "sourcemap.*true|devtool.*source-map|productionSourceMap" webpack.config.* vite.config.* next.config.* tsconfig.json 2>/dev/null
```

**If not found in code, ask user**:
- "Are source maps uploaded to Sentry during builds?"
- "Can you see original TypeScript/source code in Sentry stack traces?"
- "Is source map upload part of the CI/CD pipeline?"

**Cross-reference with**:
- ERR-003 (stack traces need source maps to be readable)
- ERR-005 (releases tie source maps to deployments)

**Pass criteria**:
- Source maps generated during build
- Source maps uploaded to Sentry (via plugin or sentry-cli)
- Upload happens in CI/CD pipeline (not manual)
- Stack traces in Sentry show original source code

**Fail criteria**:
- No source map upload configured
- Stack traces show minified code (line 1, column 45678)
- Source maps generated but not uploaded

**Partial (acceptable)**:
- Source maps uploaded for frontend only, backend is plain Node.js (readable without maps)
- Upload exists but occasionally fails - note and fix

**Evidence to capture**:
- Source map upload method (plugin or CLI)
- CI/CD step that uploads
- Sample Sentry error showing readable source

---

### ERR-005: Deployment integration with Sentry
**Severity**: Recommended

When Sentry knows about deployments, you can answer "did this deploy break something?" and filter errors by release.

**Check automatically**:

1. **Check for release creation in CI/CD**:
```bash
# Sentry release in CI
grep -riE "sentry-cli.*releases|sentry.*release|SENTRY_RELEASE" .github/workflows/*.yml .gitlab-ci.yml 2>/dev/null
```

2. **Check for release config in Sentry init**:
```bash
# Release in Sentry.init
grep -A 30 "Sentry.init" --include="*.ts" --include="*.js" --include="*.tsx" src/ lib/ app/ 2>/dev/null | grep -iE "release|environment"
```

3. **Check for deploy notification**:
```bash
# Deploy finalization
grep -riE "sentry-cli.*releases.*finalize|sentry-cli.*releases.*deploys" .github/workflows/*.yml package.json 2>/dev/null
```

4. **Check how release is set**:
```bash
# Release from git or env
grep -riE "release.*process\.env|release.*GIT|release.*COMMIT|release.*SHA|release.*VERSION" --include="*.ts" --include="*.js" src/ lib/ app/ config/ 2>/dev/null | head -5
```

**If not found in code, ask user**:
- "Does Sentry know when deployments happen?"
- "Can you filter Sentry errors by release version?"
- "When a deploy goes out, can you see 'new errors in this release' in Sentry?"

**Cross-reference with**:
- ERR-004 (source maps are tied to releases)
- DEPLOY-004 (deployment tagging)

**Pass criteria**:
- `release` set in Sentry.init (from git SHA, version, or env var)
- Release created in Sentry during CI/CD (`sentry-cli releases new`)
- Deploy notification sent (`sentry-cli releases deploys new`)
- Can filter errors by release in Sentry dashboard

**Fail criteria**:
- No release configured (all errors lumped together)
- Release set but never created in Sentry (orphaned release)
- No way to correlate errors with specific deployments

**Partial (acceptable)**:
- Release set but no deploy notification (you see releases but not deploy timestamps)
- Release is git SHA only (works but less human-readable than semver)

**Evidence to capture**:
- Release configuration method
- CI/CD steps for release creation
- Sample Sentry view showing release filtering

---

## AI-Driven Error Handling

### ERR-006: AI periodically reviews Sentry errors
**Severity**: Recommended

Errors should be reviewed regularly, not just when someone remembers to check. AI can automate this review and surface actionable insights.

**Check automatically**:

1. **Check for Sentry API integration**:
```bash
# Sentry API usage
grep -riE "sentry.*api|SENTRY_API|sentry\.io/api|getsentry" --include="*.ts" --include="*.js" --include="*.py" scripts/ jobs/ cron/ .github/workflows/*.yml 2>/dev/null | head -10
```

2. **Check for scheduled error review jobs**:
```bash
# Scheduled jobs interacting with Sentry
grep -riE "sentry.*cron|sentry.*schedule|error.*review|error.*triage" .github/workflows/*.yml package.json crontab 2>/dev/null
```

3. **Check for Claude/AI error review**:
```bash
# AI integration with error tracking
grep -riE "claude.*sentry|sentry.*claude|ai.*error|error.*ai|llm.*error" --include="*.ts" --include="*.js" --include="*.py" --include="*.md" . 2>/dev/null | grep -v node_modules | head -10

# Check CLAUDE.md for error review instructions
grep -iE "sentry|error.*review|error.*triage" CLAUDE.md 2>/dev/null
```

**If not found in code, ask user**:
- "Do you have any automated process for reviewing Sentry errors?"
- "Does an AI/Claude agent periodically look at new errors?"
- "How do errors get triaged today - manually or automated?"

**Cross-reference with**:
- ERR-007 (AI review feeds into auto-PR creation)
- ERR-008 (triage determines which errors warrant attention)

**Pass criteria**:
- Scheduled job or workflow that fetches errors from Sentry API
- AI/Claude reviews errors on a cadence (daily, weekly)
- Output is actionable (Slack notification, issue creation, or PR)

**Fail criteria**:
- Errors only reviewed when someone manually checks Sentry
- No automation around error review
- Sentry alerts exist but no triage process

**Partial (acceptable)**:
- Manual AI review on-demand (not scheduled but process exists)
- Sentry alerts to Slack, human triages, then asks Claude for help

**Evidence to capture**:
- Review cadence (daily, weekly, manual)
- Integration method (API, webhook, manual)
- Output format (Slack, issues, PRs)

---

### ERR-007: Auto-create PRs for fixes
**Severity**: Recommended

When AI identifies a fixable error, it should be able to propose a fix as a PR, not just report the problem.

**Check automatically**:

1. **Check for automated PR creation workflows**:
```bash
# PR creation in scripts
grep -riE "create.*pr|create.*pull|gh pr create|octokit.*pull" --include="*.ts" --include="*.js" --include="*.py" --include="*.yml" scripts/ jobs/ .github/workflows/ 2>/dev/null | head -10
```

2. **Check for Sentry → GitHub integration**:
```bash
# Error to PR pipeline
grep -riE "sentry.*github|sentry.*pr|error.*fix.*pr|auto.*fix" --include="*.ts" --include="*.js" --include="*.py" . 2>/dev/null | grep -v node_modules | head -10
```

3. **Check for AI-assisted fix workflows**:
```bash
# Claude/AI fix automation
grep -riE "claude.*fix|ai.*pr|automated.*fix|auto.*patch" .github/workflows/*.yml scripts/ CLAUDE.md 2>/dev/null
```

**If not found in code, ask user**:
- "When Claude identifies a fixable error, does it create a PR automatically?"
- "Is there a workflow from 'error detected' → 'fix proposed' → 'PR opened'?"
- "What's the human approval step before AI-generated fixes merge?"

**Cross-reference with**:
- ERR-006 (AI review identifies what to fix)
- ERR-008 (triage determines which errors warrant auto-fix)
- FLOW-002 (AI + human PR review)

**Pass criteria**:
- Workflow exists: Sentry error → AI analysis → PR created
- PRs are clearly labeled as AI-generated
- Human review required before merge (not fully autonomous)

**Fail criteria**:
- No automated PR creation from errors
- Fixes are always manual (human writes code after seeing error)

**Partial (acceptable)**:
- AI suggests fix in Slack/issue but doesn't create PR (human opens PR)
- PR creation exists but not connected to Sentry (manual trigger)

**Evidence to capture**:
- PR creation workflow
- Labeling/tagging for AI-generated PRs
- Human review requirement

---

### ERR-008: Automated error triage
**Severity**: Recommended

Not all errors are equal. Triage should prioritize by impact (affected users, revenue impact, frequency) and route to appropriate owners.

**Check automatically**:

1. **Check for Sentry alerting/workflow rules**:
```bash
# Sentry alerting config
grep -riE "sentry.*alert|sentry.*rule|sentry.*workflow|alert.*rule" --include="*.ts" --include="*.js" --include="*.yml" --include="*.json" . 2>/dev/null | grep -v node_modules | head -10
```

2. **Check for error categorization/tagging**:
```bash
# Error categorization logic
grep -riE "error.*category|error.*priority|error.*severity|triage|fingerprint" --include="*.ts" --include="*.js" src/ lib/ app/ 2>/dev/null | head -10
```

3. **Check for issue tracker integration**:
```bash
# Sentry to issue tracker
grep -riE "sentry.*linear|sentry.*jira|sentry.*github.*issue" . 2>/dev/null | grep -v node_modules | head -5
```

4. **Check for ignore rules**:
```bash
# Known/expected errors filtered
grep -riE "ignoreErrors|denyUrls|beforeSend.*return null" --include="*.ts" --include="*.js" src/ lib/ app/ config/ 2>/dev/null | head -10
```

**If not found in code, ask user**:
- "How are Sentry errors prioritized? (volume, affected users, revenue impact)"
- "Are errors automatically assigned to teams/owners?"
- "Do errors auto-create issues in your task tracker (Linear, Jira)?"
- "Is there logic to ignore known/acceptable errors?"

**Cross-reference with**:
- ERR-006 (AI review is part of triage)
- ERR-007 (triage determines what gets auto-fixed)
- Section 35 - Incident Response (error triage feeds into incident process)

**Pass criteria**:
- Errors categorized by severity/priority (automated or via Sentry rules)
- High-impact errors routed to appropriate team/owner
- Known/expected errors filtered (ignored or low priority)
- Integration with issue tracker for actionable errors

**Fail criteria**:
- All errors treated equally (no prioritization)
- Manual triage only (someone scans Sentry and decides)
- No ownership assignment

**Partial (acceptable)**:
- Sentry's built-in alerting rules configured but no AI triage
- Manual triage but with documented process/cadence

**Evidence to capture**:
- Triage rules/logic
- Issue tracker integration
- Ignore rules for known errors
- Ownership/routing configuration

---

## Completing the Audit

After checking all items:

1. **Summarize results**:
   - ERR-001: PASS/FAIL (Critical)
   - ERR-002: PASS/FAIL (Recommended)
   - ERR-003: PASS/FAIL (Recommended)
   - ERR-004: PASS/FAIL (Recommended)
   - ERR-005: PASS/FAIL (Recommended)
   - ERR-006: PASS/FAIL (Recommended)
   - ERR-007: PASS/FAIL (Recommended)
   - ERR-008: PASS/FAIL (Recommended)

2. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority

3. **Common recommendations**:
   - If no error tracking: Install Sentry immediately (Critical)
   - If no source maps: Add @sentry/webpack-plugin or equivalent to build
   - If no releases: Add sentry-cli to CI/CD pipeline
   - If no AI review: Create CLAUDE.md section for error review workflow
   - If no triage: Configure Sentry alert rules and issue integration

4. **Maturity assessment**:
   - **Level 1**: No error tracking or basic error tracking without configuration
   - **Level 2**: Sentry configured with PII handling, source maps, and releases
   - **Level 3**: Deployment integration, alerting rules, issue tracker integration
   - **Level 4**: AI-driven review, automated triage, auto-PR creation for fixes

5. **Record audit date** and auditor
