# Environments Audit Guide

This guide walks you through auditing a project's environment setup, configuration, and protection.

## Before You Start

1. Confirm you're in the target repository's root directory
2. Have staging and dev URLs ready for browser testing
3. Have Cloudflare account ID and API token available (for ENV-008)
4. Have the user available for questions about environment architecture

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## Environment Tiers

### ENV-001: Production environment exists
**Severity**: Critical

**Check automatically**:

1. **Find deployment workflows in CI**:
   ```bash
   grep -r -l "production\|prod" .github/workflows/
   ```

2. **Check GitHub deployment history**:
   ```bash
   gh api repos/{owner}/{repo}/deployments --jq '.[] | select(.environment | test("prod"; "i")) | {env: .environment, ref: .ref, created: .created_at}' | head -20
   ```

3. **Check workflow run history for deploy jobs**:
   ```bash
   gh run list --limit 20 --json name,conclusion,createdAt,headBranch | jq '.[] | select(.name | test("deploy|prod"; "i"))'
   ```

4. **Look for platform config files**:
   ```bash
   ls -la vercel.json fly.toml railway.toml render.yaml netlify.toml 2>/dev/null
   ```

**From CI/deployment history, extract**:
- Which workflow deploys to production
- What branch/trigger (main, tags, manual)
- Recent deployment frequency
- Success/failure rate

**Ask user to confirm**:
- Production URL
- Is the detected deployment method correct?

**Pass criteria**:
- Production deployments visible in history
- Clear deployment trigger identified

**Fail criteria**:
- No deployment history found
- Can't determine how production is deployed

**Evidence to capture**:
- Production URL
- Workflow file path
- Deployment trigger (branch/tag/manual)
- Last successful deployment date
- Platform (detected from config or workflow)

---

### ENV-002: Staging environment exists
**Severity**: Critical

**Check automatically**:

1. **Find staging in workflow files**:
   ```bash
   grep -r -l "staging\|stage" .github/workflows/
   ```

2. **Check GitHub deployment history for staging**:
   ```bash
   gh api repos/{owner}/{repo}/deployments --jq '.[] | select(.environment | test("stag"; "i")) | {env: .environment, ref: .ref, created: .created_at}' | head -20
   ```

3. **Check workflow runs**:
   ```bash
   gh run list --limit 20 --json name,conclusion,createdAt,headBranch | jq '.[] | select(.name | test("stag"; "i"))'
   ```

**From CI/deployment history, extract**:
- Which workflow deploys to staging
- What branch triggers staging deploy
- Deployment frequency

**Ask user to confirm**:
- Staging URL
- What triggers staging deployment?

**Pass criteria**:
- Staging environment exists
- Deployment method identified

**Fail criteria**:
- No staging environment (direct dev → prod)
- Staging exists but deployment method unknown

**Evidence to capture**:
- Staging URL
- Workflow file path
- Deployment trigger
- Last successful deployment date

**Cross-reference with**:
- ENV-001 (staging should use same platform/method as prod)
- ENV-004 (staging should run in production mode)

---

### ENV-003: Dev environment(s) exist
**Severity**: Recommended

**Check automatically**:

1. **Find dev/preview in workflow files**:
   ```bash
   grep -r -l "dev\|preview\|review" .github/workflows/
   ```

2. **Check GitHub deployment history for dev/preview**:
   ```bash
   gh api repos/{owner}/{repo}/deployments --jq '.[] | select(.environment | test("dev|preview|review"; "i")) | {env: .environment, ref: .ref, created: .created_at}' | head -20
   ```

3. **Check for preview deployment patterns** (Vercel, Netlify auto-preview):
   ```bash
   gh pr list --state merged --limit 5 --json number | jq -r '.[].number' | xargs -I {} gh pr view {} --comments --json comments --jq '.comments[].body' | grep -i "preview\|deploy"
   ```

4. **Look for environment-per-PR patterns in workflows**:
   ```bash
   grep -r "pull_request" .github/workflows/ | grep -l "deploy\|preview"
   ```

**Ask user**:
- How many dev environments exist?
- Are they persistent or ephemeral (per-PR)?
- Dev environment URL(s) or URL pattern

**Pass criteria**:
- At least one dev environment exists for QA
- Method to deploy feature branches for testing

**Fail criteria**:
- No dev environment (testing only on staging)
- No way to test feature branches before merge

**Evidence to capture**:
- Dev environment URL(s) or pattern
- Ephemeral (per-PR) vs persistent
- Workflow file path
- How developers trigger a dev deploy

**Cross-reference with**:
- ENV-001, ENV-002 (complete tier picture)
- ENV-005 (dev should have verbose logging)

---

## Environment Configuration

### ENV-004: Staging runs in production mode
**Severity**: Critical

**Check automatically**:

1. **Check staging workflow for NODE_ENV / environment mode**:
   ```bash
   grep -A 20 -i "staging" .github/workflows/*.yml | grep -i "NODE_ENV\|RAILS_ENV\|APP_ENV\|ENVIRONMENT"
   ```

2. **Check for build flags in staging deploy**:
   ```bash
   grep -A 20 -i "staging" .github/workflows/*.yml | grep -i "build\|--prod\|--production"
   ```

3. **Check IaC/platform configs for staging environment variables**:
   ```bash
   grep -r "NODE_ENV\|RAILS_ENV\|APP_ENV" terraform/ pulumi/ 2>/dev/null | grep -i stag
   ```

**Ask user**:
- Is staging explicitly set to production mode?
- Any intentional differences from prod mode?

**Pass criteria**:
- Staging runs with production mode enabled (NODE_ENV=production or equivalent)
- Same build process as production

**Fail criteria**:
- Staging runs in development mode
- Different build flags than production (e.g., unminified, debug enabled)

**Evidence to capture**:
- Environment mode setting (NODE_ENV=production, etc.)
- Where this is configured (workflow, platform, IaC)
- Any intentional deviations documented

**Cross-reference with**:
- ENV-002 (staging exists)
- ENV-005 (contrast with dev mode)
- ENV-006 (staging env vars match prod)

---

### ENV-005: Dev environment has verbose logging
**Severity**: Recommended

**Check automatically**:

1. **Check dev workflow for environment mode**:
   ```bash
   grep -A 20 -i "dev\|preview" .github/workflows/*.yml | grep -i "NODE_ENV\|RAILS_ENV\|APP_ENV\|LOG_LEVEL\|DEBUG"
   ```

2. **Check for debug/verbose flags**:
   ```bash
   grep -r "LOG_LEVEL\|DEBUG\|VERBOSE" .github/workflows/*.yml | grep -i "dev\|preview"
   ```

3. **Check platform configs for dev environment variables**:
   ```bash
   grep -r "LOG_LEVEL\|DEBUG" vercel.json fly.toml railway.toml 2>/dev/null
   ```

**Ask user**:
- Is dev mode explicitly enabled in dev environments?
- What logging level is configured? (debug, verbose, info)
- Are stack traces visible in dev?

**Pass criteria**:
- Dev environment runs in development mode (NODE_ENV=development or equivalent)
- Verbose/debug logging enabled
- Stack traces visible for debugging

**Fail criteria**:
- Dev environment runs in production mode (defeats purpose of dev)
- Logging too minimal to debug issues

**Evidence to capture**:
- Environment mode setting
- Log level configured
- Debug features enabled (stack traces, source maps, etc.)

**Cross-reference with**:
- ENV-003 (dev exists)
- ENV-004 (contrast with staging in prod mode)
- ENV-007 (prod has minimal logging - opposite)

---

### ENV-006: Staging env vars match production
**Severity**: Critical

**Check automatically**:

1. **Compare env var structure if using IaC**:
   ```bash
   diff <(grep -h "variable\|env\|secret" terraform/prod/*.tf 2>/dev/null | sort) \
        <(grep -h "variable\|env\|secret" terraform/staging/*.tf 2>/dev/null | sort)
   ```

2. **Check for env var documentation**:
   ```bash
   cat .env.example README.md docs/*.md 2>/dev/null | grep -i "staging\|production\|environment"
   ```

3. **If using GitHub environments, compare secrets count**:
   ```bash
   gh api repos/{owner}/{repo}/environments --jq '.environments[] | {name: .name}'
   ```

**Ask user**:
- Are staging env vars intentionally mirrored from production?
- What are the known exceptions?
  - Payment gateways (sandbox) - **acceptable**
  - Email provider - **should be real, not sandbox** (catches deliverability issues)
  - Third-party API keys - sandbox or production?

**Pass criteria**:
- Staging uses same env var set as production
- Only payment gateways in sandbox mode
- Email uses real provider settings (not sandbox)

**Fail criteria**:
- Staging missing env vars that exist in production
- Email in sandbox mode (won't catch deliverability issues)
- Multiple services in sandbox (staging won't match prod behavior)

**Evidence to capture**:
- List of known staging/prod differences
- Payment gateway mode (sandbox - OK)
- Email provider mode (should be real)
- Any other sandbox services (flag for review)

**Cross-reference with**:
- ENV-004 (staging in production mode)
- ENV-002 (staging exists)

---

### ENV-007: Production has minimal logging and user-friendly errors
**Severity**: Recommended

**Check automatically**:

1. **Check production workflow for log level settings**:
   ```bash
   grep -A 20 -i "prod" .github/workflows/*.yml | grep -i "LOG_LEVEL\|DEBUG\|VERBOSE"
   ```

2. **Check for error handling configuration**:
   ```bash
   find . -name "*.ts" -o -name "*.js" -o -name "*.tsx" | head -100 | xargs grep -l "errorHandler\|ErrorBoundary\|custom.*error" 2>/dev/null
   ```

3. **Check for debug mode disabled in production configs**:
   ```bash
   grep -r "DEBUG\|STACK_TRACE\|VERBOSE" .env.production .env.prod 2>/dev/null
   ```

4. **Check framework-specific error configs**:
   ```bash
   grep -r "showStackTrace\|exposeStackTrace\|debug.*false" . --include="*.config.*" 2>/dev/null
   ```

**Ask user**:
- What log level runs in production? (info, warn, error)
- Are stack traces hidden from end users?
- Do users see friendly error messages or raw exceptions?

**Pass criteria**:
- Production log level is info/warn/error (not debug/verbose)
- Stack traces not exposed to end users
- User-facing errors are friendly ("Something went wrong") not technical
- Debug mode explicitly disabled

**Fail criteria**:
- Debug/verbose logging in production (performance + security risk)
- Stack traces visible to users (information disclosure)
- Raw exception messages shown to users

**Evidence to capture**:
- Production log level setting
- Error handling approach (custom error pages, error boundaries)
- Confirmation stack traces are internal only

**Cross-reference with**:
- ENV-005 (contrast with dev verbose logging)
- Section 19 (Sentry - errors should go there, not to users)

---

## Environment Protection

### ENV-008: Dev and staging protected with Cloudflare Zero Trust
**Severity**: Critical

**Check automatically**:

1. **Browser verification** (use agent-browser skill):
   - Navigate to staging URL → should redirect to Cloudflare Access login
   - Navigate to dev URL → should redirect to Cloudflare Access login
   - Capture screenshots as evidence

2. **If using Terraform**, check state/config:
   ```bash
   grep -r "cloudflare_access_application\|cloudflare_access_policy" terraform/ *.tf 2>/dev/null

   terraform state list 2>/dev/null | grep -i access
   ```

3. **Cloudflare API** (if token available):
   ```bash
   # List Access applications
   curl -s "https://api.cloudflare.com/client/v4/accounts/{account_id}/access/apps" \
     -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | jq '.result[] | {name, domain}'

   # List policies for an Access application
   curl -s "https://api.cloudflare.com/client/v4/accounts/{account_id}/access/apps/{app_id}/policies" \
     -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | jq '.result[] | {name, decision, include}'
   ```

4. **DNS check** (confirm behind Cloudflare):
   ```bash
   dig +short staging.example.com
   dig +short dev.example.com
   # Should resolve to Cloudflare IPs (104.x, 172.x, 103.x ranges)
   ```

**Ask user**:
- Staging and dev URLs to test
- Cloudflare account ID and API token (if available)
- Or: confirm Terraform is used for Access config

**Pass criteria**:
- Browser test shows Access gate on staging and dev
- API/Terraform confirms Access applications exist
- DNS confirms behind Cloudflare

**Fail criteria**:
- Browser loads without authentication prompt
- No Access application configured
- Public access possible

**Evidence to capture**:
- Screenshots of Access login prompts
- Access application names/domains from API or Terraform
- Policy rules (who can access)

**Cross-reference with**:
- ENV-002, ENV-003 (environments exist)
- ENV-009 (webhooks bypass with signatures)
- Section 13 (Infrastructure Security)

---

### ENV-009: Webhooks bypass Zero Trust but verify signatures
**Severity**: Critical

**Check automatically**:

1. **Find webhook endpoints in codebase**:
   ```bash
   grep -r -i "webhook" --include="*.ts" --include="*.js" --include="*.py" --include="*.rb" . | grep -i "route\|endpoint\|handler\|post\|app\."
   ```

2. **Check for signature verification in webhook handlers**:
   ```bash
   grep -r -i "signature\|verify\|hmac\|sha256\|x-hub-signature\|stripe-signature\|svix" --include="*.ts" --include="*.js" --include="*.py" . | head -30
   ```

3. **Check for known webhook libraries**:
   ```bash
   grep -i "svix\|stripe\|webhook" package.json requirements.txt Gemfile 2>/dev/null
   ```

4. **Check Cloudflare Access bypass rules** (if API available):
   ```bash
   curl -s "https://api.cloudflare.com/client/v4/accounts/{account_id}/access/apps/{app_id}/policies" \
     -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | jq '.result[] | select(.decision == "bypass")'
   ```

5. **Check Terraform for bypass rules**:
   ```bash
   grep -A 10 "cloudflare_access_policy" terraform/*.tf 2>/dev/null | grep -i "bypass\|service_token"
   ```

**Ask user**:
- What webhook providers are used? (Stripe, GitHub, Twilio, etc.)
- Are webhook endpoints excluded from Zero Trust?
- How is signature verification implemented?

**Pass criteria**:
- Webhook endpoints identified
- Each webhook verifies signatures before processing
- Signature secret stored securely (env var, secrets manager)

**Fail criteria**:
- Webhooks bypass Zero Trust with no signature verification
- Signature verification missing or commented out
- Webhook secrets hardcoded

**Evidence to capture**:
- List of webhook endpoints
- Signature verification method per endpoint
- Webhook providers in use
- Bypass rules in Cloudflare Access (if applicable)

**Cross-reference with**:
- ENV-008 (Zero Trust protection)
- Section 3 (Authentication - webhook signature verification)
- Section 29 (Secrets Management - webhook secrets)

---

## Completing the Audit

After checking all items:

1. **Summarize results** by category:
   - Critical items: X passed, Y failed
   - Recommended items: X passed, Y failed

2. **List all failures** with:
   - Item ID and title
   - What was found (evidence)
   - Recommended fix

3. **Prioritize fixes**:
   - Critical failures first (ENV-001, ENV-002, ENV-004, ENV-006, ENV-008, ENV-009)
   - Environment protection issues can expose sensitive data
   - Configuration mismatches cause prod-only bugs

4. **Record audit date** and auditor (you + user confirmation)
