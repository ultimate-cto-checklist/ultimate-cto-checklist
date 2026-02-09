# Testing & Code Metrics Audit Guide

This guide walks you through auditing a project's test coverage, testing practices, and code quality metrics.

## The Goal: Confidence in Change

Every code change is validated by automated tests. Quality cannot silently degrade.

- **Enforced** — CI fails when coverage drops below threshold
- **Complete** — bug fixes include regression tests, features ship with test coverage
- **Critical-path** — e2e tests cover revenue-impacting journeys (auth, checkout, core flows)
- **Measurable** — complexity metrics tracked with established baselines
- **Automated** — test and lint commands documented for agents and developers alike

## Before You Start

1. Confirm you're in the target repository's root directory
2. Know the project's test framework (Jest, Vitest, pytest, etc.)
3. Have dependencies installed (`pnpm install` or equivalent)

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## Test Coverage

### TEST-001: Automated tests with coverage tracking and CI threshold
**Severity**: Critical

**Check automatically**:

1. **Detect test framework and config**:
   ```bash
   # Look for test configs
   ls -la jest.config.* vitest.config.* pytest.ini pyproject.toml 2>/dev/null

   # Check package.json for test scripts
   grep -E '"test":|"coverage":' package.json
   ```

2. **Run tests and capture coverage**:
   ```bash
   # Node.js
   pnpm test --coverage

   # Python
   pytest --cov=src --cov-report=term-missing
   ```

3. **Verify coverage thresholds configured**:
   ```bash
   # Jest/Vitest - look for coverageThreshold
   grep -rE "coverageThreshold|--coverage.*fail" jest.config.* vitest.config.* package.json 2>/dev/null

   # Python - look for fail_under
   grep -E "fail_under|--cov-fail-under" pytest.ini pyproject.toml .coveragerc 2>/dev/null
   ```

4. **Verify CI enforces coverage**:
   ```bash
   # Check CI config for coverage step
   grep -rE "coverage|--cov" .github/workflows/*.yml .gitlab-ci.yml 2>/dev/null
   ```

**Cross-reference with**:
- GIT-001 (Clone and run) - tests should run as part of setup verification
- Section 9 (Development Workflow) - CI should run tests on PRs

**Pass criteria**:
- Test framework configured
- Tests run successfully
- Coverage reporting enabled
- Coverage threshold configured (CI fails if coverage drops)
- CI workflow includes coverage check

**Fail criteria**:
- No test framework configured
- Tests fail to run
- No coverage reporting
- No coverage threshold (coverage can drop silently)
- CI doesn't enforce coverage

**Evidence to capture**:
- Test framework detected
- Total test count, pass/fail
- Current coverage percentage (lines, branches)
- Coverage threshold value (if set)
- CI workflow that enforces it

---

## Test Requirements

### TEST-002: Bug fix commits include regression tests
**Severity**: Critical

**Check automatically**:

1. **Sample recent bug fix commits**:
   ```bash
   # Get last 20 bug fix commits with their hashes
   git log --oneline --grep="fix" -n 20
   ```

2. **For each fix commit, check if test files were modified in that commit OR adjacent commits**:
   ```bash
   # Check the fix commit itself
   git show --name-only --pretty="" <commit-sha> | grep -E "\.(test|spec)\.(ts|js|py)$|tests/|__tests__/"

   # Check 1 commit before
   git show --name-only --pretty="" <commit-sha>~1 | grep -E "\.(test|spec)\.(ts|js|py)$|tests/|__tests__/"

   # Check 1 commit after
   git show --name-only --pretty="" <commit-sha>^1 | grep -E "\.(test|spec)\.(ts|js|py)$|tests/|__tests__/"
   ```

3. **Calculate ratio**: What percentage of fix commits have test changes in the commit or adjacent commits?

**Cross-reference with**:
- TEST-001 - tests must exist and run for this to matter
- Section 9 (Development Workflow) - PR process should enforce this

**Pass criteria**:
- 80%+ of bug fix commits have associated test changes (same commit or ±1 commit)

**Fail criteria**:
- Most bug fix commits have no associated test changes
- Pattern of fixes without regression tests

**If low ratio, ask user**:
"Only X% of recent bug fix commits have associated test changes. Is there a process to require regression tests for bug fixes? This prevents the same bug from recurring."

**Evidence to capture**:
- Number of fix commits sampled
- Number with associated test changes
- Percentage
- Example fix commits without tests (for review)

---

### TEST-003: New feature commits include tests
**Severity**: Critical

**Check automatically**:

1. **Sample recent feature commits**:
   ```bash
   # Get last 20 feature commits
   git log --oneline --grep="feat" --grep="add" --grep="feature" -n 20
   ```

2. **For each feature commit, check if test files were modified in that commit OR adjacent commits**:
   ```bash
   # Check the feature commit itself
   git show --name-only --pretty="" <commit-sha> | grep -E "\.(test|spec)\.(ts|js|py)$|tests/|__tests__/"

   # Check 1 commit before
   git show --name-only --pretty="" <commit-sha>~1 | grep -E "\.(test|spec)\.(ts|js|py)$|tests/|__tests__/"

   # Check 1 commit after (in case test added after)
   git show --name-only --pretty="" <commit-sha>^1 | grep -E "\.(test|spec)\.(ts|js|py)$|tests/|__tests__/"
   ```

3. **Calculate ratio**: What percentage of feature commits have test changes in the commit or adjacent commits?

**Cross-reference with**:
- TEST-001 - tests must exist and run for this to matter
- TEST-002 - same pattern for bug fixes

**Pass criteria**:
- 80%+ of feature commits have associated test changes (same commit or ±1 commit)

**Fail criteria**:
- Most feature commits have no associated test changes
- Pattern of features shipped without tests

**If low ratio, ask user**:
"Only X% of recent feature commits have associated test changes. Is there a process to require tests for new features?"

**Evidence to capture**:
- Number of feature commits sampled
- Number with associated test changes
- Percentage
- Example feature commits without tests (for review)

---

### TEST-004: End-to-end tests for business-critical paths
**Severity**: Critical

**Check automatically**:

1. **Detect e2e test framework**:
   ```bash
   # Look for e2e configs
   ls -la playwright.config.* cypress.config.* cypress.json 2>/dev/null

   # Check for e2e folders
   ls -d e2e/ cypress/ tests/e2e/ 2>/dev/null

   # Check package.json for e2e scripts
   grep -E '"e2e":|"test:e2e":|playwright|cypress' package.json
   ```

2. **Search for documented critical paths**:
   ```bash
   # Check for critical path documentation
   grep -riE "critical path|business.?critical|core.?journey|revenue|checkout|payment flow" \
     README.md docs/ CLAUDE.md PRD.md e2e/ cypress/ 2>/dev/null

   # Check e2e test file names for clues
   find . -path ./node_modules -prune -o -type f \( -name "*.e2e.*" -o -path "*/e2e/*" -o -path "*/cypress/*" \) -print 2>/dev/null
   ```

3. **List e2e test files**:
   ```bash
   find . -path ./node_modules -prune -o -type f \( -name "*.e2e.*" -o -name "*.spec.*" -o -path "*/e2e/*" -o -path "*/cypress/*" \) -print 2>/dev/null
   ```

4. **Run e2e tests** (if configured):
   ```bash
   pnpm test:e2e
   ```

**Cross-reference with**:
- TEST-001 - e2e coverage may be tracked separately from unit test coverage
- Section 14 (Documentation) - critical paths should be documented

**Pass criteria**:
- E2e test framework configured
- E2e tests exist for critical paths (revenue, auth, core user journeys)
- E2e tests run and pass

**Fail criteria**:
- No e2e framework configured
- E2e tests exist but don't cover critical paths
- E2e tests are broken/skipped

**If critical paths not documented, ask user**:
"What are the business-critical paths for this project? (e.g., checkout flow, signup, payment). I'll verify e2e tests exist for each."

**Evidence to capture**:
- E2e framework detected
- Number of e2e test files
- Documented critical paths (if found)
- List of critical paths covered by e2e tests
- List of critical paths missing e2e tests
- E2e test pass/fail results

---

## Code Metrics

### TEST-005: CRAP score calculated with project baseline
**Severity**: Recommended

**Check automatically**:

1. **Check for CRAP score tooling**:
   ```bash
   # Node.js - look for complexity tools
   grep -E "complexity|crap|code-climate|plato|es6-plato" package.json 2>/dev/null

   # PHP - phpunit has CRAP built in
   grep -E "crap|coverage.*crap" phpunit.xml* 2>/dev/null

   # Python - look for radon or similar
   grep -E "radon|mccabe|complexity" requirements*.txt pyproject.toml 2>/dev/null
   ```

2. **Check for baseline/threshold configuration**:
   ```bash
   # Look for documented thresholds
   grep -riE "crap.*threshold|crap.*baseline|complexity.*threshold|max.*complexity" \
     README.md CLAUDE.md docs/ .eslintrc* package.json 2>/dev/null
   ```

3. **Run CRAP/complexity analysis** (if tooling exists):
   ```bash
   # Node.js with eslint complexity rule
   pnpm eslint --rule 'complexity: ["error", 10]' src/

   # PHP
   ./vendor/bin/phpunit --coverage-text | grep -A 20 "CRAP"

   # Python
   radon cc src/ -a -s
   ```

**Cross-reference with**:
- TEST-001 - CRAP score often calculated alongside coverage
- TODO: Section 28 (Code Architecture) - update reference once developed
- TODO: Section 40 (Technical Debt) - update reference once developed

**Pass criteria**:
- CRAP score or complexity tooling configured
- Baseline/threshold established for the project
- Current scores within acceptable range

**Fail criteria**:
- No complexity measurement tooling
- No baseline defined (can't track if it's getting worse)
- High CRAP scores ignored

**If no tooling found, ask user**:
"No CRAP score or complexity measurement tooling found. Do you want to track code complexity? Common options: ESLint complexity rule, PHPUnit CRAP, radon (Python)."

**Evidence to capture**:
- Tooling detected (or none)
- Baseline/threshold value (if configured)
- Current CRAP/complexity scores for key components
- Components exceeding threshold (if any)

---

## Agent Automation

### TEST-006: Agent skills for test automation
**Severity**: Optional

**Check automatically**:

1. **Check for Claude/agent skill definitions**:
   ```bash
   # Look for skills directory
   ls -la skills/ .claude/skills/ 2>/dev/null

   # Look for skill files related to testing
   find . -type f -name "*.skill.*" -o -name "*skill*.md" 2>/dev/null | xargs grep -l -iE "test|lint|crap|coverage" 2>/dev/null

   # Check CLAUDE.md for test instructions
   grep -iE "run.*test|test.*command|lint.*command" CLAUDE.md 2>/dev/null
   ```

2. **Verify skills cover key operations**:
   - Run tests
   - Check coverage
   - Run linting
   - Check/report CRAP score

**Cross-reference with**:
- TEST-001 - skills should invoke the same test commands
- TEST-005 - skills for CRAP score checking
- Section 2 (Dependencies) - linting configuration

**Pass criteria**:
- Agent instructions exist for running tests
- Agent instructions exist for running linting
- (Bonus) Agent instructions for CRAP/complexity checks

**Fail criteria**:
- No agent-readable instructions for test/lint commands
- CLAUDE.md exists but doesn't mention how to run tests

**If no skills found, ask user**:
"No agent skills found for running tests or linting. If you want AI agents to run these, consider adding instructions to CLAUDE.md or a skills/ directory."

**Evidence to capture**:
- Skills/instructions found (or none)
- Test command documented for agents
- Lint command documented for agents
- CRAP/complexity command documented (if any)

---

## Completing the Audit

After checking all items:

1. **Summarize results**:
   - TEST-001: PASS/FAIL (Critical)
   - TEST-002: PASS/FAIL (Critical)
   - TEST-003: PASS/FAIL (Critical)
   - TEST-004: PASS/FAIL (Critical)
   - TEST-005: PASS/FAIL (Recommended)
   - TEST-006: PASS/FAIL (Optional)

2. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority

3. **Common recommendations**:
   - If no coverage threshold: Add `coverageThreshold` to jest/vitest config or `fail_under` to pytest
   - If fix commits lack tests: Establish PR review requirement for regression tests
   - If no e2e tests: Identify critical paths and add Playwright/Cypress tests
   - If no CRAP tracking: Add ESLint complexity rule or equivalent
   - If no agent skills: Document test/lint commands in CLAUDE.md

4. **Record audit date** and auditor
