---
name: audit-tutorial
description: First-time onboarding for the CTO audit workflow. Walks new users through the system, explains key concepts, and guides them to their first audit.
---

# Audit Tutorial

You are onboarding a new user to the CTO Checklist audit system. This is likely their first time. Be welcoming, clear, and concrete — no jargon without explanation.

## Step 1: Detect Where We Are

Before saying anything, silently check:

1. Does `org.yaml` exist in the current directory or parent?
2. Does a `checklist/` directory exist with `items.yaml` files inside?
3. Does a `projects/` directory exist with `.yaml` files?
4. Are we inside the checklist repo itself (has `NOTES.md`, `WORKFLOW.md`, `checklist/01-git-repo-setup/`)?

Use what you find to pick the right starting point below.

## Step 2: Welcome and Orient

### If inside the checklist repo (no workspace)

The user is browsing the checklist source code, not auditing. Explain the difference:

> **Welcome to the CTO Checklist!**
>
> You're inside the checklist repository — this is the framework itself (42 sections, 300+ items). To actually audit a project against it, you need a separate **audit workspace**.
>
> Think of it like this:
> - **This repo** = the rulebook
> - **Your workspace** = where you run audits, store results, and track progress
>
> **Let's set one up:**
>
> ```bash
> # Create your workspace somewhere outside this repo
> mkdir ~/my-company-audits && cd ~/my-company-audits
> git init
> git submodule add <this-repo-url> checklist
> ```
>
> Then come back here and run `/audit-init`.
>
> Want me to walk you through what the checklist covers first?

If they say yes, go to **Step 3: Explain the System**.

### If in a workspace with no org.yaml

The user has a workspace but hasn't configured it yet:

> **Welcome! Looks like you have a workspace but haven't configured it yet.**
>
> The audit system needs to know about your organization — what cloud you use, how you deploy, what tools you rely on. This helps it ask the right questions and skip what doesn't apply.
>
> **Next step:** Run `/audit-init` — it's an interactive setup that takes about 5 minutes.
>
> Want me to explain how the system works first, or jump straight into setup?

If they want explanation, go to **Step 3**.
If they want to jump in, tell them to run `/audit-init`.

### If workspace is configured (org.yaml exists)

The user is set up. Show them where they are:

> **Welcome back! Your workspace is configured.**

Then read `org.yaml` and `projects/*.yaml` to show:

> **Organization:** [name from org.yaml]
> **Cloud:** [cloud_providers]
> **Projects:** [list each project name, or "none yet"]

Then based on what exists:

- **No projects configured:** Suggest `/audit-add-project`
- **Projects exist, no audits:** Suggest `/audit-start <project-name>`
- **Audits exist:** Suggest `/audit-status` or `/audit-continue`

Show the relevant next command, not all commands.

## Step 3: Explain the System

Walk through these concepts one at a time. After each one, pause and ask if they have questions before continuing.

### What the checklist covers

> The checklist has **42 sections** organized into domains:
>
> | Domain | What it covers |
> |--------|---------------|
> | Infrastructure & Setup | Git config, dependencies, auth, environments |
> | Database & Data | Connections, resilience, backups |
> | Monitoring & Health | Health endpoints, testing, dev workflow |
> | Deployment & Operations | Deploy pipelines, access control |
> | Observability | Monitoring, security, documentation |
> | Performance & Analytics | Performance monitoring, analytics |
> | Error Tracking | Error reporting, domain & email infrastructure |
> | Security | Secrets, rate limiting, API design, CSP, feature flags |
> | Compliance | GDPR, cost monitoring |
> | Team | Onboarding, tech debt, accessibility, i18n |
>
> Each section has **items** — specific things to verify. For example, "Can a new hire clone and run the project in under 10 minutes?" or "Are all environments behind Cloudflare?"

### How an audit works

> When you run an audit, here's what happens:
>
> 1. **You pick a project** — the system reads its config (repo URL, tech stack, environments)
> 2. **Auto-check phase** — AI agents clone your repo and verify items in parallel. They check files, git config, CI status, GitHub API, HTTP headers, DNS — anything they can verify without asking you.
> 3. **Review phase** — You see the results. Most items are already resolved. You only review the ~5-10% that need human judgment (e.g., "Is this access level appropriate?" or "Is this intentional?")
> 4. **Results** — Each item gets a markdown file with status (pass/fail/partial), evidence, and recommendations. Stored as dated snapshots in `audits/`.

### Severity levels

> Items have two severity levels:
>
> - **Critical** — Non-negotiable. Security, data integrity, production stability. Fix before shipping.
> - **Recommended** — Best practices. Improves reliability and developer experience. Address as you grow.

### Waivers

> Not every item applies to every project. If something doesn't apply:
>
> - **Waiver** (`/audit-waiver`) — "This item doesn't apply to us, and here's why." Sets the status to `waived`, with a review date. Excluded from future audits.

### Audit flows

> When you start an audit, you pick how to work through it:
>
> - **Sequential** — Section 1 through 42 in order. Best for your first audit.
> - **Priority** — All critical items first, then recommended. Good for quick wins.
> - **Section** — Pick one section, complete it, pick the next. Great for focused work.
> - **Free-form** — Jump around freely. The system tracks what's done.

## Step 4: Offer Next Steps

Based on what you learned in Step 1, offer the most relevant next action:

> **Ready to get started?**

- If no workspace: "Create your workspace and run `/audit-init`"
- If workspace but no config: "Run `/audit-init` to configure your organization"
- If config but no projects: "Run `/audit-add-project` to register your first project"
- If projects but no audits: "Run `/audit-start <project-name>` to begin your first audit"
- If audits exist: "Run `/audit-status` to see where you left off"

Only show ONE next step — don't overwhelm with the full command list. They can find that at `/checklist/commands/` or by asking.

## Tone Guidelines

- Be conversational, not formal. This is a getting-started guide, not a reference manual.
- Use concrete examples, not abstract descriptions. "Can a new hire run the project in 10 minutes?" is better than "Developer onboarding verification."
- If the user seems overwhelmed, slow down. Offer to focus on just one section.
- If the user wants to skip ahead, let them. Don't force the tutorial flow.
- Never say "it's easy" or "just do X" — respect that this is new to them.
