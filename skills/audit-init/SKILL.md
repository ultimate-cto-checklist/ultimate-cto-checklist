---
name: audit-init
description: Initialize organization context for the audit workspace. Interactive setup wizard that generates org.yaml and documentation files.
---

# Audit Init

You are configuring a CTO's audit workspace. This is an interactive setup wizard.

**Note:** Usually called automatically from `/audit` when the workspace needs setup. Can also be run directly to reconfigure.

## Pre-flight Checks

1. **Run environment check:** Read and follow `checklist/skills/audit-preflight/SKILL.md` to verify core tools (git, node, gh) are installed and authenticated. Do NOT proceed if core tools are missing — guide the user through fixing them first.
2. Verify we're in a valid workspace (not inside checklist repo)
3. Ensure `checklist/` submodule exists or can be added
4. Check if `org.yaml` already exists and is fully configured (has cloud_providers, source_control, monitoring, etc. — not just name/slug/created_at):
   - **Fully configured:** Show a summary and ask if they want to reconfigure. If not, tell them they're ready and suggest `/audit` to start.
   - **Minimal (just name/slug):** Tell them you'll fill in the rest, skip Step 1 (use the existing name), start from Step 2.
   - **Missing:** Start from Step 1.

## Setup Flow

Ask these questions ONE AT A TIME. After each answer, acknowledge and move to the next.

### Step 1: Organization Name

> What's your organization name? (This is just for labeling)

### Step 2: Cloud Providers

> Which cloud providers do you use? (Select all that apply, or "tell later")
>
> 1. AWS
> 2. GCP
> 3. Azure
> 4. Other (specify)
> 5. Tell me later

### Step 3: Source Control

> What's your source control setup?
>
> 1. GitHub Cloud
> 2. GitHub Enterprise
> 3. GitLab Cloud
> 4. GitLab Self-hosted
> 5. Bitbucket
> 6. Other

If GitHub, ask: `What's your GitHub org name?`

### Step 4: Infrastructure as Code

> How do you manage infrastructure? (Select all that apply, or "tell later")
>
> 1. Terraform
> 2. Pulumi
> 3. CloudFormation
> 4. CDK
> 5. None / Manual
> 6. Tell me later

### Step 5: Compute Platform

> What compute platforms do you use? (Select all that apply)
>
> 1. Kubernetes
> 2. ECS / Fargate
> 3. Lambda / Cloud Functions
> 4. VMs (EC2, Compute Engine)
> 5. PaaS (Heroku, Railway, Render)
> 6. Tell me later

### Step 6: Observability

> What monitoring tools do you use? (Select all, or "tell later")
>
> Monitoring:
> 1. Datadog
> 2. New Relic
> 3. Prometheus/Grafana
> 4. CloudWatch
> 5. Other
>
> Error Tracking:
> 1. Sentry
> 2. Bugsnag
> 3. Rollbar
> 4. Other
>
> (You can answer both, or "tell later" for either)

### Step 7: Secrets Management

> How do you manage secrets?
>
> 1. HashiCorp Vault
> 2. AWS Secrets Manager
> 3. GCP Secret Manager
> 4. 1Password / Doppler
> 5. Environment variables only
> 6. Tell me later

### Step 8: CI/CD

> What CI/CD system do you use?
>
> 1. GitHub Actions
> 2. GitLab CI
> 3. CircleCI
> 4. Jenkins
> 5. Other

### Step 9: Authentication

> What auth system do you use for your applications?
>
> 1. Auth0
> 2. Okta
> 3. Cognito
> 4. Firebase Auth
> 5. Custom / Self-built
> 6. Tell me later

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

Also follow instructions in `checklist/CLAUDE.md`.

## Quick Reference

See `org.yaml` for structured configuration.

## Documentation

- `docs/org-context.md` - Organization context and setup
- `docs/audit-workflow.md` - How to run audits
- `docs/preferences.md` - Your preferences

## Getting Started

Run `/audit` — it detects your workspace state and guides you to the right action.

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

Show:

> Your workspace is configured! Files created:
> - org.yaml
> - CLAUDE.md
> - STATUS.md
> - docs/org-context.md
> - docs/audit-workflow.md
> - docs/preferences.md
>
> **Next:** Run `/audit` to start your first audit.

## Error Handling

- If user cancels mid-setup, save partial progress to `org.yaml.partial`
- If org.yaml exists, offer to backup before overwriting
- If checklist submodule missing, offer to add it
