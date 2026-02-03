# CTO Workspace Audit Guide

This guide walks you through auditing a project's CTO workspace tooling, specifically the ability to get AI-assisted project briefings on demand.

## Before You Start

1. Ensure `gh` CLI is authenticated for the repository
2. Understand the project's deployment workflow (from Section 10)
3. Check if the project uses Claude skills or has a CLAUDE.md

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## Project Briefings

### CTO-001: AI-assisted project briefings
**Severity**: Recommended

**Check automatically**:

1. **Look for briefing skill/command**:
```bash
# Check for Claude skill for briefings
find . -type f -name "*.md" -exec grep -l -iE "brief|status|what.?happened|check.?in" {} \; | head -10

# Look in skills folder
ls -la skills/ .claude/skills/ 2>/dev/null

# Check CLAUDE.md for briefing instructions
grep -iE "brief|status|summary|check.?in" CLAUDE.md 2>/dev/null
```

2. **Check for required data sources**:
```bash
# Verify gh CLI is available (needed for PR/deployment data)
which gh

# Test access to key data sources
gh pr list --limit 5 --state all 2>/dev/null
gh run list --limit 5 2>/dev/null
git log --oneline -10
```

3. **If skill exists, test it**:
   - Invoke the briefing skill
   - Verify output includes: recent commits, PRs (open/merged), deployments
   - Check it synthesizes (not just raw data dumps)

**Prescriptive requirements**:

The briefing mechanism **must**:
- Be a Claude skill (in `skills/` or `.claude/skills/`) or documented in CLAUDE.md
- Query these sources:
  - `git log` - recent commits with authors
  - `gh pr list` - open and recently merged PRs
  - `gh run list` - recent workflow runs (deployments)
- Synthesize into a brief that answers: "What happened since [date]?"
- Be invokable on-demand (not scheduled-only)

**Cross-reference with**:
- DEPLOY-001 (deployment workflow - source for deployment status)
- FLOW-001 (feature branch workflow - source for PR activity)

**Pass criteria**:
- Claude skill or CLAUDE.md section exists for project briefings
- Skill queries git, PRs, and deployments
- Output is synthesized brief (not raw command output)
- CTO can ask "what happened this week?" and get useful answer

**Fail criteria**:
- No documented briefing mechanism
- CTO must manually run multiple commands and synthesize
- Skill exists but only covers partial data (e.g., commits but not PRs)

**Evidence to capture**:
- Location of briefing skill/documentation
- Data sources it covers (commits, PRs, deployments, issues)
- Sample invocation and output

---

## Completing the Audit

After checking all items:

1. **Summarize results**:
   - CTO-001: PASS/FAIL (Recommended)

2. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority

3. **Common recommendations**:
   - If no briefing skill: Create a Claude skill that queries git log, gh pr list, and gh run list
   - If partial coverage: Extend skill to cover missing data sources
   - If raw output only: Update skill to synthesize information into readable brief

4. **Record audit date** and auditor
