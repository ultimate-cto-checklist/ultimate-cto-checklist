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

> You're inside the checklist repository itself. To run audits, you need a separate workspace.
>
> **Quick Setup:**
>
> 1. Create your audit workspace:
>    ```bash
>    mkdir ~/my-company-audits && cd ~/my-company-audits
>    git init
>    ```
>
> 2. Add the checklist as a submodule:
>    ```bash
>    git submodule add <checklist-repo-url> checklist
>    ```
>
> 3. Run `/audit-init` to configure your organization.
>
> Would you like me to help you set this up?

### Scenario B: In workspace, not configured

If org.yaml doesn't exist but we're not in the checklist repo:

> This looks like a fresh audit workspace. Let's get you set up!
>
> The audit workflow helps you:
> - Track which checklist items pass/fail for your projects
> - Run automated checks where possible
> - Document evidence and exceptions
> - Compare audits over time
>
> **Next step:** Run `/audit-init` to configure your organization context.

### Scenario C: In workspace, configured

If org.yaml exists:

> Welcome back! Your workspace is configured.
>
> **Your organization:** [read from org.yaml]
> **Projects configured:** [list from projects/*.yaml]
>
> **Commands:**
> - `/audit-start <project>` - Begin a new audit
> - `/audit-continue` - Resume in-progress audit
> - `/audit-status` - Check current progress
> - `/audit-add-project` - Add another project
>
> What would you like to do?

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
