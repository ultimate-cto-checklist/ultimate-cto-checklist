# Deployments Audit Guide

This guide walks you through auditing a project's deployment pipeline, including workflow stability, notifications, build performance, and release tagging.

## Before You Start

1. Confirm you're in the target repository's root directory
2. Have `gh` CLI authenticated with access to the repo
3. Know the repository owner/name for API calls

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## Pipeline Stability

### DEPLOY-001: Clear, stable deployment workflow
**Severity**: Critical

**Check automatically**:

1. **Find deployment workflow files**:
   ```bash
   # GitHub Actions
   ls -la .github/workflows/*.yml 2>/dev/null

   # Look for deployment keywords
   grep -rlE "deploy|release|production|staging" .github/workflows/*.yml 2>/dev/null
   ```

2. **Check for workflow documentation**:
   ```bash
   # Look for deployment docs
   grep -riE "deploy|pipeline|ci/cd|workflow" README.md CLAUDE.md CONTRIBUTING.md docs/ 2>/dev/null
   ```

3. **Check workflow triggers are clear**:
   ```bash
   # Verify workflow triggers on appropriate branches
   grep -A10 "^on:" .github/workflows/*.yml 2>/dev/null | grep -E "push:|branches:|main|master|staging"
   ```

4. **Check current pipeline health**:
   ```bash
   # Is the most recent deployment run passing?
   gh run list --limit 10 --json workflowName,conclusion,createdAt --jq '.[] | select(.workflowName | test("deploy|release"; "i"))'
   ```

5. **Check recent stability (failure rate)**:
   ```bash
   # Failure rate over last 50 runs
   gh run list --limit 50 --json workflowName,conclusion --jq '[.[] | select(.workflowName | test("deploy|release"; "i"))] | group_by(.conclusion) | map({conclusion: .[0].conclusion, count: length})'
   ```

6. **Check for alternative CI systems** (if no GitHub Actions):
   ```bash
   # Look for other CI configs
   ls -la Jenkinsfile .gitlab-ci.yml .circleci/config.yml bitbucket-pipelines.yml 2>/dev/null
   ```

**Cross-reference with**:
- FLOW-006 (Branch flow documented)
- ENV-001/002/003 (Environment tiers exist)

**Pass criteria**:
- Deployment workflow exists and is documented
- Triggers are clear (push to main = prod, push to staging = staging)
- Pipeline is currently passing (not broken)
- Recent failure rate < 10% (occasional failures OK, chronic failures not)

**Fail criteria**:
- No deployment workflow (manual deploys only)
- Workflow exists but undocumented
- Pipeline currently broken
- High failure rate (>20%) indicating instability

**If no GitHub Actions found, ask user**:
"No GitHub Actions deployment workflow found. What CI/CD system is used for deployments? Document how to find deployment status and history."

**Evidence to capture**:
- Deployment workflow file path(s)
- Documentation location
- Current pipeline status (passing/failing)
- Failure rate over last 50 runs
- Last successful deployment timestamp

---

### DEPLOY-002: Deployment failures tracked and team notified
**Severity**: Critical

**Check automatically**:

1. **Check workflow run failure rate**:
   ```bash
   # Get recent deployment runs with conclusions
   gh run list --limit 50 --json workflowName,conclusion --jq '[.[] | select(.workflowName | test("deploy|release"; "i"))] | group_by(.conclusion) | map({conclusion: .[0].conclusion, count: length})'
   ```

2. **Check for notification on success AND failure**:
   ```bash
   # Look for Slack/Discord/email notifications
   grep -riE "slack|discord|notify|email|webhook|teams" .github/workflows/*.yml 2>/dev/null
   ```

3. **Check if notifications happen on both success and failure**:
   ```bash
   # Look for conditional notifications
   grep -B5 -A15 "slack\|discord\|notify" .github/workflows/*.yml 2>/dev/null | grep -E "if:|success|failure|always"
   ```

4. **Check for GitHub deployment statuses**:
   ```bash
   # Get recent deployments and their statuses
   gh api repos/{owner}/{repo}/deployments --jq '.[0:5] | .[] | {environment, sha: .sha[0:7], created_at}'
   ```

5. **Check for third-party deployment tracking**:
   ```bash
   # Look for deployment tracking integrations
   grep -riE "sentry.*release|datadog|newrelic|honeycomb|deploy.*track" .github/workflows/*.yml 2>/dev/null
   ```

**Cross-reference with**:
- DEPLOY-001 (Workflow exists and is stable)
- Section 19 (Sentry deployment integration)

**Pass criteria**:
- Failure rate calculable from CI history
- Notifications configured for both success and failure
- Team actually receives deploy notifications (Slack channel, email, etc.)
- Deployment events tracked (GitHub deployments API or third-party)

**Fail criteria**:
- No visibility into deployment success/failure
- Only failure notifications (miss successful deploys)
- Notifications configured but going nowhere (dead channel)
- No historical deployment tracking

**If no notifications found, ask user**:
"No deployment notifications found in workflows. How does the team know when deploys happen? Notifications should fire on both success and failure so the team has visibility."

**Evidence to capture**:
- Notification method (Slack, Discord, email, etc.)
- Notification channel/destination
- Whether both success and failure trigger notifications
- Failure rate over recent deployments
- Deployment tracking integration (if any)

---

## Build Performance

### DEPLOY-003: Build performance optimized
**Severity**: Recommended

**Check automatically**:

1. **Check for caching in workflows**:
   ```bash
   # Look for cache action usage
   grep -riE "actions/cache|cache:|restore-keys" .github/workflows/*.yml 2>/dev/null
   ```

2. **Check for dependency caching**:
   ```bash
   # Node/pnpm cache patterns
   grep -A10 "actions/cache\|pnpm/action-setup\|actions/setup-node" .github/workflows/*.yml 2>/dev/null | grep -iE "cache|pnpm-store|node_modules|\.npm"
   ```

3. **Check for Docker layer caching**:
   ```bash
   # Docker buildx cache
   grep -riE "cache-from|cache-to|buildx.*cache|docker/build-push-action" .github/workflows/*.yml 2>/dev/null
   ```

4. **Measure actual build times**:
   ```bash
   # Get recent workflow run durations (deployment workflows)
   gh run list --limit 20 --json workflowName,createdAt,updatedAt --jq '[.[] | select(.workflowName | test("deploy|release|build"; "i"))] | .[] | {name: .workflowName, duration_minutes: ((((.updatedAt | fromdateiso8601) - (.createdAt | fromdateiso8601)) / 60) | floor)}'
   ```

5. **Check for parallelization**:
   ```bash
   # Look for matrix builds or parallel jobs
   grep -riE "matrix:|needs:|concurrency:" .github/workflows/*.yml 2>/dev/null
   ```

6. **Check cache key includes lockfile**:
   ```bash
   # Cache keys should include lockfile hash for correctness
   grep -A5 "actions/cache" .github/workflows/*.yml 2>/dev/null | grep -E "key:.*lock|key:.*hashFiles"
   ```

**Cross-reference with**:
- DEPLOY-001 (Workflow stability)
- Section 28 (Code Architecture - build times)

**Pass criteria**:
- Dependency caching configured (node_modules, pnpm store, pip, etc.)
- Build times reasonable (under 5 min typical, under 10 min for complex builds)
- Cache keys include lockfile hash (prevents stale cache)
- Docker layer caching (if using Docker builds)
- Parallelization used where beneficial

**Fail criteria**:
- No caching configured (cold builds every time)
- Build times consistently >15 minutes
- Cache keys don't include lockfile hash (stale cache risk)
- Obvious parallelization opportunities missed

**If builds slow, ask user**:
"Build times averaging over 10 minutes. Is this acceptable for your workflow? Long builds slow down iteration and developer feedback loops. Consider adding caching or parallelization."

**Evidence to capture**:
- Caching configured (yes/no, what type)
- Average build duration (minutes)
- Cache key pattern (includes lockfile hash?)
- Parallelization used (matrix, parallel jobs)
- Docker caching (if applicable)

---

## Release Management

### DEPLOY-004: Production deployments tagged
**Severity**: Critical

**Check automatically**:

1. **List recent tags**:
   ```bash
   # Get recent tags sorted by date
   git tag --sort=-creatordate | head -20
   ```

2. **Check tag naming pattern**:
   ```bash
   # Analyze tag format
   git tag --sort=-creatordate | head -20 | grep -E "^v[0-9]|^release|^[0-9]+\.[0-9]+"
   ```

3. **Get production deployments**:
   ```bash
   # Get recent production deployment commits
   gh api repos/{owner}/{repo}/deployments --jq '.[] | select(.environment == "production" or .environment == "prod") | {sha: .sha[0:7], created_at, environment}' | head -20
   ```

4. **Compare tags to production deployments**:
   ```bash
   # For each production deployment SHA, check if it has a tag
   # Get a production deployment SHA first
   PROD_SHA=$(gh api repos/{owner}/{repo}/deployments --jq '.[] | select(.environment == "production" or .environment == "prod") | .sha' | head -1)
   git tag --contains $PROD_SHA 2>/dev/null
   ```

5. **Check for automated tagging in workflow**:
   ```bash
   # Look for tag creation in deploy workflow
   grep -riE "git tag|create.*tag|actions/create-release|softprops/action-gh-release|semantic-release" .github/workflows/*.yml 2>/dev/null
   ```

6. **Verify staging is NOT tagged** (should only tag production):
   ```bash
   # Check if staging deployments have tags (they shouldn't)
   STAGING_SHA=$(gh api repos/{owner}/{repo}/deployments --jq '.[] | select(.environment == "staging") | .sha' | head -1)
   git tag --contains $STAGING_SHA 2>/dev/null
   ```

**Cross-reference with**:
- DEPLOY-001 (Deployment workflow)
- FLOW-005 (Merge strategy preserves history)

**Pass criteria**:
- Production deployments have corresponding tags
- Tags follow consistent naming convention (v1.2.3, release-YYYY-MM-DD, etc.)
- Tagging is automated in deployment workflow (not manual)
- Staging deployments are NOT tagged (only production)

**Fail criteria**:
- Production deployments without tags
- Inconsistent or missing tag naming convention
- Manual tagging process (prone to being skipped)
- Tags for every environment (cluttered, meaningless)

**If no automated tagging found, ask user**:
"No automated tagging found in deployment workflow. How are production releases tracked? Every production deployment should be tagged automatically for traceability. Consider using semantic-release or adding a tagging step to your deploy workflow."

**Evidence to capture**:
- Recent tags (last 10-20)
- Tag naming convention
- Automated tagging mechanism (workflow step, semantic-release, etc.)
- Production deployments with matching tags
- Any untagged production deployments

---

## Completing the Audit

After checking all items:

1. **Summarize results**:
   - DEPLOY-001: PASS/FAIL (Critical)
   - DEPLOY-002: PASS/FAIL (Critical)
   - DEPLOY-003: PASS/FAIL (Recommended)
   - DEPLOY-004: PASS/FAIL (Critical)

2. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority

3. **Common recommendations**:
   - If no deployment workflow: Set up GitHub Actions with deployment jobs
   - If pipeline unstable: Investigate recent failures, add better error handling
   - If no notifications: Add Slack/Discord notification action (slackapi/slack-github-action)
   - If no caching: Add actions/cache for dependencies, Docker buildx cache for images
   - If builds slow: Profile workflow, add parallelization, optimize Docker layers
   - If no automated tagging: Add semantic-release or manual tag step in prod deploy

4. **Record audit date** and auditor
