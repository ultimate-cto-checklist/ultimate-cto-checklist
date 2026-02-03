# Dependencies & Code Quality Audit Guide

This guide walks you through auditing a repository's dependency management, language choices, and code quality tooling.

## Before You Start

1. Confirm you're in the target repository's root directory
2. Verify the project is a Node.js/TypeScript project (most checks are Node-specific)
3. Have the user available for questions about package choices and migration plans

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## Dependency Management

### DEP-001: Dependencies secure and maintained
**Severity**: Critical

**Check automatically**:

1. **Run vulnerability scan**:
   ```bash
   # Node.js projects
   pnpm audit 2>/dev/null || npm audit 2>/dev/null

   # Python projects
   pip-audit 2>/dev/null || safety check 2>/dev/null
   ```

2. **Check lockfile freshness**:
   ```bash
   git log -1 --format="%ci %s" -- pnpm-lock.yaml package-lock.json yarn.lock 2>/dev/null
   ```

3. **Count outdated packages** (informational):
   ```bash
   pnpm outdated 2>/dev/null || npm outdated 2>/dev/null
   ```

**Pass criteria**:
- No critical or high vulnerabilities in audit output
- Lockfile updated within last 30 days

**Fail criteria**:
- Any critical vulnerabilities
- High vulnerabilities without documented exception
- Lockfile not touched in 90+ days

**If vulnerabilities found, ask user**:
"Found [X] critical and [Y] high vulnerabilities. Are any of these documented exceptions with mitigations in place?"

**Evidence to capture**:
- Vulnerability count by severity (critical/high/moderate/low)
- Last lockfile update date and commit message
- List of critical/high vulnerabilities with affected packages

---

### DEP-002: Dependency update system configured
**Severity**: Recommended

**Check automatically**:

1. **Look for Dependabot config**:
   ```bash
   ls -la .github/dependabot.yml .github/dependabot.yaml 2>/dev/null
   ```

2. **Look for Renovate config**:
   ```bash
   ls -la renovate.json renovate.json5 .renovaterc .renovaterc.json .github/renovate.json 2>/dev/null
   ```

3. **If found, verify config covers the project**:
   ```bash
   # Check Dependabot covers the right ecosystem
   cat .github/dependabot.yml 2>/dev/null | grep -E "package-ecosystem|directory"

   # Check Renovate is enabled
   cat renovate.json 2>/dev/null
   ```

4. **Check for recent dependency update PRs** (evidence it's working):
   ```bash
   gh pr list --state all --limit 20 --json title,createdAt | grep -iE "(dependabot|renovate|bump|update.*dependencies)"
   ```

**Cross-reference with**:
- DEP-001: If lockfile is fresh and no vulnerabilities, the system is likely working

**Pass criteria**:
- Dependabot or Renovate configured, OR
- Evidence of regular manual dependency updates (recent PRs, fresh lockfile)

**Fail criteria**:
- No automated system AND no evidence of manual updates
- Config exists but is broken/incomplete (wrong ecosystem, wrong directory)

**If no config found, ask user**:
"No Dependabot or Renovate config found. How are dependency updates tracked? Is there a manual process?"

**Evidence to capture**:
- Which system configured (Dependabot/Renovate/manual)
- Config file location
- Recent dependency update PRs (last 3 months)

---

### DEP-003: No deprecated or unmaintained libraries
**Severity**: Recommended

**Check automatically**:

1. **Check for known deprecated packages** (Node.js):
   ```bash
   # Check npm deprecation warnings during install
   pnpm install --dry-run 2>&1 | grep -i "deprecated" || npm install --dry-run 2>&1 | grep -i "deprecated"
   ```

2. **Check package health on key dependencies**:
   ```bash
   # Extract direct dependencies from package.json
   cat package.json | jq -r '.dependencies // {} | keys[]' 2>/dev/null
   ```

3. **For critical dependencies, check GitHub activity**:
   ```bash
   # Example for a specific package - check last commit
   gh api repos/{owner}/{repo}/commits --jq '.[0].commit.committer.date' 2>/dev/null
   ```

**Note**: Full automation is difficult here. Focus on:
- Framework packages (React, Express, Django, etc.)
- Security-sensitive packages (auth, crypto)
- Packages with known deprecation announcements

**Pass criteria**:
- No deprecated packages in install output
- Critical dependencies have commits within last 12 months
- No packages with known security abandonment

**Fail criteria**:
- Deprecated packages in use with no migration plan
- Critical dependency unmaintained (no commits in 2+ years)
- Using packages with known security issues and no maintainer

**If deprecated packages found, ask user**:
"Found deprecated packages: [list]. Are there migration plans for these?"

**Evidence to capture**:
- List of deprecated packages from install output
- Key dependencies and their last update dates
- Any known unmaintained packages flagged

---

## Language & Tooling

### DEP-004: TypeScript over JavaScript
**Severity**: Recommended

**Check automatically**:

1. **Look for TypeScript configuration**:
   ```bash
   ls -la tsconfig.json tsconfig.*.json 2>/dev/null
   ```

2. **Count file extensions**:
   ```bash
   # TypeScript files
   find . -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "./node_modules/*" -not -path "./dist/*" | wc -l

   # JavaScript files (excluding config files)
   find . -type f \( -name "*.js" -o -name "*.jsx" \) -not -path "./node_modules/*" -not -path "./dist/*" -not -name "*.config.js" -not -name "*.config.mjs" | wc -l
   ```

3. **Check for partial migration** (both TS and JS source files):
   ```bash
   # List JS files in src/ that aren't configs
   find ./src -type f \( -name "*.js" -o -name "*.jsx" \) 2>/dev/null
   ```

4. **Check tsconfig strictness**:
   ```bash
   cat tsconfig.json | jq '{strict: .compilerOptions.strict, noImplicitAny: .compilerOptions.noImplicitAny, strictNullChecks: .compilerOptions.strictNullChecks}' 2>/dev/null
   ```

**Note**: This applies to Node.js/frontend projects. Skip for Python, Go, etc.

**Pass criteria**:
- Project uses TypeScript (tsconfig.json exists)
- Source files are predominantly .ts/.tsx
- Strict mode enabled (`"strict": true`) or key strict flags set

**Fail criteria**:
- Pure JavaScript project with no TypeScript
- TypeScript configured but `strict: false` and no strict flags
- Mixed codebase with significant JS files in src/ (partial migration stalled)

**If JavaScript project, ask user**:
"Project uses JavaScript instead of TypeScript. Is there a plan to migrate, or a reason TypeScript isn't suitable here?"

**If partial migration, ask user**:
"Found [X] JavaScript files alongside TypeScript. Is migration in progress? What's the timeline?"

**Evidence to capture**:
- tsconfig.json exists (yes/no)
- File count: .ts/.tsx vs .js/.jsx
- Strict mode status
- Any JS files in src/ that should be migrated

---

### DEP-005: Linting rules follow best practices
**Severity**: Recommended

**Check automatically**:

1. **Find ESLint config**:
   ```bash
   ls -la .eslintrc* eslint.config.* 2>/dev/null
   ```

2. **Check for recommended/standard base configs**:
   ```bash
   # Look for extends with recommended configs
   cat .eslintrc.json 2>/dev/null | jq '.extends' 2>/dev/null
   cat .eslintrc.js 2>/dev/null | grep -A5 "extends"
   cat eslint.config.js 2>/dev/null | grep -E "(recommended|standard|airbnb)"
   ```

3. **Check for overly permissive rule overrides**:
   ```bash
   # Rules set to "off" or 0
   cat .eslintrc.json 2>/dev/null | jq '.rules | to_entries[] | select(.value == "off" or .value == 0)' 2>/dev/null
   grep -E '"(off|0)"' .eslintrc* 2>/dev/null
   ```

4. **Check for critical rules disabled**:
   ```bash
   # Security and quality rules that shouldn't be off
   grep -E "(no-eval|no-implied-eval|no-new-func|no-unused-vars|no-undef|eqeqeq|no-var)" .eslintrc* eslint.config.* 2>/dev/null | grep -E "(off|0)"
   ```

5. **For TypeScript projects, check TS-specific rules**:
   ```bash
   cat .eslintrc.json 2>/dev/null | jq '.extends[]' 2>/dev/null | grep -i typescript
   grep -E "@typescript-eslint" .eslintrc* eslint.config.* 2>/dev/null
   ```

**Cross-reference with**:
- GIT-010 (Linting configured): That checks linting exists; this checks it's configured well

**Pass criteria**:
- Extends a recommended base config (eslint:recommended, airbnb, standard, etc.)
- TypeScript projects use @typescript-eslint
- No critical security rules disabled
- Rule overrides are minimal and justified

**Fail criteria**:
- No base config extended (rules from scratch)
- Critical rules disabled: `no-eval`, `no-unused-vars`, `no-undef`, `eqeqeq`
- TypeScript project without @typescript-eslint rules
- Excessive rules turned off (10+ rules disabled)

**If many rules disabled, ask user**:
"Found [X] ESLint rules disabled. Are these intentional? Disabling `[list critical ones]` may hide bugs or security issues."

**Evidence to capture**:
- Base config(s) extended
- List of disabled rules
- Whether TypeScript-specific rules are configured
- Any critical rules that are off

---

### DEP-006: pnpm over npm for Node projects
**Severity**: Recommended

**Check automatically**:

1. **Check which lockfile exists**:
   ```bash
   ls -la pnpm-lock.yaml package-lock.json yarn.lock 2>/dev/null
   ```

2. **Check packageManager field in package.json**:
   ```bash
   cat package.json | jq '.packageManager' 2>/dev/null
   ```

3. **Check for .npmrc with pnpm settings**:
   ```bash
   cat .npmrc 2>/dev/null | grep -E "(shamefully-hoist|strict-peer-dependencies)"
   ```

4. **Check CI workflows for package manager used**:
   ```bash
   grep -rE "(pnpm install|npm install|yarn install|npm ci|pnpm ci)" .github/workflows/ 2>/dev/null
   ```

**Note**: This applies to Node.js projects only. Skip for non-Node projects.

**Pass criteria**:
- `pnpm-lock.yaml` exists (not package-lock.json or yarn.lock)
- `packageManager` field set in package.json (e.g., `"packageManager": "pnpm@8.x.x"`)
- CI uses pnpm commands

**Fail criteria**:
- Using npm (package-lock.json) or yarn (yarn.lock) instead of pnpm
- Mixed lockfiles (multiple lockfiles present)
- CI uses different package manager than lockfile indicates

**If not using pnpm, ask user**:
"Project uses [npm/yarn] instead of pnpm. Is there a specific reason? pnpm offers better disk efficiency and stricter dependency resolution."

**If mixed lockfiles, ask user**:
"Found multiple lockfiles: [list]. This causes inconsistent installs. Which package manager should be used?"

**Evidence to capture**:
- Lockfile present (pnpm-lock.yaml / package-lock.json / yarn.lock)
- packageManager field value
- Package manager used in CI
- Any inconsistencies between local and CI

---

## Monorepo Structure

### DEP-007: Turborepo for monorepos
**Severity**: Recommended

**Check automatically**:

1. **Scan for multiple package.json files** (detect hidden apps):
   ```bash
   # Find all package.json files in first 2 levels (excluding node_modules)
   find . -maxdepth 3 -name "package.json" -not -path "*/node_modules/*" 2>/dev/null
   ```

2. **Check for app-like directories without workspace setup**:
   ```bash
   # Common app directory patterns that might be hidden apps
   ls -d */package.json */*/package.json 2>/dev/null | grep -v node_modules

   # Check for directories with their own node_modules (red flag)
   find . -maxdepth 3 -type d -name "node_modules" -not -path "./node_modules" -not -path "./node_modules/*" 2>/dev/null
   ```

3. **Detect if this is a monorepo**:
   ```bash
   # Check for workspace configuration
   cat package.json | jq '.workspaces' 2>/dev/null
   cat pnpm-workspace.yaml 2>/dev/null

   # Check for typical monorepo directories
   ls -d apps/ packages/ libs/ services/ 2>/dev/null
   ```

4. **Cross-reference: all package.json files should be in workspaces**:
   ```bash
   # Get workspace globs
   cat pnpm-workspace.yaml 2>/dev/null
   cat package.json | jq '.workspaces' 2>/dev/null

   # Compare against found package.json locations
   ```

5. **If monorepo, check for Turborepo**:
   ```bash
   ls -la turbo.json 2>/dev/null
   ```

6. **Check Turborepo configuration**:
   ```bash
   # Verify pipeline is configured
   cat turbo.json | jq '.pipeline // .tasks' 2>/dev/null

   # Check for proper task dependencies
   cat turbo.json | jq '(.pipeline // .tasks) | keys' 2>/dev/null
   ```

7. **Check root package.json uses turbo**:
   ```bash
   cat package.json | jq '.scripts' | grep -E "turbo"
   ```

8. **Check for alternative monorepo tools** (flag if present instead of Turborepo):
   ```bash
   # Nx
   ls -la nx.json 2>/dev/null

   # Lerna
   ls -la lerna.json 2>/dev/null

   # Rush
   ls -la rush.json 2>/dev/null
   ```

9. **Check CI uses turbo for builds**:
   ```bash
   grep -rE "(turbo run|turbo build|turbo test|npx turbo)" .github/workflows/ 2>/dev/null
   ```

10. **Check caching is enabled**:
    ```bash
    # Check .turbo is gitignored (local cache)
    grep -E "\.turbo" .gitignore 2>/dev/null
    ```

**Note**: Only applies to monorepos or repos with multiple apps. Skip if truly single-package.

**Pass criteria**:
- Single-package repo (only root package.json) - N/A, skip this check
- All package.json files are covered by workspace config
- No rogue node_modules directories outside root
- Monorepo with Turborepo configured (`turbo.json` exists)
- Pipeline/tasks properly defined for build, test, lint
- Root scripts use `turbo run` commands
- CI workflows use turbo for builds
- `.turbo` cache directory is gitignored

**Fail criteria**:
- Multiple package.json files but no workspace configuration (hidden monorepo)
- package.json files not covered by workspaces glob
- Nested node_modules directories (apps installing deps independently)
- Monorepo without any build orchestration tool
- Using Lerna, Nx, or Rush instead of Turborepo (flag for discussion)
- Turborepo configured but not used in scripts or CI
- Missing pipeline configuration for key tasks (build, test, lint)
- `.turbo` not in .gitignore

**If hidden apps detected, ask user**:
"Found package.json files not in workspaces config: [list paths]. Are these separate apps that should be workspace packages? Nested node_modules at [paths] suggests they're being managed independently."

**If alternative tool found, ask user**:
"Monorepo uses [Nx/Lerna/Rush] instead of Turborepo. Is there a specific reason? Turborepo is preferred for its simplicity and caching."

**If monorepo without orchestration, ask user**:
"This appears to be a monorepo (multiple package.json files) but no build orchestration tool found. How are cross-package builds and dependencies managed?"

**Evidence to capture**:
- All package.json locations found
- Which are covered by workspaces config
- Any rogue node_modules directories
- Is properly configured monorepo (yes/no)
- Orchestration tool (Turborepo/Nx/Lerna/Rush/none)
- turbo.json tasks defined
- Whether scripts and CI use turbo
- Cache configuration status

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
   - Critical failures first (DEP-001 vulnerabilities)
   - Security issues are urgent
   - Quick wins vs larger efforts

4. **Record audit date** and auditor (you + user confirmation)
