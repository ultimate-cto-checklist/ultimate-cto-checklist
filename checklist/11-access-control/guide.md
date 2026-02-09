# Access Control Audit Guide

This guide walks you through auditing a project's access control model, ensuring production access is minimal, tiered appropriately, and that access holders meet security requirements.

## The Goal: Least Privilege, Verified

Production access is a liability. Every person with access is a potential attack vector, compliance risk, and operational burden. The goal is minimal, justified, secure access with clear accountability.

- **Tiered** — Separate access lists for production, staging, and development with documented approval chains
- **Minimal** — Production access granted only with clear justification; fewer people means smaller blast radius
- **Verified** — Every production access holder meets security requirements: device encryption, MFA, endpoint protection
- **Reviewed** — Periodic access audits with clear ownership ensure access stays minimal over time

## Before You Start

1. Confirm you have access to cloud IAM (GCP, AWS, or Azure)
2. Know the project IDs for production, staging, and dev environments
3. Have `gh` CLI authenticated for repository access checks
4. Identify who manages access control for the organization

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## Tiered Access

### ACCESS-001: Tiered access model documented and approved
**Severity**: Critical

**Check automatically**:

1. **Cloud IAM - GCP**:
   ```bash
   # List IAM bindings for production project
   gcloud projects get-iam-policy PROJECT_ID --format=json

   # Compare with staging
   gcloud projects get-iam-policy STAGING_PROJECT_ID --format=json

   # Count members with elevated roles
   gcloud projects get-iam-policy PROJECT_ID --format=json | jq '[.bindings[] | select(.role | test("owner|admin|editor"; "i")) | .members[]] | unique | length'
   ```

2. **Cloud IAM - AWS**:
   ```bash
   # List IAM users/roles with production access
   aws iam list-users --query 'Users[].UserName'

   # Check who can access production resources
   aws iam get-account-authorization-details --filter LocalManagedPolicy
   ```

3. **GitHub repository access**:
   ```bash
   # List collaborators with their permission level
   gh api repos/{owner}/{repo}/collaborators --jq '.[] | {login, role_name}'

   # List teams with access
   gh api repos/{owner}/{repo}/teams --jq '.[] | {name, permission}'
   ```

4. **Check for documented & approved access lists**:
   ```bash
   # Look for access policy docs
   find . -type f -name "*.md" | xargs grep -liE "access.*(control|policy|tier)|who.*access|permissions" 2>/dev/null
   ```

**For database access verification**:

If direct CLI access available:
```bash
# PostgreSQL - list users
psql -h $PROD_DB_HOST -U admin -c "\du"

# MySQL - list users
mysql -h $PROD_DB_HOST -u admin -e "SELECT user, host FROM mysql.user;"
```

**If direct DB access not available, ask user**:
"Please run the following queries and provide the output as evidence:
- **PostgreSQL**: `\du` or `SELECT usename, usesuper, usecreatedb FROM pg_user;`
- **MySQL**: `SELECT user, host FROM mysql.user;`
- **Cloud SQL/RDS**: Provide screenshot or export of database users from console

Provide results for: (1) Production DB (2) Staging DB (3) Dev DB"

**Cross-reference with**:
- DB-004 (Database users & permissions)
- ADMIN-002 (Admin user audits)

**Pass criteria**:
- Access lists are **documented** (who has access to what)
- Access lists are **approved** (sign-off from appropriate person)
- Prod has fewer users than staging
- Staging has fewer users than dev
- Principle of least privilege visible

**Fail criteria**:
- No documented access list
- Access exists but not approved/reviewed
- Same users everywhere (flat access)
- Prod has more users than staging (inverted)

**If cloud CLI not available, ask user**:
"Unable to query IAM directly. Please provide:
1. Who has production access? (list names/emails)
2. Who has staging access?
3. Who has dev access?
4. Where is this access documented?
5. Who approved the current access list?"

**Evidence to capture**:
- IAM binding counts per environment
- Database user counts per environment
- Access documentation location
- Last access review/approval date
- Approver name

---

## Production Access

### ACCESS-002: Production access is minimal
**Severity**: Critical

**Check automatically**:

1. **Count production log access**:
   ```bash
   # GCP - who can view logs?
   gcloud projects get-iam-policy PROJECT_ID --format=json | jq '[.bindings[] | select(.role | test("logging.viewer|logging.admin"; "i")) | .members[]] | unique | length'

   # AWS CloudWatch - who has logs access?
   aws iam get-account-authorization-details --filter LocalManagedPolicy | jq '.Policies[] | select(.PolicyName | test("CloudWatch|Logs"; "i"))'
   ```

2. **Count production database access**:
   ```bash
   # GCP Cloud SQL - who can access?
   gcloud sql instances describe INSTANCE_NAME --format=json | jq '.settings.ipConfiguration.authorizedNetworks'

   # Count DB users with login access
   # (ask user to run if no direct access)
   ```

3. **Count production infrastructure access**:
   ```bash
   # GCP - owners/editors (should be minimal)
   gcloud projects get-iam-policy PROJECT_ID --format=json | jq '[.bindings[] | select(.role | test("owner|editor"; "i")) | .members[]] | unique'
   ```

**If CLI not available, ask user**:
"Please provide counts for production environment:
1. How many people can view production **logs**? (Target: 1-2)
2. How many people can access production **database**? (Target: as few as possible)
3. How many people have production **infrastructure** access (console, SSH, etc.)?

Provide names and their justification for having access."

**Cross-reference with**:
- ACCESS-001 (Tiered access exists)
- ACCESS-003 (Security requirements for prod access holders)

**Pass criteria**:
- Production log access: 1-2 people
- Production DB access: Limited to essential personnel only
- Each person with prod access has documented justification
- No "everyone has prod access" patterns

**Fail criteria**:
- More than 2-3 people with prod log access
- Broad prod DB access (entire team)
- No justification for who has access
- Service accounts with unnecessary prod access

**Evidence to capture**:
- Number of people with prod log access
- Number of people with prod DB access
- Names of prod access holders
- Justification for each (documented or provided by user)

---

## Security Requirements

### ACCESS-003: Production access holders meet security requirements
**Severity**: Critical

**Check automatically**:

1. **Check for documented security requirements**:
   ```bash
   # Look for security policy / access requirements docs
   find . -type f -name "*.md" | xargs grep -liE "security.*(posture|requirement|standard)|prod.*access.*require|access.*policy" 2>/dev/null
   ```

2. **Check for security tooling enforcement** (MDM, endpoint protection):
   ```bash
   # Look for references to security tools in docs
   grep -riE "jamf|kandji|intune|crowdstrike|sentinel|mdm|endpoint.*(protection|security)" . 2>/dev/null
   ```

**This is primarily manual verification. Ask user**:

"For each person with production access, verify the following security requirements:

**Device Security**:
- [ ] Device has full-disk encryption enabled
- [ ] Device has MDM/endpoint management (Jamf, Kandji, Intune, etc.)
- [ ] Device has endpoint protection (CrowdStrike, SentinelOne, etc.)
- [ ] Device auto-locks after inactivity

**Account Security**:
- [ ] MFA enabled on all accounts (cloud console, VPN, etc.)
- [ ] Hardware key (YubiKey) preferred over SMS/TOTP
- [ ] Password manager in use (no reused passwords)

**Access Security**:
- [ ] VPN or Zero Trust required for prod access
- [ ] Access logged and auditable
- [ ] Access reviewed periodically (quarterly minimum)

Please confirm:
1. Are these requirements documented?
2. Who verifies compliance?
3. When was the last verification?
4. What happens if someone fails verification?"

**Cross-reference with**:
- ACCESS-001 (Access documented and approved)
- ACCESS-002 (Minimal prod access)
- ENV-004 (Environment protection - Zero Trust)

**Pass criteria**:
- Security requirements for prod access are documented
- Requirements are enforced (not just written down)
- Compliance is verified periodically
- Clear process for revoking access if requirements not met

**Fail criteria**:
- No documented security requirements
- Requirements exist but not enforced
- No verification process
- Prod access granted without security vetting

**Evidence to capture**:
- Security requirements document location
- Enforcement mechanism (MDM, manual checks, etc.)
- Last compliance verification date
- Who is responsible for verification
- List of prod access holders and their compliance status

---

## Completing the Audit

After checking all items:

1. **Summarize results**:
   - ACCESS-001: PASS/FAIL (Critical)
   - ACCESS-002: PASS/FAIL (Critical)
   - ACCESS-003: PASS/FAIL (Critical)

2. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority

3. **Common recommendations**:
   - If no tiered access: Implement separate IAM policies per environment
   - If access not documented: Create access control matrix document
   - If too many prod users: Audit and revoke unnecessary access
   - If no security requirements: Define and document security posture requirements
   - If requirements not enforced: Implement MDM/endpoint management
   - If no periodic review: Schedule quarterly access reviews

4. **Record audit date** and auditor
