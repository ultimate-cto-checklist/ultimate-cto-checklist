---
name: audit-preflight
description: Verify that required CLI tools are installed and authenticated before running audits. Guides users through fixing any gaps.
---

# Audit Preflight

You are checking the user's environment to make sure all the tools needed for auditing are installed and authenticated. This ensures newcomers get a smooth first-run experience.

**Note:** Called automatically from `/audit-init` and `/audit-start`. Can also be run directly with `/audit-preflight`.

## When to Run

- Before `/audit-init` (first-time setup)
- Before `/audit-start` (each audit session)
- On demand when the user asks

## Check Sequence

Run all checks, collect results, then present a single summary. Do NOT stop at the first failure — check everything so the user can fix all issues at once.

### 1. Core Tools (Always Required)

These are required regardless of org configuration:

#### Git

```bash
git --version
```

- **Pass:** Version is printed
- **Fail:** Not installed. Tell the user: `brew install git` (macOS) or see https://git-scm.com

#### Node.js / npx

```bash
node --version
npx --version
```

- **Pass:** Both return versions (Node 18+ recommended)
- **Fail:** Not installed. Tell the user: `brew install node` or use `nvm install --lts`
- **Why needed:** Schema validation (`npx tsx checklist/schema/validate.ts`) runs during every audit

#### GitHub CLI

```bash
gh --version
```

- **Pass:** Version is printed
- **Fail:** Not installed. Tell the user: `brew install gh` or see https://cli.github.com

If installed, check authentication:

```bash
gh auth status
```

- **Pass:** Shows authenticated user and scopes
- **Fail:** Not authenticated. Tell the user to run: `! gh auth login`
  (The `!` prefix runs it in the current session so the interactive login works)

Check that the auth token has the right scopes for auditing:

```bash
gh auth status 2>&1
```

Look for `repo` scope. If missing, suggest: `! gh auth refresh -s repo,read:org`

#### Claude Code

Check that they're running inside Claude Code (they must be, since they're using skills). Note this for completeness but don't fail — if they're reading this, they have it.

### 2. Cloud Provider Tools (Based on org.yaml)

If `org.yaml` exists, read the `cloud_providers` list. For each provider, check the corresponding CLI:

#### AWS

Only check if `cloud_providers` includes `aws`:

```bash
aws --version
```

If installed, check authentication:

```bash
aws sts get-caller-identity
```

- **Pass:** Returns account ID and ARN
- **Fail (not installed):** `brew install awscli` or see https://aws.amazon.com/cli/
- **Fail (not authenticated):** Tell the user to run: `! aws configure` or `! aws sso login`

#### Google Cloud

Only check if `cloud_providers` includes `gcp`:

```bash
gcloud --version 2>/dev/null | head -1
```

If installed, check authentication:

```bash
gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null
```

- **Pass:** Returns an active account
- **Fail (not installed):** `brew install --cask google-cloud-sdk` or see https://cloud.google.com/sdk/docs/install
- **Fail (not authenticated):** Tell the user to run: `! gcloud auth login`

Also check the project is set:

```bash
gcloud config get-value project 2>/dev/null
```

If unset, suggest: `! gcloud config set project PROJECT_ID`

#### Azure

Only check if `cloud_providers` includes `azure`:

```bash
az --version 2>/dev/null | head -1
```

If installed:

```bash
az account show 2>/dev/null
```

- **Pass:** Returns subscription info
- **Fail (not installed):** `brew install azure-cli` or see https://learn.microsoft.com/en-us/cli/azure/install-azure-cli
- **Fail (not authenticated):** Tell the user to run: `! az login`

### 3. Source Control Access

If `org.yaml` has a `source_control.org` field (GitHub org name), verify access:

```bash
gh api orgs/{org_name} --jq '.login' 2>/dev/null
```

- **Pass:** Returns the org name
- **Fail:** User may not have access to the org, or the org name is wrong

### 4. Project Repo Access (if running before audit-start)

If a project name is provided or can be inferred, check that the repo is accessible:

```bash
gh api repos/{owner}/{repo} --jq '.full_name' 2>/dev/null
```

- **Pass:** Repo is accessible
- **Fail:** Check permissions or repo URL in project config

## Present Results

Show a clean summary table:

```
## Environment Check

| Tool          | Status | Details                          |
|---------------|--------|----------------------------------|
| Git           | Pass   | v2.43.0                          |
| Node.js       | Pass   | v20.11.0                         |
| GitHub CLI    | Pass   | v2.42.0, authenticated as @user  |
| AWS CLI       | Pass   | v2.15.0, account 123456789       |
| gcloud        | Fail   | Not installed                    |
| Org access    | Pass   | acme-corp                        |

### Action needed

1. **Install Google Cloud SDK:**
   ```
   brew install --cask google-cloud-sdk
   ```
   Then authenticate:
   ```
   ! gcloud auth login
   ```
```

## Behavior Based on Results

### All pass

> Your environment is ready. All required tools are installed and authenticated.

Continue with the calling skill (audit-init or audit-start).

### Some failures — core tools

If any core tool (git, node, gh) is missing or unauthenticated:

> **Some required tools need attention.** The audit system needs these to function.
> Fix the items above, then run `/audit-preflight` to verify.

**Do NOT proceed** with audit-init or audit-start until core tools pass.

### Some failures — cloud tools only

If core tools pass but cloud CLIs are missing:

> **Cloud tools are missing.** Some audit sections check cloud infrastructure directly.
> You can proceed, but sections that need [AWS/GCP/Azure] access will be marked as **blocked**.
>
> Continue anyway? (y/n)

If the user says yes, proceed. The audit will mark cloud-dependent items as blocked.

### No org.yaml yet

If running before audit-init (no org.yaml exists), only check core tools. Cloud tools will be checked again after org.yaml is created.

## Error Handling

- If a command hangs (e.g., `aws sts get-caller-identity` with expired creds), use a 10-second timeout
- If org.yaml has providers you don't recognize, skip them with a note
- Never fail silently — always report what was checked and what was skipped
