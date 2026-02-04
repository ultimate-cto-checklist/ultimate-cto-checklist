# Code Architecture Audit Guide

This guide walks you through auditing a project's code architecture - specifically SOLID principles compliance, code quality tooling, and build performance.

## Before You Start

1. **Identify primary language/framework** (TypeScript, Python, Go, etc.)
2. **Identify build system** (Vite, Webpack, esbuild, Turbo, etc.)
3. **Check for existing code quality tools** (ESLint, SonarQube, CodeClimate)
4. **Understand CI/CD pipeline** (where quality checks and builds run)

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## SOLID Principles

### ARCH-001: SOLID Principles Audited Regularly
**Severity**: Recommended

Code should follow SOLID principles (Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, Dependency Inversion) and be regularly audited for compliance. AI agents are well-suited to this assessment.

**Check automatically**:

1. **Check for AI code review integration**:
```bash
# Check for Claude/AI agent configuration
ls -la CLAUDE.md AGENTS.md .claude* 2>/dev/null

# Check for AI reviewer in GitHub Actions
grep -rE "claude|anthropic|openai|ai-review|code-review" .github/workflows/ 2>/dev/null

# Check for architecture guidelines in agent config
grep -iE "solid|architecture|single responsibility|dependency injection" CLAUDE.md AGENTS.md 2>/dev/null
```

2. **Check for architecture documentation**:
```bash
# Look for architecture decision records (ADRs)
find . -type d -name "adr*" -o -name "decisions" 2>/dev/null
find . -type f -name "*.md" | xargs grep -liE "architecture|solid|design principle" 2>/dev/null | head -10

# Check for documented coding standards
ls -la CONTRIBUTING.md docs/architecture* docs/coding-standards* 2>/dev/null
```

3. **Proxy metrics** (heuristics, not definitive):
```bash
# Very large files may indicate SRP violations (>500 lines)
find src -name "*.ts" -o -name "*.js" -o -name "*.py" 2>/dev/null | xargs wc -l 2>/dev/null | sort -n | tail -20

# Files with many imports may have coupling issues (>20 imports)
for f in $(find src -name "*.ts" 2>/dev/null | head -20); do
  count=$(grep -c "^import" "$f" 2>/dev/null || echo 0)
  if [ "$count" -gt 20 ]; then echo "$f: $count imports"; fi
done

# God classes - files with many exported functions/classes
grep -rE "^export (function|class|const)" src --include="*.ts" 2>/dev/null | cut -d: -f1 | sort | uniq -c | sort -n | tail -10
```

**AI agent assessment** (the core verification):
- AI agent should review codebase for SOLID violations during PR review
- Periodic architecture audits (monthly/quarterly) by AI agent
- Agent checks for: god classes, interface bloat, concrete dependencies, inheritance misuse
- Agent flags issues with specific recommendations

**Ask user**:
- "Is AI code review part of your PR process?"
- "How are architecture decisions reviewed?"
- "When was the last architecture audit?"

**Cross-reference with**:
- ARCH-002 (code complexity - related health metric)
- TEST-005 (CRAP score)
- FLOW-002 (AI + human review in PR process)

**Pass criteria**:
- AI agent is part of code review process and checks for architecture issues
- Architecture principles documented (in CLAUDE.md, ADRs, or similar)
- No major SOLID violations in critical paths (as assessed by AI review)
- Evidence of recent architecture review

**Fail criteria**:
- No AI-assisted code review
- No documented architecture standards
- Known god classes or tightly coupled code ignored
- "We don't do architecture reviews"

**Evidence to capture**:
- How SOLID compliance is assessed (AI agent, manual review, both)
- Location of architecture guidelines
- Recent examples of AI catching architecture issues
- Date of last architecture audit

---

## Code Quality

### ARCH-002: Code Quality Measurement Tools
**Severity**: Recommended

Projects should have tooling to measure code health: duplication, complexity, and overall quality. Results should be visible and acted upon.

**Check automatically**:

1. **Check for code quality tools in dependencies**:
```bash
# JavaScript/TypeScript quality tools
grep -E "sonarqube|sonar-scanner|@sonarqube|codeclimate|eslint-plugin-sonarjs|jscpd|plato|es6-plato|typhonjs-escomplex" package.json 2>/dev/null

# Python quality tools
grep -E "radon|xenon|flake8|pylint|bandit|vulture|mccabe|prospector" requirements*.txt pyproject.toml setup.py 2>/dev/null

# Go quality tools
grep -E "golangci-lint|gocyclo|dupl" go.mod Makefile 2>/dev/null

# General config files
ls -la .codeclimate.yml sonar-project.properties .sonarcloud.properties .codacy.yml 2>/dev/null
```

2. **Check for duplication detection**:
```bash
# jscpd (copy-paste detector)
grep -E "jscpd" package.json 2>/dev/null
ls -la .jscpd.json .jscpd.yaml 2>/dev/null

# Check CI for duplication checks
grep -rE "jscpd|cpd|duplication|duplicate" .github/workflows/ 2>/dev/null

# SonarQube includes duplication detection
grep -rE "sonar" .github/workflows/ 2>/dev/null
```

3. **Check for complexity measurement**:
```bash
# ESLint complexity rules
grep -rE "complexity|max-depth|max-lines|max-statements|max-nested-callbacks" .eslintrc* eslint.config.* 2>/dev/null

# Dedicated complexity tools
grep -E "plato|es6-plato|typhonjs-escomplex|radon" package.json requirements*.txt 2>/dev/null

# Check for complexity thresholds in CI
grep -rE "complexity|cyclomatic" .github/workflows/ 2>/dev/null
```

4. **Check for CI integration**:
```bash
# Quality gates in CI
grep -rE "sonar|codeclimate|quality|lint" .github/workflows/ 2>/dev/null

# Check if quality checks are required (not just informational)
grep -rE "fail-on-|--max-|threshold|gate" .github/workflows/ 2>/dev/null
```

5. **Check ESLint configuration for quality rules**:
```bash
# Look for quality-focused ESLint plugins
grep -rE "eslint-plugin-sonarjs|eslint-plugin-unicorn|eslint-plugin-complexity" package.json 2>/dev/null

# Check actual complexity settings
cat .eslintrc* eslint.config.* 2>/dev/null | grep -A5 -E "complexity|max-"
```

**Ask user**:
- "What tools do you use to measure code quality?"
- "Where can developers see code quality metrics?"
- "Are there thresholds that fail the build?"
- "How often are quality reports reviewed?"

**Common tools** (for reference):
- **SonarQube/SonarCloud** - Comprehensive (duplication, complexity, bugs, smells)
- **CodeClimate** - Quality metrics with GitHub integration
- **jscpd** - Copy-paste detection
- **ESLint complexity rules** - Built into linting
- **Plato/ES6-Plato** - JavaScript complexity reports
- **Radon** - Python complexity metrics

**Cross-reference with**:
- ARCH-001 (SOLID audits - related but different angle)
- TEST-005 (CRAP score - combines complexity with coverage)
- Section 40 (Technical Debt tracking - complexity feeds into debt)
- DEP-001 (Vulnerability scanning - often same tools)

**Pass criteria**:
- At least one code quality tool configured
- Duplication detection available (jscpd, SonarQube, or similar)
- Complexity metrics accessible (tool output, ESLint rules, or reports)
- Results visible to team (dashboard, CI output, or reports)
- Team actively reviews and acts on findings

**Partial pass**:
- Tools configured but results ignored
- Only ESLint rules, no dedicated quality tool
- Quality checks run but don't fail builds (visibility without enforcement)

**Fail criteria**:
- No code quality tooling configured
- "We just eyeball it in code review"
- No visibility into code health metrics
- Complexity warnings consistently ignored

**Evidence to capture**:
- Tools configured (list)
- Where results are visible (CI output, dashboard URL, reports)
- Whether thresholds/gates are enforced or advisory
- Recent example of acting on quality findings

---

## Build Performance

### ARCH-003: Build Performance
**Severity**: Recommended

Builds should be fast: under 3 minutes for clean builds, under 30 seconds with caching. Slow builds hurt developer productivity and CI costs.

**Check automatically**:

1. **Check for build caching configuration**:
```bash
# Turborepo (monorepo caching)
ls -la turbo.json 2>/dev/null
grep -E "\"turbo\"" package.json 2>/dev/null

# Nx (monorepo caching)
ls -la nx.json 2>/dev/null
grep -E "\"nx\"" package.json 2>/dev/null

# Vite/esbuild/swc (fast by design)
grep -E "\"vite\"|\"esbuild\"|\"@swc\"" package.json 2>/dev/null

# Webpack caching configuration
grep -rE "cache.*filesystem|cache.*type.*filesystem" webpack.config.* 2>/dev/null

# Next.js (has built-in caching)
grep -E "\"next\":" package.json 2>/dev/null
```

2. **Check CI caching**:
```bash
# GitHub Actions cache
grep -rE "actions/cache|cache:" .github/workflows/ 2>/dev/null

# Node modules / pnpm store caching
grep -rE "node_modules|pnpm-store|\.npm|\.pnpm" .github/workflows/ 2>/dev/null

# Build output caching
grep -rE "\.next|dist|build|\.turbo" .github/workflows/ 2>/dev/null
```

3. **Check build scripts**:
```bash
# What does the build command do?
grep -E "\"build\":" package.json 2>/dev/null

# Check for build optimization flags
grep -rE "NODE_ENV=production|--minify|--sourcemap" package.json Makefile 2>/dev/null
```

4. **Check recent CI build times** (if GitHub Actions):
```bash
# Get recent workflow runs with duration
gh run list --limit 10 --json databaseId,displayTitle,conclusion,createdAt,updatedAt 2>/dev/null
```

**Measure actual build times** (use subagent):
- Run clean build (delete node_modules/.next/.turbo/dist first)
- Time the build: `time pnpm build` or equivalent
- Run cached build (second run without cleaning)
- Time again and compare

**Benchmarks**:
| Metric | Good | Acceptable | Needs Work |
|--------|------|------------|------------|
| Clean build | < 2 min | < 3 min | > 5 min |
| Cached build | < 15 sec | < 30 sec | > 1 min |
| CI build | < 3 min | < 5 min | > 10 min |

**Ask user**:
- "How long does a typical build take?"
- "Is build caching configured?"
- "Are developers waiting on builds frequently?"

**Cross-reference with**:
- DEPLOY-003 (CI build performance - same concept, deployment context)
- Section 2 (Dependencies - fewer deps = faster builds)
- DEP-007 (Turborepo for monorepos - caching solution)

**Pass criteria**:
- Clean build completes in < 3 minutes
- Cached/incremental build completes in < 30 seconds
- Build caching is configured (local and/or CI)
- No unnecessary rebuilds of unchanged code

**Partial pass**:
- Build times acceptable but no caching configured
- Caching configured but not optimized (cache misses common)
- Local builds fast but CI builds slow

**Fail criteria**:
- Clean build > 5 minutes
- No caching configured (every build is full rebuild)
- Cached build still takes minutes
- Developers avoid running builds due to slowness
- CI times consistently > 10 minutes

**Evidence to capture**:
- Measured clean build time
- Measured cached build time
- Caching tools in use (Turbo, Nx, Webpack cache, etc.)
- CI build times (from recent runs)
- Any identified bottlenecks

---

## Completing the Audit

After checking all items:

1. **Summarize results**:
   - ARCH-001: PASS/FAIL (Recommended) - SOLID principles audited regularly
   - ARCH-002: PASS/FAIL (Recommended) - Code quality measurement tools
   - ARCH-003: PASS/FAIL (Recommended) - Build performance

2. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority

3. **Common recommendations**:
   - If no AI review: Add CLAUDE.md with architecture guidelines, integrate AI into PR review
   - If no quality tools: Start with ESLint complexity rules, graduate to SonarQube/CodeClimate
   - If slow builds: Add Turborepo for monorepos, enable Webpack/Vite caching, audit dependencies
   - If no duplication detection: Add jscpd to CI pipeline

4. **Maturity assessment**:
   - **Level 1**: No architecture oversight - code quality is ad-hoc
   - **Level 2**: Basic linting but no quality tools - complexity ignored
   - **Level 3**: Quality tools configured with visibility - team aware of issues
   - **Level 4**: AI-assisted architecture review, enforced quality gates, fast builds

5. **Record audit date** and auditor
