# Secrets Management Audit Guide

This guide walks you through auditing a project's secrets management practices - how secrets are stored, loaded, and protected.

## The Goal: Zero Leaked Secrets

Secrets should be impossible to leak through code, impossible to access without authorization, and impossible to share across environments.

- **Managed secrets** — production credentials in a dedicated secret manager with rotation and audit trails
- **Environment injection** — secrets loaded via environment variables at startup, never read from files at runtime
- **No git exposure** — nothing committed to version control, with scanning to prevent future leaks
- **Isolated environments** — dev, staging, and prod use completely separate credentials
- **Least privilege** — access follows principle of minimal permissions with proper service accounts and controls

## Before You Start

1. **Identify deployment target** (GCP, AWS, Azure, self-hosted, etc.)
2. **Identify secret manager in use** (GCP Secret Manager, AWS Secrets Manager, Vault, Doppler, etc.)
3. **Understand deployment method** (Kubernetes, Docker, serverless, VMs, etc.)
4. **Check for existing secret scanning tools** (gitleaks, trufflehog, GitHub secret scanning)

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## Secret Storage

### SEC-001: Use Secret Manager or Equivalent
**Severity**: Critical

Production secrets must be managed by a dedicated secret manager (not plain files or environment variables in config). The secret manager should support rotation and provide audit trails.

**Check automatically**:

1. **Check for secrets manager integrations**:
```bash
# Node.js/TypeScript
grep -rE "@google-cloud/secret-manager|@aws-sdk/client-secrets-manager|node-vault|hashi-vault-js|doppler|infisical|@1password" package.json 2>/dev/null

# Python
grep -rE "google-cloud-secret-manager|boto3.*secretsmanager|hvac|python-dotenv" requirements*.txt pyproject.toml 2>/dev/null

# Check for SDK usage in code
grep -rE "SecretManager|SecretsManager|Vault\.read|doppler|infisical" src/ lib/ app/ 2>/dev/null
```

2. **Check deployment configs for secret injection**:
```bash
# Kubernetes secrets
grep -rE "secretKeyRef|secretRef|envFrom.*secretRef" k8s/ kubernetes/ manifests/ 2>/dev/null

# Docker Compose secrets
grep -rE "secrets:" docker-compose*.yml 2>/dev/null

# Cloud Run / App Engine
grep -rE "secretKeyRef|SECRET_" app.yaml cloudbuild.yaml 2>/dev/null
```

3. **Check CI/CD for secret injection** (not hardcoded):
```bash
# GitHub Actions - should use secrets context
grep -rE '\$\{\{ secrets\.' .github/workflows/ 2>/dev/null
```

4. **Check for rotation support**:
```bash
# AWS rotation config
grep -rE "rotation|RotationSchedule" terraform/ cloudformation/ 2>/dev/null

# Vault rotation policies
grep -rE "ttl|max_ttl|rotation" vault/ 2>/dev/null
```

**Ask user**:
- "Which secret manager do you use?" (GCP Secret Manager, AWS Secrets Manager, Vault, Doppler, etc.)
- "Is secret rotation configured?"
- "Where can you see audit logs for secret access?"

**Cross-reference with**:
- SEC-002 (secrets loaded into environment)
- SEC-003 (not stored on filesystem)
- GIT-016 (no credentials in repo)

**Pass criteria**:
- Production secrets managed by dedicated secret manager
- Rotation capability exists (even if not automated for all secrets)
- Audit trail available for secret access

**Fail criteria**:
- No secret manager - secrets in plain files or hardcoded
- No rotation capability
- No audit trail for who accessed secrets

**Evidence to capture**:
- Secret manager in use (name)
- Rotation policy (automatic, manual, or none)
- Where audit logs are accessible
- How secrets reach the application (injection method)

---

### SEC-002: Secrets Loaded into Process Environment
**Severity**: Critical

Secrets should be injected into the process environment at startup, not read from files at runtime. The application reads from `process.env` / `os.environ` / equivalent.

**Check automatically**:

1. **Check application reads from environment variables**:
```bash
# Node.js - process.env usage
grep -rE "process\.env\." src/ lib/ app/ --include="*.ts" --include="*.js" 2>/dev/null | head -20

# Python - os.environ or os.getenv
grep -rE "os\.environ|os\.getenv" src/ app/ --include="*.py" 2>/dev/null | head -20

# Go - os.Getenv
grep -rE "os\.Getenv" . --include="*.go" 2>/dev/null | head -20
```

2. **Check for proper config patterns** (centralized config loading):
```bash
# Config file that loads from env
ls -la src/config* lib/config* app/config* config/ 2>/dev/null

# Environment validation at startup (good pattern)
grep -rE "required.*env|validateEnv|envalid|zod.*env|env-var" src/ lib/ 2>/dev/null
```

3. **Check deployment passes env vars** (not files):
```bash
# Kubernetes env injection
grep -rE "env:|envFrom:" k8s/ kubernetes/ manifests/ 2>/dev/null

# Docker Compose environment
grep -rE "environment:" docker-compose*.yml 2>/dev/null

# Systemd service (should use Environment= or EnvironmentFile=)
grep -rE "Environment=|EnvironmentFile=" *.service 2>/dev/null
```

4. **Check for anti-patterns** (reading secrets from files at runtime):
```bash
# Reading .env files in production code (anti-pattern)
grep -rE "dotenv\.config|load_dotenv|godotenv" src/ lib/ app/ 2>/dev/null

# Direct file reads for secrets
grep -rE "readFileSync.*secret|readFile.*key\.pem|readFile.*\.env" src/ lib/ 2>/dev/null
```

**Ask user**:
- "Does your app read secrets from environment variables or config files?"
- "Is dotenv/similar used in production?" (acceptable for local dev only)

**Cross-reference with**:
- SEC-001 (secret manager - source of the env vars)
- SEC-003 (not stored on filesystem)
- ENV-002 (environment tiers)

**Pass criteria**:
- Application reads secrets via `process.env` / `os.environ` / equivalent
- Secrets injected into environment at deploy time (not read from files)
- Centralized config pattern validates required env vars at startup
- dotenv only used for local development, not production

**Fail criteria**:
- Secrets read from filesystem in production
- No environment variable usage - hardcoded or file-based
- dotenv used in production to load `.env` files from disk

**Evidence to capture**:
- How secrets reach the process (env injection method)
- Config pattern used (centralized validation or scattered)
- Whether dotenv is dev-only or also used in prod

---

### SEC-003: Not Stored on File System
**Severity**: Critical

Secrets should not exist as files on production servers. They exist only in memory after being injected via environment. No `.env` files, no key files deployed from the codebase.

**Check automatically**:

1. **Check for secret files in deployment artifacts**:
```bash
# .env files that might be deployed
find . -name ".env" -o -name ".env.production" -o -name ".env.prod" 2>/dev/null | grep -v node_modules

# Check if .env files are gitignored (they should be)
grep -E "^\.env" .gitignore 2>/dev/null

# Secret/key files that shouldn't exist in deployable code
find . -name "*.pem" -o -name "*.key" -o -name "*secret*" -o -name "*credential*" 2>/dev/null | grep -v node_modules | grep -v test
```

2. **Check deployment doesn't copy secret files**:
```bash
# Dockerfile copying .env files (anti-pattern)
grep -E "COPY.*\.env|ADD.*\.env" Dockerfile* 2>/dev/null

# CI/CD writing secrets to files
grep -rE "echo.*>.*\.env|cat.*>.*secret|write.*\.env" .github/workflows/ 2>/dev/null
```

3. **Check for file-based secret loading patterns** (anti-pattern in prod):
```bash
# Reading secrets from files
grep -rE "readFileSync.*\.env|read_file.*secret|ioutil\.ReadFile.*secret" src/ lib/ app/ 2>/dev/null

# Config pointing to file paths for secrets
grep -rE "SECRET_FILE|KEY_PATH|CREDENTIALS_PATH" src/ lib/ app/ 2>/dev/null
```

4. **Check deployment documentation** for file-based instructions:
```bash
# Docs mentioning scp or copying env files to servers
grep -rE "scp.*\.env|copy.*\.env.*server|upload.*secret" README.md docs/ DEPLOY.md 2>/dev/null
```

**Ask user**:
- "How do secrets reach your production servers?"
- "Are any `.env` files or secret files present on production hosts?"
- "Does deployment involve copying secret files to servers?"

**Cross-reference with**:
- SEC-001 (secret manager is the alternative)
- SEC-002 (environment injection is the alternative)
- GIT-016 (no credentials in repo)
- INFRA-002 (Cloudflare/infrastructure security)

**Pass criteria**:
- No `.env` or secret files deployed to production servers
- Secrets exist only in memory (injected via environment)
- No file-based secret loading in production code
- Deployment process doesn't copy secret files
- TLS certificates managed by infrastructure (Cloudflare, cert-manager) or secret manager, not committed to repo

**Fail criteria**:
- `.env` files present on production servers
- Secrets stored in files on disk (even if "secured")
- Deployment docs mention copying secret files
- Application reads secrets from filesystem in production
- TLS certificates committed to repo or deployed from codebase

**Evidence to capture**:
- Presence of secret files in deployment
- How secrets reach production (injection vs file copy)
- How TLS certificates are managed (Cloudflare, cert-manager, secret manager)

---

## Secret Security

### SEC-004: No Secrets Committed to Git
**Severity**: Critical

Secrets must never be committed to version control. Secret scanning should be in place to prevent accidental commits and detect any past leaks.

**Check automatically**:

1. **Check for secret scanning tools**:
```bash
# Git hooks for secret detection
ls -la .husky/pre-commit .git/hooks/pre-commit 2>/dev/null
grep -rE "gitleaks|detect-secrets|trufflehog|git-secrets" .husky/ .git/hooks/ .pre-commit-config.yaml 2>/dev/null

# GitHub secret scanning (check repo settings via API)
gh api repos/{owner}/{repo} --jq '.security_and_analysis.secret_scanning.status' 2>/dev/null

# CI-based scanning
grep -rE "gitleaks|trufflehog|detect-secrets" .github/workflows/ 2>/dev/null
```

2. **Check .gitignore covers secrets**:
```bash
# Common secret file patterns that should be ignored
grep -E "^\.env|\.pem$|\.key$|credentials|secrets" .gitignore 2>/dev/null
```

3. **Scan for secrets in repo** (use gitleaks or similar):
```bash
# If gitleaks is available
gitleaks detect --source . --no-git 2>/dev/null

# Basic pattern check (not comprehensive)
grep -rE "AKIA[0-9A-Z]{16}|sk-[a-zA-Z0-9]{48}|ghp_[a-zA-Z0-9]{36}" --include="*.ts" --include="*.js" --include="*.py" --include="*.json" . 2>/dev/null | grep -v node_modules
```

4. **Check git history for past leaks** (important - secrets in history are still exposed):
```bash
# Search recent commits for secret patterns
git log --oneline -20 --all -p 2>/dev/null | grep -E "password.*=|api_key.*=|secret.*=" | head -10
```

**Ask user**:
- "Do you have pre-commit hooks for secret detection?"
- "Is GitHub secret scanning enabled?"
- "Have you ever had to rotate credentials due to accidental commit?"

**Cross-reference with**:
- SEC-001 (secret manager - the right way)
- GIT-016 (no credentials in repo - related item)
- SEC-003 (not stored on filesystem)

**Pass criteria**:
- Secret scanning tool in place (pre-commit hook or CI)
- GitHub secret scanning enabled (if using GitHub)
- .gitignore covers common secret patterns
- No secrets detected in current codebase or history

**Fail criteria**:
- No secret scanning configured
- Secrets found in codebase or git history
- .gitignore doesn't cover secret files
- History of leaked credentials without rotation

**Evidence to capture**:
- Secret scanning tool in use
- GitHub secret scanning status
- Any secrets found (redacted)
- Whether git history has been cleaned (if past leaks)

---

### SEC-005: Different Secrets Per Environment
**Severity**: Recommended

Each environment (dev, staging, prod) should have completely separate credentials. Compromising one environment's secrets should not expose others.

**Check automatically**:

1. **Check secret manager has environment separation**:
```bash
# Look for env-specific secret naming patterns in code
grep -rE "SECRET.*prod|SECRET.*staging|SECRET.*dev|getSecret.*env|secret.*environment" src/ lib/ app/ 2>/dev/null

# Check for environment prefixes in secret references
grep -rE "projects/.*/secrets/prod-|projects/.*/secrets/staging-|/prod/|/staging/|/dev/" src/ lib/ terraform/ 2>/dev/null
```

2. **Check deployment configs use different secret sources per env**:
```bash
# Kubernetes - different secrets per namespace/env
grep -rE "secretName:|secretKeyRef:" k8s/ kubernetes/ manifests/ 2>/dev/null

# Environment-specific deployment files
ls -la k8s/prod/ k8s/staging/ k8s/dev/ deploy/prod/ deploy/staging/ 2>/dev/null
ls -la .env.example .env.development .env.staging .env.production 2>/dev/null
```

3. **Check CI/CD has separate secrets per environment**:
```bash
# GitHub Actions environment-specific secrets
grep -rE "environment:" .github/workflows/ 2>/dev/null
grep -rE "secrets\.(PROD_|STAGING_|DEV_)" .github/workflows/ 2>/dev/null
```

4. **Check for hardcoded environment detection** (ensures right secrets load):
```bash
# Environment variable determines which secrets to load
grep -rE "NODE_ENV|APP_ENV|ENVIRONMENT" src/config* lib/config* app/config* 2>/dev/null
```

**Ask user**:
- "Do dev, staging, and prod use completely separate credentials?"
- "If staging DB password leaked, would prod be compromised?"
- "How are environment-specific secrets organized in your secret manager?"

**Cross-reference with**:
- SEC-001 (secret manager)
- ENV-001 (environment tiers)
- ENV-003 (staging requirements)

**Pass criteria**:
- Each environment (dev, staging, prod) has its own set of secrets
- Compromising one environment's secrets doesn't expose others
- Secret manager organized by environment (folders, prefixes, or separate projects)
- CI/CD uses environment-specific secret contexts

**Fail criteria**:
- Same database credentials across environments
- Same API keys shared between staging and prod
- No environment separation in secret manager
- "We just use the same secrets everywhere"

**Evidence to capture**:
- How environments are separated in secret manager
- Whether credentials are truly isolated per environment
- Any shared secrets (and justification if intentional)

---

### SEC-006: Least Privilege Access to Secrets
**Severity**: Recommended

Access to secrets should follow the principle of least privilege. Applications use dedicated service accounts with scoped access. Humans have limited access to production secrets with audit trails.

**Check automatically**:

1. **Check secret manager IAM/access policies**:
```bash
# GCP - check IAM bindings for Secret Manager
gcloud secrets list --format="value(name)" 2>/dev/null | head -5
# Then for each: gcloud secrets get-iam-policy SECRET_NAME

# AWS - check Secrets Manager resource policies
aws secretsmanager list-secrets --query 'SecretList[].Name' 2>/dev/null | head -5

# Terraform IAM configurations
grep -rE "secretmanager|secrets_manager" terraform/ --include="*.tf" 2>/dev/null | head -10
```

2. **Check for role-based access patterns**:
```bash
# Terraform/IaC defining secret access
grep -rE "secretAccessor|SecretsManagerReadWrite|secret.*policy" terraform/ cloudformation/ 2>/dev/null

# Service accounts with secret access
grep -rE "serviceAccount.*secret|role.*secret" terraform/ k8s/ 2>/dev/null
```

3. **Check application service accounts** (should have minimal permissions):
```bash
# Kubernetes service account annotations
grep -rE "serviceAccountName:|iam.gke.io/gcp-service-account" k8s/ kubernetes/ 2>/dev/null

# Check if app uses dedicated service account (not default)
grep -rE "serviceAccount:" k8s/ kubernetes/ 2>/dev/null
```

4. **Check for overly broad access patterns** (anti-patterns):
```bash
# Everyone can access all secrets (bad)
grep -rE "allUsers|allAuthenticatedUsers|\*.*secret" terraform/ 2>/dev/null

# Admin/owner roles for secret access (should be reader/accessor)
grep -rE "roles/owner|roles/editor|AdministratorAccess" terraform/ 2>/dev/null | grep -i secret
```

**Ask user**:
- "Who can access production secrets?" (should be minimal)
- "Do applications have dedicated service accounts with scoped access?"
- "Can developers read production secrets directly?"
- "Is there an approval process for production secret access?"

**Cross-reference with**:
- SEC-001 (secret manager - where access is controlled)
- ACCESS-001 (production access - related concept)
- ACCESS-002 (tiered access)
- ADMIN-002 (admin panel security - audit trails)

**Pass criteria**:
- Production secrets accessible only to production workloads + limited humans
- Applications use dedicated service accounts (not personal credentials)
- Developers cannot read production secrets without approval/audit
- Secret access follows principle of least privilege
- Access changes are logged/auditable

**Fail criteria**:
- Everyone on the team can read all secrets
- Applications use broad "admin" credentials
- No distinction between dev and prod secret access
- No audit trail for secret access grants

**Evidence to capture**:
- Who/what can access production secrets
- Service account strategy for applications
- Approval process for human access to prod secrets
- Where access grants are audited

---

## Completing the Audit

After checking all items:

1. **Summarize results**:
   - SEC-001: PASS/FAIL (Critical) - Use secret manager or equivalent
   - SEC-002: PASS/FAIL (Critical) - Secrets loaded into process environment
   - SEC-003: PASS/FAIL (Critical) - Not stored on file system
   - SEC-004: PASS/FAIL (Critical) - No secrets committed to git
   - SEC-005: PASS/FAIL (Recommended) - Different secrets per environment
   - SEC-006: PASS/FAIL (Recommended) - Least privilege access to secrets

2. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority

3. **Common recommendations**:
   - If no secret manager: Start with cloud-native (GCP Secret Manager, AWS Secrets Manager) - easy integration
   - If secrets on filesystem: Migrate to environment injection via Kubernetes secrets or secret manager SDK
   - If secrets in git: Rotate immediately, clean history with BFG or git filter-repo, add gitleaks pre-commit hook
   - If no env separation: Create separate secret paths/projects per environment, rotate shared credentials
   - If broad access: Implement service accounts, remove direct human access to prod secrets

4. **Maturity assessment**:
   - **Level 1**: Secrets in code or plain files - major security risk
   - **Level 2**: Environment files (.env) on servers - better but still risky
   - **Level 3**: Secret manager in use, injected at deploy - good baseline
   - **Level 4**: Full secret lifecycle - rotation, audit trails, least privilege, separate environments

5. **Record audit date** and auditor
