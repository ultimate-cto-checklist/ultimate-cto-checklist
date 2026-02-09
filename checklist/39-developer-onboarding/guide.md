# Developer Onboarding Audit Guide

This guide walks you through auditing a project's developer onboarding experience - documentation, access, and day-one productivity.

## The Goal: Day-One Productivity

A new developer should be able to make a meaningful contribution on their first day. This means:
- Clear onboarding path documented
- Access pre-arranged (not blocked waiting for approvals)
- Local development working quickly
- Enough context to understand the system

This guide verifies the supporting elements that make day-one productivity achievable.

**Cross-reference**: GIT-001 through GIT-003 cover clone-and-run experience. This section focuses on the broader onboarding context beyond local setup.

## Before You Start

1. **Identify recent hires** (if any) to gather feedback on actual onboarding experience
2. **Locate existing documentation** (README, wiki, Notion, internal docs)
3. **Understand team size** (smaller teams may have informal processes that work)

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## Onboarding Documentation

### DEV-001: Onboarding checklist documented
**Severity**: Critical

New developers need a clear path to follow. A checklist format is better than prose because it provides progress tracking and ensures nothing is missed.

**Check automatically**:

```bash
# Look for onboarding documentation
find . -maxdepth 4 -type f \( -name "*onboard*" -o -name "*new-dev*" -o -name "*getting-started*" -o -name "*setup*" \) -name "*.md" 2>/dev/null | grep -v node_modules

# Search for onboarding content in docs
grep -riE "onboarding|new (developer|engineer|hire)|getting started|first day" docs/ README.md CONTRIBUTING.md --include="*.md" 2>/dev/null
```

**Ask user**:
- "Where does a new dev start?" (Notion, README, wiki, onboarding doc)
- "Is it a checklist they can work through, or just prose?"
- "When was it last updated? By whom?"
- "Has a recent hire validated it works?"

**Pass criteria**:
- Documented onboarding guide exists (in repo or linked)
- Actionable checklist format (not just narrative)
- Updated within last 6 months OR after most recent hire
- Covers: access, local setup, first tasks, who to ask

**Fail criteria**:
- No onboarding doc ("we just pair with someone")
- Doc exists but outdated (references deprecated tools, wrong URLs)
- Prose-only with no clear steps
- Missing critical sections (access, setup, or context)

**Evidence to capture**:
- Location of onboarding doc
- Format (checklist vs prose)
- Last updated date
- Sections covered

---

### DEV-002: Access requirements documented and pre-defined
**Severity**: Critical

New developers shouldn't discover missing access mid-task. All required access should be documented and requestable before day one.

**Check automatically**:

```bash
# Look for access list documentation
grep -riE "access|accounts|permissions|provisioning" docs/ --include="*.md" 2>/dev/null | grep -iE "new|onboard|developer|engineer"

# Look for access checklist or matrix
find . -maxdepth 4 -type f \( -name "*access*" -o -name "*permissions*" -o -name "*accounts*" \) -name "*.md" 2>/dev/null | grep -v node_modules

# Check for tools commonly needing access
grep -riE "github|gitlab|slack|aws|gcp|azure|sentry|datadog|vercel|netlify|linear|jira|notion|figma|1password|bitwarden|lastpass" docs/ --include="*.md" 2>/dev/null | head -20
```

**Ask user**:
- "Is there a complete list of accounts/tools a new dev needs?"
- "Who requests access - new dev, manager, or automated?"
- "How long until a new dev has full access?" (hours vs days)
- "When did someone last discover they were missing access mid-task?"

**Common access categories to cover**:
| Category | Examples |
|----------|----------|
| Code | GitHub/GitLab, repo access levels |
| Cloud | AWS, GCP, Azure console access |
| Monitoring | Sentry, Datadog, LogRocket |
| Communication | Slack, email lists |
| Project management | Linear, Jira, Notion |
| Design | Figma, design system |
| Secrets | 1Password, Vault |
| Infrastructure | Vercel, Netlify, Heroku |

**Pass criteria**:
- Documented list of all required access (repos, tools, services, environments)
- Each item has clear owner or request process
- Full access achievable within first day
- Recently validated (no surprise missing access)

**Fail criteria**:
- No list ("they discover what they need as they go")
- List exists but incomplete or outdated
- Access takes 2+ days, blocking productivity
- New devs regularly discover missing access after day one

**Cross-reference with**:
- DEV-001 (access list should be part of onboarding checklist)
- DEV-007 (automation level for access provisioning)

**Evidence to capture**:
- Location of access list
- Tools/services covered (count and categories)
- Request process per category
- Typical time to full access

---

## Technical Documentation

### DEV-003: Architecture overview documented
**Severity**: Recommended

New developers need to understand how the system fits together before diving into code. An architecture doc provides the mental model.

**Check automatically**:

```bash
# Look for architecture docs
find . -maxdepth 4 -type f \( -name "*architect*" -o -name "*overview*" -o -name "*system*" -o -name "*design*" \) -name "*.md" 2>/dev/null | grep -v node_modules

# Search for architecture content
grep -riE "architecture|system (design|overview)|high.level|component" docs/ README.md --include="*.md" 2>/dev/null | head -10

# Check for diagrams
find . -maxdepth 4 -type f \( -name "*.mermaid" -o -name "*.puml" -o -name "*.drawio" \) 2>/dev/null | grep -v node_modules
ls -la docs/*diagram* docs/*architect* 2>/dev/null
```

**Ask user**:
- "Is there a document explaining how the system fits together?"
- "Does it include diagrams?" (boxes and arrows, sequence diagrams)
- "Would a new dev understand the major components after reading it?"

**Pass criteria**:
- Architecture doc exists (in repo or linked wiki/Notion)
- Covers major components and how they interact
- Diagram or visual representation included
- Understandable without prior context

**Fail criteria**:
- No architecture doc ("it's in people's heads")
- Doc exists but outdated (describes old system)
- Text-only, no visual representation
- Requires existing knowledge to understand

**Cross-reference with**:
- DEV-004 (architecture references key systems)
- DOC-001/DOC-002 (general documentation standards)

**Evidence to capture**:
- Location of architecture doc
- Last updated date
- Whether diagrams exist
- Components covered (frontend, backend, DB, queues, external services)

---

### DEV-004: Key systems documented
**Severity**: Recommended

Complex or critical systems (payments, auth, integrations) need dedicated documentation beyond architecture overview.

**Check automatically**:

```bash
# Look for system-specific documentation
find . -maxdepth 4 -type f -name "*.md" 2>/dev/null | xargs grep -liE "payment|billing|auth|authentication|order|fulfillment|subscription" 2>/dev/null | grep -v node_modules | head -10

# Check docs folder structure
ls -la docs/ 2>/dev/null

# Look for ADRs (Architecture Decision Records)
find . -maxdepth 4 -type d -name "*adr*" -o -name "*decision*" 2>/dev/null | grep -v node_modules

# Search for "how X works" style docs
grep -riE "how .* works|implementation|flow|process" docs/ --include="*.md" 2>/dev/null | head -10
```

**Ask user**:
- "What are the most complex or critical systems?" (payments, auth, integrations)
- "Is each one documented for someone new?"
- "Where would a dev learn how payments/auth/[X] works?"

**Pass criteria**:
- Each critical system has dedicated documentation
- Docs explain the flow, not just code location
- External integrations documented (Stripe, Auth0, etc.)
- New dev could understand without reading all the code

**Fail criteria**:
- Critical systems undocumented ("read the code")
- Docs exist but are stubs or outdated
- Only API reference, no conceptual explanation
- Tribal knowledge required for key flows

**Cross-reference with**:
- DEV-003 (architecture overview should reference key systems)
- DOC-002 (complex systems documentation)

**Evidence to capture**:
- List of critical systems identified
- Documentation status per system (exists, partial, missing)
- Location of docs
- Last updated dates

---

### DEV-005: Development workflow documented
**Severity**: Recommended

New developers need to know the team's conventions: how to branch, how to submit PRs, what reviews look like, how deployments work.

**Check automatically**:

```bash
# Look for contributing or workflow docs
find . -maxdepth 3 -type f \( -name "CONTRIBUTING*" -o -name "*workflow*" -o -name "*process*" -o -name "*conventions*" \) -name "*.md" 2>/dev/null | grep -v node_modules

# Search for workflow content
grep -riE "pull request|PR process|branch|commit|code review|merge|deploy" docs/ README.md CONTRIBUTING.md --include="*.md" 2>/dev/null | head -15

# Check for PR templates
ls -la .github/PULL_REQUEST_TEMPLATE* .github/pull_request_template* 2>/dev/null
```

**Ask user**:
- "Is the development workflow documented?" (branching, PRs, reviews, deploys)
- "Would a new dev know how to submit their first PR correctly?"
- "Are conventions documented?" (commit messages, branch naming)

**Pass criteria**:
- Workflow doc exists (CONTRIBUTING.md or equivalent)
- Covers: branching strategy, PR process, review expectations
- Commit message conventions documented
- Deploy process explained (or linked)

**Fail criteria**:
- No workflow doc ("just follow what others do")
- Doc exists but incomplete (branching yes, reviews no)
- Contradicts actual practice
- New dev would need to ask about basics

**Cross-reference with**:
- Section 9 (Development Workflow - FLOW items)
- GIT-004/005/006 (branch protection, strategy)

**Evidence to capture**:
- Location of workflow doc
- Topics covered (branching, PRs, reviews, commits, deploys)
- Whether PR template exists
- Alignment with actual practice

---

## Team & Support

### DEV-006: Team contacts and ownership documented
**Severity**: Optional

New developers should know who to ask for help with different areas. This becomes more important as team size grows.

**Check automatically**:

```bash
# Look for team or contact documentation
find . -maxdepth 4 -type f \( -name "*team*" -o -name "*contact*" -o -name "*owner*" -o -name "*who*" \) -name "*.md" 2>/dev/null | grep -v node_modules

# Search for ownership content
grep -riE "contact|owner|ask|responsible|maintainer|point of contact|slack|team" docs/ README.md --include="*.md" 2>/dev/null | head -10

# Check for CODEOWNERS
ls -la .github/CODEOWNERS CODEOWNERS 2>/dev/null

# Look for on-call or escalation docs
grep -riE "on.call|escalat|support|help" docs/ --include="*.md" 2>/dev/null | head -5
```

**Ask user**:
- "Does a new dev know who to ask for help with different areas?"
- "Is there a CODEOWNERS file or equivalent?"
- "Are team/area owners documented somewhere?"

**Pass criteria**:
- Contact/ownership info exists (doc, CODEOWNERS, or team page)
- Covers key areas: frontend, backend, infra, key systems
- New dev knows where to get help without asking around

**Fail criteria**:
- No ownership documentation
- "Just ask in Slack" with no guidance on who/where
- CODEOWNERS exists but only for PR routing, not discoverable for questions

**Note**: Small teams where everyone knows everyone may not need formal ownership docs. This becomes more important at 5+ engineers.

**Evidence to capture**:
- Location of ownership info
- Format (CODEOWNERS, doc, wiki, Slack channel list)
- Areas covered
- Accessibility for new devs

---

## Access & Tooling

### DEV-007: Access provisioning automated
**Severity**: Optional

Automation reduces onboarding friction and ensures consistency. This is a maturity indicator, not a baseline requirement.

**Check automatically**:

```bash
# Look for provisioning scripts or IaC
find . -maxdepth 4 -type f \( -name "*provision*" -o -name "*onboard*" -o -name "*access*" \) \( -name "*.sh" -o -name "*.tf" -o -name "*.py" \) 2>/dev/null | grep -v node_modules

# Check for identity provider or SSO references
grep -riE "okta|auth0|google workspace|azure ad|onelogin|jumpcloud|sso|saml|scim" docs/ --include="*.md" 2>/dev/null

# Look for Terraform IAM or access management
grep -riE "iam|aws_iam|google_project_iam|azurerm.*role" terraform/ infra/ --include="*.tf" 2>/dev/null | head -10
```

**Ask user**:
- "How is access granted today?" (manual, tickets, automated)
- "Is there SSO/identity provider integration?" (Okta, Google Workspace, etc.)
- "Any SCIM provisioning for SaaS tools?"
- "How long does full access take?"

**Access provisioning maturity**:
| Level | Description |
|-------|-------------|
| 1 - Manual | Individual requests per tool, takes days |
| 2 - Documented | Checklist exists, still manual, faster |
| 3 - Partial automation | SSO for some tools, scripts for cloud |
| 4 - Mostly automated | SSO + SCIM, minimal manual steps |
| 5 - Fully automated | Role-based, self-service, instant |

**Pass criteria**:
- Some automation exists (SSO, scripts, SCIM)
- Manual steps documented and minimized
- Full access achievable same-day

**Fail criteria**:
- Fully manual process with no automation
- Takes 2+ days due to access bottlenecks
- No awareness of automation options

**Cross-reference with**:
- DEV-002 (automation builds on documented access list)

**Evidence to capture**:
- Provisioning method per tool category
- SSO/identity provider in use
- Automation level (1-5 scale)
- Typical time to full access

---

### DEV-008: IDE/editor setup documented
**Severity**: Optional

Shared IDE configuration ensures consistent developer experience (formatting, linting, extensions).

**Check automatically**:

```bash
# Look for IDE config files in repo
ls -la .vscode/ .idea/ .editorconfig 2>/dev/null

# Check for recommended extensions
cat .vscode/extensions.json 2>/dev/null

# Look for IDE setup docs
grep -riE "vscode|vs code|intellij|ide|editor|extension|plugin" docs/ README.md --include="*.md" 2>/dev/null | head -10

# Check for workspace settings
ls -la *.code-workspace 2>/dev/null
```

**Ask user**:
- "Is there a recommended IDE/editor?"
- "Are settings/extensions shared in the repo?"
- "Would a new dev get the same linting/formatting experience as the team?"

**Pass criteria**:
- Recommended IDE documented OR shared config exists
- Extensions/plugins listed (for linting, formatting, language support)
- Settings ensure consistent experience (format on save, lint rules)

**Fail criteria**:
- No IDE guidance
- Team uses shared config but it's not in repo/docs
- Inconsistent formatting across team due to different setups

**Note**: Some teams intentionally stay editor-agnostic. This is acceptable if linting/formatting is enforced at CI level regardless of editor.

**Cross-reference with**:
- GIT-019 (no local engineer settings committed - but *shared* settings are OK)

**Evidence to capture**:
- IDE config files present (.vscode/, .editorconfig)
- Extensions documented or in extensions.json
- Whether settings are shared or individual

---

### DEV-009: Troubleshooting FAQ documented
**Severity**: Optional

Common issues and gotchas should be documented so new developers don't hit the same problems repeatedly.

**Check automatically**:

```bash
# Look for troubleshooting or FAQ docs
find . -maxdepth 4 -type f \( -name "*troubleshoot*" -o -name "*faq*" -o -name "*problem*" -o -name "*issue*" -o -name "*debug*" \) -name "*.md" 2>/dev/null | grep -v node_modules

# Search for troubleshooting content
grep -riE "troubleshoot|common (issue|problem|error)|faq|known issue|if you see|fix for" docs/ README.md --include="*.md" 2>/dev/null | head -10

# Check README for troubleshooting section
grep -iE "^#+ *(troubleshoot|faq|common issue|known issue|problem)" README.md 2>/dev/null
```

**Ask user**:
- "Are common setup issues documented somewhere?"
- "What trips up new devs most often?" (port conflicts, env issues, version mismatches)
- "Is there a place to add new gotchas when discovered?"

**Common troubleshooting topics**:
- Port conflicts (something already running on 3000)
- Node/Python version mismatches
- Missing environment variables
- Docker issues (disk space, network, permissions)
- Database connection failures
- Dependency installation failures
- Platform-specific issues (Mac vs Linux)

**Pass criteria**:
- Troubleshooting section or FAQ exists
- Covers common issues (port conflicts, dependency issues, env problems)
- Actively maintained (new issues added when discovered)

**Fail criteria**:
- No troubleshooting docs
- Doc exists but stale (references old issues, misses current ones)
- New devs hit same issues repeatedly without documentation

**Cross-reference with**:
- DEV-001 (onboarding doc should link to troubleshooting)
- GIT-001/003 (setup failures should feed into FAQ)

**Evidence to capture**:
- Location of troubleshooting docs
- Number of issues documented
- Last updated date
- Whether actively maintained

---

## Completing the Audit

After checking all items:

1. **Summarize results**:
   - DEV-001: PASS/FAIL (Critical) - Onboarding checklist documented
   - DEV-002: PASS/FAIL (Critical) - Access requirements documented
   - DEV-003: PASS/FAIL (Recommended) - Architecture overview documented
   - DEV-004: PASS/FAIL (Recommended) - Key systems documented
   - DEV-005: PASS/FAIL (Recommended) - Development workflow documented
   - DEV-006: PASS/FAIL (Optional) - Team contacts and ownership documented
   - DEV-007: PASS/FAIL (Optional) - Access provisioning automated
   - DEV-008: PASS/FAIL (Optional) - IDE/editor setup documented
   - DEV-009: PASS/FAIL (Optional) - Troubleshooting FAQ documented

2. **Validate with recent hire** (if available):
   - Ask them to review the checklist against their actual experience
   - Identify gaps between documentation and reality
   - Capture improvement suggestions

3. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority (Critical items first)

4. **Common recommendations**:
   - If no onboarding doc: Create ONBOARDING.md with checklist format, include access + setup + first tasks
   - If no access list: Document every tool/service a dev needs, assign owners, track request process
   - If no architecture doc: Create ARCHITECTURE.md with diagrams (Mermaid for in-repo, or link to external)
   - If no workflow doc: Create CONTRIBUTING.md covering branches, PRs, reviews, deploys
   - If no troubleshooting: Add "Troubleshooting" section to README, seed with known issues

5. **Onboarding maturity assessment**:
   - **Level 1 - Ad-hoc**: No docs, pair with someone, figure it out
   - **Level 2 - Documented**: Onboarding doc exists, mostly manual process
   - **Level 3 - Structured**: Checklist format, access pre-defined, architecture clear
   - **Level 4 - Streamlined**: Automated access, comprehensive docs, validated recently
   - **Level 5 - Optimized**: Self-service, feedback loop, continuous improvement

6. **Record audit date** and auditor
