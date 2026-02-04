# Data Retention Audit Guide

This guide walks you through auditing a project's data retention practices, including soft delete implementation, data cleanup processes, and legal compliance.

## Before You Start

1. **Get access to the codebase** (required for this section)
2. **Identify the ORM/database layer** in use (Prisma, TypeORM, Sequelize, Drizzle, raw SQL)
3. **Identify critical tables** - ask user if not obvious (users, orders, payments, subscriptions, invoices)

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## Soft Delete Implementation

### RET-001: Critical data uses soft deletes
**Severity**: Critical

Critical business data should never be permanently deleted via regular application operations. Soft deletes preserve data for recovery, auditing, and compliance while hiding it from normal queries.

**Check automatically**:

1. **Identify critical tables** (ask user if uncertain):
```bash
# Common critical tables to check for soft delete columns
# users, orders, payments, subscriptions, invoices, transactions, accounts
```

2. **Find soft delete columns in schema**:
```bash
# Prisma schema
grep -rE "deleted_at|deletedAt|is_deleted|isDeleted" --include="*.prisma" 2>/dev/null

# SQL migrations
grep -rE "deleted_at|deletedAt|is_deleted|isDeleted" --include="*.sql" migrations/ 2>/dev/null

# TypeORM/Sequelize models
grep -rE "@DeleteDateColumn|deletedAt|paranoid" --include="*.ts" --include="*.js" src/ 2>/dev/null
```

3. **Check ORM soft delete configuration**:
```bash
# Prisma soft delete middleware/extensions
grep -rE "softDelete|@prisma/extension" --include="*.ts" src/ 2>/dev/null

# TypeORM soft delete
grep -rE "@DeleteDateColumn|softRemove|softDelete" --include="*.ts" src/ 2>/dev/null

# Sequelize paranoid mode
grep -rE "paranoid\s*:\s*true" --include="*.ts" --include="*.js" src/ 2>/dev/null

# Drizzle soft delete patterns
grep -rE "deletedAt.*timestamp|isDeleted.*boolean" --include="*.ts" src/ 2>/dev/null
```

4. **Check for hard DELETE operations on critical tables** (red flag):
```bash
# Raw DELETE statements
grep -rE "DELETE FROM\s+(users|orders|payments|subscriptions|invoices)" --include="*.ts" --include="*.sql" 2>/dev/null

# ORM hard delete methods
grep -rE "\.(delete|destroy)\s*\(" --include="*.ts" src/ 2>/dev/null | grep -v "softDelete"
```

5. **Verify delete operations use UPDATE** (soft delete pattern):
```bash
# Setting deleted_at timestamp
grep -rE "deleted_at\s*=|deletedAt\s*:|set.*deleted" --include="*.ts" src/ 2>/dev/null
```

**Ask user**:
- "Which tables do you consider critical/business-essential?"
- "Are there any tables that intentionally allow hard deletes? Why?"

**Common critical tables** (educated guess):
- users, accounts, profiles
- orders, transactions, payments, invoices
- subscriptions, memberships
- products, inventory (in e-commerce)
- documents, contracts (in document management)

**Cross-reference with**:
- RET-002 (queries must filter soft-deleted records)
- DB-006 (app user permissions - ideally no DELETE)

**Pass criteria**:
- Critical tables have soft delete columns (`deleted_at`, `deletedAt`, `is_deleted`)
- ORM configured for soft deletes (Prisma middleware, TypeORM @DeleteDateColumn, Sequelize paranoid)
- Delete operations use UPDATE to set deleted timestamp, not DELETE

**Fail criteria**:
- Critical tables allow hard DELETE
- No soft delete columns on critical tables
- ORM not configured for soft delete behavior

**Evidence to capture**:
- List of critical tables identified
- Which tables have soft delete columns
- ORM soft delete configuration
- Any hard DELETE operations found (with justification if intentional)

---

### RET-002: Soft delete queries exclude deleted records by default
**Severity**: Critical

Queries should automatically exclude soft-deleted records so deleted data doesn't leak into user-facing features. There should also be a way to include deleted records when legitimately needed (admin, audits, compliance).

**Check automatically**:

1. **Check for global query scopes/filters**:
```bash
# Prisma middleware that filters deleted records
grep -rE "prisma\.\$use|middleware.*deleted" --include="*.ts" src/ 2>/dev/null

# Prisma client extensions
grep -rE "@prisma/client/extension|defineExtension" --include="*.ts" src/ 2>/dev/null
```

2. **Check ORM built-in soft delete filtering**:
```bash
# TypeORM - @DeleteDateColumn auto-filters
grep -rE "@DeleteDateColumn" --include="*.ts" src/ 2>/dev/null

# Sequelize paranoid - auto-filters
grep -rE "paranoid\s*:\s*true" --include="*.ts" --include="*.js" src/ 2>/dev/null

# Drizzle - manual WHERE clauses needed
grep -rE "where.*deletedAt.*null|where.*isDeleted.*false" --include="*.ts" src/ 2>/dev/null
```

3. **Check for manual WHERE clauses** (if no ORM auto-filter):
```bash
# Manual soft delete filtering
grep -rE "deleted_at\s*IS\s*NULL|deletedAt\s*=\s*null|isDeleted\s*=\s*false" --include="*.ts" --include="*.sql" src/ 2>/dev/null
```

4. **Check for "include deleted" escape hatch**:
```bash
# Ways to include deleted records when needed
grep -rE "withDeleted|includeDeleted|paranoid\s*:\s*false|unscoped|withTrashed" --include="*.ts" src/ 2>/dev/null
```

5. **Look for inconsistent patterns** (some queries filter, others don't):
```bash
# Count queries that filter vs don't filter deleted records
# If using manual WHERE clauses, inconsistency is a red flag
```

**Cross-reference with**:
- RET-001 (soft delete must exist for this to apply)
- RET-005 (compliance queries may need to include deleted records)

**Pass criteria**:
- Default queries automatically exclude soft-deleted records (via ORM feature or global middleware)
- Explicit "include deleted" method exists for admin/audit use cases
- Pattern is consistent across the codebase

**Fail criteria**:
- Queries must manually add `deleted_at IS NULL` everywhere (error-prone)
- Inconsistent pattern - some queries filter, others don't
- No way to access deleted records when legitimately needed (audits, compliance)

**Evidence to capture**:
- ORM soft delete filtering mechanism in use
- Whether filtering is automatic or manual
- "Include deleted" escape hatch location
- Any inconsistencies found

---

## Data Cleanup

### RET-003: Periodic review of old soft-deleted data
**Severity**: Recommended

Soft-deleted data shouldn't accumulate forever. There should be a process (automated or manual) to periodically review old deleted records and decide whether to permanently purge them.

**Check automatically**:

1. **Look for scheduled cleanup jobs**:
```bash
# Cron job definitions
grep -rE "@Cron|cron\s*:|schedule.*delete|cleanup.*schedule" --include="*.ts" --include="*.yml" --include="*.yaml" src/ 2>/dev/null

# Node-cron or similar schedulers
grep -rE "node-cron|agenda|bull.*cleanup|bree" package.json 2>/dev/null

# Background job processors
grep -rE "queue.*retention|job.*cleanup|worker.*purge|worker.*delete" --include="*.ts" src/ 2>/dev/null
```

2. **Look for data cleanup scripts**:
```bash
# Scripts directory
ls -la scripts/*delete* scripts/*cleanup* scripts/*purge* scripts/*retention* 2>/dev/null

# Package.json scripts
grep -E "cleanup|purge|retention|archive" package.json 2>/dev/null
```

3. **Look for admin interfaces for data management**:
```bash
# Admin routes for deleted/archived data
grep -rE "deleted|archived|purge|retention" --include="*.ts" routes/ api/ app/ 2>/dev/null | grep -iE "admin|internal"

# Admin dashboard components
grep -rE "DeletedRecords|ArchivedData|DataRetention|PurgePanel" --include="*.tsx" --include="*.ts" src/ 2>/dev/null
```

4. **Check for retention period configuration**:
```bash
# Environment variables or config
grep -rE "RETENTION|retention.*days|DELETE_AFTER|PURGE_AFTER" --include="*.ts" --include="*.env*" --include="*.yml" 2>/dev/null
```

**Ask user** (if no automated process found):
- "Do you have a manual process for reviewing soft-deleted data?"
- "How often do you review deleted records for permanent deletion?"
- "Who is responsible for data retention decisions?"

**Cross-reference with**:
- RET-004 (hard delete capability)
- RET-005 (legal holds may prevent deletion)

**Pass criteria**:
- Documented process for reviewing soft-deleted data (automated or manual)
- Process runs periodically (quarterly, annually, etc.)
- Someone is accountable for this review

**Fail criteria**:
- No process exists - deleted data accumulates indefinitely
- "We'll deal with it later" without a concrete plan

**Evidence to capture**:
- Retention review mechanism (scheduled job, script, manual process)
- Review frequency
- Owner/accountable party
- Retention period (if defined)

---

### RET-004: Hard delete after review period
**Severity**: Recommended

After the review period, there should be a way to actually purge soft-deleted records. This shouldn't happen automatically without review, but the capability must exist.

**Check automatically**:

1. **Look for hard delete capability**:
```bash
# Permanent delete methods
grep -rE "hardDelete|permanentDelete|forceDelete|purge|destroy.*force" --include="*.ts" src/ 2>/dev/null

# Raw DELETE statements (intentional purge)
grep -rE "DELETE FROM" --include="*.ts" --include="*.sql" scripts/ 2>/dev/null

# ORM force delete
grep -rE "\.destroy\(.*force|\.delete\(.*force|softRemove.*false" --include="*.ts" src/ 2>/dev/null
```

2. **Check retention period configuration**:
```bash
# How long before soft-deleted data is purged
grep -rE "retention.*period|RETENTION_DAYS|DELETE_AFTER_DAYS|purge.*days" --include="*.ts" --include="*.env*" --include="*.yml" 2>/dev/null
```

3. **Look for purge scripts or jobs**:
```bash
# Purge/cleanup scripts
find . -type f \( -name "*purge*" -o -name "*cleanup*" -o -name "*retention*" \) 2>/dev/null

# Scheduled purge jobs
grep -rE "purge|cleanup.*deleted|remove.*old" --include="*.ts" src/jobs/ src/workers/ src/cron/ 2>/dev/null
```

4. **Check for audit logging of purges**:
```bash
# Logging what was deleted
grep -rE "log.*purge|log.*delete|audit.*purge" --include="*.ts" src/ 2>/dev/null
```

**Cross-reference with**:
- RET-003 (review must happen before purge)
- RET-005 (legal holds override purge)

**Pass criteria**:
- Hard delete mechanism exists (script, job, or admin action)
- Retention period defined (e.g., "purge after 90 days soft-deleted")
- Purge is auditable (logs what was deleted, when, by whom)
- Purge is gated (not fully automatic - requires review or approval)

**Fail criteria**:
- No way to actually delete data (storage grows forever)
- Automatic purge without review step
- No defined retention period
- Purges not logged/auditable

**Evidence to capture**:
- Hard delete mechanism location
- Retention period configuration
- Audit/logging for purge operations
- Approval/gating mechanism (if any)

---

## Legal Compliance

### RET-005: Legal retention requirements respected
**Severity**: Critical

Some data must be retained for legal, regulatory, or compliance reasons (GDPR, HIPAA, SOX, tax laws). The purge process must respect these requirements - certain records should not be deletable even after the normal retention period.

**Check automatically**:

1. **Look for legal hold flags in schema**:
```bash
# Legal hold columns
grep -rE "legal_hold|legalHold|do_not_delete|doNotDelete|retention_required|retentionRequired|compliance_hold" --include="*.prisma" --include="*.ts" --include="*.sql" 2>/dev/null
```

2. **Look for retention policy documentation**:
```bash
# Documentation mentioning retention/compliance
find . -type f \( -name "*.md" -o -name "*.txt" \) -exec grep -liE "retention|compliance|gdpr|hipaa|sox|legal.*hold|data.*retention" {} \; 2>/dev/null

# Specific policy files
ls -la docs/*retention* docs/*compliance* docs/*privacy* RETENTION* COMPLIANCE* 2>/dev/null
```

3. **Check for compliance-aware purge logic**:
```bash
# Purge logic that checks legal holds
grep -rE "legal_hold|compliance|retention.*check|can.*delete|deletable" --include="*.ts" src/ 2>/dev/null

# Skip logic in cleanup jobs
grep -rE "skip.*legal|exclude.*hold|where.*legal_hold.*false" --include="*.ts" src/ 2>/dev/null
```

4. **Check for data retention configuration per type**:
```bash
# Different retention periods for different data types
grep -rE "retention.*user|retention.*order|retention.*transaction|retention.*\{" --include="*.ts" --include="*.yml" 2>/dev/null
```

**Ask user**:
- "What compliance requirements affect your data retention?" (GDPR, HIPAA, SOX, PCI-DSS, tax laws, industry-specific)
- "Which data types have legally mandated retention periods?"
- "Do you have a written data retention policy?"
- "How do you handle legal holds (litigation, audits)?"

**Common retention requirements** (for reference):
- **Tax records**: Often 7 years
- **Financial transactions**: Varies by jurisdiction (5-10 years)
- **Healthcare (HIPAA)**: 6 years from creation or last effective date
- **SOX compliance**: 7 years for audit records
- **GDPR**: Minimize retention, delete when no longer necessary
- **Legal holds**: Indefinite during litigation

**Cross-reference with**:
- GDPR-001 (right to be forgotten - tension with retention requirements)
- RET-004 (purge must check legal holds first)

**Pass criteria**:
- Compliance requirements identified and documented
- Legal hold mechanism exists (flag to prevent deletion)
- Retention periods defined per data type where legally required
- Purge process checks legal holds before deleting
- Written retention policy exists

**Fail criteria**:
- No awareness of compliance requirements
- No mechanism to prevent deletion of legally-required data
- Purge process ignores legal requirements
- No documented retention policy

**Evidence to capture**:
- Compliance requirements identified (GDPR, HIPAA, etc.)
- Legal hold mechanism (schema column, flag, or process)
- Retention periods per data type
- Retention policy document location
- How purge respects legal holds

---

## Completing the Audit

After checking all items:

1. **Summarize results**:
   - RET-001: PASS/FAIL (Critical) - Soft deletes for critical data
   - RET-002: PASS/FAIL (Critical) - Query filtering for deleted records
   - RET-003: PASS/FAIL (Recommended) - Periodic review process
   - RET-004: PASS/FAIL (Recommended) - Hard delete capability
   - RET-005: PASS/FAIL (Critical) - Legal retention compliance

2. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority

3. **Common recommendations**:
   - If no soft deletes: Add `deleted_at` column to critical tables, configure ORM soft delete
   - If queries don't filter: Add Prisma middleware or use ORM's built-in soft delete filtering
   - If no review process: Establish quarterly review of soft-deleted data, assign owner
   - If no purge capability: Create admin script for permanent deletion with audit logging
   - If no legal awareness: Document compliance requirements, add legal hold flag to schema

4. **Maturity assessment**:
   - **Level 1**: No soft deletes - hard deletes everywhere
   - **Level 2**: Soft deletes exist but queries don't consistently filter
   - **Level 3**: Soft deletes with proper filtering, but no cleanup process
   - **Level 4**: Full lifecycle - soft delete, filtering, periodic review, legal holds

5. **Record audit date** and auditor
