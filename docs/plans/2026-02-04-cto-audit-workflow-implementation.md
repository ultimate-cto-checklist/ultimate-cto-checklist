# CTO Audit Workflow - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Claude Code-powered audit system where CTOs can interactively work through checklist items with context-aware automation.

**Architecture:** Skills in the checklist repo provide `/audit-*` commands. CTOs create a separate workspace repo with this as a submodule. Claude reads org/project config, runs verification commands, and writes audit results as markdown files.

**Tech Stack:** Claude Code skills (SKILL.md), YAML configs, Markdown with YAML frontmatter, Next.js dashboard extensions.

**Design Document:** `docs/plans/2026-02-04-cto-audit-workflow-design.md`

---

## Phase 1: Scope Metadata

Add `default_scope` to all 41 section items.yaml files. Use subagents (one per batch) to avoid context waste.

### Task 1.1: Define scope mapping

**Files:**
- Create: `docs/scope-mapping.yaml`

**Step 1: Create the scope mapping reference**

```yaml
# Defines which scope each section defaults to
# Scopes: org (audit once), project (per-project), both (org policy + project compliance)

sections:
  # Infrastructure & Setup - per-project
  01-git-repo-setup: project
  02-dependencies: project
  03-authentication-endpoints: project
  04-environments: project

  # Database & Data - per-project
  05-database-connections: project
  06-resilience: project

  # Monitoring & Health - per-project
  07-health-endpoints: project
  08-testing-code-metrics: project
  09-development-workflow: project
  10-deployments: project

  # Access & Security - mixed
  11-access-control: both
  12-monitoring: project
  13-infrastructure-security: both

  # Documentation & Admin - org level
  14-documentation: project
  15-admin-features: org
  16-cto-workspace: org

  # Performance & Analytics - per-project
  17-performance-monitoring: project
  18-analytics: project
  19-error-reporting: project
  20-email-infrastructure: org

  # Frontend & Caching - per-project
  21-caching: project
  22-frontend-performance: project
  23-client-side-security: project

  # Data & Security - mixed
  24-data-retention: both
  25-intrusion-detection: org

  # HA & Database - mixed
  26-high-availability-backups: both
  27-database-tooling: project

  # Code & Secrets - per-project
  28-code-architecture: project
  29-secrets-management: both

  # API & Security - per-project
  30-rate-limiting: project
  31-api-design: project
  32-content-security-policy: project

  # Operations - mixed
  33-feature-flags: project
  34-rollback-recovery: project
  35-incident-response: org
  36-load-stress-testing: project
  37-gdpr-privacy-compliance: org
  38-cost-monitoring-budget-alerts: org

  # Team & Development - org level
  39-developer-onboarding: org
  40-technical-debt-tracking: org
  41-accessibility: project
```

**Step 2: Commit**

```bash
git add docs/scope-mapping.yaml
git commit -m "docs: add scope mapping for all checklist sections"
```

---

### Task 1.2: Add scope to sections 01-10 (project scope)

**Files:**
- Modify: `checklist/01-git-repo-setup/items.yaml`
- Modify: `checklist/02-dependencies/items.yaml`
- Modify: `checklist/03-authentication-endpoints/items.yaml`
- Modify: `checklist/04-environments/items.yaml`
- Modify: `checklist/05-database-connections/items.yaml`
- Modify: `checklist/06-resilience/items.yaml`
- Modify: `checklist/07-health-endpoints/items.yaml`
- Modify: `checklist/08-testing-code-metrics/items.yaml`
- Modify: `checklist/09-development-workflow/items.yaml`
- Modify: `checklist/10-deployments/items.yaml`

**Step 1: Use subagent to add scope field**

Spawn a subagent with this prompt:

```
Add `default_scope: project` to these 10 items.yaml files.

For files with object-style section header:
- Add `default_scope: project` as a new field inside the section object

For files with string-style section header:
- Add `default_scope: project` as a top-level field after description

Files to modify:
- checklist/01-git-repo-setup/items.yaml
- checklist/02-dependencies/items.yaml
- checklist/03-authentication-endpoints/items.yaml
- checklist/04-environments/items.yaml
- checklist/05-database-connections/items.yaml
- checklist/06-resilience/items.yaml
- checklist/07-health-endpoints/items.yaml
- checklist/08-testing-code-metrics/items.yaml
- checklist/09-development-workflow/items.yaml
- checklist/10-deployments/items.yaml

Read each file first to determine which format it uses, then add the field appropriately.
```

**Step 2: Verify changes**

```bash
grep -l "default_scope" checklist/0*/items.yaml checklist/10-*/items.yaml | wc -l
```
Expected: 10

**Step 3: Commit**

```bash
git add checklist/0*/items.yaml checklist/10-*/items.yaml
git commit -m "chore: add default_scope to sections 01-10"
```

---

### Task 1.3: Add scope to sections 11-20 (mixed scopes)

**Files:**
- Modify: `checklist/11-access-control/items.yaml` (both)
- Modify: `checklist/12-monitoring/items.yaml` (project)
- Modify: `checklist/13-infrastructure-security/items.yaml` (both)
- Modify: `checklist/14-documentation/items.yaml` (project)
- Modify: `checklist/15-admin-features/items.yaml` (org)
- Modify: `checklist/16-cto-workspace/items.yaml` (org)
- Modify: `checklist/17-performance-monitoring/items.yaml` (project)
- Modify: `checklist/18-analytics/items.yaml` (project)
- Modify: `checklist/19-error-reporting/items.yaml` (project)
- Modify: `checklist/20-email-infrastructure/items.yaml` (org)

**Step 1: Use subagent to add scope field**

Spawn a subagent with this prompt:

```
Add default_scope to these items.yaml files with the specified values:

- checklist/11-access-control/items.yaml → default_scope: both
- checklist/12-monitoring/items.yaml → default_scope: project
- checklist/13-infrastructure-security/items.yaml → default_scope: both
- checklist/14-documentation/items.yaml → default_scope: project
- checklist/15-admin-features/items.yaml → default_scope: org
- checklist/16-cto-workspace/items.yaml → default_scope: org
- checklist/17-performance-monitoring/items.yaml → default_scope: project
- checklist/18-analytics/items.yaml → default_scope: project
- checklist/19-error-reporting/items.yaml → default_scope: project
- checklist/20-email-infrastructure/items.yaml → default_scope: org

Read each file first to determine format (object vs string section header), then add appropriately.
```

**Step 2: Verify**

```bash
grep "default_scope" checklist/1*/items.yaml checklist/20-*/items.yaml
```

**Step 3: Commit**

```bash
git add checklist/1*/items.yaml checklist/20-*/items.yaml
git commit -m "chore: add default_scope to sections 11-20"
```

---

### Task 1.4: Add scope to sections 21-30 (mixed scopes)

**Files:**
- Modify: `checklist/21-caching/items.yaml` (project)
- Modify: `checklist/22-frontend-performance/items.yaml` (project)
- Modify: `checklist/23-client-side-security/items.yaml` (project)
- Modify: `checklist/24-data-retention/items.yaml` (both)
- Modify: `checklist/25-intrusion-detection/items.yaml` (org)
- Modify: `checklist/26-high-availability-backups/items.yaml` (both)
- Modify: `checklist/27-database-tooling/items.yaml` (project)
- Modify: `checklist/28-code-architecture/items.yaml` (project)
- Modify: `checklist/29-secrets-management/items.yaml` (both)
- Modify: `checklist/30-rate-limiting/items.yaml` (project)

**Step 1: Use subagent**

```
Add default_scope to these items.yaml files:

- checklist/21-caching/items.yaml → default_scope: project
- checklist/22-frontend-performance/items.yaml → default_scope: project
- checklist/23-client-side-security/items.yaml → default_scope: project
- checklist/24-data-retention/items.yaml → default_scope: both
- checklist/25-intrusion-detection/items.yaml → default_scope: org
- checklist/26-high-availability-backups/items.yaml → default_scope: both
- checklist/27-database-tooling/items.yaml → default_scope: project
- checklist/28-code-architecture/items.yaml → default_scope: project
- checklist/29-secrets-management/items.yaml → default_scope: both
- checklist/30-rate-limiting/items.yaml → default_scope: project

Read each file first to determine format, then add appropriately.
```

**Step 2: Verify and commit**

```bash
grep "default_scope" checklist/2*/items.yaml checklist/30-*/items.yaml
git add checklist/2*/items.yaml checklist/30-*/items.yaml
git commit -m "chore: add default_scope to sections 21-30"
```

---

### Task 1.5: Add scope to sections 31-41 (mixed scopes)

**Files:**
- Modify: `checklist/31-api-design/items.yaml` (project)
- Modify: `checklist/32-content-security-policy/items.yaml` (project)
- Modify: `checklist/33-feature-flags/items.yaml` (project)
- Modify: `checklist/34-rollback-recovery/items.yaml` (project)
- Modify: `checklist/35-incident-response/items.yaml` (org)
- Modify: `checklist/36-load-stress-testing/items.yaml` (project)
- Modify: `checklist/37-gdpr-privacy-compliance/items.yaml` (org)
- Modify: `checklist/38-cost-monitoring-budget-alerts/items.yaml` (org)
- Modify: `checklist/39-developer-onboarding/items.yaml` (org)
- Modify: `checklist/40-technical-debt-tracking/items.yaml` (org)
- Modify: `checklist/41-accessibility/items.yaml` (project)

**Step 1: Use subagent**

```
Add default_scope to these items.yaml files:

- checklist/31-api-design/items.yaml → default_scope: project
- checklist/32-content-security-policy/items.yaml → default_scope: project
- checklist/33-feature-flags/items.yaml → default_scope: project
- checklist/34-rollback-recovery/items.yaml → default_scope: project
- checklist/35-incident-response/items.yaml → default_scope: org
- checklist/36-load-stress-testing/items.yaml → default_scope: project
- checklist/37-gdpr-privacy-compliance/items.yaml → default_scope: org
- checklist/38-cost-monitoring-budget-alerts/items.yaml → default_scope: org
- checklist/39-developer-onboarding/items.yaml → default_scope: org
- checklist/40-technical-debt-tracking/items.yaml → default_scope: org
- checklist/41-accessibility/items.yaml → default_scope: project

Read each file first to determine format, then add appropriately.
```

**Step 2: Verify all 41 sections have scope**

```bash
find checklist -name "items.yaml" -exec grep -l "default_scope" {} \; | wc -l
```
Expected: 41

**Step 3: Commit**

```bash
git add checklist/3*/items.yaml checklist/4*/items.yaml
git commit -m "chore: add default_scope to sections 31-41"
```

---

### Task 1.6: Update dashboard to read scope

**Files:**
- Modify: `dashboard/lib/checklist.ts`

**Step 1: Read current file**

Read `dashboard/lib/checklist.ts` to understand current structure.

**Step 2: Add scope to types**

Add to the interface definitions:

```typescript
// Add to ChecklistItem interface
export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "recommended";
  category: string;
  scope?: "org" | "project" | "both";  // NEW
}

// Add to Section interface
export interface Section {
  slug: string;
  id: string;
  name: string;
  description: string;
  defaultScope: "org" | "project" | "both";  // NEW
  items: ChecklistItem[];
  guide: string;
}

// Add to SectionSummary interface
export interface SectionSummary {
  slug: string;
  id: string;
  name: string;
  description: string;
  defaultScope: "org" | "project" | "both";  // NEW
  itemCount: number;
  criticalCount: number;
}
```

**Step 3: Update parsing logic**

In the `getSection` function, add scope extraction:

```typescript
// After extracting section metadata
const defaultScope = (typeof data.section === 'object'
  ? data.section.default_scope
  : data.default_scope) || 'project';

// When mapping items
const items: ChecklistItem[] = data.items.map((item: any) => ({
  id: item.id,
  title: item.title,
  description: item.description || item.summary || "",
  severity: item.severity,
  category: item.category || "uncategorized",
  scope: item.scope || defaultScope,  // Item scope or section default
}));
```

**Step 4: Run type check**

```bash
cd dashboard && pnpm tsc --noEmit
```
Expected: No errors

**Step 5: Commit**

```bash
git add dashboard/lib/checklist.ts
git commit -m "feat(dashboard): add scope field support to checklist parsing"
```

---

## Phase 2: Core Skills

Create the skills directory structure and implement setup skills.

### Task 2.1: Create skills directory structure

**Files:**
- Create: `skills/audit-tutorial/SKILL.md`
- Create: `skills/audit-init/SKILL.md`
- Create: `skills/audit-add-project/SKILL.md`
- Create: `skills/README.md`

**Step 1: Create directory structure**

```bash
mkdir -p skills/audit-tutorial skills/audit-init skills/audit-add-project
```

**Step 2: Create README**

```markdown
# CTO Audit Skills

Skills for running structured audits against the Ultimate CTO Checklist.

## Setup Skills

| Skill | Purpose |
|-------|---------|
| `/audit-tutorial` | First-time onboarding walkthrough |
| `/audit-init` | Configure organization context |
| `/audit-add-project` | Add a project to audit |

## Audit Execution Skills

| Skill | Purpose |
|-------|---------|
| `/audit-start` | Begin a new audit |
| `/audit-continue` | Resume in-progress audit |
| `/audit-item` | Jump to specific item |
| `/audit-skip` | Skip item with reason |
| `/audit-section` | Focus on one section |

## Reporting Skills

| Skill | Purpose |
|-------|---------|
| `/audit-status` | Show audit progress |
| `/audit-summary` | Generate audit report |
| `/audit-history` | View past audits |
| `/audit-diff` | Compare two audits |
| `/audit-waiver` | Create a waiver |

## Usage

These skills are designed for use in a CTO's audit workspace where this repo is a submodule:

```
my-company-audits/
├── checklist/          ← this repo as submodule
├── org.yaml
├── projects/
└── audits/
```

Run `/audit-tutorial` to get started.
```

**Step 3: Commit structure**

```bash
git add skills/
git commit -m "chore: create skills directory structure"
```

---

### Task 2.2: Write audit-tutorial skill

**Files:**
- Create: `skills/audit-tutorial/SKILL.md`

**Step 1: Write the skill**

```markdown
---
name: audit-tutorial
description: First-time onboarding for the CTO audit workflow. Walk through the system, explain how it works, and guide setup.
---

# Audit Tutorial

You are helping a CTO get started with the audit workflow system.

## Context Detection

First, determine where we are:

1. Check if `org.yaml` exists in current directory or parent
2. Check if `checklist/` submodule exists
3. Check if this appears to be inside the checklist repo itself

## Scenarios

### Scenario A: Inside checklist repo (no workspace)

If we're inside the checklist repo itself (no org.yaml, has checklist/ as a direct child with items.yaml files):

Explain:
```
You're inside the checklist repository itself. To run audits, you need a separate workspace.

**Quick Setup:**

1. Create your audit workspace:
   ```bash
   mkdir ~/my-company-audits && cd ~/my-company-audits
   git init
   ```

2. Add the checklist as a submodule:
   ```bash
   git submodule add <checklist-repo-url> checklist
   ```

3. Run `/audit-init` to configure your organization.

Would you like me to help you set this up?
```

### Scenario B: In workspace, not configured

If org.yaml doesn't exist but we're not in the checklist repo:

```
This looks like a fresh audit workspace. Let's get you set up!

The audit workflow helps you:
- Track which checklist items pass/fail for your projects
- Run automated checks where possible
- Document evidence and exceptions
- Compare audits over time

**Next step:** Run `/audit-init` to configure your organization context.
```

### Scenario C: In workspace, configured

If org.yaml exists:

```
Welcome back! Your workspace is configured.

**Your organization:** [read from org.yaml]
**Projects configured:** [list from projects/*.yaml]

**Commands:**
- `/audit-start <project>` - Begin a new audit
- `/audit-continue` - Resume in-progress audit
- `/audit-status` - Check current progress
- `/audit-add-project` - Add another project

What would you like to do?
```

## Key Concepts to Explain

When asked, explain these concepts:

**Scope Levels:**
- `org` - Audit once for the whole organization (e.g., SSO setup, budget alerts)
- `project` - Audit separately for each project (e.g., branch protection, tests)
- `both` - Has org-level policy AND project-level compliance

**Audit Results:**
Each audited item creates a markdown file with:
- YAML frontmatter (status, timestamp, severity)
- Evidence section (command outputs, observations)
- Notes section (your comments)

**Waivers:**
If an item doesn't apply, create a waiver instead of marking it N/A every time.

## Always Be Helpful

- If the user seems confused, offer to explain more
- If they want to jump ahead, let them
- Link to the design doc for full details: `docs/plans/2026-02-04-cto-audit-workflow-design.md`
```

**Step 2: Commit**

```bash
git add skills/audit-tutorial/SKILL.md
git commit -m "feat: add audit-tutorial skill for onboarding"
```

---

### Task 2.3: Write audit-init skill

**Files:**
- Create: `skills/audit-init/SKILL.md`

**Step 1: Write the skill**

```markdown
---
name: audit-init
description: Initialize organization context for the audit workspace. Interactive setup wizard that generates org.yaml and documentation files.
---

# Audit Init

You are configuring a CTO's audit workspace. This is an interactive setup wizard.

## Pre-flight Checks

1. Verify we're in a valid workspace (not inside checklist repo)
2. Check if `org.yaml` already exists - if so, ask if they want to reconfigure
3. Ensure `checklist/` submodule exists or can be added

## Setup Flow

Ask these questions ONE AT A TIME. After each answer, acknowledge and move to the next.

### Step 1: Organization Name

```
What's your organization name? (This is just for labeling)
```

### Step 2: Cloud Providers

```
Which cloud providers do you use? (Select all that apply, or "tell later")

1. AWS
2. GCP
3. Azure
4. Other (specify)
5. Tell me later
```

### Step 3: Source Control

```
What's your source control setup?

1. GitHub Cloud
2. GitHub Enterprise
3. GitLab Cloud
4. GitLab Self-hosted
5. Bitbucket
6. Other
```

If GitHub, ask: `What's your GitHub org name?`

### Step 4: Infrastructure as Code

```
How do you manage infrastructure? (Select all that apply, or "tell later")

1. Terraform
2. Pulumi
3. CloudFormation
4. CDK
5. None / Manual
6. Tell me later
```

### Step 5: Compute Platform

```
What compute platforms do you use? (Select all that apply)

1. Kubernetes
2. ECS / Fargate
3. Lambda / Cloud Functions
4. VMs (EC2, Compute Engine)
5. PaaS (Heroku, Railway, Render)
6. Tell me later
```

### Step 6: Observability

```
What monitoring tools do you use? (Select all, or "tell later")

Monitoring:
1. Datadog
2. New Relic
3. Prometheus/Grafana
4. CloudWatch
5. Other

Error Tracking:
1. Sentry
2. Bugsnag
3. Rollbar
4. Other

(You can answer both, or "tell later" for either)
```

### Step 7: Secrets Management

```
How do you manage secrets?

1. HashiCorp Vault
2. AWS Secrets Manager
3. GCP Secret Manager
4. 1Password / Doppler
5. Environment variables only
6. Tell me later
```

### Step 8: CI/CD

```
What CI/CD system do you use?

1. GitHub Actions
2. GitLab CI
3. CircleCI
4. Jenkins
5. Other
```

### Step 9: Authentication

```
What auth system do you use for your applications?

1. Auth0
2. Okta
3. Cognito
4. Firebase Auth
5. Custom / Self-built
6. Tell me later
```

## Generate Configuration

After collecting answers, generate these files:

### org.yaml

```yaml
name: [org name]
created_at: [ISO date]
configured_by: claude-audit-init

cloud_providers:
  - [answered or empty list]

source_control:
  provider: [github/gitlab/bitbucket]
  type: [cloud/enterprise/self-hosted]
  org: [org name if provided]

infrastructure:
  iac: [terraform/pulumi/etc or null]
  compute:
    - [list of compute platforms]

observability:
  monitoring: [tool or null]
  errors: [tool or null]
  logging: [tool or null]

secrets: [tool or null]

ci_cd: [tool]

auth: [tool or null]

# Items marked "tell later" - Claude will ask when relevant
deferred:
  - [list of deferred items]
```

### docs/org-context.md

Write a prose description of the organization's setup based on answers.

### docs/audit-workflow.md

Generate instructions specific to their tooling:
- How to run audits
- Which sections are most relevant
- Tool-specific commands they'll use

### docs/commands.md

List all available `/audit-*` commands with descriptions.

### docs/preferences.md

```markdown
# Audit Preferences

## Defaults
- Verbosity: normal
- Auto-run checks: ask first

## Custom Preferences
(Add your preferences here as you work)
```

### CLAUDE.md

```markdown
# [Org Name] Audit Workspace

This workspace is configured for auditing [org name]'s technical infrastructure.

## Quick Reference

See `org.yaml` for structured configuration.

## Documentation

- `docs/org-context.md` - Organization context and setup
- `docs/audit-workflow.md` - How to run audits
- `docs/commands.md` - Available commands
- `docs/preferences.md` - Your preferences

## Getting Started

1. Add a project: `/audit-add-project`
2. Start an audit: `/audit-start <project-name>`
3. Check progress: `/audit-status`

## Checklist Reference

The checklist is in `checklist/` (submodule). Browse items at:
- `checklist/checklist/` - All sections
- `checklist/dashboard/` - Web UI (run `pnpm dev`)
```

### STATUS.md

```markdown
# Workspace Status

**Last updated:** [date]

## Projects

| Project | Last Audit | Pass Rate |
|---------|------------|-----------|
| (none configured) | - | - |

## Recent Activity

(No audits yet)
```

## After Generation

```
Your workspace is configured! Files created:
- org.yaml
- CLAUDE.md
- STATUS.md
- docs/org-context.md
- docs/audit-workflow.md
- docs/commands.md
- docs/preferences.md

**Next steps:**
1. Review the generated files
2. Run `/audit-add-project` to add your first project
3. Run `/audit-start <project>` to begin auditing

Would you like to add a project now?
```

## Error Handling

- If user cancels mid-setup, save partial progress to `org.yaml.partial`
- If org.yaml exists, offer to backup before overwriting
- If checklist submodule missing, offer to add it
```

**Step 2: Commit**

```bash
git add skills/audit-init/SKILL.md
git commit -m "feat: add audit-init skill for org setup wizard"
```

---

### Task 2.4: Write audit-add-project skill

**Files:**
- Create: `skills/audit-add-project/SKILL.md`

**Step 1: Write the skill**

```markdown
---
name: audit-add-project
description: Add a new project to the audit workspace. Interactive setup that creates projects/<name>.yaml with project metadata.
---

# Audit Add Project

You are adding a new project to a CTO's audit workspace.

## Pre-flight Checks

1. Verify `org.yaml` exists - if not, run `/audit-init` first
2. Check if project name already exists in `projects/`

## Setup Flow

Ask these questions ONE AT A TIME.

### Step 1: Project Name

```
What's the project name? (Used for folder names and references)

Examples: backend-api, mobile-app, admin-dashboard
```

Validate: lowercase, alphanumeric + hyphens only

### Step 2: Codebase Path

```
Where's the codebase located?

Enter the absolute path or path relative to this workspace:
```

Validate: Path exists and contains code (has package.json, go.mod, etc.)

### Step 3: Project Type

```
What type of project is this?

1. Backend API / Service
2. Frontend Web App
3. Mobile App
4. Library / Package
5. Infrastructure / IaC
6. Monorepo (contains multiple)
7. Other
```

### Step 4: Repository (Optional)

```
What's the GitHub/GitLab repo? (for API-based checks)

Format: owner/repo (e.g., acme-corp/backend-api)
Or press Enter to skip
```

### Step 5: Tech Stack (Optional)

```
What's the tech stack? (Select all that apply, or Enter to skip)

Languages:
1. TypeScript/JavaScript
2. Python
3. Go
4. Java/Kotlin
5. Ruby
6. Rust
7. Other

Frameworks (if web):
1. React
2. Vue
3. Next.js
4. Express
5. FastAPI
6. Django
7. Other
```

### Step 6: Environments (Optional)

```
What environments does this project have?

1. dev, staging, prod (standard)
2. dev, prod (simple)
3. Custom (specify)
4. Skip for now
```

### Step 7: URLs (Optional)

```
What are the key URLs? (Enter to skip each)

Production URL:
Health endpoint:
```

### Step 8: Scope (Optional)

```
Which checklist sections apply to this project?

1. All sections (default)
2. Exclude specific sections
3. Include only specific sections
```

If exclude/include, show section list and let them select.

## Generate Configuration

### projects/<name>.yaml

```yaml
name: [project name]
path: [absolute or relative path]
created_at: [ISO date]

type: [backend/frontend/mobile/library/infrastructure/monorepo]

repo: [owner/repo or null]

stack:
  languages:
    - [list]
  frameworks:
    - [list]

environments:
  - [list]

urls:
  production: [url or null]
  health: [url or null]

scope:
  mode: [all/include/exclude]
  sections: [list if include/exclude mode]
```

## After Generation

```
Project "[name]" added!

Created: projects/[name].yaml

**Quick check of the codebase:**
[Run a few auto-detectable checks]
- Found package.json ✓
- Found .github/workflows ✓
- Found tests/ directory ✓

**Ready to audit:**
Run `/audit-start [name]` to begin auditing this project.

Or add another project with `/audit-add-project`.
```

## Auto-Detection

When path is provided, try to auto-detect:
- Languages (from file extensions, package files)
- Frameworks (from dependencies)
- Test presence
- CI presence

Offer to pre-fill answers based on detection:
```
I detected this appears to be a TypeScript/Node.js project using Express.
Should I use these defaults? (y/n)
```
```

**Step 2: Commit**

```bash
git add skills/audit-add-project/SKILL.md
git commit -m "feat: add audit-add-project skill for project setup"
```

---

## Phase 3: Audit Execution Skills

### Task 3.1: Write audit-start skill

**Files:**
- Create: `skills/audit-start/SKILL.md`

**Step 1: Write the skill**

```markdown
---
name: audit-start
description: Begin a new audit for a project. Creates dated audit folder and guides through items based on chosen flow.
---

# Audit Start

You are starting a new audit for a project.

## Usage

```
/audit-start <project-name>
/audit-start              # prompts for project
```

## Pre-flight Checks

1. Verify `org.yaml` exists
2. Verify project exists in `projects/`
3. Check for in-progress audit (warn if exists)

## Flow Selection

```
How would you like to work through the audit?

1. **Sequential** - Sections in order (1 → 2 → 3...)
2. **Priority-based** - Critical items first, then recommended
3. **Section-at-a-time** - Pick a section, complete it, pick next
4. **Free-form** - Jump around, I'll track what's done
```

## Audit Setup

### Create audit folder

```
audits/[project-name]/[YYYY-MM-DD]/
```

### Determine applicable items

1. Load all items from `checklist/checklist/*/items.yaml`
2. Filter by project scope (from project config)
3. Filter by item scope (project or both, not org-only)
4. Check for waivers - exclude waived items
5. Load any custom items from `custom-items/`

### Track state

Create `.audit-state.yaml` in the audit folder:

```yaml
project: [name]
started_at: [ISO datetime]
flow: [sequential/priority/section/freeform]
current_section: [number or null]
current_item: [ID or null]
items_total: [count]
items_completed: [count]
items_remaining:
  - [list of item IDs]
```

## Item Workflow

For each item:

### 1. Present the item

```
## [ITEM-ID]: [Title]
**Severity:** [Critical/Recommended]
**Section:** [Section name]

[Description from items.yaml]

---
```

### 2. Show the guide

Extract the item's section from `checklist/checklist/[section]/guide.md`

### 3. Run auto-checks (if available)

If item has `auto_checks`, ask:
```
I can run these automated checks:
- [command 1]
- [command 2]

Run them now? (y/n)
```

Show results.

### 4. Ask follow-up questions (if needed)

If item has `ask_user` questions, ask them.

### 5. Determine status

```
Based on the checks, what's the status?

1. **Pass** - Meets all criteria
2. **Fail** - Does not meet criteria
3. **Partial** - Some criteria met
4. **Skip** - Skip for now (will revisit)
5. **Not Applicable** - Doesn't apply (consider creating waiver)
6. **Blocked** - Can't verify (access issue, dependency)
```

### 6. Capture notes

```
Any notes to add? (Enter to skip)
```

### 7. Write result file

Create `audits/[project]/[date]/[ITEM-ID].md`:

```markdown
---
item_id: [ID]
title: [Title]
status: [pass/fail/partial/skip/not-applicable/blocked]
severity: [critical/recommended]
section: [section-slug]
audited_at: [ISO datetime]
auditor: claude-session
---

## Evidence

[Command outputs, observations]

## Notes

[User's notes]
```

### 8. Update state and continue

Update `.audit-state.yaml` and move to next item.

## Regression Check

If previous audit exists, compare:
- Items that passed before but might fail now
- Flag these prominently

## Session End

When user wants to stop:

```
Audit progress saved!

**Completed:** X/Y items (Z%)
**Remaining:** [count] items

Resume anytime with `/audit-continue`
```
```

**Step 2: Commit**

```bash
git add skills/audit-start/SKILL.md
git commit -m "feat: add audit-start skill for beginning audits"
```

---

### Task 3.2: Write audit-continue skill

**Files:**
- Create: `skills/audit-continue/SKILL.md`

**Step 1: Write the skill**

```markdown
---
name: audit-continue
description: Resume an in-progress audit. Finds the most recent incomplete audit and continues from where you left off.
---

# Audit Continue

You are resuming an in-progress audit.

## Auto-Detection

1. Look for `.audit-state.yaml` files in `audits/*/`
2. Find the most recent incomplete audit
3. If multiple, ask which to continue

## Resume Flow

```
Resuming audit: [project-name]
Started: [date]
Progress: X/Y items (Z%)

Last completed: [ITEM-ID] - [Title]
Next up: [ITEM-ID] - [Title]

Ready to continue? (y/n)
```

## State Recovery

Read from `.audit-state.yaml`:
- Current position
- Flow preference
- Remaining items

Continue using the same flow as when started.

## If No Audit Found

```
No in-progress audit found.

Start a new audit with `/audit-start <project>`

Available projects:
- [list from projects/]
```
```

**Step 2: Commit**

```bash
git add skills/audit-continue/SKILL.md
git commit -m "feat: add audit-continue skill for resuming audits"
```

---

### Task 3.3: Write audit-item skill

**Files:**
- Create: `skills/audit-item/SKILL.md`

**Step 1: Write the skill**

```markdown
---
name: audit-item
description: Jump to a specific checklist item by ID. Useful for re-auditing a specific item or checking something out of order.
---

# Audit Item

You are jumping to a specific audit item.

## Usage

```
/audit-item GIT-005
/audit-item COST-001
```

## Flow

1. Parse the item ID from args
2. Find the item in checklist
3. Determine if it's org-level or project-level
4. If project-level, ask which project (if multiple)
5. Show the item and run through the standard item workflow
6. Save result to appropriate audit folder

## If No Active Audit

Create result in the current date folder, or ask:
```
No active audit. Create a one-off check or start an audit?

1. One-off check (save to today's folder)
2. Start full audit with `/audit-start`
```

## Item Not Found

```
Item "[ID]" not found.

Did you mean:
- GIT-005: Branch protections configured
- GIT-006: ...

Or search: /audit-item --search "branch"
```
```

**Step 2: Commit**

```bash
git add skills/audit-item/SKILL.md
git commit -m "feat: add audit-item skill for jumping to specific items"
```

---

### Task 3.4: Write audit-skip skill

**Files:**
- Create: `skills/audit-skip/SKILL.md`

**Step 1: Write the skill**

```markdown
---
name: audit-skip
description: Skip an audit item with a documented reason. The item can be revisited later.
---

# Audit Skip

You are skipping an audit item.

## Usage

```
/audit-skip GIT-005
/audit-skip GIT-005 "Need to check with DevOps team first"
```

## Flow

1. Parse item ID and optional reason
2. If no reason provided, ask:
   ```
   Why are you skipping this item?

   1. Need more information
   2. Waiting on someone else
   3. Will do later
   4. Other (specify)
   ```
3. Write result file with status: skip
4. Update audit state
5. Move to next item

## Result File

```markdown
---
item_id: [ID]
title: [Title]
status: skip
severity: [critical/recommended]
section: [section]
audited_at: [ISO datetime]
skip_reason: [reason]
---

## Skip Reason

[Detailed reason]

## Notes

Will revisit when [condition].
```

## Bulk Skip

```
/audit-skip --section 15
```

Skip all items in a section (with confirmation).
```

**Step 2: Commit**

```bash
git add skills/audit-skip/SKILL.md
git commit -m "feat: add audit-skip skill for skipping items"
```

---

### Task 3.5: Write audit-section skill

**Files:**
- Create: `skills/audit-section/SKILL.md`

**Step 1: Write the skill**

```markdown
---
name: audit-section
description: Focus on a specific checklist section. Lists all items in the section and guides through them.
---

# Audit Section

You are focusing on a specific section.

## Usage

```
/audit-section 01
/audit-section git-repo-setup
/audit-section          # shows section list
```

## Section List

If no section specified:

```
Available sections:

## Infrastructure & Setup
01. Git Repo Setup (20 items, 15 critical)
02. Dependencies (7 items)
03. Authentication & Endpoints (10 items)
04. Environments (9 items)

## Database & Data
05. Database Connections (9 items)
06. Resilience (1 item)

[... continue for all 41 sections]

Enter section number or name:
```

## Section Focus

When section selected:

```
## Section [N]: [Name]

[Description]

**Items:** [count] ([critical] critical, [recommended] recommended)
**Scope:** [org/project/both]

### Items in this section:

1. [ID]: [Title] - [severity]
2. [ID]: [Title] - [severity]
...

Start from the beginning? (y/n/or enter item number)
```

Then proceed through items sequentially within the section.

## Cross-References

When an item references another section, mention it:
```
Note: This item relates to Section [N] ([name]).
You may want to audit that section as well.
```
```

**Step 2: Commit**

```bash
git add skills/audit-section/SKILL.md
git commit -m "feat: add audit-section skill for section focus"
```

---

## Phase 4: Reporting Skills

### Task 4.1: Write audit-status skill

**Files:**
- Create: `skills/audit-status/SKILL.md`

**Step 1: Write the skill**

```markdown
---
name: audit-status
description: Show current audit progress including items completed, pass rate, and any blockers or regressions.
---

# Audit Status

You are showing the current audit status.

## Usage

```
/audit-status
/audit-status backend-api
```

## Output

### Active Audit

```
## Audit Status: [project-name]

**Started:** [date]
**Progress:** [X]/[Y] items ([Z]%)

### By Status
- Pass: [count] ✓
- Fail: [count] ✗
- Partial: [count] ~
- Skip: [count] ⏭
- Blocked: [count] ⚠
- Remaining: [count]

### By Severity
- Critical: [done]/[total]
- Recommended: [done]/[total]

### By Section
| Section | Done | Total | Status |
|---------|------|-------|--------|
| 01 Git Repo | 5 | 5 | ✓ |
| 02 Dependencies | 3 | 7 | ... |

### Regressions
[If previous audit exists]
⚠ [ITEM-ID] passed in last audit but fails now

### Blockers
- [ITEM-ID]: [reason]

---
Continue with `/audit-continue`
```

### No Active Audit

```
No active audit found.

**Recent audits:**
| Project | Date | Pass Rate |
|---------|------|-----------|
| backend-api | 2026-02-04 | 91% |
| mobile-app | 2026-01-20 | 78% |

Start a new audit: `/audit-start <project>`
```

## Update STATUS.md

After showing status, offer to update the workspace STATUS.md file.
```

**Step 2: Commit**

```bash
git add skills/audit-status/SKILL.md
git commit -m "feat: add audit-status skill for progress tracking"
```

---

### Task 4.2: Write audit-summary skill

**Files:**
- Create: `skills/audit-summary/SKILL.md`

**Step 1: Write the skill**

```markdown
---
name: audit-summary
description: Generate a summary report for an audit. Creates _summary.md in the audit folder with full results.
---

# Audit Summary

You are generating an audit summary report.

## Usage

```
/audit-summary
/audit-summary backend-api
/audit-summary backend-api 2026-02-04
```

## Generate Summary

Create `audits/[project]/[date]/_summary.md`:

```markdown
# Audit Summary: [Project Name]

**Date:** [YYYY-MM-DD]
**Auditor:** claude-session

## Overview

| Metric | Value |
|--------|-------|
| Total Items | [count] |
| Passed | [count] ([%]) |
| Failed | [count] ([%]) |
| Partial | [count] |
| Skipped | [count] |
| Not Applicable | [count] |

**Overall Score:** [X]% compliant

## Critical Items

### Passing ✓
- [ID]: [Title]
- [ID]: [Title]

### Failing ✗
- [ID]: [Title] - [brief reason]
- [ID]: [Title] - [brief reason]

## Section Breakdown

| Section | Pass | Fail | Skip | Score |
|---------|------|------|------|-------|
| 01 Git Repo Setup | 18 | 2 | 0 | 90% |
| 02 Dependencies | 6 | 1 | 0 | 86% |
...

## Action Items

Based on failing items, prioritized recommendations:

1. **[ID]: [Title]** (Critical)
   [Brief recommendation]

2. **[ID]: [Title]** (Critical)
   [Brief recommendation]

## Waivers Applied

| Item | Reason | Review Date |
|------|--------|-------------|
| [ID] | [reason] | [date] |

## Compared to Previous Audit

[If previous audit exists]

| Metric | Previous | Current | Change |
|--------|----------|---------|--------|
| Pass Rate | 76% | 91% | +15% |
| Critical Pass | 85% | 95% | +10% |

### Improvements
- [ID]: [Title] now passing

### Regressions
- [ID]: [Title] now failing

---
Generated by CTO Audit Workflow
```

## After Generation

```
Summary generated: audits/[project]/[date]/_summary.md

Key findings:
- Overall: [X]% compliant
- [Y] critical items need attention
- [Z] items improved since last audit

View the full report or export it?
```
```

**Step 2: Commit**

```bash
git add skills/audit-summary/SKILL.md
git commit -m "feat: add audit-summary skill for report generation"
```

---

### Task 4.3: Write audit-history skill

**Files:**
- Create: `skills/audit-history/SKILL.md`

**Step 1: Write the skill**

```markdown
---
name: audit-history
description: Show audit history for a project. Lists past audits with dates, pass rates, and trends.
---

# Audit History

You are showing audit history.

## Usage

```
/audit-history
/audit-history backend-api
```

## Output

```
## Audit History: [project-name]

| Date | Items | Pass | Fail | Skip | Rate |
|------|-------|------|------|------|------|
| 2026-02-04 | 45 | 41 | 2 | 2 | 91.1% |
| 2026-01-15 | 42 | 32 | 8 | 2 | 76.2% |
| 2025-12-01 | 38 | 25 | 10 | 3 | 65.8% |

**Trend:** +25.3% improvement over 3 audits

### Visualization

Dec '25  ████████████████░░░░░░░░░  65.8%
Jan '26  ███████████████████░░░░░░  76.2%
Feb '26  ███████████████████████░░  91.1%

### Consistently Failing Items
These items have failed in multiple audits:
- [ID]: [Title] (failed 3/3 audits)
- [ID]: [Title] (failed 2/3 audits)

---
Compare audits: `/audit-diff 2026-01-15 2026-02-04`
```

## No History

```
No audit history for [project].

Start the first audit: `/audit-start [project]`
```
```

**Step 2: Commit**

```bash
git add skills/audit-history/SKILL.md
git commit -m "feat: add audit-history skill for viewing past audits"
```

---

### Task 4.4: Write audit-diff skill

**Files:**
- Create: `skills/audit-diff/SKILL.md`

**Step 1: Write the skill**

```markdown
---
name: audit-diff
description: Compare two audits and show what changed. Highlights improvements, regressions, and new items.
---

# Audit Diff

You are comparing two audits.

## Usage

```
/audit-diff backend-api 2026-01-15 2026-02-04
/audit-diff backend-api   # compares two most recent
```

## Output

```
## Audit Comparison: [project-name]

**From:** [date1]
**To:** [date2]

---

### Improvements ✓ ([count] items fixed)

| Item | Title | Was | Now |
|------|-------|-----|-----|
| GIT-003 | Branch naming convention | fail | pass |
| AUTH-002 | Token rotation | fail | pass |
| DB-004 | Connection pooling | fail | pass |

### Regressions ✗ ([count] items)

| Item | Title | Was | Now |
|------|-------|-----|-----|
| (none) | | | |

### New Items Audited ([count])

| Item | Title | Status |
|------|-------|--------|
| COST-001 | Budget alerts | pass |
| COST-002 | Anomaly detection | fail |

### Still Failing ([count])

| Item | Title | Audits Failed |
|------|-------|---------------|
| SEC-005 | WAF configuration | 2 |
| MON-003 | Alert escalation | 2 |

### No Longer Audited ([count])

Items that were in [date1] but not [date2]:
- [ID]: [Title] - [reason if waiver exists]

---

**Summary:** [rate1]% → [rate2]% ([+/-X]%)
```
```

**Step 2: Commit**

```bash
git add skills/audit-diff/SKILL.md
git commit -m "feat: add audit-diff skill for comparing audits"
```

---

### Task 4.5: Write audit-waiver skill

**Files:**
- Create: `skills/audit-waiver/SKILL.md`

**Step 1: Write the skill**

```markdown
---
name: audit-waiver
description: Create a waiver for a checklist item that doesn't apply. Documents why and sets a review date.
---

# Audit Waiver

You are creating a waiver for a checklist item.

## Usage

```
/audit-waiver AUTH-003
/audit-waiver AUTH-003 --project internal-tools
```

## Flow

### Step 1: Identify Item

```
Creating waiver for: AUTH-003 - [Title]

Is this correct? (y/n)
```

### Step 2: Scope

```
Does this waiver apply to:

1. All projects (global waiver)
2. Specific projects (select which)
```

If specific, show project list.

### Step 3: Reason

```
Why doesn't this item apply?

1. Using alternative approach
2. Not applicable to our architecture
3. Covered by another control
4. Risk accepted
5. Other (specify)

Please explain:
```

### Step 4: Conditions

```
Under what conditions would this waiver be void?
(Enter conditions, or skip)
```

### Step 5: Approval

```
Who is approving this waiver?

Name and title:
```

### Step 6: Review Date

```
When should this waiver be reviewed?

1. 3 months
2. 6 months
3. 1 year
4. Custom date
```

## Generate Waiver

Create file based on scope:
- Global: `waivers/[ITEM-ID].md`
- Project-specific: `waivers/[project]/[ITEM-ID].md`

```markdown
---
item_id: [ID]
title: [Title]
status: not-applicable
applies_to:
  - [project list or "all"]
approved_by: [Name (Title)]
approved_at: [ISO date]
review_date: [ISO date]
---

## Reason

[Detailed reason]

## Alternative Controls

[If applicable]

## Conditions

This waiver is void if:
- [condition 1]
- [condition 2]

## Review History

| Date | Reviewer | Decision |
|------|----------|----------|
| [date] | [name] | Created |
```

## After Creation

```
Waiver created: waivers/[path]/[ITEM-ID].md

This item will be excluded from future audits for:
- [project list or "all projects"]

Review scheduled for: [date]

To edit: open waivers/[path]/[ITEM-ID].md
To delete: remove the file
```
```

**Step 2: Commit**

```bash
git add skills/audit-waiver/SKILL.md
git commit -m "feat: add audit-waiver skill for creating waivers"
```

---

## Phase 5: Dashboard Integration

### Task 5.1: Add workspace env var support

**Files:**
- Modify: `dashboard/.env.example`
- Modify: `dashboard/lib/checklist.ts`

**Step 1: Update .env.example**

Add to `dashboard/.env.example`:

```
# Optional: Path to CTO audit workspace for viewing audit results
# AUDIT_WORKSPACE=/path/to/my-company-audits
```

**Step 2: Add workspace reading to checklist.ts**

Add new functions to `dashboard/lib/checklist.ts`:

```typescript
// Workspace support
const WORKSPACE_PATH = process.env.AUDIT_WORKSPACE;

export function hasWorkspace(): boolean {
  if (!WORKSPACE_PATH) return false;
  try {
    return fs.existsSync(path.join(WORKSPACE_PATH, 'org.yaml'));
  } catch {
    return false;
  }
}

export interface Project {
  name: string;
  path: string;
  type: string;
  repo?: string;
  lastAudit?: string;
  lastAuditScore?: number;
}

export async function listProjects(): Promise<Project[]> {
  if (!WORKSPACE_PATH) return [];

  const projectsDir = path.join(WORKSPACE_PATH, 'projects');
  if (!fs.existsSync(projectsDir)) return [];

  const files = fs.readdirSync(projectsDir).filter(f => f.endsWith('.yaml'));

  return Promise.all(files.map(async (file) => {
    const content = fs.readFileSync(path.join(projectsDir, file), 'utf-8');
    const data = yaml.parse(content);

    // Get last audit info
    const auditDir = path.join(WORKSPACE_PATH, 'audits', data.name);
    let lastAudit: string | undefined;
    let lastAuditScore: number | undefined;

    if (fs.existsSync(auditDir)) {
      const audits = fs.readdirSync(auditDir)
        .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))
        .sort()
        .reverse();

      if (audits.length > 0) {
        lastAudit = audits[0];
        // Calculate score from audit results
        lastAuditScore = await calculateAuditScore(data.name, audits[0]);
      }
    }

    return {
      name: data.name,
      path: data.path,
      type: data.type,
      repo: data.repo,
      lastAudit,
      lastAuditScore,
    };
  }));
}

export interface AuditResult {
  itemId: string;
  title: string;
  status: 'pass' | 'fail' | 'partial' | 'skip' | 'not-applicable' | 'blocked';
  severity: 'critical' | 'recommended';
  section: string;
  auditedAt: string;
  evidence?: string;
  notes?: string;
}

export async function getAuditResults(
  project: string,
  date: string
): Promise<AuditResult[]> {
  if (!WORKSPACE_PATH) return [];

  const auditDir = path.join(WORKSPACE_PATH, 'audits', project, date);
  if (!fs.existsSync(auditDir)) return [];

  const files = fs.readdirSync(auditDir)
    .filter(f => f.endsWith('.md') && !f.startsWith('_'));

  return files.map((file) => {
    const content = fs.readFileSync(path.join(auditDir, file), 'utf-8');
    const { data, content: body } = parseFrontmatter(content);

    return {
      itemId: data.item_id,
      title: data.title,
      status: data.status,
      severity: data.severity,
      section: data.section,
      auditedAt: data.audited_at,
      evidence: extractSection(body, 'Evidence'),
      notes: extractSection(body, 'Notes'),
    };
  });
}

async function calculateAuditScore(project: string, date: string): Promise<number> {
  const results = await getAuditResults(project, date);
  if (results.length === 0) return 0;

  const passed = results.filter(r => r.status === 'pass').length;
  return Math.round((passed / results.length) * 100);
}

function parseFrontmatter(content: string): { data: any; content: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { data: {}, content };

  return {
    data: yaml.parse(match[1]),
    content: match[2],
  };
}

function extractSection(content: string, heading: string): string | undefined {
  const regex = new RegExp(`## ${heading}\\n([\\s\\S]*?)(?=\\n## |$)`);
  const match = content.match(regex);
  return match ? match[1].trim() : undefined;
}
```

**Step 3: Verify build**

```bash
cd dashboard && pnpm build
```

**Step 4: Commit**

```bash
git add dashboard/.env.example dashboard/lib/checklist.ts
git commit -m "feat(dashboard): add workspace support for audit results"
```

---

### Task 5.2: Create /audits page

**Files:**
- Create: `dashboard/app/audits/page.tsx`

**Step 1: Create the page**

```typescript
import { listProjects, hasWorkspace } from "@/lib/checklist";
import Link from "next/link";

export default async function AuditsPage() {
  if (!hasWorkspace()) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Audit Results</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            No audit workspace configured. Set the{" "}
            <code className="bg-yellow-100 px-1 rounded">AUDIT_WORKSPACE</code>{" "}
            environment variable to view audit results.
          </p>
        </div>
      </div>
    );
  }

  const projects = await listProjects();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Audit Results</h1>

      {projects.length === 0 ? (
        <p className="text-gray-500">No projects configured yet.</p>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <Link
              key={project.name}
              href={`/audits/${project.name}`}
              className="block border rounded-lg p-4 hover:border-blue-500 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold">{project.name}</h2>
                  <p className="text-sm text-gray-500">{project.type}</p>
                </div>
                {project.lastAudit && (
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {project.lastAuditScore}%
                    </div>
                    <div className="text-sm text-gray-500">
                      {project.lastAudit}
                    </div>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Add to navigation**

Update `dashboard/app/layout.tsx` to include link to /audits if workspace is configured.

**Step 3: Commit**

```bash
git add dashboard/app/audits/page.tsx dashboard/app/layout.tsx
git commit -m "feat(dashboard): add /audits page for project list"
```

---

### Task 5.3: Create /audits/[project] page

**Files:**
- Create: `dashboard/app/audits/[project]/page.tsx`

**Step 1: Create the page**

```typescript
import { getAuditHistory } from "@/lib/checklist";
import Link from "next/link";

interface Props {
  params: Promise<{ project: string }>;
}

export default async function ProjectAuditsPage({ params }: Props) {
  const { project } = await params;
  const history = await getAuditHistory(project);

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/audits" className="text-blue-500 hover:underline mb-4 block">
        ← Back to projects
      </Link>

      <h1 className="text-2xl font-bold mb-6">Audit History: {project}</h1>

      {history.length === 0 ? (
        <p className="text-gray-500">No audits yet for this project.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Date</th>
                <th className="text-right p-2">Items</th>
                <th className="text-right p-2">Pass</th>
                <th className="text-right p-2">Fail</th>
                <th className="text-right p-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {history.map((audit) => (
                <tr key={audit.date} className="border-b hover:bg-gray-50">
                  <td className="p-2">
                    <Link
                      href={`/audits/${project}/${audit.date}`}
                      className="text-blue-500 hover:underline"
                    >
                      {audit.date}
                    </Link>
                  </td>
                  <td className="text-right p-2">{audit.total}</td>
                  <td className="text-right p-2 text-green-600">{audit.pass}</td>
                  <td className="text-right p-2 text-red-600">{audit.fail}</td>
                  <td className="text-right p-2 font-bold">{audit.score}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Add getAuditHistory to checklist.ts**

```typescript
export interface AuditHistoryEntry {
  date: string;
  total: number;
  pass: number;
  fail: number;
  skip: number;
  score: number;
}

export async function getAuditHistory(project: string): Promise<AuditHistoryEntry[]> {
  if (!WORKSPACE_PATH) return [];

  const auditDir = path.join(WORKSPACE_PATH, 'audits', project);
  if (!fs.existsSync(auditDir)) return [];

  const dates = fs.readdirSync(auditDir)
    .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort()
    .reverse();

  return Promise.all(dates.map(async (date) => {
    const results = await getAuditResults(project, date);
    const pass = results.filter(r => r.status === 'pass').length;
    const fail = results.filter(r => r.status === 'fail').length;
    const skip = results.filter(r => r.status === 'skip').length;

    return {
      date,
      total: results.length,
      pass,
      fail,
      skip,
      score: results.length > 0 ? Math.round((pass / results.length) * 100) : 0,
    };
  }));
}
```

**Step 3: Commit**

```bash
git add dashboard/app/audits/[project]/page.tsx dashboard/lib/checklist.ts
git commit -m "feat(dashboard): add /audits/[project] history page"
```

---

### Task 5.4: Create /audits/[project]/[date] page

**Files:**
- Create: `dashboard/app/audits/[project]/[date]/page.tsx`

**Step 1: Create the page**

```typescript
import { getAuditResults, getSection } from "@/lib/checklist";
import Link from "next/link";

interface Props {
  params: Promise<{ project: string; date: string }>;
}

export default async function AuditResultsPage({ params }: Props) {
  const { project, date } = await params;
  const results = await getAuditResults(project, date);

  // Group by section
  const bySection = results.reduce((acc, result) => {
    if (!acc[result.section]) acc[result.section] = [];
    acc[result.section].push(result);
    return acc;
  }, {} as Record<string, typeof results>);

  const statusColors = {
    pass: "text-green-600 bg-green-50",
    fail: "text-red-600 bg-red-50",
    partial: "text-yellow-600 bg-yellow-50",
    skip: "text-gray-600 bg-gray-50",
    "not-applicable": "text-gray-400 bg-gray-50",
    blocked: "text-orange-600 bg-orange-50",
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href={`/audits/${project}`}
        className="text-blue-500 hover:underline mb-4 block"
      >
        ← Back to history
      </Link>

      <h1 className="text-2xl font-bold mb-2">
        Audit: {project}
      </h1>
      <p className="text-gray-500 mb-6">{date}</p>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {results.filter((r) => r.status === "pass").length}
          </div>
          <div className="text-sm text-green-700">Passed</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {results.filter((r) => r.status === "fail").length}
          </div>
          <div className="text-sm text-red-700">Failed</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {results.filter((r) => r.status === "partial").length}
          </div>
          <div className="text-sm text-yellow-700">Partial</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">
            {results.filter((r) => r.status === "skip").length}
          </div>
          <div className="text-sm text-gray-700">Skipped</div>
        </div>
      </div>

      {/* Results by section */}
      {Object.entries(bySection).map(([section, items]) => (
        <div key={section} className="mb-8">
          <h2 className="text-lg font-semibold mb-4 capitalize">
            {section.replace(/-/g, " ")}
          </h2>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.itemId}
                className="border rounded-lg p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-sm text-gray-500">
                      {item.itemId}
                    </span>
                    <h3 className="font-medium">{item.title}</h3>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      statusColors[item.status]
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                {item.notes && (
                  <p className="mt-2 text-sm text-gray-600">{item.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add dashboard/app/audits/[project]/[date]/page.tsx
git commit -m "feat(dashboard): add /audits/[project]/[date] results page"
```

---

### Task 5.5: Create /audits/_org page

**Files:**
- Create: `dashboard/app/audits/_org/page.tsx`

**Step 1: Create the page**

Similar to project audit page but reads from `audits/_org/` directory.

```typescript
import { getAuditResults, getAuditHistory } from "@/lib/checklist";
import Link from "next/link";

export default async function OrgAuditsPage() {
  const history = await getAuditHistory("_org");

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/audits" className="text-blue-500 hover:underline mb-4 block">
        ← Back to projects
      </Link>

      <h1 className="text-2xl font-bold mb-6">Organization-Level Audits</h1>

      <p className="text-gray-500 mb-4">
        These items apply to your entire organization, not individual projects.
      </p>

      {history.length === 0 ? (
        <p className="text-gray-500">No org-level audits yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Date</th>
                <th className="text-right p-2">Items</th>
                <th className="text-right p-2">Pass</th>
                <th className="text-right p-2">Fail</th>
                <th className="text-right p-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {history.map((audit) => (
                <tr key={audit.date} className="border-b hover:bg-gray-50">
                  <td className="p-2">
                    <Link
                      href={`/audits/_org/${audit.date}`}
                      className="text-blue-500 hover:underline"
                    >
                      {audit.date}
                    </Link>
                  </td>
                  <td className="text-right p-2">{audit.total}</td>
                  <td className="text-right p-2 text-green-600">{audit.pass}</td>
                  <td className="text-right p-2 text-red-600">{audit.fail}</td>
                  <td className="text-right p-2 font-bold">{audit.score}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add dashboard/app/audits/_org/page.tsx
git commit -m "feat(dashboard): add /audits/_org page for org-level results"
```

---

## Phase 6: Polish & Testing

### Task 6.1: End-to-end test

**Step 1: Create test workspace**

```bash
mkdir -p /tmp/test-audit-workspace
cd /tmp/test-audit-workspace
git init
git submodule add /path/to/ultimate-cto-checklist checklist
```

**Step 2: Test each skill**

- Run `/audit-tutorial` and verify it detects fresh workspace
- Run `/audit-init` and complete setup
- Run `/audit-add-project` and add a test project
- Run `/audit-start` and audit a few items
- Run `/audit-status` and verify progress
- Run `/audit-summary` and check output

**Step 3: Test dashboard**

```bash
cd checklist/dashboard
AUDIT_WORKSPACE=/tmp/test-audit-workspace pnpm dev
```

Verify:
- /audits shows the test project
- /audits/[project] shows history
- /audits/[project]/[date] shows results

### Task 6.2: Write README for the workflow

**Files:**
- Create: `docs/audit-workflow-guide.md`

Document:
- How to set up a workspace
- Quick start guide
- Full command reference
- Troubleshooting

### Task 6.3: Create example workspace

**Files:**
- Create: `examples/sample-workspace/`

Include:
- Sample org.yaml
- Sample project config
- Sample audit results
- Sample waiver

---

## Summary

**Total Tasks:** 25+
**Estimated Phases:** 6

| Phase | Tasks | Focus |
|-------|-------|-------|
| 1 | 6 | Scope metadata for all 41 sections |
| 2 | 4 | Skills directory + setup skills |
| 3 | 5 | Audit execution skills |
| 4 | 5 | Reporting skills |
| 5 | 5 | Dashboard integration |
| 6 | 3 | Testing and documentation |

**Key Implementation Notes:**

1. Use subagents for bulk items.yaml updates (tasks 1.2-1.5)
2. Skills are independent - can be developed in parallel
3. Dashboard changes are additive - won't break existing functionality
4. Test incrementally - each skill should work standalone
