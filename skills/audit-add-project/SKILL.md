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

> What's the project name? (Used for folder names and references)
>
> Examples: backend-api, mobile-app, admin-dashboard

Validate: lowercase, alphanumeric + hyphens only

### Step 2: Codebase Path

> Where's the codebase located?
>
> Enter the absolute path or path relative to this workspace:

Validate: Path exists and contains code (has package.json, go.mod, etc.)

### Step 3: Project Type

> What type of project is this?
>
> 1. Backend API / Service
> 2. Frontend Web App
> 3. Mobile App
> 4. Library / Package
> 5. Infrastructure / IaC
> 6. Monorepo (contains multiple)
> 7. Other

### Step 4: Repository (Optional)

> What's the GitHub/GitLab repo? (for API-based checks)
>
> Format: owner/repo (e.g., acme-corp/backend-api)
> Or press Enter to skip

### Step 5: Tech Stack (Optional)

> What's the tech stack? (Select all that apply, or Enter to skip)
>
> Languages:
> 1. TypeScript/JavaScript
> 2. Python
> 3. Go
> 4. Java/Kotlin
> 5. Ruby
> 6. Rust
> 7. Other
>
> Frameworks (if web):
> 1. React
> 2. Vue
> 3. Next.js
> 4. Express
> 5. FastAPI
> 6. Django
> 7. Other

### Step 6: Environments (Optional)

> What environments does this project have?
>
> 1. dev, staging, prod (standard)
> 2. dev, prod (simple)
> 3. Custom (specify)
> 4. Skip for now

### Step 7: URLs (Optional)

> What are the key URLs? (Enter to skip each)
>
> Production URL:
> Health endpoint:

### Step 8: Scope (Optional)

> Which checklist sections apply to this project?
>
> 1. All sections (default)
> 2. Exclude specific sections
> 3. Include only specific sections

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

Show:

> Project "[name]" added!
>
> Created: projects/[name].yaml
>
> **Quick check of the codebase:**
> [Run a few auto-detectable checks]
> - Found package.json
> - Found .github/workflows
> - Found tests/ directory
>
> **Ready to audit:**
> Run `/audit-start [name]` to begin auditing this project.
>
> Or add another project with `/audit-add-project`.

## Auto-Detection

When path is provided, try to auto-detect:
- Languages (from file extensions, package files)
- Frameworks (from dependencies)
- Test presence
- CI presence

Offer to pre-fill answers based on detection:

> I detected this appears to be a TypeScript/Node.js project using Express.
> Should I use these defaults? (y/n)
