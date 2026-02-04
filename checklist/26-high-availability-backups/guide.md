# High Availability & Backups Audit Guide

This guide walks you through auditing a project's high availability configuration and backup strategy, ensuring production systems can survive failures and data can be recovered.

## Before You Start

1. **Identify database type and hosting** (RDS, Cloud SQL, self-hosted PostgreSQL/MySQL, etc.)
2. **Identify cloud provider(s)** (AWS, GCP, Azure, etc.)
3. **Understand project scale** - "serious money involved" = Critical severity for HA items
4. **Get access to cloud console/CLI** for verification commands

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## High Availability

### HA-001: Production database HA configured
**Severity**: Recommended (Critical when serious money involved)

Production databases should have automatic failover to a standby instance. If the primary fails, the standby is promoted with minimal downtime.

**Check automatically**:

1. **AWS RDS Multi-AZ**:
```bash
# Check Multi-AZ status
aws rds describe-db-instances --query "DBInstances[].{ID:DBInstanceIdentifier,MultiAZ:MultiAZ,Engine:Engine}" --output table

# Check for read replicas (can be promoted)
aws rds describe-db-instances --query "DBInstances[?ReadReplicaSourceDBInstanceIdentifier!=null].{ID:DBInstanceIdentifier,Source:ReadReplicaSourceDBInstanceIdentifier}"
```

2. **GCP Cloud SQL HA**:
```bash
# Check availability type (REGIONAL = HA, ZONAL = no HA)
gcloud sql instances list --format="table(name,availabilityType,region)"

# Detailed HA config
gcloud sql instances describe INSTANCE_NAME --format="get(settings.availabilityType)"
```

3. **Azure SQL**:
```bash
# Check zone redundancy
az sql db show --name DB_NAME --server SERVER_NAME --query "{name:name,zoneRedundant:zoneRedundant}"
```

4. **Check Terraform/IaC**:
```bash
# AWS RDS
grep -rE "multi_az\s*=\s*true" --include="*.tf" 2>/dev/null

# GCP Cloud SQL
grep -rE "availability_type\s*=\s*\"REGIONAL\"" --include="*.tf" 2>/dev/null

# Self-hosted replication
grep -rE "streaming_replication|primary_conninfo|hot_standby" --include="*.tf" --include="*.conf" --include="*.yml" 2>/dev/null
```

5. **For self-hosted databases**:
```bash
# PostgreSQL streaming replication
grep -rE "primary_conninfo|recovery_target|standby_mode|hot_standby" --include="*.conf" 2>/dev/null

# MySQL replication
grep -rE "server-id|log_bin|relay-log|read_only" --include="*.cnf" --include="*.conf" 2>/dev/null

# Check Docker Compose for replication setup
grep -rE "replication|replica|standby|primary" docker-compose*.yml 2>/dev/null
```

**Ask user**:
- "Is your production database configured for high availability?"
- "What happens if the primary database node fails?"
- "Have you tested database failover?"

**Cross-reference with**:
- HA-003 (backups - HA doesn't replace backups)
- HA-005 (PITR - complementary to HA)
- DB-001 (connection pooling - may need reconfiguration during failover)

**Pass criteria**:
- Database has automatic failover to standby (Multi-AZ, REGIONAL, replication)
- Failover has been tested or documented
- RTO (Recovery Time Objective) is acceptable for business

**Fail criteria**:
- Single database instance with no standby
- "We've never tested failover"
- HA configured but never verified working

**Evidence to capture**:
- Database HA configuration (Multi-AZ, availability type, replication mode)
- Failover RTO (expected downtime during failover)
- Last failover test date (if any)

---

### HA-002: Multi-region server deployment with failover
**Severity**: Recommended (Critical when serious money involved)

Production servers should be deployed across multiple regions/data centers with the ability to failover traffic if one region goes down.

**Check automatically**:

1. **Check for multi-region deployment**:
```bash
# AWS - instances across regions
aws ec2 describe-instances --query "Reservations[].Instances[].{ID:InstanceId,AZ:Placement.AvailabilityZone,State:State.Name}" --output table

# Check for global load balancer
aws elbv2 describe-load-balancers --query "LoadBalancers[].{Name:LoadBalancerName,Type:Type,Scheme:Scheme}" --output table

# GCP - instances across regions
gcloud compute instances list --format="table(name,zone,status)"

# Kubernetes nodes across zones
kubectl get nodes -o custom-columns=NAME:.metadata.name,ZONE:.metadata.labels."topology\.kubernetes\.io/zone"
```

2. **Check Terraform/IaC for multi-region**:
```bash
# Look for multiple region definitions
grep -rE "region\s*=|availability_zone|location\s*=" --include="*.tf" 2>/dev/null | sort | uniq

# Check for global load balancer resources
grep -rE "aws_globalaccelerator|google_compute_global|azurerm_frontdoor|cloudflare_load_balancer" --include="*.tf" 2>/dev/null
```

3. **Check Kubernetes for multi-zone**:
```bash
# Node distribution
kubectl get nodes --show-labels | grep -E "zone|region"

# Pod anti-affinity rules (spread across zones)
grep -rE "topologySpreadConstraints|podAntiAffinity" --include="*.yaml" --include="*.yml" 2>/dev/null
```

4. **Check for DNS failover**:
```bash
# Cloudflare load balancing
curl -sX GET "https://api.cloudflare.com/client/v4/zones/{zone_id}/load_balancers" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" 2>/dev/null | jq '.result[] | {name, proxied, pools}'

# Route53 health checks (DNS failover)
aws route53 list-health-checks --query "HealthChecks[].{Id:Id,Type:HealthCheckConfig.Type}" --output table
```

5. **Check for container orchestration multi-region**:
```bash
# ECS clusters
aws ecs list-clusters --query "clusterArns"

# Check Fly.io regions
grep -rE "primary_region|regions\s*=" fly.toml 2>/dev/null

# Check Railway/Render multi-region config
grep -rE "region|replicas" --include="*.toml" --include="railway.json" 2>/dev/null
```

**Ask user**:
- "Are your production servers deployed across multiple regions or data centers?"
- "What happens if one region/data center goes down?"
- "How quickly can you spin up servers in a different region if needed?"

**Acceptable alternatives to multi-region**:
- Single region with documented quick-failover capability (can deploy elsewhere within hours)
- Multi-AZ within single region (less resilient but acceptable for smaller projects)
- PaaS with built-in regional failover (Vercel, Cloudflare Workers)

**Cross-reference with**:
- HA-001 (database HA - both layers need resilience)
- MON-006 (status pages - should reflect regional status)
- Section 34 (Rollback & Recovery - RTO/RPO)

**Pass criteria**:
- Servers in 2+ regions/data centers, OR
- Single region with multi-AZ AND documented quick-failover capability
- Traffic can route away from failed region (load balancer, DNS failover)
- Failover tested or documented

**Fail criteria**:
- Single region, single AZ deployment with no failover plan
- "We'd figure it out if it happened"
- Multi-region configured but no traffic routing

**Evidence to capture**:
- Regions/zones where servers are deployed
- Failover mechanism (load balancer, DNS, manual)
- RTO for regional failover
- Last failover test date (if any)

---

## Backups

### HA-003: Production database backup configured
**Severity**: Critical

Production databases must have automated backups. This is non-negotiable regardless of project size.

**Check automatically**:

1. **AWS RDS backup settings**:
```bash
# Check backup retention and window
aws rds describe-db-instances --query "DBInstances[].{ID:DBInstanceIdentifier,BackupRetention:BackupRetentionPeriod,BackupWindow:PreferredBackupWindow,LatestRestore:LatestRestorableTime}" --output table

# List available snapshots
aws rds describe-db-snapshots --query "DBSnapshots[?Status=='available'].{ID:DBSnapshotIdentifier,Created:SnapshotCreateTime,Type:SnapshotType}" --output table | head -20
```

2. **GCP Cloud SQL backup settings**:
```bash
# Check backup configuration
gcloud sql instances describe INSTANCE_NAME --format="yaml(settings.backupConfiguration)"

# List backups
gcloud sql backups list --instance=INSTANCE_NAME --limit=10
```

3. **Azure SQL backup**:
```bash
# Check backup retention
az sql db show --name DB_NAME --server SERVER_NAME --query "{name:name,earliestRestoreDate:earliestRestoreDate}"
```

4. **Check Terraform/IaC**:
```bash
# AWS RDS backup config
grep -rE "backup_retention_period|backup_window" --include="*.tf" 2>/dev/null

# GCP Cloud SQL backup config
grep -rE "backup_configuration|enabled\s*=\s*true" --include="*.tf" 2>/dev/null
```

5. **For self-hosted/scripted backups**:
```bash
# Look for backup scripts
grep -rE "pg_dump|mysqldump|mongodump" --include="*.sh" --include="*.yml" --include="*.yaml" 2>/dev/null

# Check cron jobs for backups
grep -rE "backup|dump" /etc/cron* 2>/dev/null || echo "No cron access - ask user"

# Check for backup containers in Docker Compose
grep -rE "backup|pgbackrest|barman|wal-g" docker-compose*.yml 2>/dev/null
```

**Ask user**:
- "Are automated backups enabled for your production database?"
- "What's your backup retention period?"
- "When was the last time you verified a backup could be restored?"

**Cross-reference with**:
- HA-004 (off-site backups - backups must also be stored externally)
- HA-005 (PITR - builds on backup foundation)
- HA-006 (backup window - timing matters)

**Pass criteria**:
- Automated backups enabled
- Retention period defined (minimum 7 days recommended)
- Backups are actually running (not just configured)
- At least one restore test performed

**Fail criteria**:
- No backups configured
- Backups configured but failing (check last backup timestamp)
- "We haven't verified backups work"
- Retention period of 0 or 1 day

**Evidence to capture**:
- Backup mechanism (managed service, scripts, tools)
- Retention period
- Last successful backup timestamp
- Last restore test date (if any)

---

### HA-004: Off-site backup storage (outside primary provider)
**Severity**: Recommended (Critical when serious money involved)

Backups must be stored with a **different provider** than production. If AWS has a catastrophic failure, AWS backups won't help you.

**Check automatically**:

1. **Look for external backup destinations**:
```bash
# Check for different provider storage in backup scripts/config
grep -rE "backblaze|b2://|wasabi|r2://|idrive|rsync\.net|minio" --include="*.tf" --include="*.yml" --include="*.sh" 2>/dev/null

# If AWS production, check for GCP/Azure backup targets
grep -rE "gs://|google.*storage|azure.*blob|wasb://" --include="*.tf" --include="*.yml" --include="*.sh" 2>/dev/null

# If GCP production, check for AWS/Azure backup targets
grep -rE "s3://|aws.*s3" --include="*.tf" --include="*.yml" --include="*.sh" 2>/dev/null
```

2. **Check for S3 cross-region replication** (partial credit - still AWS):
```bash
# This is better than nothing but doesn't satisfy "outside provider"
aws s3api get-bucket-replication --bucket BACKUP_BUCKET 2>/dev/null
```

3. **Check for backup export jobs**:
```bash
# RDS export to S3 (then synced elsewhere?)
aws rds describe-export-tasks --query "ExportTasks[].{ID:ExportTaskIdentifier,Status:Status,S3Bucket:S3Bucket}" --output table 2>/dev/null

# Look for sync scripts
grep -rE "rclone|aws s3 sync|gsutil rsync" --include="*.sh" --include="*.yml" 2>/dev/null
```

4. **Check Terraform for external backup resources**:
```bash
# Backblaze B2
grep -rE "b2_bucket|backblaze" --include="*.tf" 2>/dev/null

# Cloudflare R2
grep -rE "cloudflare_r2" --include="*.tf" 2>/dev/null

# Wasabi
grep -rE "wasabi" --include="*.tf" 2>/dev/null
```

5. **Check for read replica with different provider** (rare but ideal):
```bash
# Self-hosted replica pulling from managed DB
grep -rE "primary_conninfo.*amazonaws|primary_conninfo.*cloud\.google" --include="*.conf" 2>/dev/null
```

**Ask user**:
- "If your primary cloud provider (AWS/GCP/Azure) had a catastrophic failure, where would you restore from?"
- "Are backups stored with a completely separate provider?"
- "What's your process for syncing backups to external storage?"

**Low-cost external backup options**:
- Backblaze B2 (~$5/TB/month)
- Wasabi (~$7/TB/month, no egress fees)
- Cloudflare R2 (no egress fees)
- rsync.net (SSH-based, good for pg_dump files)
- Scheduled SQL dumps uploaded via cron

**Cross-reference with**:
- HA-003 (backups exist - this item is about WHERE they're stored)
- HA-005 (PITR - off-site should include WAL archives if using PITR)
- Section 34 (Disaster Recovery - off-site enables DR)

**Pass criteria**:
- Backups exist with a **different provider** than production
- Sync process is automated (not manual)
- External backup freshness verified (not stale)
- Restoration from external backups tested

**Fail criteria**:
- All backups within same cloud provider (even if cross-region)
- "We use S3 cross-region replication" (still AWS-dependent)
- Manual sync process that hasn't run in months
- No plan for provider-wide outage

**Evidence to capture**:
- External backup destination (provider, bucket/path)
- Sync mechanism (rclone, custom script, managed service)
- Sync frequency
- Last verified external backup timestamp
- Last external restore test (if any)

---

### HA-005: Point-in-time recovery enabled
**Severity**: Critical (for production)

Point-in-time recovery (PITR) allows restoring the database to any moment, not just the last daily snapshot. Essential for recovering from accidental data deletion or corruption.

**Check automatically**:

1. **AWS RDS PITR**:
```bash
# PITR is enabled if BackupRetentionPeriod > 0
aws rds describe-db-instances --query "DBInstances[].{ID:DBInstanceIdentifier,BackupRetention:BackupRetentionPeriod,LatestRestorableTime:LatestRestorableTime}" --output table

# Check how far back you can restore
aws rds describe-db-instances --query "DBInstances[].{ID:DBInstanceIdentifier,EarliestRestore:InstanceCreateTime,LatestRestore:LatestRestorableTime}"
```

2. **GCP Cloud SQL PITR**:
```bash
# Check PITR specifically
gcloud sql instances describe INSTANCE_NAME --format="get(settings.backupConfiguration.pointInTimeRecoveryEnabled)"

# Check binary logging (required for PITR on MySQL)
gcloud sql instances describe INSTANCE_NAME --format="get(settings.backupConfiguration.binaryLogEnabled)"
```

3. **Azure SQL PITR**:
```bash
# Check earliest restore point
az sql db show --name DB_NAME --server SERVER_NAME --query "{name:name,earliestRestoreDate:earliestRestoreDate}"
```

4. **Check Terraform/IaC**:
```bash
# AWS RDS - PITR enabled via backup retention
grep -rE "backup_retention_period\s*=\s*[1-9]" --include="*.tf" 2>/dev/null

# GCP Cloud SQL PITR
grep -rE "point_in_time_recovery_enabled\s*=\s*true" --include="*.tf" 2>/dev/null
```

5. **For self-hosted PostgreSQL** (WAL archiving):
```bash
# Check for WAL archiving configuration
grep -rE "archive_mode\s*=\s*on|archive_command|wal_level\s*=\s*replica" --include="*.conf" --include="*.tf" --include="*.yml" 2>/dev/null

# Check for WAL-G or pgBackRest (common PITR tools)
grep -rE "wal-g|pgbackrest|barman" --include="*.yml" --include="*.sh" --include="docker-compose*" 2>/dev/null
```

6. **For self-hosted MySQL** (binary logging):
```bash
# Check binary log configuration
grep -rE "log_bin|binlog_format|expire_logs_days" --include="*.cnf" --include="*.conf" 2>/dev/null
```

**Ask user**:
- "Can you restore your production database to a specific point in time?"
- "What's your recovery window? (how far back can you restore?)"
- "If someone accidentally deleted critical data at 2:47 PM, could you restore to 2:46 PM?"

**Cross-reference with**:
- HA-003 (backups - PITR builds on backup infrastructure)
- HA-004 (off-site - WAL archives should also be stored off-site)
- Section 34 (RPO - PITR provides near-zero RPO)

**Pass criteria**:
- PITR enabled on production database
- Recovery window appropriate (typically 7-35 days)
- Team knows how to perform PITR restore
- PITR restore tested at least once

**Fail criteria**:
- Only daily snapshots (can't restore to specific point)
- PITR not enabled
- "We've never done a point-in-time restore"
- WAL archiving configured but failing

**Evidence to capture**:
- PITR mechanism (managed service, WAL archiving, binary logs)
- Recovery window (earliest to latest restorable time)
- Last PITR restore test (if any)
- RPO achieved with PITR (typically seconds/minutes)

---

### HA-006: Backup window appropriate for RPO
**Severity**: Recommended

Backup timing should be intentional: during low-traffic periods to minimize performance impact, and frequent enough to meet business RPO requirements.

**Check automatically**:

1. **Check backup window timing**:
```bash
# AWS RDS backup window (UTC)
aws rds describe-db-instances --query "DBInstances[].{ID:DBInstanceIdentifier,BackupWindow:PreferredBackupWindow}" --output table

# GCP Cloud SQL backup start time
gcloud sql instances describe INSTANCE_NAME --format="get(settings.backupConfiguration.startTime)"
```

2. **Check Terraform for backup window**:
```bash
# AWS RDS
grep -rE "preferred_backup_window|backup_window" --include="*.tf" 2>/dev/null

# GCP Cloud SQL
grep -rE "start_time.*backup" --include="*.tf" 2>/dev/null
```

3. **Check cron schedules for scripted backups**:
```bash
# Look for backup cron patterns
grep -rE "cron|schedule" --include="*.yml" --include="*.yaml" --include="*.sh" 2>/dev/null | grep -iE "backup|dump"

# Check Kubernetes CronJobs
kubectl get cronjobs -A 2>/dev/null | grep -iE "backup|dump"
```

4. **Check backup frequency**:
```bash
# AWS RDS - automated backups are daily, but PITR provides continuous
# Check snapshot frequency for manual snapshots
aws rds describe-db-snapshots --snapshot-type manual --query "DBSnapshots[].SnapshotCreateTime" --output text | head -10

# GCP - check backup frequency
gcloud sql instances describe INSTANCE_NAME --format="get(settings.backupConfiguration.transactionLogRetentionDays)"
```

**Ask user**:
- "When do your backups run? Is this during low-traffic periods?"
- "What's your RPO (Recovery Point Objective) - how much data loss is acceptable?"
- "Does your backup frequency match your RPO?"
- "Have you noticed performance impact during backup windows?"

**RPO considerations**:
- If RPO is 1 hour, daily backups aren't enough (need PITR or hourly snapshots)
- If RPO is 24 hours, daily backups are sufficient
- PITR with continuous WAL archiving effectively gives RPO of seconds/minutes

**Cross-reference with**:
- HA-003 (backups exist - this item is about timing)
- HA-005 (PITR - if enabled, provides continuous protection regardless of window)
- Section 34 (Rollback & Recovery - RPO/RTO definitions)
- MON-002 (database performance - backup impact on queries)

**Pass criteria**:
- Backup window defined and intentional (not just default)
- Window is during low-traffic period for the application
- Backup frequency aligns with business RPO requirements
- No significant performance degradation during backups

**Fail criteria**:
- Default backup window never reviewed
- Backups run during peak traffic causing performance issues
- RPO requirement is 1 hour but backups are daily (and no PITR)
- Backup window conflicts with other maintenance

**Evidence to capture**:
- Backup window (time in UTC and local timezone)
- Backup frequency (daily, hourly, continuous)
- Business RPO requirement
- Whether PITR fills the gap between snapshots
- Any known performance impact

---

## Completing the Audit

After checking all items:

1. **Summarize results**:
   - HA-001: PASS/FAIL (Recommended/Critical) - Database HA configured
   - HA-002: PASS/FAIL (Recommended/Critical) - Multi-region server deployment
   - HA-003: PASS/FAIL (Critical) - Database backup configured
   - HA-004: PASS/FAIL (Recommended/Critical) - Off-site backup storage
   - HA-005: PASS/FAIL (Critical) - Point-in-time recovery enabled
   - HA-006: PASS/FAIL (Recommended) - Backup window appropriate

2. **Determine severity based on project scale**:
   - "Serious money involved" (revenue-critical, high transaction volume): HA-001, HA-002, HA-004 become Critical
   - Smaller projects: HA items remain Recommended, backup items stay Critical

3. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority based on project scale

4. **Common recommendations**:
   - If no database HA: Enable Multi-AZ (RDS) or REGIONAL availability (Cloud SQL)
   - If no multi-region: Start with multi-AZ, document quick-failover procedure
   - If no off-site backups: Set up daily sync to Backblaze B2 or Cloudflare R2
   - If no PITR: Enable (usually just requires backup retention > 0 for managed DBs)
   - If poor backup window: Move to low-traffic hours, typically 2-5 AM local time

5. **Maturity assessment**:
   - **Level 1**: No backups or HA - extreme risk
   - **Level 2**: Backups exist but single region, no PITR, same-provider storage
   - **Level 3**: Backups + PITR, single region with multi-AZ, same-provider storage
   - **Level 4**: Full HA (database + servers), PITR, off-site backups, tested recovery

6. **Record audit date** and auditor
