# Development Workflow Audit Guide

This guide walks you through auditing a project's development workflow, including PR processes, commit conventions, and merge strategies.

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

## PR Process

### FLOW-001: Feature branch workflow enforced
**Severity**: Critical

**Check automatically**:

1. **Sample recent merged PRs for branch naming**:
   ```bash
   # Get recent merged PRs with branch names
   gh pr list --state merged --limit 10 --json number,title,headRefName,body
   ```

2. **Check PR description quality**:
   ```bash
   # Look for empty descriptions
   gh pr list --state merged --limit 10 --json number,title,body --jq '.[] | select(.body == "" or .body == null) | {number, title}'
   ```

3. **Check for direct commits bypassing PRs**:
   ```bash
   # Look at recent commits on main - merge commits are OK, direct commits are not
   git log main --oneline --first-parent -20

   # Count merge commits vs direct commits
   git log main --oneline --first-parent -20 | grep -c "Merge pull request"
   ```

**Cross-reference with**:
- GIT-004 (Branch protection enabled)
- GIT-005 (No direct push to protected branches)
- GIT-006 (PRs require approval)

**Pass criteria**:
- Recent PRs originated from feature branches (naming like `feature/`, `fix/`, or descriptive names)
- PRs have meaningful descriptions (not empty, explains what/why)
- No evidence of direct commits bypassing PRs

**Fail criteria**:
- PRs with empty descriptions
- Evidence of direct pushes to main/staging
- No consistent branch naming

**Evidence to capture**:
- Sample of recent PR titles + branch names
- PR description quality (empty vs populated)
- Count of direct commits vs merge commits
- Any direct commits found (non-merge commits on main)

---

### FLOW-002: PRs reviewed by AI agent + human
**Severity**: Recommended

**Check automatically**:

1. **Check for AI review bot in recent PR comments**:
   ```bash
   # List recent merged PRs
   gh pr list --state merged --limit 5 --json number

   # For each PR, check reviewers and commenters
   gh pr view <number> --json reviews,comments --jq '{reviews: [.reviews[].author.login], comments: [.comments[].author.login]}'
   ```

2. **Look for common AI review bots**:
   ```bash
   # Check for bot reviewers (common patterns)
   gh pr view <number> --json reviews,comments --jq '.reviews[].author.login, .comments[].author.login' | grep -iE "coderabbit|copilot|sweep|sourcery|codeclimate|sonar"
   ```

3. **Check for GitHub App installations**:
   ```bash
   # List installed apps (requires admin access)
   gh api repos/{owner}/{repo}/installations 2>/dev/null
   ```

**Cross-reference with**:
- GIT-006 (PRs require approval) - covers the human approval requirement
- FLOW-001 (PR quality) - AI review complements human review

**Pass criteria**:
- AI review bot configured and actively commenting on PRs
- Human reviewers also present (not AI-only reviews)
- AI feedback appears to be addressed (not ignored)

**Fail criteria**:
- No AI review tooling
- AI reviews present but ignored
- Only AI reviews, no human involvement

**If no AI bot found, ask user**:
"No AI review bot detected. Are you using an AI code review tool (CodeRabbit, GitHub Copilot, etc.)? This is recommended but not critical."

**Evidence to capture**:
- AI review bot name (if found)
- Sample PR showing AI + human review
- Ratio of PRs with AI review participation

---

### FLOW-003: PRs tested on dev environment before merge
**Severity**: Critical

**Check automatically**:

1. **Check for deployment workflows**:
   ```bash
   # Look for preview/dev deployment in CI
   grep -riE "deploy|preview|dev.*environment|environment:" .github/workflows/*.yml 2>/dev/null
   ```

2. **List recent deployments with environment names**:
   ```bash
   # Get deployments and their refs
   gh api repos/{owner}/{repo}/deployments --jq '.[] | {environment, ref, created_at}' | head -30
   ```

3. **Check if PR branches get deployments**:
   ```bash
   # Look for deployments to non-main branches
   gh api repos/{owner}/{repo}/deployments --jq '[.[] | select(.ref | test("^(feature|fix|dependabot|refs/pull)") or (. != "main" and . != "staging" and . != "master"))] | length'
   ```

4. **For a specific merged PR, verify dev deployment before merge**:
   ```bash
   # Get PR merge time
   gh pr view <number> --json mergedAt,headRefName

   # Check for deployments of that branch before merge time
   gh api repos/{owner}/{repo}/deployments --jq '.[] | select(.ref == "<branch-name>") | {created_at, environment}'
   ```

**Cross-reference with**:
- ENV-001/002/003 (Environment tiers exist) - dev environment must exist
- FLOW-001 (Feature branch workflow) - PRs should be deployed before merge

**Pass criteria**:
- CI workflow deploys PR branches to dev environment
- Evidence of dev deployments for recent PRs before their merge timestamps
- Dev environment actually accessible for testing

**Fail criteria**:
- No dev deployment workflow
- PRs merged without prior dev deployment
- Dev deployments only happen after merge to staging

**If no PR deployments found, ask user**:
"No dev deployments found for PR branches. How does the team test changes before merging? Manual local testing only, or is there a preview environment process not captured in GitHub?"

**Evidence to capture**:
- Deployment workflow file (if found)
- Sample PR with dev deployment timestamp vs merge timestamp
- Dev environment URL pattern (if discoverable)

---

## Commit Conventions

### FLOW-004: Commit messages follow project conventions
**Severity**: Recommended

**Check automatically**:

1. **Check for commit convention documentation**:
   ```bash
   # Look for documented conventions
   grep -riE "commit.*message|conventional.*commit|commit.*format" README.md CONTRIBUTING.md CLAUDE.md docs/ 2>/dev/null
   ```

2. **Check for commitlint or enforcement tooling**:
   ```bash
   # Look for commitlint config
   ls -la commitlint.config.* .commitlintrc* 2>/dev/null

   # Check package.json for commit hooks
   grep -E "commitlint|husky|commit-msg|@commitlint" package.json 2>/dev/null
   ```

3. **Sample recent commit messages**:
   ```bash
   # Get recent commits
   git log --oneline -20

   # Check for conventional commit format (feat:, fix:, etc.)
   git log --oneline -50 | grep -cE "^[a-f0-9]+ (feat|fix|chore|docs|refactor|test|style|ci|build|perf)(\(.+\))?:"
   ```

4. **Check for poor quality messages**:
   ```bash
   # Look for vague/meaningless commits
   git log --oneline -50 | grep -iE "^[a-f0-9]+ (fix|update|wip|tmp|test|asdf|stuff|changes)$"
   ```

**Cross-reference with**:
- GIT-001 (Clone and run) - CLAUDE.md may document commit conventions
- TEST-002/003 (Commits include tests) - commit messages indicate fix vs feature

**Pass criteria**:
- Commit convention documented OR commitlint configured
- Recent commits follow a consistent pattern (conventional commits, or project-specific)
- Messages are descriptive (not just "fix" or "update")

**Fail criteria**:
- No documented convention and no enforcement
- Inconsistent commit message styles across team
- Many vague/meaningless messages ("fix", "wip", "asdf")

**If no convention found, ask user**:
"No commit message convention documented or enforced. Does the team follow a standard like Conventional Commits? This helps with changelog generation and understanding history."

**Evidence to capture**:
- Convention documented (location) or tooling (commitlint)
- Sample of recent commits showing format
- Consistency ratio (% following pattern out of last 50)
- Examples of poor commit messages (if any)

---

## Merge Strategy

### FLOW-005: Merge strategy preserves history
**Severity**: Critical

**Check automatically**:

1. **Check repo merge settings**:
   ```bash
   # Get allowed merge strategies
   gh api repos/{owner}/{repo} --jq '{allow_squash_merge, allow_merge_commit, allow_rebase_merge}'
   ```

2. **Sample recent merge commits**:
   ```bash
   # Check merge commits on main
   git log main --oneline --merges -10

   # Check merge commits on staging
   git log staging --oneline --merges -10 2>/dev/null
   ```

3. **Detect squash merges (single commit referencing PR)**:
   ```bash
   # Squash merges appear as single commits with (#123) reference but no merge commit
   git log main --oneline --no-merges -20 | grep -E "\(#[0-9]+\)$"
   ```

4. **Check staging→main relationship**:
   ```bash
   # See if branches are in sync or diverged
   git log main..staging --oneline 2>/dev/null | head -5
   git log staging..main --oneline 2>/dev/null | head -5
   ```

5. **Look for force-pushes (if reflog accessible)**:
   ```bash
   # Check reflog for forced updates
   git reflog show main --oneline -20 2>/dev/null | grep -i "forced"
   ```

**Cross-reference with**:
- GIT-004/005 (Branch protection) - protection rules may enforce merge strategy
- FLOW-001 (Feature branch workflow) - merges should come from PRs

**Pass criteria**:
- Regular merge commits enabled (allow_merge_commit: true)
- Squash merge disabled OR used sparingly
- Recent merges show merge commits with full history preserved
- No evidence of force-pushes to protected branches

**Fail criteria**:
- Squash-only merges (history lost)
- Rebase merges rewriting shared history
- Evidence of force-pushes after merge
- Git history shows orphaned/dangling commits

**If squash enabled, ask user**:
"Squash merge is enabled. Is this intentional? Squashing loses individual commit history from PRs. The recommended approach is regular merge to preserve history, with history cleanup done in the branch before merging."

**Evidence to capture**:
- Repo merge settings (which strategies allowed)
- Sample merge commits showing preserved history
- Count of squash merges vs regular merges
- Any evidence of force-pushes or history rewrites

---

### FLOW-006: Branch flow documented (feature → dev → staging → production)
**Severity**: Recommended

**Check automatically**:

1. **Check for branch strategy documentation**:
   ```bash
   # Look for flow documentation
   grep -riE "branch.*strategy|git.*flow|deployment.*flow|feature.*staging.*prod|workflow" \
     README.md CONTRIBUTING.md CLAUDE.md docs/ .github/ 2>/dev/null
   ```

2. **List active branches**:
   ```bash
   # Check what branches exist
   git branch -r | grep -E "origin/(main|master|staging|dev|develop|production)"
   ```

3. **Check CI for environment promotion logic**:
   ```bash
   # Look for deployment workflows with environment references
   grep -riE "staging|production|dev.*environment|promote|environment:" .github/workflows/*.yml 2>/dev/null
   ```

4. **Check for environment definitions**:
   ```bash
   # GitHub environments
   gh api repos/{owner}/{repo}/environments --jq '.environments[].name' 2>/dev/null
   ```

**Cross-reference with**:
- ENV-001/002/003 (Environment tiers) - environments must exist for the flow to work
- FLOW-003 (Dev testing before merge) - dev is part of the flow
- GIT-007 (Only main and staging branches) - validates branch structure

**Pass criteria**:
- Branch flow documented somewhere (README, CONTRIBUTING, CLAUDE.md)
- Actual branches match documented flow
- CI workflows reflect the promotion path

**Fail criteria**:
- No documented flow (team members may have different understanding)
- Documentation doesn't match actual practice
- Confusing or contradictory branch structure

**If not documented, ask user**:
"No branch flow documentation found. What is the intended path from feature branch to production? Document this so the team has a shared understanding."

**Evidence to capture**:
- Documentation location (if found)
- Actual branch structure (list of branches)
- GitHub environments defined
- CI workflow promotion steps
- Any discrepancies between docs and reality

---

## Completing the Audit

After checking all items:

1. **Summarize results**:
   - FLOW-001: PASS/FAIL (Critical)
   - FLOW-002: PASS/FAIL (Recommended)
   - FLOW-003: PASS/FAIL (Critical)
   - FLOW-004: PASS/FAIL (Recommended)
   - FLOW-005: PASS/FAIL (Critical)
   - FLOW-006: PASS/FAIL (Recommended)

2. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority

3. **Common recommendations**:
   - If PRs have empty descriptions: Add PR template with required sections
   - If no AI review: Consider CodeRabbit, GitHub Copilot, or similar
   - If no dev deployments: Set up preview environments (Vercel, Netlify, or custom)
   - If no commit convention: Add commitlint with husky pre-commit hook
   - If squash merges enabled: Disable squash, encourage branch cleanup before merge
   - If no flow documented: Add branching strategy to CONTRIBUTING.md

4. **Record audit date** and auditor
