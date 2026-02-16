# Git Repo Setup Audit Guide

This guide walks you through auditing a repository's Git setup, branch strategy, CI/CD configuration, and overall cleanliness.

## The Goal: Clone-to-Running in Minutes

A new developer should be able to clone, install, and run the project without asking anyone for help. The repository should be self-documenting, secure by default, and impossible to accidentally break.

- **Runnable** — clone to working app with zero manual intervention
- **Protected** — branch rules enforce code review and prevent direct pushes
- **Tested** — CI validates every PR with linting and tests
- **Secure** — no secrets exposed in code or git history
- **Clean** — proper .gitignore patterns, no stale files or cruft

## Before You Start

1. **Read the project config** from `projects/<project-name>.yaml` to get the `repo` field (e.g., `acme-corp/acme-api`)
2. **Clone the repo yourself** — do NOT ask the user for evidence you can gather automatically:
   ```bash
   git clone git@github.com:<owner>/<repo>.git /tmp/audit-<project>-$(date +%s)
   ```
   If SSH fails, fall back to HTTPS:
   ```bash
   git clone https://github.com/<owner>/<repo>.git /tmp/audit-<project>-$(date +%s)
   ```
3. Use the cloned directory as your working directory for all checks in this section
4. Verify you have access to GitHub API (via `gh` CLI) for branch protection checks
5. Clean up the clone when the section is complete

## Audit Process

Work through each category below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## Clone & Run

### GIT-001: Clone and run immediately
**Severity**: Critical

**Verification steps**:

1. **Get the repo URL from project config** — read `projects/<project>.yaml` and use the `repo` field:
   ```bash
   # Clone using the repo field from project config (e.g., acme-corp/acme-api)
   CLONE_DIR="/tmp/audit-clone-test-$(date +%s)"
   git clone git@github.com:<owner>/<repo>.git "$CLONE_DIR"
   # If SSH fails, fall back to HTTPS:
   # git clone https://github.com/<owner>/<repo>.git "$CLONE_DIR"
   cd "$CLONE_DIR"
   ```
   **Do NOT ask the user for the repo URL** — it's already in the project config.

2. **Spawn subagent** to work in the cloned directory:
   - Read README for setup instructions
   - Install dependencies (npm install, pip install, etc.)
   - **Build the app** (npm run build, etc.) - dev mode can hide issues
   - Run the app in dev mode
   - Report any errors encountered

3. **Pass criteria**:
   - Dependencies install without errors
   - App **builds** successfully
   - App runs in dev mode without critical errors
   - No manual intervention required (no "go get X API key first")

4. **Evidence to capture**:
   - Time from clone to running
   - Build output (success/warnings/errors)
   - Any warnings (acceptable) vs errors (failure)
   - What commands were needed

**If fails**: Document exactly where it broke and what was missing.

---

### GIT-002: Sandbox env vars ready
**Severity**: Critical

**Check automatically**:
1. Look for files: `.env.example`, `.env.sample`, `.env.development`, `env.example`, `.env`
2. If `.env` is committed, verify it contains **only sandbox keys** (no real secrets)
3. **Warn if `.env.local` is committed** - this should never be in repo (contains personal overrides)
4. Verify example file contains actual values (not just empty `API_KEY=`)
5. Compare against what the app actually requires (check code for `process.env.X` or equivalent)

**Pass criteria**:
- Env example file exists (or `.env` with sandbox values)
- Contains all required variables with working sandbox/example values
- A developer can copy to `.env` (or use committed `.env`) and run without edits
- No `.env.local` committed

**Fail criteria**:
- No env example file at all
- `.env.local` is committed
- `.env` contains real secrets (not sandbox)
- Required variables missing from example

---

### GIT-003: Graceful failure with clear warnings
**Severity**: Recommended

**Test during GIT-001 subagent run**:
1. After successful run, try running with a required env var removed/unset
2. Observe behavior - does it crash or warn gracefully?
3. If it fails, evaluate error message quality

**Verify env var usage**:
1. For each variable in `.env.example` (or `.env`), grep the codebase to find where it's used
2. Document what each variable is for (e.g., `DATABASE_URL` → database connection in `src/db.ts:12`)
3. Flag any env vars that are defined but **never referenced** (stale)
4. Flag any env vars referenced in code but **missing from example** (undocumented)

**Pass criteria**:
- App shows clear warning indicating what's missing and what it's for
- OR app runs with degraded functionality and logs warnings
- All env vars are accounted for (used and documented)

**Fail criteria**:
- Cryptic stack trace with no indication of the problem
- Silent failure (app seems to run but features broken with no warning)
- Generic errors like `Cannot read property 'x' of undefined`
- `Connection refused` with no context
- Stale or undocumented env vars

**Evidence to capture**:
- Table of env vars → where used → purpose
- Sample error messages when vars missing

---

## Branch Protection

### GIT-005: Branch protections configured
**Severity**: Critical

**Check via GitHub API**:

1. **Check if branches are protected** (works with any repo access):
   ```bash
   gh api repos/{owner}/{repo}/branches/main --jq '.protected'
   gh api repos/{owner}/{repo}/branches/staging --jq '.protected'
   ```

2. **Get full protection details** (requires admin access):
   ```bash
   gh api repos/{owner}/{repo}/branches/main/protection --jq '{
     force_pushes_blocked: (.allow_force_pushes.enabled == false),
     enforce_admins: .enforce_admins.enabled,
     required_approvals: .required_pull_request_reviews.required_approving_review_count,
     dismiss_stale_reviews: .required_pull_request_reviews.dismiss_stale_reviews,
     has_push_restrictions: (.restrictions != null)
   }'
   ```

**Note**: 404 response means either no protection rules exist OR no permission to view.

**Pass criteria**:
- main/master branch is protected
- staging branch is protected (if exists)
- Force pushes blocked (`allow_force_pushes.enabled: false`)
- PRs require at least 1 approval (`required_approving_review_count >= 1`)
- `enforce_admins.enabled: true` (admins can't bypass) - or documented exception with plan to disable

**If no admin access**: Ask user:
"Branch shows as protected but I can't see details. Please confirm:
- Force pushes are disabled
- Direct pushes require PRs
- At least 1 approval required on PRs
- Admin bypass status (enabled/disabled, if enabled is there a plan to disable?)"

**Evidence to capture**:
- `protected: true/false` for each branch
- Full protection config if accessible
- Number of required approvals
- Admin bypass status and justification if enabled

---

## Branch Strategy

### GIT-006: Clean branch structure
**Severity**: Recommended

**Check automatically**:
```bash
# List all remote branches
git branch -r | grep -v HEAD
```

**Look for**:
- `origin/main` or `origin/master` (production - required)
- `origin/staging` (pre-prod - expected)
- No `origin/dev` or `origin/develop` (anti-pattern)
- No stale long-lived branches (`release`, `hotfix`, old version branches)

**Correct flow**: feature-branch → staging → main (production)

**Pass criteria**:
- Only main/master + staging as long-lived branches
- No permanent `dev`/`develop` branch
- No other long-lived branches (release/*, hotfix/*, v1, v2, etc.)

**Fail criteria**:
- `dev` or `develop` branch exists
- Other long-lived branches that aren't main/staging

**If suspicious branches found, ask user**:
"Found these long-lived branches: [list]. Are these actively needed? Recommended pattern is feature-branch → staging → main, with only main and staging as permanent branches."

**Evidence to capture**:
- List of all remote branches
- Any flagged long-lived branches and user justification

---

### GIT-007: Feature branches for all work
**Severity**: Critical

**Check automatically**:
```bash
# Check recent commits on main - should be merge commits from staging
git log origin/main --oneline -20

# Check recent commits on staging - should be merge commits from feature branches
git log origin/staging --oneline -20

# Check for merge commits specifically
git log origin/main --oneline -20 --merges
git log origin/staging --oneline -20 --merges
```

**Look for**:
- main: merge commits from staging (not direct commits)
- staging: merge commits from feature branches (not direct commits)
- Commit messages indicate PR merges (e.g., "Merge pull request #123")

**Pass criteria**:
- All recent changes on main came via merges from staging
- All recent changes on staging came via merges from feature branches
- No evidence of direct pushes to either branch

**Fail criteria**:
- Direct commits on main or staging that aren't merges
- Evidence of bypassing PR process

**Evidence to capture**:
- Last 20 commits on main showing merge pattern
- Last 20 commits on staging showing merge pattern
- Any direct commits flagged with date and author

---

### GIT-008: Feature branches deleted after merge
**Severity**: Recommended

**Check via GitHub API** (auto-delete setting):
```bash
gh api repos/{owner}/{repo} --jq '.delete_branch_on_merge'
# Returns: true (enabled) or false (disabled)
```

**Check for stale merged branches**:
```bash
# Branches already merged into staging
git branch -r --merged origin/staging | grep -v main | grep -v staging | grep -v HEAD
```

**Pass criteria**:
- Auto-delete on merge is enabled (`true`), OR
- No stale merged branches exist

**Fail criteria**:
- Auto-delete disabled AND merged branches still exist
- Large number of merged branches lingering

**If stale branches found, ask user**:
"Found [X] branches already merged into staging that haven't been deleted: [list first 5]. Should these be cleaned up? Recommend enabling auto-delete on merge in repo settings."

**Evidence to capture**:
- `delete_branch_on_merge` setting (true/false)
- Count of stale merged branches
- List of stale branches (if any)

---

### GIT-009: Stale branch audit
**Severity**: Recommended

**Check for branches with no recent activity**:
```bash
# List remote branches with last commit date
for branch in $(git branch -r | grep -v HEAD | grep -v main | grep -v staging); do
  echo "$(git log -1 --format='%ci' $branch) $branch"
done | sort
```

**Flag branches**:
- No commits in 30+ days: review recommended
- No commits in 45+ days: likely should be deleted

**Pass criteria**:
- No branches older than 45 days without activity, OR
- User confirms regular review process exists

**Fail criteria**:
- Multiple branches with no activity for 45+ days
- No process for reviewing stale branches

**Evidence to capture**:
- List of branches with last commit date
- Count of stale branches (30+ days, 45+ days)
- Any justification for keeping old branches

---

## CI/CD

### GIT-010: Linting configured
**Severity**: Critical

**Check for lint configuration files**:
```bash
# ESLint, Prettier, etc.
ls -la .eslintrc* eslint.config.* .prettierrc* prettier.config.* 2>/dev/null

# Python
ls -la .flake8 pyproject.toml .ruff.toml 2>/dev/null

# Ruby
ls -la .rubocop.yml 2>/dev/null

# Check package.json for lint script
grep -A2 '"lint"' package.json 2>/dev/null
```

**Check CI config for linting commands**:
```bash
grep -r -E "(eslint|prettier|lint|rubocop|flake8|ruff|pylint|golangci-lint)" .github/workflows/ 2>/dev/null
```

**Verify lint runs on PRs** (check workflow triggers):
```bash
grep -A5 "on:" .github/workflows/*.yml | grep -E "(pull_request|push)"
```

**Test lint locally**:
1. Find lint command in `package.json` scripts, `Makefile`, or CI config
2. Run it: `npm run lint`, `pnpm lint`, `make lint`, etc.
3. Note if it passes, fails, or errors out

**Pass criteria**:
- Lint tools are configured locally
- Lint command is discoverable (package.json, Makefile, or README)
- CI includes linting step
- Lint runs on pull requests (not just main/staging)
- Lint runs locally without erroring out (warnings/failures acceptable, crashes not)

**Fail criteria**:
- No lint configuration found
- No lint step in CI
- Lint only runs on main (not on PRs)
- Lint command crashes or is misconfigured

**Evidence to capture**:
- Lint tools used (ESLint, Prettier, etc.)
- Lint config file locations
- Workflow triggers (confirms PR coverage)
- Local lint output (pass/fail/issues noted)

---

### GIT-011: Testing configured
**Severity**: Critical

**Check for test framework configuration**:
```bash
# Look for test config files
ls -la jest.config.* vitest.config.* pytest.ini pyproject.toml setup.cfg 2>/dev/null

# Check package.json for test script
grep -A2 '"test"' package.json 2>/dev/null
```

**Check CI config for test commands**:
```bash
grep -r -E "(jest|vitest|pytest|rspec|go test|npm test|pnpm test|yarn test|make test)" .github/workflows/ 2>/dev/null
```

**Verify tests run on PRs** (check workflow triggers):
```bash
grep -A5 "on:" .github/workflows/*.yml | grep -E "(pull_request|push)"
```

**Test locally**:
1. Find test command in `package.json` scripts, `Makefile`, or CI config
2. Run it: `npm test`, `pnpm test`, `pytest`, etc.
3. Note if tests pass, fail, or error out

**Pass criteria**:
- Test framework is configured locally
- Test command is discoverable (package.json, Makefile, or README)
- CI includes test execution step
- Tests run on pull requests (not just main/staging)
- Tests run locally without erroring out

**Fail criteria**:
- No test framework configured
- No test step in CI
- Tests only run on main (not on PRs)
- Test command crashes or is misconfigured

**Evidence to capture**:
- Test framework used
- Test config file location
- Workflow triggers (confirms PR coverage)
- Local test output (pass/fail count, any errors)
- Test coverage percentage if available

---

## Documentation

### GIT-012: README.md present
**Severity**: Critical

**Check automatically**:
```bash
ls -la README.md README readme.md 2>/dev/null
```

**Verify contents** - README should include:
- Project description (what is this?)
- Setup/installation instructions
- How to run locally
- How to run tests

**Cross-reference with GIT-001 results**:
- Do the README instructions match what actually worked when we cloned and ran?
- Flag any missing steps we had to figure out
- Flag any outdated instructions that didn't work
- Note any undocumented dependencies or env vars we discovered

**Pass criteria**:
- README exists with meaningful content
- Includes setup instructions
- Instructions match reality (verified in GIT-001)

**Fail criteria**:
- No README
- README is empty or just a title
- No setup instructions
- Instructions are outdated or incomplete vs actual setup

**Evidence to capture**:
- README exists (yes/no)
- Sections present (description, setup, run, test)
- Discrepancies between README and actual setup experience
- Suggested additions based on GIT-001 findings

---

### GIT-013: AI agent context file
**Severity**: Recommended

**Check automatically**:
```bash
ls -la CLAUDE.md claude.md AGENTS.md agents.md .claude/ 2>/dev/null
```

**If found, verify contents**:
- Project overview/purpose
- Key conventions and patterns
- Important files/directories
- How to work in this codebase

**Pass criteria**:
- File exists (CLAUDE.md, AGENTS.md, or similar)
- Contains useful context for AI assistants

**Fail criteria**:
- No AI context file

**If missing**:
"Consider adding CLAUDE.md with: project overview, conventions, key files, and any gotchas an AI assistant should know."

**Evidence to capture**:
- File exists (yes/no)
- Quality of content (basic vs comprehensive)

---

## Local Development

### GIT-014: Docker Compose for services
**Severity**: Recommended

**Check automatically**:
```bash
ls -la docker-compose.yml docker-compose.yaml compose.yml compose.yaml 2>/dev/null
```

**If found, verify it includes services the app needs**:
- Database (postgres, mysql, mongodb)
- Cache (redis, memcached)
- Queue (rabbitmq, kafka)
- Any other dependencies

**Cross-reference with GIT-001**:
- What services did we need to run the app?
- Are they all in Docker Compose?

**Cross-reference env vars with Docker Compose services**:
- Check `.env.example` for connection strings (DATABASE_URL, REDIS_URL, etc.)
- Verify they match Docker Compose service names and ports
- Example: `DATABASE_URL=postgres://user:pass@localhost:5432/db` should match postgres service exposing port 5432
- Flag mismatches (wrong port, wrong hostname, service not in compose)

**Test it works**:
```bash
docker compose config  # Validates the file
docker compose up -d   # Actually start services
docker compose ps      # Verify they're running
docker compose down    # Clean up
```

**Pass criteria**:
- Docker Compose exists with third-party services, OR project has no external dependencies
- Env var connection strings match Docker Compose services (ports, hostnames)
- Services start successfully

**Fail criteria**:
- Project requires external services but no Docker Compose
- Docker Compose missing required services
- Env vars don't match Docker Compose (wrong ports, missing services)
- Docker Compose file is broken/invalid

**If no compose file, ask user**:
"Does this project require external services (database, Redis, etc.) to run locally? If yes, how are developers expected to set them up?"

**Evidence to capture**:
- Docker Compose exists (yes/no)
- Services defined vs services needed
- Env var connection strings and whether they match compose
- Any gaps or mismatches

---

## Repo Cleanliness

### GIT-015: No useless/outdated files
**Severity**: Recommended

**Check automatically for suspicious patterns**:
```bash
# Backup/temp files
find . -name "*.bak" -o -name "*.old" -o -name "*.orig" -o -name "*.tmp" 2>/dev/null

# Common junk in root
ls -la TODO.txt notes.txt scratch.* temp.* 2>/dev/null

# Suspicious directories
ls -d old/ backup/ archive/ tmp/ temp/ 2>/dev/null
```

**Check for dated/report markdown files**:
```bash
# Files with dates in name (2024-01-15-something.md)
find . -name "*.md" | grep -E "[0-9]{4}-[0-9]{2}-[0-9]{2}"

# Report-style files
find . -name "*.md" | grep -iE "(report|meeting|notes|standup|retro|review)"
```

**Check for outdated planning documents**:
```bash
# Planning/spec directories
ls -d docs/specs/ docs/planning/ docs/plans/ docs/rfcs/ specs/ planning/ 2>/dev/null

# Common planning file patterns
find . -name "*.md" | xargs grep -l -iE "(RFC|proposal|spec|roadmap|plan)" 2>/dev/null

# Check modification dates - flag if not touched in 6+ months
```

**Pass criteria**:
- No obviously outdated or unused files
- No backup directories committed
- No dated reports/meeting notes committed
- Planning docs are current or removed
- User confirms any flagged files are intentional

**Fail criteria**:
- .bak, .old, .orig files committed
- backup/, old/, archive/ directories in repo
- Dated markdown files (meeting notes, reports) in repo
- Outdated specs/RFCs that don't match implementation
- Clearly abandoned files

**If suspicious files found, ask user**:
"These files may be outdated: [list]. Should they be removed or are they intentionally kept?"

**Evidence to capture**:
- List of flagged files by category
- User justification for any kept files

---

### GIT-016: Test results gitignored
**Severity**: Critical

**Check .gitignore includes test output patterns**:
```bash
grep -E "(coverage|\.nyc_output|test-results|\.lcov|junit\.xml|__snapshots__|\.pytest_cache)" .gitignore
```

**Verify no test output is committed**:
```bash
git ls-files | grep -iE "(coverage|test-results|\.lcov|junit\.xml|\.nyc_output)"
```

**Common patterns that should be gitignored**:
- `coverage/`
- `.nyc_output/`
- `test-results/`
- `*.lcov`
- `junit.xml`
- `.pytest_cache/`
- `__pycache__/`

**Pass criteria**:
- Test outputs are in .gitignore
- No test output files committed to repo

**Fail criteria**:
- Test output patterns missing from .gitignore
- Test results/coverage files committed

**Evidence to capture**:
- Patterns present in .gitignore
- Any committed test output files

---

### GIT-017: No credentials in repo
**Severity**: Critical

**Check for committed .env files** (not .env.example):
```bash
git ls-files | grep -E "^\.env$|\.env\.local|\.env\.production"
```

**Scan for potential secrets patterns**:
```bash
# API keys with values
grep -r -E "(API_KEY|SECRET|PASSWORD|TOKEN|PRIVATE_KEY)=['\"]?[A-Za-z0-9+/=]{16,}" --include="*" . 2>/dev/null

# AWS keys
grep -r -E "AKIA[0-9A-Z]{16}" . 2>/dev/null

# Private keys
grep -r -l "BEGIN RSA PRIVATE KEY\|BEGIN OPENSSH PRIVATE KEY\|BEGIN EC PRIVATE KEY" . 2>/dev/null

# Common secret file names
git ls-files | grep -iE "(credentials|secrets|\.pem|\.key|id_rsa)"
```

**Exception: Sandbox/development keys are OK**:
- Keys in `.env.example`, `.env.development`, or `.env` clearly marked as sandbox
- Test/mock API keys (e.g., Stripe test keys starting with `sk_test_`)
- Local development credentials (e.g., `postgres://dev:dev@localhost`)
- Keys with obvious placeholder values (`xxx`, `changeme`, `your-key-here`)

**Use secret scanning tools if available**:
```bash
gitleaks detect --source . 2>/dev/null
trufflehog filesystem . 2>/dev/null
```

**Check git history** (secrets may have been removed but still in history):
```bash
git log --all --full-history -p | grep -E "AKIA[0-9A-Z]{16}" | head -5
```

**Pass criteria**:
- No production secrets in current files
- No production secrets in git history
- Any committed keys are clearly sandbox/test only

**Fail criteria**:
- Production secrets in repository
- Production secrets in git history
- Ambiguous keys that might be production

**If secrets found, ask user**:
"Found credentials in [location]. Are these sandbox/development keys only, or production credentials?"

**If production secrets found**:
"CRITICAL: Production secrets detected. These must be rotated immediately - removing from repo is not enough."

**Evidence to capture**:
- Scan results (tools used, findings)
- Classification of each finding (sandbox vs production)
- User confirmation for any ambiguous keys

---

### GIT-018: Sandbox keys rotation documented
**Severity**: Recommended

**Check .env.example or .env for rotation comments**:
```bash
# Look for comments indicating last rotation or rotation schedule
grep -E "^#.*(rotat|updated|changed|expires)" .env.example .env 2>/dev/null
```

**Expected pattern in env files**:
```bash
# Sandbox Stripe key - rotate every 6 months - last rotated: 2026-01
STRIPE_SECRET_KEY=sk_test_xxx

# Dev database - rotate quarterly - last rotated: 2025-12
DATABASE_URL=postgres://dev:xxx@localhost/app
```

**Pass criteria**:
- Sandbox keys have comments indicating rotation schedule
- Comments include last rotation date
- Rotation is happening on schedule (dates are recent)

**Fail criteria**:
- No rotation comments on sandbox keys
- Last rotation date is stale (over a year old)
- No rotation policy documented

**If missing, ask user**:
"Sandbox keys should be rotated periodically and documented. When were these last rotated? What's the rotation schedule?"

**Evidence to capture**:
- Which keys have rotation comments
- Last rotation dates
- Whether rotation is current or overdue

---

### GIT-019: No local engineer settings
**Severity**: Recommended

**Check .gitignore includes IDE/editor patterns**:
```bash
grep -E "(\.idea|\.vscode|\.swp|\.DS_Store|Thumbs\.db|\.code-workspace)" .gitignore
```

**Verify none committed**:
```bash
git ls-files | grep -iE "(\.idea|\.vscode|\.swp|\.DS_Store|Thumbs\.db)"
```

**Common patterns that should be gitignored**:
- `.idea/` (JetBrains IDEs)
- `.vscode/settings.json` (personal VS Code settings)
- `*.swp`, `*.swo` (Vim)
- `.DS_Store` (macOS)
- `Thumbs.db` (Windows)
- `*.code-workspace`

**Note**: Some teams intentionally share `.vscode/extensions.json` or `.vscode/launch.json` - this is acceptable if team decision.

**Pass criteria**:
- IDE/editor patterns in .gitignore
- No personal config files committed
- Any shared configs are intentional team decision

**Fail criteria**:
- IDE config patterns missing from .gitignore
- Personal settings committed (`.idea/workspace.xml`, `.vscode/settings.json`)

**Evidence to capture**:
- Patterns present in .gitignore
- Any committed IDE files
- User confirmation if shared configs are intentional

---

### GIT-020: Proper .gitignore configured
**Severity**: Critical

**Check .gitignore exists**:
```bash
ls -la .gitignore
```

**Verify it contains standard patterns for the project type**:

For Node/JS/TS projects:
```bash
grep -E "(node_modules|dist|build|\.env|coverage)" .gitignore
```

For Python projects:
```bash
grep -E "(__pycache__|\.pyc|\.venv|venv|\.env|\.pytest_cache)" .gitignore
```

For general:
```bash
grep -E "(\.DS_Store|\.env|\.log|tmp)" .gitignore
```

**Cross-reference with what should be ignored**:
- From GIT-016: Test results patterns
- From GIT-017: .env files (except .env.example)
- From GIT-019: IDE/editor patterns
- Dependencies (node_modules, vendor, venv)
- Build output (dist, build, out)
- Logs (*.log)

**Compare against gitignore.io template** for project type:
```bash
# Detect project type and compare
# Node: check for package.json
# Python: check for requirements.txt or pyproject.toml
```

**Pass criteria**:
- .gitignore exists
- Contains appropriate patterns for project type
- Covers: dependencies, build output, env files, test results, IDE configs

**Fail criteria**:
- No .gitignore
- Missing critical patterns (node_modules, .env, etc.)
- Project type patterns not covered

**Evidence to capture**:
- .gitignore exists (yes/no)
- Project type detected
- Critical patterns present/missing
- Recommended additions

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
   - Critical failures first
   - Security issues (GIT-017) are urgent
   - Quick wins vs larger efforts

4. **Record audit date** and auditor (you + user confirmation)
