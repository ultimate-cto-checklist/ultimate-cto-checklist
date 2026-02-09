# Rollback & Recovery Audit Guide

This guide walks you through auditing a project's rollback and disaster recovery capabilities - deployment rollback, database migration rollback, and full recovery from backups.

## The Goal: Two-Minute Recovery

When things go wrong, speed matters. Every minute of downtime costs trust. This audit ensures you can undo mistakes fast.

- **Documented** — Deployment rollback procedures can be executed quickly (under 2 minutes) by any team member
- **Migration-aware** — Database rollback strategies exist, especially for destructive schema changes
- **Full-stack** — Disaster recovery procedures cover restoring the entire system from backups
- **Tested** — Rollback and recovery procedures have been validated and actually work
- **Objective-driven** — Recovery objectives (RTO/RPO) are defined and achievable with current infrastructure

## Before You Start

1. **Identify deployment platform** (Vercel, Railway, Fly.io, K8s, custom CI/CD)
2. **Identify database and migration tool** (Prisma, Drizzle, Knex, etc.)
3. **Identify backup strategy** (provider snapshots, S3, PITR)
4. **Check for existing runbooks** (disaster recovery documentation)

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## Rollback Strategy

### RR-001: Rollback procedure documented
**Severity**: Critical

A documented rollback procedure ensures anyone on the team can quickly revert a bad deployment without figuring it out under pressure.

**Check automatically**:

1. **Look for rollback documentation**:
```bash
# Search docs for rollback procedures
grep -riE "rollback|revert|roll back" docs/ README.md CLAUDE.md runbooks/ --include="*.md" 2>/dev/null

# Check deployment scripts for rollback commands
grep -riE "rollback|revert" deploy/ .github/ scripts/ --include="*.sh" --include="*.yml" 2>/dev/null
```

2. **Check if using platforms with built-in rollback**:
```bash
# Vercel - instant rollback via dashboard
grep -E "vercel" package.json vercel.json 2>/dev/null

# Railway - instant rollback via dashboard
grep -E "railway" package.json railway.json 2>/dev/null

# Fly.io - `fly releases rollback`
find . -name "fly.toml" 2>/dev/null

# Kubernetes - `kubectl rollout undo`
find . -name "*.yaml" -exec grep -l "kind: Deployment" {} \; 2>/dev/null
```

**Ask user**:
- "Is the rollback procedure documented?"
- "Who can perform a rollback?"
- "Does everyone on the team know how to do it?"

**Cross-reference with**:
- RR-003 (rollback speed) - documented procedure enables fast execution
- Section 10/11 (deployment) - rollback is part of deployment workflow
- Section 35 (incident response) - rollback may be in runbooks

**Pass criteria**:
- Written procedure for how to rollback a bad deploy
- Documents who can do it and how
- OR uses platform with built-in rollback (Vercel, Railway, etc.) and team knows how

**Fail criteria**:
- No documentation
- Only verbal knowledge ("ask Bob")
- Platform has rollback but nobody knows how to use it

**Evidence to capture**:
- Location of rollback docs
- Platform being used and its rollback capabilities
- Who has access to trigger rollback

---

### RR-002: Rollback tested regularly
**Severity**: Recommended

An untested rollback procedure may not work when you need it. Regular testing ensures the team is practiced and the procedure is current.

**Check automatically**:

1. **Look for rollback testing records**:
```bash
# Check for rollback testing in CI/CD or docs
grep -riE "rollback.*test|test.*rollback|disaster.*drill|recovery.*test" .github/ docs/ runbooks/ --include="*.yml" --include="*.md" 2>/dev/null

# Check for scheduled drills
grep -riE "drill|exercise|regularly|monthly|quarterly" docs/ runbooks/ --include="*.md" 2>/dev/null | grep -iE "rollback|recovery|disaster"
```

**Ask user**:
- "When was the last time you tested a rollback? (Last month = good, never = bad)"
- "Do you have scheduled disaster recovery drills?"
- "Has everyone on the team done a rollback at least once?"

**Cross-reference with**:
- RR-001 (documented procedure) - can't test what isn't documented
- RR-006 (recovery procedure tested) - same principle applies to full recovery
- Section 35 (incident response) - drills should include rollback scenarios

**Pass criteria**:
- Rollback tested at least quarterly (or after major infra changes)
- Multiple team members have done it (not just one person)
- Last test date is documented

**Fail criteria**:
- Never tested ("we'll figure it out when we need it")
- Only one person has ever done it
- Last test was > 1 year ago

**Evidence to capture**:
- Date of last rollback test
- How many team members have performed a rollback
- Whether there's a schedule for regular testing

---

### RR-003: Can rollback in < 2 minutes
**Severity**: Critical

Speed matters during incidents. A rollback that takes 10+ minutes extends the outage. Target: under 2 minutes from decision to live.

**Check automatically**:

1. **Check deployment platform**:
```bash
# Vercel - instant rollback via dashboard or CLI
grep -E "vercel" package.json vercel.json 2>/dev/null

# Railway - instant rollback via dashboard
grep -E "railway" package.json railway.json 2>/dev/null

# Fly.io - `fly releases rollback`
find . -name "fly.toml" 2>/dev/null

# Kubernetes - `kubectl rollout undo`
find . -name "*.yaml" -exec grep -l "kind: Deployment" {} \; 2>/dev/null

# Check for rollback scripts
find . -name "*rollback*" -o -name "*revert*" 2>/dev/null | grep -v node_modules
```

2. **Check CI/CD pipeline duration** (if rollback goes through CI):
```bash
# Check for pipeline config
cat .github/workflows/*.yml 2>/dev/null | head -100
```

**Rollback speed tiers**:
| Speed | Method |
|-------|--------|
| Instant (< 30 sec) | Vercel, Railway, Fly.io dashboard click, K8s rollout undo |
| Fast (< 2 min) | Git revert + fast CI/CD pipeline |
| Slow (> 5 min) | Manual deploy process, long CI pipelines, approval gates |

**Ask user**:
- "How do you deploy? (Platform with instant rollback vs manual CI/CD)"
- "How long does your CI/CD pipeline take?"
- "Are there approval gates that slow down emergency rollbacks?"

**Cross-reference with**:
- RR-001 (documented procedure) - speed comes from clear process
- RR-002 (tested regularly) - testing reveals actual time
- FF-002 (kill switches) - sometimes faster than rollback, use as complement

**Pass criteria**:
- Can rollback production in under 2 minutes
- No blocking approval gates for emergency rollbacks
- Process is known and practiced

**Fail criteria**:
- Rollback requires full CI/CD run (> 5 min)
- Approval gates block emergency rollbacks
- Nobody knows how long it actually takes

**Notes**:
Kill switches (Section 33) can disable features in seconds, which is faster than any rollback. For critical features, consider: kill switch first (instant), then rollback if needed (< 2 min).

**Evidence to capture**:
- Deployment platform and its rollback mechanism
- Measured or estimated rollback time
- Any blockers (approval gates, long pipelines)

---

### RR-004: Database migration rollback plan
**Severity**: Critical

Code rollback is useless if the database schema is incompatible. Destructive migrations (DROP COLUMN, DROP TABLE) require special consideration.

**Check automatically**:

1. **Identify migration tool**:
```bash
# Check for migration tools
grep -E "prisma|drizzle|knex|typeorm|sequelize|migrate" package.json 2>/dev/null
```

2. **Check for migrations**:
```bash
# Find migration files
find . -path ./node_modules -prune -o -name "*migration*" -type f -print 2>/dev/null
ls migrations/ prisma/migrations/ drizzle/ db/migrations/ 2>/dev/null

# Check for down migrations (reversible)
find . -path ./node_modules -prune -o -name "*.sql" -type f -exec grep -l "DOWN\|down\|rollback" {} \; 2>/dev/null | head -5
```

3. **Check for destructive migrations**:
```bash
# Find DROP statements (irreversible without backup)
find . -path ./node_modules -prune -o -name "*.sql" -type f -exec grep -l "DROP TABLE\|DROP COLUMN" {} \; 2>/dev/null | head -5
```

4. **Check for migration rollback documentation**:
```bash
grep -riE "migration.*rollback|rollback.*migration|down migration" docs/ README.md CLAUDE.md --include="*.md" 2>/dev/null
```

**Migration tool considerations**:
| Tool | Rollback Support |
|------|------------------|
| Prisma | No built-in down migrations. Rollback = previous schema + manual SQL or backup restore |
| Drizzle | Supports down migrations if written |
| Knex | Supports down migrations if written |
| TypeORM | Supports down migrations if written |

**Ask user**:
- "What migration tool do you use?"
- "Do you write down/rollback migrations?"
- "For destructive migrations (DROP), what's the recovery plan?"
- "Do you test migrations on staging with production-like data first?"

**Cross-reference with**:
- RR-001 (rollback procedure) - migrations are part of overall rollback
- Section 26 (backups) - backup restore may be the only rollback for destructive migrations
- Section 5/6 (database) - migration practices

**Pass criteria**:
- Migration tool in use with clear rollback strategy
- Destructive migrations have documented recovery plan (backup restore, manual SQL)
- Migrations tested on staging before production
- Team knows the difference between reversible and irreversible migrations

**Fail criteria**:
- No rollback strategy ("we just fix forward")
- Destructive migrations with no backup plan
- Migrations go straight to production untested
- Using Prisma but thinking `prisma migrate reset` is a rollback (it's not - it drops everything)

**Evidence to capture**:
- Migration tool in use
- Whether down migrations are written
- Strategy for destructive migrations
- Staging testing process

---

## Emergency Recovery

### RR-005: Document "Server down → back up from backups"
**Severity**: Critical

If your primary infrastructure is completely gone, you need written steps to restore everything from scratch. This isn't about rollback - it's about total recovery.

**Check automatically**:

1. **Look for disaster recovery documentation**:
```bash
# Search for DR docs
grep -riE "disaster.*recovery|restore.*backup|recovery.*procedure|server.*down" docs/ runbooks/ README.md CLAUDE.md --include="*.md" 2>/dev/null

# Check for restore scripts
find . -name "*restore*" -o -name "*recovery*" 2>/dev/null | grep -v node_modules
```

2. **Check for infrastructure-as-code** (makes recovery easier):
```bash
# Terraform, Pulumi, CDK
find . -name "*.tf" -o -name "pulumi.*" -o -name "cdk.*" 2>/dev/null | head -5
ls terraform/ pulumi/ cdk/ infrastructure/ 2>/dev/null
```

**What the document should cover**:
1. Where are backups stored? (S3, provider snapshots, etc.)
2. How to access them in emergency?
3. How to provision new infrastructure?
4. How to restore database from backup?
5. How to restore application state?
6. How to update DNS/routing to new infrastructure?
7. Who has permissions to do this?

**Ask user**:
- "If your primary server and database were completely gone, do you have written steps to restore?"
- "Where are your backups stored? (Same provider = risky, different provider = better)"
- "Who has access to restore from backups?"
- "Is infrastructure defined as code (Terraform, Pulumi) or manual?"

**Cross-reference with**:
- RR-006 (recovery procedure tested) - document is useless if untested
- RR-007/RR-008 (RTO/RPO) - recovery doc should mention time objectives
- Section 26 (backups) - backups must exist before you can restore them

**Pass criteria**:
- Written step-by-step recovery procedure exists
- Covers full stack (infra, database, application)
- Multiple people can execute it
- Backups are stored separately from primary infrastructure

**Fail criteria**:
- No written procedure ("we'll figure it out")
- Only covers partial recovery (database but not infra)
- Only one person knows how
- Backups on same provider/region as primary (could be lost together)

**Evidence to capture**:
- Location of disaster recovery documentation
- Backup storage location(s)
- Whether infrastructure is codified
- Who has restore permissions

---

### RR-006: Recovery procedure tested
**Severity**: Critical

Untested backups are Schrödinger's backups - you don't know if they work until you try. Many teams discover their backups are corrupted or incomplete only during a real disaster.

**Check automatically**:

1. **Look for recovery test records**:
```bash
# Search for DR test documentation
grep -riE "dr.*test|disaster.*drill|recovery.*test|tested.*recovery" docs/ runbooks/ --include="*.md" 2>/dev/null

# Check for test dates
grep -riE "last.*tested|tested.*on|drill.*date" docs/ runbooks/ --include="*.md" 2>/dev/null
```

**Ask user**:
- "Have you ever done a full restore from backups to a clean environment?"
- "When was the last disaster recovery drill?"
- "Did the drill include database restore, not just application redeploy?"
- "What problems did you discover during testing?"

**What a proper test covers**:
1. Provision fresh infrastructure (or use DR environment)
2. Restore database from backup
3. Deploy application
4. Verify data integrity
5. Verify application functionality
6. Measure time taken (validates RTO)
7. Document issues found

**Cross-reference with**:
- RR-005 (recovery documented) - test validates the documentation
- RR-007 (RTO) - test measures actual recovery time
- RR-002 (rollback tested) - similar principle, different scope
- Section 26 (backups) - tests verify backups are actually restorable

**Pass criteria**:
- Full recovery tested at least annually
- Test included database restore (not just app redeploy)
- Issues found during test were fixed
- Test results documented with time measurements

**Fail criteria**:
- Never tested ("backups exist, that's enough")
- Only tested app redeploy, never database restore
- Test failed and issues weren't fixed
- No record of when/how testing was done

**Evidence to capture**:
- Date of last recovery test
- Scope of test (full stack vs partial)
- Time taken to recover
- Issues discovered and their resolution status

---

### RR-007: Know RTO (Recovery Time Objective)
**Severity**: Recommended

RTO is the maximum acceptable time from incident start to service restoration. It drives infrastructure decisions and should be agreed with stakeholders.

**Check automatically**:

1. **Look for RTO documentation**:
```bash
# Search for RTO mentions
grep -riE "RTO|recovery.*time.*objective|time.*to.*recover|downtime.*target" docs/ runbooks/ README.md CLAUDE.md SLA* --include="*.md" 2>/dev/null

# Check for SLA documentation
find . -name "*sla*" -o -name "*SLA*" 2>/dev/null | grep -v node_modules
```

**RTO tiers and required strategies**:
| RTO | Strategy Required |
|-----|-------------------|
| < 1 min | Hot standby, automatic failover |
| < 15 min | Warm standby, quick promotion |
| < 1 hour | Pre-provisioned DR environment |
| < 4 hours | Restore from backups to fresh infra |
| < 24 hours | Manual recovery acceptable |

**Ask user**:
- "What's the maximum acceptable downtime for your service?"
- "Is this documented/agreed with stakeholders?"
- "Does your current infrastructure support achieving this RTO?"
- "Have you measured actual recovery time in drills?"

**Cross-reference with**:
- RR-006 (recovery tested) - tests measure actual recovery time
- RR-008 (RPO) - related objective, often defined together
- Section 26 (HA/backups) - infrastructure must support RTO
- RR-005 (recovery documented) - procedure should mention RTO target

**Pass criteria**:
- RTO is defined (even informally: "we need to be up within 4 hours")
- RTO is realistic given current infrastructure
- Team knows the RTO and it influences decisions
- Actual recovery time (from drills) meets or beats RTO

**Fail criteria**:
- No idea what acceptable downtime is
- RTO is defined but infrastructure can't achieve it
- RTO exists on paper but team doesn't know it
- Never measured actual recovery time

**Evidence to capture**:
- Defined RTO (or lack thereof)
- Whether it's documented/agreed with business
- Actual measured recovery time from drills
- Gap between target RTO and actual capability

---

### RR-008: Know RPO (Recovery Point Objective)
**Severity**: Recommended

RPO is the maximum acceptable data loss measured in time. It drives backup frequency and replication strategy.

**Check automatically**:

1. **Look for RPO documentation**:
```bash
# Search for RPO mentions
grep -riE "RPO|recovery.*point.*objective|data.*loss|backup.*frequency|point.*in.*time" docs/ runbooks/ README.md CLAUDE.md SLA* --include="*.md" 2>/dev/null
```

2. **Check backup frequency**:
```bash
# Check for backup schedules
grep -riE "backup.*schedule|cron.*backup|daily.*backup|hourly.*backup" .github/ scripts/ terraform/ --include="*.yml" --include="*.tf" --include="*.sh" 2>/dev/null

# Check for point-in-time recovery (PITR)
grep -riE "point_in_time|pitr|continuous.*backup" terraform/ infrastructure/ --include="*.tf" 2>/dev/null
```

**RPO tiers and required strategies**:
| RPO | Strategy Required |
|-----|-------------------|
| 0 (no data loss) | Synchronous replication, multi-region writes |
| < 1 min | Async replication, streaming WAL |
| < 1 hour | Point-in-time recovery (PITR) |
| < 24 hours | Daily backups |
| < 1 week | Weekly backups |

**Ask user**:
- "How much data loss is acceptable? (1 hour? 1 day?)"
- "What's your backup frequency?"
- "Do you have point-in-time recovery enabled for your database?"
- "Is RPO agreed with stakeholders/business?"

**Cross-reference with**:
- RR-007 (RTO) - often defined together as recovery objectives
- RR-005/RR-006 (recovery docs/testing) - RPO should be mentioned and validated
- Section 26 (backups) - backup frequency determines achievable RPO

**Pass criteria**:
- RPO is defined (even informally: "losing a day of data would be bad")
- Backup frequency supports the RPO (daily backups = 24h RPO max)
- Team understands the tradeoff (tighter RPO = higher cost)
- For critical data: PITR enabled or frequent backups

**Fail criteria**:
- No idea what acceptable data loss is
- Backup frequency doesn't match expectations (weekly backups but expect no data loss)
- RPO defined but infrastructure doesn't support it
- Never verified backup restore point (might be older than expected)

**Evidence to capture**:
- Defined RPO (or lack thereof)
- Actual backup frequency
- Whether PITR is enabled
- Gap between target RPO and actual capability

---

## Completing the Audit

After checking all items:

1. **Summarize results**:
   - RR-001: PASS/FAIL (Critical) - Rollback procedure documented
   - RR-002: PASS/FAIL (Recommended) - Rollback tested regularly
   - RR-003: PASS/FAIL (Critical) - Can rollback in < 2 minutes
   - RR-004: PASS/FAIL (Critical) - Database migration rollback plan
   - RR-005: PASS/FAIL (Critical) - Recovery from backups documented
   - RR-006: PASS/FAIL (Critical) - Recovery procedure tested
   - RR-007: PASS/FAIL (Recommended) - Know RTO
   - RR-008: PASS/FAIL (Recommended) - Know RPO

2. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority

3. **Common recommendations**:
   - If no rollback docs: Document the procedure, even if it's just "click rollback in Vercel"
   - If rollback is slow: Switch to platform with instant rollback or optimize CI/CD
   - If no migration rollback plan: Document strategy per migration type (reversible vs destructive)
   - If no DR documentation: Start with database restore steps, then expand
   - If never tested: Schedule a drill within 30 days
   - If no RTO/RPO: Have conversation with stakeholders to define expectations

4. **Maturity assessment**:
   - **Level 1**: No rollback capability - redeploy from scratch only
   - **Level 2**: Basic rollback - works but slow, undocumented
   - **Level 3**: Documented rollback - procedure exists, team knows it
   - **Level 4**: Tested rollback - regularly drilled, < 2 min execution
   - **Level 5**: Full DR capability - tested recovery, defined RTO/RPO, meets objectives

5. **Record audit date** and auditor
