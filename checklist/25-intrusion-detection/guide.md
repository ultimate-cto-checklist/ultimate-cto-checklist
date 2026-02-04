# Intrusion Detection Audit Guide

This guide walks you through auditing a project's intrusion detection capabilities, focusing on data exfiltration detection and alerting for smaller-budget implementations.

## Before You Start

1. **Identify infrastructure provider** (AWS, GCP, Azure, Cloudflare, etc.)
2. **Identify CDN/WAF in use** (Cloudflare, AWS WAF, Fastly, etc.)
3. **Identify database type** (PostgreSQL, MySQL, MongoDB, etc.)
4. **Understand project scale** - big projects require Critical severity for all items

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## General Security Monitoring

### IDS-001: Intrusion detection system evaluated/deployed
**Severity**: Recommended (Critical for big projects)

Projects should have some form of intrusion detection system in place - this could be a WAF, SIEM, cloud-native security tools, or open-source solutions. The goal is systematic detection of malicious activity, not just reactive incident response.

**Check automatically**:

1. **Check for WAF/security proxy**:
```bash
# Cloudflare (most common)
curl -sI https://example.com | grep -iE "cf-ray|server: cloudflare"

# AWS WAF - check for WebACL associations
aws wafv2 list-web-acls --scope REGIONAL --region us-east-1 2>/dev/null
aws wafv2 list-web-acls --scope CLOUDFRONT 2>/dev/null
```

2. **Check for SIEM/security monitoring tools**:
```bash
# Look for security tool configuration in codebase
grep -rE "datadog.*security|splunk|elastic.*security|sentinel|chronicle" --include="*.yml" --include="*.yaml" --include="*.json" --include="*.tf" 2>/dev/null

# Check for cloud-native security
# AWS GuardDuty
aws guardduty list-detectors 2>/dev/null

# GCP Security Command Center
gcloud scc sources list --organization=ORG_ID 2>/dev/null
```

3. **Check for open-source IDS**:
```bash
# Look for common open-source IDS tools
grep -rE "wazuh|ossec|suricata|snort|zeek|fail2ban" --include="*.yml" --include="*.yaml" --include="docker-compose*" --include="*.tf" 2>/dev/null

# Check Docker Compose for security containers
grep -rE "wazuh|ossec|suricata" docker-compose*.yml 2>/dev/null
```

4. **Check Terraform/IaC for security resources**:
```bash
# AWS security resources
grep -rE "aws_guardduty|aws_securityhub|aws_wafv2" --include="*.tf" 2>/dev/null

# GCP security resources
grep -rE "google_scc|google_security" --include="*.tf" 2>/dev/null

# Cloudflare WAF rules
grep -rE "cloudflare_ruleset|cloudflare_waf" --include="*.tf" 2>/dev/null
```

**Ask user**:
- "What security monitoring tools does your team use?"
- "Have you evaluated IDS options for your budget/scale?"
- "Is there a security team or designated security owner?"

**Common IDS options by budget**:
- **Free/Low cost**: Cloudflare (free tier WAF), Fail2ban, AWS GuardDuty (pay per use), Wazuh (open source)
- **Medium**: Datadog Security, Cloudflare Pro/Business, AWS Security Hub
- **Enterprise**: Splunk, Elastic Security, Chronicle, Sentinel

**Cross-reference with**:
- SEC-001 (Cloudflare setup from section 13)
- IDS-002 (network-level monitoring)
- IDS-003 (database-level monitoring)

**Pass criteria**:
- Some IDS/security monitoring solution is deployed and active
- Solution is appropriate for project scale and budget
- Someone is responsible for reviewing security alerts

**Fail criteria**:
- No IDS or security monitoring in place
- "We haven't looked into it" without a plan
- Security monitoring exists but nobody reviews alerts

**Evidence to capture**:
- IDS solution(s) in use
- Coverage scope (network, application, database)
- Who reviews security alerts
- Last security review date (if available)

---

## Data Exfiltration Detection

### IDS-002: Network-level data transfer monitoring
**Severity**: Recommended (Critical for big projects)

Unusual outbound data volumes can indicate data exfiltration via API or web endpoints. Monitoring should detect when an IP downloads significantly more data than normal patterns.

**Check automatically**:

1. **Check Cloudflare analytics/alerts** (if using Cloudflare):
```bash
# Check for Cloudflare notification policies via API
# Requires CLOUDFLARE_API_TOKEN with Account:Read
curl -sX GET "https://api.cloudflare.com/client/v4/accounts/{account_id}/alerting/v3/policies" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" 2>/dev/null | jq '.result[] | {name, alert_type}'

# Check for rate limiting rules
curl -sX GET "https://api.cloudflare.com/client/v4/zones/{zone_id}/rulesets" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | jq '.result[] | select(.phase == "http_ratelimit")'
```

2. **Check cloud provider flow logs**:
```bash
# AWS VPC Flow Logs
aws ec2 describe-flow-logs 2>/dev/null | jq '.FlowLogs[] | {FlowLogId, LogDestination, TrafficType}'

# AWS CloudWatch alarms for data transfer
aws cloudwatch describe-alarms --alarm-name-prefix "DataTransfer" 2>/dev/null

# GCP VPC Flow Logs
gcloud compute networks subnets list --format="table(name,enableFlowLogs)" 2>/dev/null
```

3. **Check application-level response logging**:
```bash
# Look for response size/bandwidth tracking in code
grep -rE "content-length|response.*size|bandwidth|bytes.*sent|transfer.*size" --include="*.ts" --include="*.js" src/ 2>/dev/null

# Look for custom middleware tracking response sizes
grep -rE "res\.on\('finish'|onFinished|response.*logging" --include="*.ts" --include="*.js" src/ 2>/dev/null
```

4. **Check for rate limiting with data awareness**:
```bash
# Look for rate limit configuration
grep -rE "rateLimit|rate-limit|throttle" --include="*.ts" --include="*.js" --include="*.yml" src/ 2>/dev/null

# Check for download-specific limits
grep -rE "download.*limit|export.*limit|bulk.*limit" --include="*.ts" --include="*.js" src/ 2>/dev/null
```

5. **Check APM/monitoring tools for bandwidth metrics**:
```bash
# Datadog, New Relic, etc. config
grep -rE "datadog|newrelic|apm" --include="*.ts" --include="*.js" --include="*.yml" src/ 2>/dev/null

# Look for custom metrics
grep -rE "metrics\.increment|statsd|prometheus.*bytes" --include="*.ts" --include="*.js" src/ 2>/dev/null
```

**Ask user**:
- "Do you monitor outbound data transfer per IP/session?"
- "What thresholds would indicate abnormal download activity?"
- "Who gets alerted if unusual data transfer is detected?"

**Thresholds to consider** (project-specific):
- Single IP downloading >100MB in 1 hour
- Single session downloading >1000 records
- Sudden spike in bandwidth from one source
- After-hours bulk downloads

**Cross-reference with**:
- IDS-001 (general IDS - may include this capability)
- SEC-001 (Cloudflare setup)
- MON-003 (HTTP logging from section 12)

**Pass criteria**:
- Some mechanism monitors outbound data volume per IP/session
- Thresholds defined for what constitutes "unusual"
- Alerts configured to notify team when thresholds exceeded

**Fail criteria**:
- No visibility into data transfer patterns
- Thresholds not defined ("we'd notice manually")
- Monitoring exists but no alerting

**Evidence to capture**:
- Monitoring mechanism (CDN analytics, flow logs, APM, custom)
- Thresholds configured
- Alert destinations
- Example of recent alert (if available)

---

### IDS-003: Database query anomaly detection
**Severity**: Recommended (Critical for big projects)

Large database queries returning unusual amounts of data can indicate exfiltration via application abuse or compromised credentials. Monitoring should detect queries that return abnormally large result sets.

**Check automatically**:

1. **Check for database audit logging**:
```bash
# PostgreSQL pgaudit extension
grep -rE "pgaudit|shared_preload_libraries.*audit" --include="*.sql" --include="*.conf" --include="*.tf" 2>/dev/null

# MySQL audit plugin
grep -rE "audit_log|server_audit" --include="*.sql" --include="*.cnf" --include="*.tf" 2>/dev/null

# Check cloud database audit settings
# AWS RDS
aws rds describe-db-parameters --db-parameter-group-name default.postgres14 --query "Parameters[?ParameterName=='pgaudit.log']" 2>/dev/null

# GCP Cloud SQL
gcloud sql instances describe INSTANCE_NAME --format="get(settings.databaseFlags)" 2>/dev/null | grep -i audit
```

2. **Check for slow query logging with row counts**:
```bash
# PostgreSQL slow query log
grep -rE "log_min_duration_statement|log_statement" --include="*.conf" --include="*.tf" --include="*.sql" 2>/dev/null

# MySQL slow query log
grep -rE "slow_query_log|long_query_time" --include="*.cnf" --include="*.tf" 2>/dev/null
```

3. **Check for application-level query monitoring**:
```bash
# Look for query logging middleware
grep -rE "query.*log|prisma.*log|typeorm.*logging|sequelize.*logging" --include="*.ts" --include="*.js" src/ 2>/dev/null

# Look for row count tracking
grep -rE "rowCount|affectedRows|rows\.length|count\(\)" --include="*.ts" --include="*.js" src/ 2>/dev/null

# Look for query result size alerts
grep -rE "result.*size|rows.*threshold|bulk.*warning" --include="*.ts" --include="*.js" src/ 2>/dev/null
```

4. **Check for database proxy/firewall**:
```bash
# ProxySQL, PgBouncer, or similar with logging
grep -rE "proxysql|pgbouncer|mysql-proxy" --include="docker-compose*" --include="*.tf" --include="*.yml" 2>/dev/null

# Database firewall rules
grep -rE "db.*firewall|database.*rules|query.*filter" --include="*.tf" --include="*.yml" 2>/dev/null
```

5. **Check cloud database insights/monitoring**:
```bash
# AWS Performance Insights
aws rds describe-db-instances --query "DBInstances[].{DBInstanceIdentifier:DBInstanceIdentifier,PerformanceInsightsEnabled:PerformanceInsightsEnabled}" 2>/dev/null

# GCP Query Insights
gcloud sql instances describe INSTANCE_NAME --format="get(settings.insightsConfig)" 2>/dev/null
```

**Ask user**:
- "Do you log database queries with row counts?"
- "What would constitute an unusually large query result?"
- "How would you detect if someone exported your entire user table?"

**Anomaly patterns to detect**:
- Single query returning >10,000 rows
- Multiple `SELECT *` queries in short timeframe
- Queries on sensitive tables (users, payments) without normal access patterns
- After-hours database activity

**Cross-reference with**:
- IDS-001 (general IDS)
- IDS-002 (network-level - exfiltration may show in both)
- MON-002 (database performance monitoring from section 12)
- DB-004 (database users from section 5)

**Pass criteria**:
- Database queries logged with row counts or data volume
- Thresholds defined for "unusual" query sizes
- Alerts trigger on threshold breach
- Someone reviews database activity regularly

**Fail criteria**:
- No query logging beyond basic slow query logs
- No awareness of what "normal" query patterns look like
- No alerting on large result sets
- "We'd notice if the database was slow"

**Evidence to capture**:
- Query logging mechanism (database native, proxy, application)
- Row count/data volume tracking
- Thresholds configured
- Last review of database activity logs

---

## Alerting

### IDS-004: Exfiltration alert routing configured
**Severity**: Recommended (Critical for big projects)

When exfiltration is detected, alerts must reach the right people immediately with actionable context - not just logged somewhere nobody checks.

**Check automatically**:

1. **Check for alert destinations**:
```bash
# Slack webhook configuration
grep -rE "slack.*webhook|SLACK_WEBHOOK|hooks\.slack\.com" --include="*.ts" --include="*.js" --include="*.yml" --include="*.env*" 2>/dev/null

# PagerDuty configuration
grep -rE "pagerduty|PAGERDUTY" --include="*.ts" --include="*.js" --include="*.yml" --include="*.env*" 2>/dev/null

# Email alerting
grep -rE "alert.*email|sendgrid|ses.*alert|smtp.*alert" --include="*.ts" --include="*.js" --include="*.yml" 2>/dev/null

# Generic webhook/notification config
grep -rE "webhook.*alert|notification.*url|alert.*endpoint" --include="*.ts" --include="*.js" --include="*.yml" 2>/dev/null
```

2. **Check cloud provider alerting**:
```bash
# AWS SNS topics for security alerts
aws sns list-topics 2>/dev/null | jq '.Topics[].TopicArn' | grep -iE "security|alert|incident"

# AWS CloudWatch alarm actions
aws cloudwatch describe-alarms --query "MetricAlarms[].AlarmActions" 2>/dev/null

# GCP alerting policies
gcloud alpha monitoring policies list --format="table(displayName,notificationChannels)" 2>/dev/null
```

3. **Check Cloudflare notifications**:
```bash
# Cloudflare notification destinations
curl -sX GET "https://api.cloudflare.com/client/v4/accounts/{account_id}/alerting/v3/destinations/webhooks" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" 2>/dev/null | jq '.result'

curl -sX GET "https://api.cloudflare.com/client/v4/accounts/{account_id}/alerting/v3/destinations/pagerduty" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" 2>/dev/null | jq '.result'
```

4. **Check for security-specific alert routing**:
```bash
# Look for security alert categorization
grep -rE "security.*alert|exfiltration|intrusion|breach|incident" --include="*.ts" --include="*.js" src/ 2>/dev/null

# Check for alert severity/priority routing
grep -rE "alert.*severity|priority.*high|critical.*notify|escalat" --include="*.ts" --include="*.js" --include="*.yml" src/ 2>/dev/null
```

5. **Check for on-call/escalation configuration**:
```bash
# PagerDuty/Opsgenie escalation
grep -rE "escalation|on-call|oncall|rotation" --include="*.yml" --include="*.json" --include="*.ts" 2>/dev/null

# Incident response documentation
find . -type f \( -name "*incident*" -o -name "*runbook*" -o -name "*playbook*" \) 2>/dev/null
```

**Ask user**:
- "Who gets notified when a security alert fires?"
- "Are security alerts routed differently from ops alerts?"
- "What's the escalation path if the primary contact doesn't respond?"
- "How quickly should someone acknowledge a security alert?"

**Alert quality requirements**:
- Include context: what happened, why it's suspicious
- Include affected resources: IP, user, endpoint, query
- Include recommended action: what to investigate first
- Not just "high bandwidth detected" but "IP x.x.x.x downloaded 500MB in 10 minutes from /api/users"

**Cross-reference with**:
- IDS-002 (network alerts feed into this)
- IDS-003 (database alerts feed into this)
- INC-001 (on-call rotation from section 35)
- MON-004 (general alerting from section 12)

**Pass criteria**:
- Alert destinations configured for security events
- Recipients defined (not just "whoever's on call" - security-aware people)
- Alerts are immediate (not batched/daily digest)
- Alerts include actionable context (what, where, why suspicious, what to do)
- Escalation path exists if primary contact unavailable

**Fail criteria**:
- Alerts go to a log file nobody reads
- No defined recipients for security alerts
- Alerts batched (daily/weekly) instead of immediate
- Alerts are raw data without context
- No escalation if primary contact unavailable

**Evidence to capture**:
- Alert destinations (Slack channel, PagerDuty, email list)
- Security alert recipients (names/roles)
- Escalation path documentation
- Example alert format (does it include context?)
- SLA for alert acknowledgment (if defined)

---

## Completing the Audit

After checking all items:

1. **Summarize results**:
   - IDS-001: PASS/FAIL (Recommended/Critical) - IDS solution deployed
   - IDS-002: PASS/FAIL (Recommended/Critical) - Network data transfer monitoring
   - IDS-003: PASS/FAIL (Recommended/Critical) - Database query anomaly detection
   - IDS-004: PASS/FAIL (Recommended/Critical) - Alert routing configured

2. **Determine severity based on project scale**:
   - Big projects (sensitive data, high traffic, revenue-critical): All items Critical
   - Smaller projects: All items Recommended

3. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority based on project scale

4. **Common recommendations**:
   - If no IDS: Start with Cloudflare (free WAF), enable AWS GuardDuty, or deploy Wazuh
   - If no network monitoring: Enable Cloudflare analytics alerts, AWS VPC Flow Logs, or application-level tracking
   - If no database monitoring: Enable pgaudit/audit plugins, add application-level query logging with row counts
   - If poor alerting: Set up dedicated security Slack channel, configure PagerDuty for security incidents

5. **Maturity assessment**:
   - **Level 1**: No intrusion detection - reactive only
   - **Level 2**: Basic WAF in place but no data exfiltration monitoring
   - **Level 3**: WAF + some data monitoring but alerts not well-routed
   - **Level 4**: Full IDS with network + database monitoring, immediate actionable alerts

6. **Record audit date** and auditor
