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
