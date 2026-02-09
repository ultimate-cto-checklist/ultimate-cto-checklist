# Accessibility Audit Guide

This guide walks you through auditing a project's accessibility practices for user-facing applications.

## The Goal: Accessible by Default

Accessibility isn't a feature — it's a quality attribute. The goal is:
- **Standards-based** — Working toward a defined target (WCAG 2.1 AA)
- **Automated** — Catching issues in CI before they ship
- **Tested** — Manual validation for what automation misses
- **Tracked** — Known gaps visible and prioritized

Accessibility debt compounds like technical debt. This guide verifies the practices that prevent it.

**Cross-references**:
- Section 8 (Testing & Code Metrics) — Testing infrastructure
- Section 14 (Documentation) — Documentation practices
- Section 22 (Front-End Performance) — Lighthouse overlaps
- Section 40 (Technical Debt Tracking) — Same patterns for a11y debt

## Before You Start

1. **Confirm this applies** — This section is for user-facing applications (web apps, mobile apps, customer-facing sites). Internal tools, CLIs, and backend services can skip this audit.
2. **Identify the tech stack** — React, Vue, vanilla HTML affects which patterns to look for
3. **Check for compliance requirements** — Legal (ADA, EAA) or contractual obligations change severity levels

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## WCAG Compliance

### A11Y-001: WCAG 2.1 Level AA target documented
**Severity**: Recommended (Critical if legal/contractual requirement)

An explicit accessibility target gives the team something to measure against. Without it, "accessible enough" is undefined.

**Check automatically**:

```bash
# Look for accessibility documentation
grep -riE "wcag|accessibility|a11y" docs/ README.md CONTRIBUTING.md --include="*.md" 2>/dev/null

# Check for ADRs or decision docs about accessibility
find . -maxdepth 4 -type f -name "*.md" | xargs grep -l -iE "wcag|accessibility standard" 2>/dev/null
```

**Ask user**:
- "Does the project have a documented accessibility target?" (WCAG 2.0 AA, 2.1 AA, etc.)
- "Is this a compliance requirement (legal, contractual) or a quality goal?"

**Pass criteria**:
- Explicit target documented (even "we aim for WCAG 2.1 AA")
- Team is aware of the target

**Fail criteria**:
- No documented target
- Team doesn't know what they're aiming for

**Cross-reference with**: A11Y-005 through A11Y-008 (testing items verify against this target)

**Evidence to capture**:
- Documented target (or lack thereof)
- Whether compliance is required
- Location of documentation

---

### A11Y-002: Automated accessibility testing in CI
**Severity**: Recommended

Automated testing catches ~30-40% of accessibility issues before they ship. It's the minimum viable accessibility practice.

**Check automatically**:

```bash
# Check for a11y testing libraries in dependencies
grep -E "axe-core|@axe-core|jest-axe|cypress-axe|pa11y|lighthouse" package.json pnpm-lock.yaml 2>/dev/null

# Check for Lighthouse CI config
find . -maxdepth 3 -type f \( -name "lighthouserc*" -o -name ".lighthouserc*" \) 2>/dev/null

# Check CI for accessibility jobs
grep -riE "axe|lighthouse|a11y|accessibility" .github/workflows/ .circleci/ .gitlab-ci.yml 2>/dev/null

# Look for a11y test files
find . -maxdepth 5 -type f \( -name "*a11y*" -o -name "*accessibility*" \) \( -name "*.test.*" -o -name "*.spec.*" \) 2>/dev/null | grep -v node_modules
```

**If config exists**: Use subagent to run the tests and verify they execute.

**Pass criteria**:
- Accessibility testing tool installed (axe-core, pa11y, Lighthouse CI)
- Tests actually exist and run
- Integrated into CI (not just local)

**Fail criteria**:
- No a11y testing tools
- Tools installed but no tests written
- Tests exist but not in CI (manual only)

**Cross-reference with**:
- A11Y-001 (tests should verify against stated target)
- Section 8 (Testing & Code Metrics) — testing infrastructure

**Evidence to capture**:
- Testing tool(s) in use
- Number of a11y tests
- CI integration status
- Sample test output

---

### A11Y-003: Screen reader testing for critical paths
**Severity**: Recommended (B2C apps), Optional (internal tools)

Automated tools miss interaction and flow issues. Screen reader testing validates the real user experience.

**Check automatically**:

```bash
# Look for manual testing docs/checklists
grep -riE "screen reader|nvda|voiceover|jaws|narrator|manual.*test" docs/ --include="*.md" 2>/dev/null

# Check for testing checklists or QA docs
find . -maxdepth 4 -type f \( -name "*qa*" -o -name "*testing*" -o -name "*checklist*" \) -name "*.md" 2>/dev/null | xargs grep -l -iE "screen reader|a11y" 2>/dev/null
```

**Ask user**:
- "Are critical user paths tested with a screen reader?" (signup, checkout, core flows)
- "Who does this testing?" (dedicated QA, developers, external audit)
- "How often?" (every release, quarterly, once)
- "Which screen readers?" (VoiceOver, NVDA, JAWS)

**Pass criteria**:
- Critical paths have been tested with at least one screen reader
- Testing happens at some cadence (not just once at launch)
- Issues found are tracked and fixed

**Fail criteria**:
- Never tested with screen reader
- "We assume axe catches everything" (it doesn't)
- Tested once years ago, never since

**Evidence to capture**:
- Screen readers used
- Testing cadence
- Who performs testing
- Last test date

---

### A11Y-004: Keyboard navigation works
**Severity**: Recommended

Many users rely on keyboard-only navigation — not just screen reader users. Motor impairments, power users, and broken trackpads all depend on this.

**Check automatically**:

```bash
# Look for focus management patterns in code
grep -riE "tabindex|focus\(\)|onKeyDown|onKeyUp|keyboardEvent|aria-activedescendant" src/ --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" 2>/dev/null | head -20

# Check for focus-visible CSS (good sign)
grep -riE ":focus-visible|:focus" src/ --include="*.css" --include="*.scss" --include="*.tsx" 2>/dev/null | head -10

# Check for skip links (navigation accessibility)
grep -riE "skip.*main|skip.*nav|skip.*content" src/ --include="*.tsx" --include="*.jsx" --include="*.html" 2>/dev/null

# Look for keyboard testing in test files
grep -riE "keyboard|tab|focus|userEvent\.tab|fireEvent\.keyDown" --include="*.test.*" --include="*.spec.*" . 2>/dev/null | grep -v node_modules | head -10

# RED FLAG: outline:none without replacement (hides focus)
grep -riE "outline:\s*none|outline:\s*0" src/ --include="*.css" --include="*.scss" 2>/dev/null
```

**Ask user**:
- "Can you complete core flows using only keyboard?" (Tab, Enter, Escape, Arrow keys)
- "Is there a skip-to-content link?"
- "Do modals trap focus correctly?"

**Pass criteria**:
- Core flows work with keyboard only
- Focus is visible (not hidden with `outline: none`)
- Focus order is logical
- Skip link exists for content-heavy pages

**Fail criteria**:
- Can't complete critical flows without mouse
- Focus indicators removed globally
- Focus traps in modals don't work (or don't exist)
- Custom components ignore keyboard entirely

**Cross-reference with**: A11Y-008 (ARIA attributes help keyboard users)

**Evidence to capture**:
- Focus management patterns found
- Skip link present
- `outline: none` usage (red flag)
- Keyboard test coverage

---

## Testing

### A11Y-005: Accessibility audit before major releases
**Severity**: Recommended

Automated tests are continuous; audits are deep. Major releases should get a thorough review beyond what CI catches.

**Check automatically**:

```bash
# Look for release checklists or QA docs
find . -maxdepth 4 -type f \( -name "*release*" -o -name "*checklist*" -o -name "*qa*" \) -name "*.md" 2>/dev/null | xargs grep -l -iE "accessibility|a11y|wcag" 2>/dev/null

# Check for audit reports
find . -maxdepth 4 -type d -name "*audit*" 2>/dev/null
find . -maxdepth 4 -type f \( -name "*a11y*audit*" -o -name "*accessibility*report*" \) 2>/dev/null

# Look for PR templates with a11y checkbox
grep -riE "accessibility|a11y" .github/PULL_REQUEST_TEMPLATE* 2>/dev/null
```

**Ask user**:
- "Is there a pre-release accessibility check?" (manual audit, Lighthouse run, external review)
- "What triggers an audit?" (major releases only, every release, never)
- "Who performs it?" (developers, QA, external firm)
- "Are there blocking criteria?" (can't release with critical a11y issues)

**Pass criteria**:
- Accessibility is part of release process (documented or practiced)
- Major releases get some level of review
- Blocking issues prevent release

**Fail criteria**:
- No accessibility gate before releases
- "We'll fix it in the next release"
- Only happens when someone remembers

**Cross-reference with**:
- A11Y-002 (automated testing is minimum; audit is deeper)
- A11Y-010 (audit findings should be tracked)

**Evidence to capture**:
- Audit process documented
- Last audit date
- Who performs audits
- Blocking criteria

---

### A11Y-006: Color contrast checks
**Severity**: Recommended

Insufficient contrast affects users with low vision, color blindness, and everyone in bright sunlight. WCAG requires 4.5:1 for normal text.

**Check automatically**:

```bash
# Check for color/contrast in a11y tests
grep -riE "contrast|color.*ratio|toHaveNoViolations" --include="*.test.*" --include="*.spec.*" . 2>/dev/null | grep -v node_modules | head -10

# Look for design tokens or color system docs
find . -maxdepth 4 -type f \( -name "*colors*" -o -name "*tokens*" -o -name "*theme*" \) \( -name "*.ts" -o -name "*.js" -o -name "*.json" -o -name "*.css" \) 2>/dev/null | grep -v node_modules | head -10

# Check Lighthouse config for accessibility audits
grep -riE "accessibility|contrast" lighthouserc* .lighthouserc* 2>/dev/null

# Check for Storybook a11y addon (includes contrast)
grep -E "storybook.*a11y|addon-a11y" package.json 2>/dev/null
```

**Ask user**:
- "Are color choices validated for contrast?" (design phase, code review, automated)
- "What's the target ratio?" (4.5:1 for AA normal text, 3:1 for large text)
- "How are new colors added?" (must pass contrast check, designer approval)

**Pass criteria**:
- Contrast is checked somewhere in workflow (design, PR, CI)
- Color system exists with pre-validated colors
- axe-core or Lighthouse catches contrast violations in CI

**Fail criteria**:
- No contrast checking
- "Designer picked the colors" without validation
- Known contrast issues ignored

**Cross-reference with**: A11Y-002 (automated testing should catch contrast issues)

**Evidence to capture**:
- Contrast validation method
- Color system/tokens location
- Automated contrast testing in CI

---

### A11Y-007: Alt text for images
**Severity**: Recommended

Images without alt text are invisible to screen reader users. This is the most common and easily preventable accessibility issue.

**Check automatically**:

```bash
# Check for ESLint jsx-a11y plugin (enforces alt text)
grep -E "eslint-plugin-jsx-a11y|jsx-a11y" package.json 2>/dev/null

# Check ESLint config for alt-text rule
grep -riE "alt-text|jsx-a11y" .eslintrc* eslint.config* 2>/dev/null

# Sample img tags to see alt usage patterns
grep -riE "<img|<Image" src/ --include="*.tsx" --include="*.jsx" 2>/dev/null | head -15

# Check for empty alt (decorative images - valid if intentional)
grep -riE 'alt=""' src/ --include="*.tsx" --include="*.jsx" 2>/dev/null | head -5
```

**Ask user**:
- "Is there a linting rule enforcing alt text?" (jsx-a11y/alt-text)
- "How are decorative images handled?" (empty alt="" is correct)
- "Who writes alt text for content images?" (devs, content team, CMS)

**Pass criteria**:
- ESLint rule enforces alt attribute on images
- Meaningful alt text on content images
- Decorative images use `alt=""` (not missing alt)
- CMS/content workflow includes alt text field

**Fail criteria**:
- No linting rule, alt text is optional
- Images missing alt entirely (not even empty)
- Alt text is placeholder ("image", "photo", filename)

**Note**: `alt=""` for decorative images is correct — it tells screen readers to skip them. Missing `alt` entirely is the problem.

**Evidence to capture**:
- jsx-a11y plugin installed
- Alt text linting rule enabled
- Sample of alt text usage

---

### A11Y-008: Form labels and ARIA attributes
**Severity**: Recommended

Forms without proper labels are unusable for screen reader users. ARIA extends HTML semantics where needed.

**Check automatically**:

```bash
# Check for jsx-a11y ESLint rules (covers label, aria)
grep -riE "label-has-associated-control|aria-props|aria-role" .eslintrc* eslint.config* 2>/dev/null

# Look for form/input patterns with labels
grep -riE "<label|htmlFor|aria-label|aria-labelledby|aria-describedby" src/ --include="*.tsx" --include="*.jsx" 2>/dev/null | head -15

# Look for ARIA landmark roles
grep -riE 'role="(main|navigation|banner|contentinfo|search|complementary)"' src/ --include="*.tsx" --include="*.jsx" 2>/dev/null | head -5

# Check for common ARIA patterns (live regions, etc)
grep -riE "aria-live|aria-atomic|aria-expanded|aria-hidden|aria-current" src/ --include="*.tsx" --include="*.jsx" 2>/dev/null | head -10
```

**Ask user**:
- "Are form inputs associated with labels?" (htmlFor/id or wrapping label)
- "How are error messages announced?" (aria-describedby, aria-live)
- "Is ARIA used appropriately?" (prefer semantic HTML first)

**Pass criteria**:
- All form inputs have associated labels (visible or aria-label)
- Error messages connected to inputs (aria-describedby)
- ARIA used correctly (not overused or misused)
- jsx-a11y ESLint rules enabled

**Fail criteria**:
- Inputs without labels (placeholder doesn't count)
- ARIA misuse (wrong roles, aria-label on non-interactive elements)
- No connection between errors and inputs
- Form submission errors not announced

**Note**: ARIA is a supplement, not a replacement. Prefer semantic HTML (`<button>` not `<div role="button">`).

**Cross-reference with**: A11Y-004 (keyboard navigation relies on proper roles)

**Evidence to capture**:
- Label association patterns
- ARIA usage patterns
- jsx-a11y rules configured
- Error announcement method

---

## Documentation

### A11Y-009: Accessibility standards documented
**Severity**: Recommended

Developers need guidance on building accessibly. Without documentation, accessibility depends on individual knowledge.

**Check automatically**:

```bash
# Look for accessibility docs
find . -maxdepth 4 -type f \( -name "*accessibility*" -o -name "*a11y*" \) -name "*.md" 2>/dev/null | grep -v node_modules

# Check for contributing guidelines mentioning a11y
grep -riE "accessibility|a11y|wcag" CONTRIBUTING.md docs/contributing* 2>/dev/null

# Look for component documentation with a11y guidance
grep -riE "accessibility|keyboard|screen reader" docs/ --include="*.md" 2>/dev/null | head -10

# Check for Storybook with a11y docs
find . -maxdepth 5 -type f -name "*.stories.*" 2>/dev/null | head -3 | xargs grep -l "a11y\|accessibility" 2>/dev/null
```

**Ask user**:
- "Is there a documented accessibility standard for the project?"
- "Where do developers learn how to build accessibly?" (docs, training, code review)
- "Are there component-level a11y guidelines?" (how to use buttons, modals, forms)

**Pass criteria**:
- Accessibility guidelines exist (even lightweight)
- Developers know where to find guidance
- Standards align with stated target (A11Y-001)
- Updated as patterns evolve

**Fail criteria**:
- No documentation ("just make it accessible")
- Exists but outdated or ignored
- Only lives in one person's head

**Cross-reference with**:
- A11Y-001 (docs should reference the target standard)
- Section 14 (Documentation) — general docs practices

**Evidence to capture**:
- Documentation location
- Coverage (component-level, pattern library, etc.)
- Last updated date
- Discoverability

---

### A11Y-010: Known accessibility issues tracked
**Severity**: Recommended

Like technical debt, accessibility issues need explicit tracking. "We know about it" isn't good enough.

**Check automatically**:

```bash
# Check for accessibility label in GitHub
gh label list 2>/dev/null | grep -iE "a11y|accessibility"

# Count open accessibility issues
gh issue list --label "accessibility" --state open --json title --limit 100 2>/dev/null | jq length
gh issue list --label "a11y" --state open --json title --limit 100 2>/dev/null | jq length

# Sample open issues
gh issue list --label "accessibility" --state open --json title,createdAt --limit 5 2>/dev/null

# Look for known issues doc
find . -maxdepth 4 -type f \( -name "*known*issues*" -o -name "*a11y*backlog*" \) -name "*.md" 2>/dev/null
```

**Ask user**:
- "Where are accessibility issues tracked?" (GitHub label, Jira, dedicated board)
- "Is there visibility into the current a11y backlog?"
- "Are issues from audits captured and tracked?"

**Pass criteria**:
- Dedicated label or tag for a11y issues
- Known issues are logged (not just remembered)
- Issues from audits/testing get captured
- Backlog is visible to team

**Fail criteria**:
- No tracking ("we fix them when we find them")
- Issues found but never logged
- Scattered across random tickets with no way to find them

**Cross-reference with**:
- A11Y-005 (audit findings should become tracked issues)
- A11Y-011 (tracked issues feed the remediation plan)
- Section 40 (Technical Debt Tracking) — same principle, different domain

**Evidence to capture**:
- Tracking method (label, board, doc)
- Open issue count
- Sample of tracked issues
- Last activity date

---

### A11Y-011: Remediation plan for gaps
**Severity**: Recommended (Critical if compliance deadline exists)

A backlog without prioritization is a graveyard. Known gaps need a plan with ownership and timelines.

**Check automatically**:

```bash
# Look for remediation/roadmap docs
find . -maxdepth 4 -type f \( -name "*remediation*" -o -name "*roadmap*" -o -name "*a11y*plan*" \) -name "*.md" 2>/dev/null

grep -riE "accessibility.*roadmap|a11y.*plan|remediation|compliance.*timeline" docs/ --include="*.md" 2>/dev/null

# Check if accessibility issues have milestones/priorities
gh issue list --label "accessibility" --state open --json title,milestone,labels --limit 10 2>/dev/null

# Look for prioritization in issue labels
gh issue list --label "accessibility" --state open --json title,labels --limit 20 2>/dev/null | jq '.[].labels[].name' 2>/dev/null | sort | uniq -c
```

**Ask user**:
- "Is there a plan for addressing known a11y gaps?"
- "How are issues prioritized?" (severity, user impact, legal risk)
- "Is there a timeline?" (quarterly goals, release targets)
- "Who owns accessibility remediation?"

**Pass criteria**:
- Known gaps have a prioritized plan (not just a pile of issues)
- Critical issues have timelines
- Someone owns driving remediation
- Progress is tracked over time

**Fail criteria**:
- Backlog exists but no prioritization
- "We'll get to it" with no timeline
- No ownership (everyone's problem = no one's problem)
- Same issues open for years

**Cross-reference with**:
- A11Y-010 (plan is built from tracked issues)
- A11Y-001 (plan works toward stated target)
- Section 40 (Technical Debt Tracking) — DEBT-003/004 patterns apply here

**Evidence to capture**:
- Plan exists (doc, roadmap, milestones)
- Prioritization method
- Owner/DRI
- Timeline or target dates

---

## Completing the Audit

After checking all items:

1. **Confirm applicability** — If not user-facing, document as N/A

2. **Summarize results**:
   - A11Y-001: PASS/FAIL (Recommended) — WCAG 2.1 Level AA target documented
   - A11Y-002: PASS/FAIL (Recommended) — Automated accessibility testing in CI
   - A11Y-003: PASS/FAIL (Recommended) — Screen reader testing for critical paths
   - A11Y-004: PASS/FAIL (Recommended) — Keyboard navigation works
   - A11Y-005: PASS/FAIL (Recommended) — Accessibility audit before major releases
   - A11Y-006: PASS/FAIL (Recommended) — Color contrast checks
   - A11Y-007: PASS/FAIL (Recommended) — Alt text for images
   - A11Y-008: PASS/FAIL (Recommended) — Form labels and ARIA attributes
   - A11Y-009: PASS/FAIL (Recommended) — Accessibility standards documented
   - A11Y-010: PASS/FAIL (Recommended) — Known accessibility issues tracked
   - A11Y-011: PASS/FAIL (Recommended) — Remediation plan for gaps

3. **Cross-reference related sections**:
   - Section 8 (Testing & Code Metrics) — Testing infrastructure
   - Section 14 (Documentation) — Documentation practices
   - Section 22 (Front-End Performance) — Lighthouse overlaps
   - Section 40 (Technical Debt Tracking) — Debt tracking patterns

4. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority (Critical items first, legal requirements top)

5. **Common recommendations**:
   - If no target: Document WCAG 2.1 AA as the baseline target
   - If no automated testing: Add jest-axe or cypress-axe, integrate with CI
   - If no screen reader testing: Start with VoiceOver (Mac) or NVDA (Windows) on critical paths
   - If keyboard broken: Audit focus management, remove `outline: none`, add skip links
   - If no contrast checking: Enable axe-core contrast rules, validate color system
   - If no alt text enforcement: Add eslint-plugin-jsx-a11y with alt-text rule
   - If no form labels: Enable jsx-a11y label rules, audit forms
   - If no docs: Create lightweight a11y guidelines, add to contributing guide
   - If no tracking: Create accessibility label, start logging known issues
   - If no plan: Prioritize backlog, assign owner, set quarterly goals

6. **Accessibility maturity assessment**:
   - **Level 1 — Unaware**: No accessibility practices, unknown compliance status
   - **Level 2 — Reactive**: Fix issues when reported, no proactive testing
   - **Level 3 — Automated**: CI catches common issues, some manual testing
   - **Level 4 — Systematic**: Target defined, regular audits, tracked backlog
   - **Level 5 — Embedded**: Accessibility built into design/dev process, owned

7. **Record audit date** and auditor
