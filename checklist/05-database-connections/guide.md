# Database & Connections Audit Guide

Verification guide for database configuration, migrations, users, and access controls.

## The Goal: Hardened Data Layer

The database should be configured for production load, protected by least-privilege access, and impossible to accidentally destroy. Migrations should be tested before they touch production.

- **Pooled** — explicit connection limits and timeouts configured
- **Tested** — migrations verified in CI against ephemeral databases
- **Least-privilege** — app user cannot DROP, read-only user available
- **Restricted** — admin credentials limited to 1-2 critical personnel
- **Documented** — Redis critical data and admin tools properly protected

## Before You Start

1. Confirm you're in the target repository's root directory
2. Have database credentials or read-only access available for manual checks
3. Know your database type (PostgreSQL, MySQL, etc.) for correct commands
4. Have access to CI configuration (GitHub Actions)
5. Have the user available for manual verification questions (DB-004, DB-005, DB-008, DB-009)

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## DB-001: Connection pooling and optimization configured

**Severity**: Critical

**Check automatically**:

1. Look for Prisma schema database config:
   ```bash
   grep -r "connection_limit\|pool_timeout" prisma/schema.prisma
   ```

2. Check DATABASE_URL for pool parameters:
   ```bash
   grep -E "connection_limit|pool_timeout|connect_timeout" .env.example .env.local 2>/dev/null
   ```

3. Look for Prisma client instantiation with explicit pool config:
   ```bash
   grep -r "new PrismaClient" --include="*.ts" --include="*.js" -A 10
   ```

**Pass criteria**:
- Pool limit explicitly configured (not using defaults)
- Connection timeout configured
- Idle timeout configured

**Fail criteria**:
- No pool configuration found
- Using default/unlimited connections
- No timeout settings

**Evidence to capture**:
- Pool size setting
- Connection timeout value
- Idle timeout value
- Location of configuration

---

## DB-002: CI verifies migrations on ephemeral test DB

**Severity**: Critical

**Check automatically**:

1. Look for migration commands in CI workflows:
   ```bash
   grep -r "prisma migrate\|prisma db push" .github/workflows/ 2>/dev/null
   ```

2. Check for Docker database in CI:
   ```bash
   grep -r "postgres:\|mysql:\|services:" .github/workflows/ 2>/dev/null
   ```

3. Verify migration runs against test DB (not dry-run only):
   ```bash
   grep -r "migrate deploy\|migrate dev" .github/workflows/ 2>/dev/null
   ```

**Pass criteria**:
- CI pipeline includes migration step
- Migrations applied to Docker-based ephemeral test database
- Not just dry-run or status check

**Fail criteria**:
- No migration step in CI
- Migrations only run manually
- Dry-run only without actual application

**Evidence to capture**:
- CI config file path
- Migration command used
- Database service configuration in CI

---

## DB-003: AI-assisted migration review with human override

**Severity**: Recommended

**Check automatically**:

1. Look for migration review automation in CI:
   ```bash
   grep -r "migration\|schema" .github/workflows/ -A 5 | grep -i "review\|danger\|comment"
   ```

2. Check for Danger.js or similar PR automation:
   ```bash
   ls dangerfile.ts dangerfile.js .danger/ 2>/dev/null
   ```

3. Look for documented migration review process:
   ```bash
   grep -ri "migration" README.md CONTRIBUTING.md docs/ 2>/dev/null | grep -i "review\|approve"
   ```

**Risky patterns to flag**:
- `DROP TABLE`, `DROP COLUMN`
- `ALTER COLUMN` (type changes)
- `DELETE`, `TRUNCATE`
- Removing `NOT NULL` constraints
- Renaming columns (can break app)

**If no automation found, ask user**:
- Is there a documented process for migration review?
- Who must approve migrations before merge?

**Pass criteria**:
- Automated review mechanism exists, OR
- Documented manual review process with human approval requirement

**Fail criteria**:
- No review process for migrations
- Migrations can be merged without oversight

**Evidence to capture**:
- Review mechanism (automated tool or documented process)
- Approval requirements

---

## DB-004: Database users documented (including read-only user)

**Severity**: Critical

**This is a guided manual check.**

**Prompt user**:
> Please provide evidence of your database users and their permissions.
>
> For PostgreSQL, run: `\du` or `SELECT usename, usesuper, usecreatedb FROM pg_user;`
>
> For MySQL, run: `SELECT user, host FROM mysql.user;` and `SHOW GRANTS FOR 'username'@'host';`
>
> Provide:
> 1. List of all database users
> 2. Purpose of each user (app, migrations, admin, read-only, etc.)
> 3. Permission level for each user

**Verify**:
- All users are documented with purpose
- A read-only user exists for safe debugging/reporting
- Permissions match stated purpose

**Pass criteria**:
- Complete list of DB users provided
- Each user has documented purpose
- Read-only user exists
- Permissions are appropriate for each role

**Fail criteria**:
- Users not documented
- No read-only user available
- Permissions don't match stated purpose

**Evidence to capture**:
- List of users with purposes
- Confirmation of read-only user
- Permission grants for each user

---

## DB-005: App user cannot DROP DATABASE

**Severity**: Critical

**This is a guided manual check.**

**Prompt user**:
> Please provide the `SHOW GRANTS` output for the application database user.
>
> For PostgreSQL: `\du app_user` or check `pg_roles`
>
> For MySQL: `SHOW GRANTS FOR 'app_user'@'%';`

**Verify**:
- No `DROP` privilege on database level
- No `ALL PRIVILEGES` on database level
- Ideally limited to: SELECT, INSERT, UPDATE, DELETE on specific tables

**Pass criteria**:
- App user cannot DROP DATABASE
- Permissions are scoped to necessary operations only

**Fail criteria**:
- DROP privilege exists
- ALL PRIVILEGES granted at database level

**Evidence to capture**:
- GRANTS output for app user
- Confirmation of restricted permissions

**Cross-reference with**:
- DB-004 (should be one of the documented users)

---

## DB-006: Soft delete pattern implemented

**Severity**: Recommended

**Check automatically**:

1. Look for soft delete columns in Prisma schema:
   ```bash
   grep -E "deleted_at|deletedAt|is_deleted|isDeleted" prisma/schema.prisma
   ```

2. Check for soft delete middleware or filters:
   ```bash
   grep -r "deletedAt\|deleted_at\|softDelete" --include="*.ts" --include="*.js" src/
   ```

3. Look for deletion service or job:
   ```bash
   grep -r "hard.?delete\|permanent.?delete\|purge" --include="*.ts" --include="*.js" -i
   ```

**If soft delete patterns found, ask user**:
- Does a separate service handle permanent deletions?
- What is the retention period before hard delete?

**If no soft delete found, ask user**:
- Is hard delete intentional for this project?
- What data is being deleted and why is soft delete not used?

**Pass criteria**:
- Soft delete pattern in place, OR
- Documented exception with justification

**Fail criteria**:
- Hard deletes with no audit trail
- No documented deletion strategy

**Evidence to capture**:
- Soft delete column locations
- Deletion service/job if exists
- Retention policy

---

## DB-007: Redis documented if storing critical data

**Severity**: Recommended

**Check automatically**:

1. Detect Redis usage:
   ```bash
   grep -r "REDIS_URL\|redis://" .env.example .env.local 2>/dev/null
   grep "ioredis\|redis" package.json 2>/dev/null
   grep -r "redis:" docker-compose*.yml 2>/dev/null
   ```

2. If Redis found, scan for critical data patterns:
   ```bash
   # Session storage
   grep -r "connect-redis\|RedisStore\|express-session" --include="*.ts" --include="*.js"

   # Job queues
   grep -r "BullMQ\|Bull\|bee-queue" --include="*.ts" --include="*.js"

   # Pub/sub for critical events
   grep -r "\.subscribe\|\.publish" --include="*.ts" --include="*.js" | grep -i redis
   ```

3. Check for cache-only indicators (all operations have TTL):
   ```bash
   grep -r "\.set\|\.setex" --include="*.ts" --include="*.js" | grep -i redis
   ```

**Pass criteria**:
- No Redis used, OR
- Redis is cache-only (all keys have TTL), OR
- Critical Redis usage is documented (connection users, data stored, backup strategy)

**Fail criteria**:
- Redis stores critical data (sessions, queues) without documentation

**Evidence to capture**:
- Redis usage type (cache-only, sessions, queues, etc.)
- Documentation location if critical data stored

---

## DB-008: DB admin tools on-demand and Zero Trust protected

**Severity**: Critical

**This is a guided manual check.**

**Prompt user**:
> How do you manage database admin tools (phpMyAdmin, Adminer, pgAdmin)?
>
> Please provide:
> 1. What tool is used (if any)
> 2. How it's deployed (always-on, on-demand, separate service)
> 3. How access is protected (Zero Trust, VPN, IP whitelist)
> 4. Who can spin it up and when it's turned off

**Verify**:
- Tool is not always running in production
- Protected behind Cloudflare Zero Trust when active
- Clear process for spinning up and down

**Pass criteria**:
- No DB admin tool used, OR
- Tool is on-demand only AND behind Zero Trust

**Fail criteria**:
- DB admin tool running 24/7 in production
- No access protection when active

**Evidence to capture**:
- Tool used
- Deployment method
- Zero Trust policy or equivalent protection
- Access procedure

**Cross-reference with**:
- Section 04 (Environments) - Zero Trust for dev/staging

---

## DB-009: Admin password restricted to critical people

**Severity**: Critical

**This is a guided manual check.**

**Prompt user**:
> Who has access to the database admin credentials (full write access)?
>
> Please confirm:
> 1. Names/roles of people with admin DB access (should be 1-2 max)
> 2. How credentials are stored (secret manager, not plain text)
> 3. Credentials are NOT in shared password manager accessible to all devs
> 4. Credentials are NOT in plain text (env files, Slack, docs)

**Verify**:
- Limited to critical people only (CTO, lead DevOps)
- Stored securely in secret manager
- Not widely accessible

**Pass criteria**:
- 1-2 people max have admin credentials
- Credentials stored in secret manager
- Not shared broadly

**Fail criteria**:
- More than 2-3 people have admin access
- Credentials in shared password manager or plain text
- No clear ownership of admin access

**Evidence to capture**:
- Who has access (roles, not names for privacy)
- Storage method for credentials

**Cross-reference with**:
- Section 29 (Secrets Management)
