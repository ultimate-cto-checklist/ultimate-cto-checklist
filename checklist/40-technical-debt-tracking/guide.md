# Technical Debt Tracking Audit Guide

This guide walks you through auditing a project's technical debt visibility, management, and metrics.

## The Goal: Visible, Managed Debt

Technical debt is inevitable. The question is whether it's:
- **Visible** — explicitly tracked, not just "known"
- **Structured** — prioritized with enough context to act on
- **Managed** — regularly reviewed, allocated time, actually reduced

Invisible debt compounds silently. This guide verifies the practices that keep debt under control.

**Cross-references**:
- Section 8 (Testing & Code Metrics) covers CRAP score
- Section 2 (Dependencies & Code Quality) covers dependency updates
- Section 28 (Code Architecture) covers SOLID principles and quality tools

## Before You Start

1. **Identify where debt is tracked** (Linear, Jira, GitHub Issues, Notion, dedicated doc)
2. **Understand the team's sprint/planning cadence** (affects review frequency expectations)
3. **Check team size** (smaller teams may have informal but effective processes)

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## Debt Visibility

### DEBT-001: Explicit tech debt list maintained
**Severity**: Critical

Technical debt must be explicitly tracked, not just "known" by the team. Without visibility, debt compounds invisibly and prioritization becomes impossible.

**Check automatically**:

```bash
# Look for tech debt documentation
find . -maxdepth 4 -type f \( -name "*debt*" -o -name "*backlog*" -o -name "*technical*" \) -name "*.md" 2>/dev/null | grep -v node_modules

# Search for debt tracking content
grep -riE "tech(nical)? debt|refactor|legacy|cleanup" docs/ README.md --include="*.md" 2>/dev/null

# Check for debt label in GitHub Issues
gh label list 2>/dev/null | grep -iE "debt|refactor|tech"

# Count open debt items if label exists
gh issue list --label "tech-debt" --state open --json title --limit 100 2>/dev/null | jq length
```

**Ask user**:
- "Where does the team track technical debt?" (Linear, Jira, Notion, GitHub Issues, dedicated doc)
- "Is it a living list that gets updated?"
- "When was the last item added or resolved?"

**Pass criteria**:
- Dedicated tech debt tracking exists (board, label, document)
- Actively maintained (updated within last quarter)
- Discoverable by team members
- Contains actual items (not empty)

**Fail criteria**:
- No explicit tracking ("we just know")
- List exists but stale (last updated 6+ months ago)
- Scattered across random places with no central view
- Empty or abandoned tracking system

**Evidence to capture**:
- Location of debt tracking (URL, file path)
- Tracking method (label, board, document)
- Number of open items
- Last activity date

---

### DEBT-002: Each debt item has required fields
**Severity**: Recommended

Debt items need structure to be actionable. A title alone ("refactor auth") doesn't enable prioritization.

**Check automatically**:

```bash
# If using GitHub Issues with labels, sample some items
gh issue list --label "tech-debt" --json title,body --limit 5 2>/dev/null

# Look for debt item template
find . -maxdepth 4 -type f \( -name "*template*" -o -name "*debt*" \) -name "*.md" 2>/dev/null | xargs grep -l -iE "impact|effort|priority" 2>/dev/null
```

**Ask user**:
- "Do debt items have a consistent structure?"
- "Can you tell at a glance: what is it, why it matters, how big, how urgent?"
- "Is there a template or convention for logging debt?"

**Required fields**:
| Field | Purpose |
|-------|---------|
| Description | What the debt is (specific, not just "refactor X") |
| Impact | Why it matters (slows dev, causes bugs, blocks features) |
| Estimated effort | T-shirt size or hours/days |
| Priority | Urgency relative to other debt |

**Pass criteria**:
- Debt items have structured fields (not just titles)
- Impact is captured (why fix this?)
- Effort is estimated (even rough)
- Priority is assigned or inferable

**Fail criteria**:
- Items are just titles ("Fix the thing")
- No impact documented (can't prioritize)
- No effort estimate (can't plan)
- No priority (everything looks equal)

**Cross-reference with**:
- DEBT-001 (structure builds on having a list)
- DEBT-003 (review is where missing fields get filled)

**Evidence to capture**:
- Sample of 3-5 debt items
- Fields present per item
- Whether template exists
- Consistency across items

---

## Debt Management

### DEBT-003: Regular debt review with stale item cleanup
**Severity**: Recommended

A debt list without regular review becomes a graveyard of good intentions. Reviews keep the list relevant, prioritized, and actionable.

**Check automatically**:

```bash
# Look for review meeting notes or cadence docs
grep -riE "debt review|quarterly review|backlog grooming|tech debt.*meeting" docs/ --include="*.md" 2>/dev/null

# Check for process documentation
find . -maxdepth 4 -type f \( -name "*process*" -o -name "*cadence*" -o -name "*rituals*" \) -name "*.md" 2>/dev/null | grep -v node_modules

# Find stale debt items (older than 1 year) if using GitHub
gh issue list --label "tech-debt" --state open --json title,createdAt --limit 50 2>/dev/null | jq '[.[] | select(.createdAt < "2025-02-01")] | length'
```

**Ask user**:
- "Is there a scheduled cadence for reviewing tech debt?" (quarterly, monthly, sprint planning)
- "When was the last debt review?"
- "Who participates?" (just leads, or whole team)
- "What happens in the review?" (prioritize, close stale items, add new ones)
- "Are there debt items older than 1 year still open?"

**Review should include**:
- Prioritization of open items
- Closing stale or irrelevant items
- Adding newly discovered debt
- Validating effort estimates
- Deciding what to tackle next

**Pass criteria**:
- Defined cadence exists (quarterly minimum)
- Review actually happens (not just documented)
- Last review within expected window
- Stale items addressed (closed or deliberately kept)
- No debt items older than 12 months without explicit decision

**Fail criteria**:
- No scheduled review ("we look at it when we have time")
- Cadence documented but not followed
- Last review was 6+ months ago
- Debt items from 2+ years ago still open and ignored
- Backlog only grows, never shrinks

**Cross-reference with**:
- DEBT-001 (review validates the list is alive)
- DEBT-004 (review is where allocation gets decided)

**Evidence to capture**:
- Review cadence (documented vs actual)
- Date of last review
- Count of stale items (>12 months old)
- Actions taken in recent review

---

### DEBT-004: Allocate time for debt reduction
**Severity**: Recommended

Visibility without action just creates guilt. Teams need protected time for debt reduction.

**Check automatically**:

```bash
# Look for sprint/planning docs mentioning debt allocation
grep -riE "debt.*allocation|20%|tech debt.*sprint|refactor.*time|maintenance.*budget" docs/ --include="*.md" 2>/dev/null

# Check for team process documentation
find . -maxdepth 4 -type f \( -name "*planning*" -o -name "*sprint*" -o -name "*process*" \) -name "*.md" 2>/dev/null | grep -v node_modules

# Check for closed debt items recently (evidence of work)
gh issue list --label "tech-debt" --state closed --json title,closedAt --limit 10 2>/dev/null
```

**Ask user**:
- "Is there dedicated time for debt reduction?" (percentage of sprint, dedicated sprints, Friday afternoons)
- "What's the target allocation?" (10%, 20%, 1 sprint per quarter)
- "Is it protected or does it get deprioritized when features are urgent?"
- "How is it tracked?" (separate epic, label, honor system)

**Common allocation patterns**:
| Pattern | Description |
|---------|-------------|
| Percentage per sprint | 10-20% of each sprint for debt |
| Dedicated sprints | Full sprint every N weeks for cleanup |
| Boy Scout rule | No dedicated time, improve as you go |
| Feature tax | Each feature includes related cleanup |
| Quarterly cleanup | One focused push per quarter |

**Pass criteria**:
- Explicit allocation policy exists (even informal)
- Team knows the target
- Allocation is somewhat protected from feature pressure
- Evidence of debt work being done (closed items, PRs)

**Fail criteria**:
- No allocation ("we'll get to it eventually")
- Policy exists but always deprioritized
- Only happens in quiet periods (reactive, not proactive)
- Zero debt items closed in last quarter

**Cross-reference with**:
- DEBT-003 (review is where allocation decisions happen)
- DEBT-005 (tracking validates allocation is real)

**Evidence to capture**:
- Allocation policy (documented or verbal)
- Target percentage/cadence
- Recent debt items closed (count, dates)
- Whether allocation is protected

---

### DEBT-005: Track debt paid down over time
**Severity**: Optional

Tracking resolution over time validates that allocation is working and provides visibility into whether debt is growing or shrinking.

**Check automatically**:

```bash
# Check closed debt items with dates
gh issue list --label "tech-debt" --state closed --json title,closedAt --limit 20 2>/dev/null

# Compare open vs closed counts
echo "Open:"
gh issue list --label "tech-debt" --state open --json title --limit 100 2>/dev/null | jq length
echo "Closed:"
gh issue list --label "tech-debt" --state closed --json title --limit 100 2>/dev/null | jq length

# Look for debt tracking/reporting docs
grep -riE "debt.*closed|resolved.*debt|paid down|debt.*trend|burndown" docs/ --include="*.md" 2>/dev/null
```

**Ask user**:
- "Can you see debt resolved over time?" (burndown, closed count, trend)
- "How do you know if you're making progress or falling behind?"
- "Is there a dashboard or periodic report?"

**What tracking enables**:
- Validate allocation is working (not just planned)
- Celebrate progress (team morale)
- Detect if debt is growing faster than resolved
- Justify continued investment to stakeholders

**Pass criteria**:
- Can query closed debt items with dates
- Some visibility into trend (growing vs shrinking)
- Team has a sense of whether they're gaining or losing ground

**Fail criteria**:
- No way to see what's been resolved
- Items just disappear without record
- No sense of trend ("we work on it but who knows if it's helping")

**Cross-reference with**:
- DEBT-001 (tracking requires a maintained list)
- DEBT-004 (tracking validates allocation is real)

**Evidence to capture**:
- Closed item count (last quarter, last year)
- Open vs closed ratio
- Whether trend is visible
- Any dashboard or reporting

---

## Debt Metrics

### DEBT-006: Code complexity trends
**Severity**: Optional

Code complexity is a leading indicator of technical debt. Tracking trends helps catch debt accumulation early.

**Check automatically**:

```bash
# Look for complexity tooling config
find . -maxdepth 3 -type f \( -name ".codeclimate*" -o -name "sonar-project.properties" -o -name ".plato*" -o -name "complexity-report*" \) 2>/dev/null

# Check for complexity in CI
grep -riE "complexity|codeclimate|sonarqube|sonar|plato" .github/workflows/ .circleci/ .gitlab-ci.yml Jenkinsfile 2>/dev/null

# Look for eslint complexity rules
grep -riE "complexity|max-depth|max-nested" .eslintrc* eslint.config* 2>/dev/null
```

**Ask user**:
- "Is code complexity measured?" (ESLint rules, SonarQube, CodeClimate, manual audits)
- "Can you see trends over time?" (dashboard, reports, CI history)
- "Are there thresholds that fail builds or warn?"

**Common tools**:
| Tool | What it measures |
|------|------------------|
| ESLint complexity rule | Cyclomatic complexity per function |
| SonarQube | Complexity, duplication, code smells |
| CodeClimate | Maintainability grade, complexity |
| Plato | JS complexity reports |

**Pass criteria**:
- Complexity measured (at least ESLint rule or equivalent)
- Trend visible (reports over time, or CI history)
- Team aware of complexity hotspots

**Fail criteria**:
- No complexity measurement
- Measured but not tracked over time
- Thresholds exist but always ignored/overridden

**Cross-reference with**:
- Section 8 (CRAP score)
- Section 28 (Code Architecture - SOLID, quality tools)

**Evidence to capture**:
- Complexity tools in use
- Thresholds configured
- Whether trends are tracked
- Recent complexity scores (if available)

---

### DEBT-007: Dependency age/health
**Severity**: Recommended

Outdated dependencies are a form of compounding technical debt with security implications. Tracking dependency health is essential.

**Check automatically**:

```bash
# Check for dependency update tooling
ls -la .github/dependabot.yml 2>/dev/null
find . -maxdepth 3 -type f \( -name "renovate.json*" -o -name ".dependabot*" \) 2>/dev/null

# Check for outdated deps (Node/pnpm)
pnpm outdated 2>/dev/null | head -20 || npm outdated 2>/dev/null | head -20

# Check for security vulnerabilities
pnpm audit 2>/dev/null | head -30 || npm audit 2>/dev/null | head -30

# Look for dependency health docs
grep -riE "dependency|outdated|upgrade|renovate|dependabot" docs/ --include="*.md" 2>/dev/null
```

**Ask user**:
- "Is there automated dependency update tooling?" (Dependabot, Renovate)
- "How far behind are dependencies typically?" (weeks, months, years)
- "Are security vulnerabilities tracked and addressed?"
- "Is there a policy for major version upgrades?"

**Pass criteria**:
- Dependency update tool configured (Dependabot/Renovate)
- No critical/high CVEs unaddressed
- Major dependencies not more than 1-2 major versions behind
- Team reviews and merges dependency PRs regularly

**Fail criteria**:
- No automated updates
- Dependencies years out of date
- Known CVEs ignored
- Dependency PRs pile up unreviewed

**Cross-reference with**:
- Section 2 (Dependencies & Code Quality)

**Evidence to capture**:
- Update tooling in use
- Count of outdated dependencies
- CVE status (critical/high count)
- Age of oldest dependency PR

---

### DEBT-008: TODO/FIXME count in codebase
**Severity**: Optional

TODO and FIXME comments are informal debt markers. Tracking them provides a signal of accumulated small debts.

**Check automatically**:

```bash
# Count TODOs and FIXMEs
grep -rE "TODO|FIXME|HACK|XXX" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py" --include="*.go" --include="*.rb" . 2>/dev/null | grep -v node_modules | grep -v vendor | wc -l

# Show sample with context
grep -rn "TODO\|FIXME" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.py" . 2>/dev/null | grep -v node_modules | head -15

# Check for eslint rule on TODOs
grep -riE "no-warning-comments|todo" .eslintrc* eslint.config* 2>/dev/null

# Look for TODO tracking in CI
grep -riE "todo|fixme" .github/workflows/ --include="*.yml" 2>/dev/null
```

**Ask user**:
- "Do you track TODO/FIXME count?"
- "Is there a policy?" (e.g., TODOs must have issue links, max age)
- "Are old TODOs ever cleaned up?"

**Patterns to watch for**:
| Pattern | Concern |
|---------|---------|
| `TODO` with no context | Unknown scope, never gets done |
| `FIXME` with no issue link | Not tracked, will be forgotten |
| `HACK` or `XXX` | Known bad code, technical debt |
| Ancient TODOs (years old) | Dead comments, noise |

**Pass criteria**:
- TODO count known or easily queryable
- TODOs have context (issue link, name, date)
- Count is stable or declining over time
- Old TODOs periodically reviewed

**Fail criteria**:
- No visibility into TODO count
- Hundreds of orphaned TODOs with no context
- Count growing unchecked
- TODOs from 3+ years ago still present

**Cross-reference with**:
- DEBT-001 (TODOs are informal debt; formal list is better)
- Section 28 (Code quality tools)

**Evidence to capture**:
- TODO/FIXME count
- Sample of oldest TODOs
- Whether policy exists
- ESLint rule configured

---

## Completing the Audit

After checking all items:

1. **Summarize results**:
   - DEBT-001: PASS/FAIL (Critical) - Explicit tech debt list maintained
   - DEBT-002: PASS/FAIL (Recommended) - Each debt item has required fields
   - DEBT-003: PASS/FAIL (Recommended) - Regular debt review with stale item cleanup
   - DEBT-004: PASS/FAIL (Recommended) - Allocate time for debt reduction
   - DEBT-005: PASS/FAIL (Optional) - Track debt paid down over time
   - DEBT-006: PASS/FAIL (Optional) - Code complexity trends
   - DEBT-007: PASS/FAIL (Recommended) - Dependency age/health
   - DEBT-008: PASS/FAIL (Optional) - TODO/FIXME count in codebase

2. **Cross-reference related sections**:
   - Section 8 (Testing & Code Metrics) - CRAP score
   - Section 2 (Dependencies & Code Quality) - Dependency management
   - Section 28 (Code Architecture) - SOLID principles, quality tools

3. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority (Critical items first)

4. **Common recommendations**:
   - If no debt list: Create dedicated label/board in your project tracker, start logging known debt
   - If no structure: Create a debt item template with description, impact, effort, priority fields
   - If no review: Schedule quarterly debt review, add to team calendar
   - If no allocation: Start with 10% of each sprint, protect it from feature pressure
   - If no complexity tracking: Enable ESLint complexity rule, consider SonarQube for visibility
   - If no dependency updates: Configure Dependabot or Renovate, address critical CVEs first
   - If high TODO count: Audit TODOs, create issues for real ones, delete stale ones

5. **Technical debt maturity assessment**:
   - **Level 1 - Invisible**: No tracking, debt is "known" but not documented
   - **Level 2 - Visible**: Debt list exists, but unstructured and rarely reviewed
   - **Level 3 - Structured**: Items have required fields, regular reviews happen
   - **Level 4 - Managed**: Protected allocation, debt actively reduced, trends tracked
   - **Level 5 - Optimized**: Metrics-driven, proactive identification, continuous improvement

6. **Record audit date** and auditor
