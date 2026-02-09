# Documentation Audit Guide

This guide walks you through auditing a project's documentation, ensuring all features are documented, complex systems have dedicated explanations, and documentation stays current with the codebase.

## The Goal: Self-Explaining Systems

Code tells you what, documentation tells you why. Good documentation enables humans and AI agents to understand, debug, and extend systems without tribal knowledge or archaeology.

- **Accessible** — Feature documentation exists in-repo (preferred) or externally, readable by both humans and AI agents
- **Complete** — Complex systems (payments, fulfillment, admin, integrations) have dedicated prose beyond code comments
- **Current** — Documentation stays fresh; staleness signals are checked and addressed
- **In-repo first** — Auth-walled external docs have in-repo equivalents for AI accessibility

## Before You Start

1. Know the project's documentation locations (in-repo, Notion, GitBook, wiki)
2. Identify complex systems in the project (payments, fulfillment, admin, integrations)
3. Have git access to check file history

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## Feature Documentation

### DOC-001: Feature documentation exists (human + AI readable)
**Severity**: Recommended

**Check automatically**:

1. **Look for in-repo documentation (preferred)**:
```bash
# Check for common doc locations
ls -la docs/ README.md CLAUDE.md AGENTS.md ARCHITECTURE.md 2>/dev/null

# Find markdown files
find . -maxdepth 2 -name "*.md" -type f | head -20
```

2. **Check for API docs**:
```bash
# OpenAPI/Swagger
find . -name "openapi*.yaml" -o -name "openapi*.json" -o -name "swagger*"
```

3. **Check README for external doc links**:
```bash
grep -iE "documentation|docs|wiki|notion|gitbook|confluence" README.md
```

**Ask user**:
- Where is feature documentation located? (in-repo preferred, external acceptable)
- If external: Notion, GitBook, Confluence, wiki?
- Can AI agents access the external docs? (important for AI-readability)

**Pass criteria**:
- Documentation exists covering major features
- In-repo docs preferred; external acceptable if accessible
- Docs are structured enough for both humans and AI agents to understand

**Fail criteria**:
- No feature documentation anywhere
- Only setup instructions, no feature descriptions
- External docs exist but AI agents can't access them (auth-walled with no workaround)

**Evidence to capture**:
- Documentation location(s) - in-repo vs external
- List of documented features
- AI accessibility (can Claude read it?)

---

### DOC-002: Complex systems documented
**Severity**: Critical

**Check automatically**:

1. **Search for documentation of known complex areas**:
```bash
# Payment/billing docs
grep -riE "payment|billing|stripe|checkout" docs/ *.md 2>/dev/null | head -10

# Order fulfillment docs
grep -riE "fulfillment|order.?flow|shipping" docs/ *.md 2>/dev/null | head -10

# Admin feature docs
grep -riE "admin|back.?office|management" docs/ *.md 2>/dev/null | head -10
```

2. **Identify complex systems in codebase that need docs**:
```bash
# Find payment-related code
find . -type f \( -name "*.ts" -o -name "*.js" \) -exec grep -l -iE "stripe|paypal|payment|checkout" {} \; | head -5

# Find admin routes/controllers
find . -type f \( -name "*.ts" -o -name "*.js" \) -path "*/admin/*" | head -10
```

**Cross-reference with**:
- DOC-001 (general docs exist)
- TODO: Section 3 item ID (Auth system documented)
- TODO: Section 15 item ID (Admin features)

**Ask user**:
- What are the complex systems in this project? (e.g., payment gateways, order fulfillment, admin features, third-party integrations)
- Are these documented? Where?

**Pass criteria**:
- Each complex system has dedicated documentation
- Docs explain the flow, not just API reference
- Includes edge cases, error handling, integration points

**Fail criteria**:
- Complex system exists in code but no corresponding documentation
- Only code comments, no prose explanation
- Docs exist but are outdated (describe old flow)

**Evidence to capture**:
- List of complex systems identified
- Documentation status for each
- Gaps (complex code without docs)

---

### DOC-003: Documentation is current
**Severity**: Recommended

**Check automatically**:

1. **Check doc file freshness**:
```bash
# Last modified dates for docs (macOS)
find docs/ -name "*.md" -exec stat -f "%m %N" {} \; 2>/dev/null | sort -rn | head -10

# Linux:
find docs/ -name "*.md" -printf "%T@ %p\n" 2>/dev/null | sort -rn | head -10
```

2. **Look for staleness signals**:
```bash
# Find TODO/outdated markers in docs
grep -riE "TODO|FIXME|outdated|update.?this|needs.?update" docs/ *.md 2>/dev/null
```

3. **Spot-check: compare doc age to referenced file changes**:
```bash
# Get last commit date for a doc file
git log -1 --format="%ci" -- docs/payments.md

# Extract file paths mentioned in the doc
grep -oE '[a-zA-Z0-9_/]+\.(ts|js|py|rb|go)' docs/payments.md | sort -u

# Check if any referenced files changed AFTER the doc
git log -1 --format="%ci" -- src/payments/checkout.ts
```

If referenced source files have commits newer than the doc file, the doc may be stale.

4. **Automated staleness detection**:
```bash
# For each doc, find referenced files and compare dates
# Flag if source file changed after doc was last updated
```

**Ask user**:
- When were docs last reviewed/updated?
- Any known stale documentation?

**Pass criteria**:
- Docs modified within reasonable timeframe relative to code changes
- No obvious staleness markers (TODO, outdated)
- Referenced source files have not changed significantly since doc was last updated

**Fail criteria**:
- Docs untouched for 6+ months while referenced code actively changed
- Docs describe features/files that no longer exist
- Source files referenced in docs changed substantially after doc's last update

**Evidence to capture**:
- Last modified dates for key doc files
- Staleness markers found
- Spot-check results: docs vs referenced file commit dates

---

## Completing the Audit

After checking all items:

1. **Summarize results**:
   - DOC-001: PASS/FAIL (Recommended)
   - DOC-002: PASS/FAIL (Critical)
   - DOC-003: PASS/FAIL (Recommended)

2. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority

3. **Common recommendations**:
   - If no docs exist: Create `docs/` folder with feature documentation
   - If only README: Expand or add dedicated feature docs
   - If external-only: Consider mirroring key docs in-repo for AI access
   - If complex systems undocumented: Prioritize payment/auth/admin docs
   - If docs stale: Review and update docs for recently changed files
   - If staleness markers: Address TODOs/FIXMEs in documentation

4. **Record audit date** and auditor
