# Monitoring Audit Guide

This guide walks you through auditing a project's monitoring setup, ensuring infrastructure metrics are collected, database performance is tracked, HTTP requests are logged with alerting, and status pages exist.

## The Goal: No Blind Spots

You cannot fix what you cannot see. Complete observability means knowing when things break before users do, understanding why they broke, and having the data to prevent recurrence.

- **Complete coverage** — Every infrastructure component (compute, databases, caches) has metrics collection with no gaps
- **Queryable** — Slow queries logged and reviewed regularly; HTTP requests analyzable by status, endpoint, and time
- **Alertable** — 404 volume spikes and immediate 500 detection route to the right people
- **Retained** — At least 14 days of logs for debugging; status pages for incident communication

## Before You Start

1. Identify the monitoring stack in use (Prometheus, Datadog, CloudWatch, GCP Monitoring, etc.)
2. Have CLI access to cloud providers (AWS, GCP, etc.)
3. Have database access or credentials to check slow query settings
4. Know where alerting is configured (PagerDuty, Opsgenie, Slack, etc.)
5. Identify status page URLs if they exist

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## Infrastructure Metrics

### MON-001: Infrastructure metrics collection
**Severity**: Critical

**Check automatically**:

1. **Get service inventory from CLI**:

   Kubernetes:
   ```bash
   # List all deployments/services
   kubectl get deployments -A -o json | jq '.items[] | {namespace: .metadata.namespace, name: .metadata.name}'

   # List statefulsets (databases, etc.)
   kubectl get statefulsets -A -o json | jq '.items[] | {namespace: .metadata.namespace, name: .metadata.name}'
   ```

   Docker Compose:
   ```bash
   # List services defined
   docker compose config --services

   # List running containers
   docker ps --format '{{.Names}}'
   ```

   AWS:
   ```bash
   # List EC2 instances
   aws ec2 describe-instances --query 'Reservations[].Instances[].{ID:InstanceId,Name:Tags[?Key==`Name`].Value|[0],State:State.Name}'

   # List ECS services
   aws ecs list-services --cluster CLUSTER_NAME

   # List RDS instances
   aws rds describe-db-instances --query 'DBInstances[].DBInstanceIdentifier'

   # List ElastiCache clusters (Redis)
   aws elasticache describe-cache-clusters --query 'CacheClusters[].CacheClusterId'
   ```

   GCP:
   ```bash
   # List Compute Engine instances
   gcloud compute instances list --format='json' | jq '.[].name'

   # List Cloud SQL instances
   gcloud sql instances list --format='json' | jq '.[].name'

   # List Memorystore (Redis) instances
   gcloud redis instances list --region=REGION --format='json' | jq '.[].name'
   ```

2. **Verify monitoring configuration exists**:

   Prometheus:
   ```bash
   # Check prometheus config
   cat prometheus.yml

   # Look for scrape configs covering services
   grep -A 20 "scrape_configs:" prometheus.yml

   # Check alert rules exist
   ls -la rules/ || ls -la alerts/
   ```

   Datadog:
   ```bash
   # Check Datadog agent config
   cat /etc/datadog-agent/datadog.yaml

   # List integrations
   ls /etc/datadog-agent/conf.d/
   ```

   CloudWatch:
   ```bash
   # List custom metrics
   aws cloudwatch list-metrics --namespace "Custom" --query 'Metrics[].MetricName'

   # Check for CloudWatch agent config
   cat /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
   ```

   GCP Monitoring:
   ```bash
   # List custom metrics
   gcloud monitoring metrics-scopes list

   # List alerting policies
   gcloud alpha monitoring policies list --format='json' | jq '.[].displayName'
   ```

3. **Verify specific metrics are collected**:

   Required metrics per service type:
   - **Compute**: CPU utilization, memory usage, disk space
   - **Database**: Connection count, pool utilization, query latency
   - **Redis**: Memory usage, connected clients, hit rate, evictions
   - **All services**: Health/up status

   ```bash
   # Prometheus - check metrics exist
   curl -s localhost:9090/api/v1/label/__name__/values | jq '.data[]' | grep -E 'cpu|memory|disk|connection|redis'

   # CloudWatch - check EC2 metrics
   aws cloudwatch list-metrics --namespace AWS/EC2 --dimensions Name=InstanceId,Value=INSTANCE_ID
   ```

**Cross-reference with**:
- DB-001 (Connection pooling) - pool metrics should match pool config
- HEALTH-002 (Deep health endpoint) - metrics should cover same services deep health checks

**Pass criteria**:
- Service inventory is documented (from CLI output)
- Each service has monitoring configured
- CPU, memory, disk metrics collected for compute
- Connection pool metrics collected for databases
- Redis metrics collected if Redis in use
- Monitoring coverage matrix shows no gaps

**Fail criteria**:
- No service inventory exists
- Services exist without monitoring
- Missing critical metrics (CPU, memory, disk)
- Database has no connection pool metrics
- Redis in use but not monitored

**If monitoring tool not identified, ask user**:
"What monitoring system does this project use? (Prometheus, Datadog, CloudWatch, GCP Monitoring, New Relic, etc.)

Please provide:
1. List of all services/infrastructure components
2. Screenshot or export of monitoring dashboard showing coverage
3. Any services known to be unmonitored"

**Evidence to capture**:
- Service inventory (CLI output)
- Monitoring tool in use
- Screenshot of monitoring dashboard
- Coverage matrix: service → metrics collected
- Any gaps identified

---

## Database Performance

### MON-002: Database performance monitoring
**Severity**: Critical

**Check automatically**:

1. **Verify slow query logging is enabled**:

   PostgreSQL:
   ```sql
   -- Check slow query threshold
   SHOW log_min_duration_statement;
   -- Should return a value (e.g., 1000 for 1 second), not -1 (disabled)

   -- Check if pg_stat_statements is enabled
   SELECT * FROM pg_extension WHERE extname = 'pg_stat_statements';

   -- Verify it's collecting data
   SELECT count(*) FROM pg_stat_statements;
   ```

   MySQL:
   ```sql
   -- Check slow query log status
   SHOW VARIABLES LIKE 'slow_query_log';
   -- Should be ON

   SHOW VARIABLES LIKE 'long_query_time';
   -- Should be set (e.g., 1 or 2 seconds)

   -- Check Performance Schema
   SHOW VARIABLES LIKE 'performance_schema';
   -- Should be ON
   ```

   Cloud SQL (GCP):
   ```bash
   # Check query insights enabled
   gcloud sql instances describe INSTANCE_NAME --format='json' | jq '.settings.insightsConfig'
   ```

   RDS (AWS):
   ```bash
   # Check Performance Insights enabled
   aws rds describe-db-instances --db-instance-identifier INSTANCE_ID --query 'DBInstances[].PerformanceInsightsEnabled'

   # Check parameter group for slow query settings
   aws rds describe-db-parameters --db-parameter-group-name PARAM_GROUP --query 'Parameters[?ParameterName==`slow_query_log`]'
   ```

2. **Check for query analysis tooling**:

   ```bash
   # Look for query analysis tools in codebase
   grep -riE "pg_stat_statements|performance_schema|query.*(insight|analysis|monitor)" . --include="*.yml" --include="*.yaml" --include="*.json" --include="*.tf" 2>/dev/null

   # Check for APM with DB tracing
   grep -riE "datadog.*trace|newrelic.*transaction|apm.*database" . --include="*.yml" --include="*.yaml" --include="*.json" 2>/dev/null
   ```

3. **Verify dashboard or audit record exists**:

   ```bash
   # Look for references to slow query dashboards/reports
   grep -riE "slow.*(query|queries).*dashboard|query.*performance.*report|database.*performance" . --include="*.md" 2>/dev/null
   ```

**Ask user for evidence**:
"Slow query logging must have a dashboard/report OR audit record showing regular review.

Please provide ONE of:
1. **Dashboard**: Screenshot of slow query dashboard (Datadog, CloudWatch, GCP Query Insights, pgAdmin, etc.)
2. **Report**: Recent slow query report or analysis document
3. **Audit record**: Evidence of recent slow query review (ticket, meeting notes, commit fixing slow query)

When was the last time slow queries were reviewed and acted upon?"

**Cross-reference with**:
- DB-001 (Connection pooling) - slow queries exhaust connection pools
- MON-001 (Infrastructure metrics) - DB CPU metrics may indicate query issues

**Pass criteria**:
- Slow query logging is enabled with reasonable threshold
- Query analysis tool/extension available (pg_stat_statements, Performance Schema, etc.)
- Dashboard exists showing slow queries, OR
- Audit record shows regular review of slow query data
- Evidence of queries being optimized based on findings

**Fail criteria**:
- Slow query logging disabled
- No query analysis capability
- Logging enabled but no dashboard/report
- No evidence anyone reviews slow query data
- Last review was > 3 months ago

**Evidence to capture**:
- Slow query threshold setting
- Query analysis tool in use
- Dashboard screenshot OR audit record
- Date of last slow query review
- Examples of queries optimized (if available)

---

## HTTP Logging

### MON-003: HTTP request logging and analysis
**Severity**: Critical

**Check automatically**:

1. **Check application logging configuration**:

   ```bash
   # Look for HTTP logging middleware/config
   grep -riE "morgan|winston|pino|express.*logger|http.*log|request.*log|access.*log" . --include="*.js" --include="*.ts" --include="*.py" --include="*.rb" --include="*.go" 2>/dev/null | head -20

   # Check for structured logging
   grep -riE "json.*log|structured.*log|log.*format.*json" . --include="*.yml" --include="*.yaml" --include="*.json" 2>/dev/null
   ```

2. **Check CDN/Load Balancer logging**:

   Cloudflare:
   ```bash
   # Check if Logpush is configured (requires API token)
   curl -s -X GET "https://api.cloudflare.com/client/v4/zones/ZONE_ID/logpush/jobs" \
     -H "Authorization: Bearer $CF_API_TOKEN" | jq '.result'
   ```

   AWS ALB:
   ```bash
   # Check ALB access logs enabled
   aws elbv2 describe-load-balancer-attributes --load-balancer-arn LB_ARN --query 'Attributes[?Key==`access_logs.s3.enabled`]'
   ```

   GCP Load Balancer:
   ```bash
   # Logging is automatic for HTTP(S) LB, check logs exist
   gcloud logging read 'resource.type="http_load_balancer"' --limit=5
   ```

3. **Check APM/observability tools**:

   ```bash
   # Look for APM configuration
   grep -riE "datadog|newrelic|dynatrace|appdynamics|honeycomb|lightstep" . --include="*.yml" --include="*.yaml" --include="*.json" --include="*.env*" 2>/dev/null | head -10
   ```

4. **Verify analysis capability**:

   ```bash
   # Check for log analysis tools references
   grep -riE "kibana|grafana|loki|elasticsearch|splunk|sumo.?logic|logtail|papertrail" . --include="*.yml" --include="*.yaml" --include="*.md" 2>/dev/null
   ```

**Ask user if no logging found**:
"Could not automatically detect HTTP logging configuration.

Please confirm:
1. Where are HTTP requests logged? (App logs, CDN, Load Balancer, APM)
2. What tool is used to analyze logs? (Kibana, Grafana, CloudWatch Insights, etc.)
3. Can you filter by: status code, endpoint, response time?
4. Can you see traffic patterns over time?
5. Is there a separate view/filter for 4xx and 5xx errors?"

**Cross-reference with**:
- MON-004 (HTTP error alerting) - alerts need logs to trigger from
- Section 13 (Infrastructure Security) - logs should show requests after Cloudflare

**Pass criteria**:
- HTTP requests are logged (any source: app, CDN, LB, APM)
- Logs include: timestamp, method, path, status code, response time
- Analysis tool exists to query/visualize logs
- Can filter by status code
- Can see traffic patterns over time
- 4xx/5xx errors are visible (not buried)

**Fail criteria**:
- No HTTP request logging
- Logs exist but no analysis capability
- Cannot filter by status code
- Cannot see traffic patterns
- Errors buried in noise with no way to surface

**Evidence to capture**:
- Logging source(s) in use
- Log format (fields captured)
- Analysis tool in use
- Screenshot of log analysis interface
- Example query for 5xx errors

---

## Alerting

### MON-004: HTTP error alerting
**Severity**: Critical

**Check automatically**:

1. **Check for alert configurations**:

   Prometheus AlertManager:
   ```bash
   # Look for HTTP error alert rules
   grep -riE "status.*(4|5)[0-9]{2}|http.*(error|4xx|5xx)|response.*code" . --include="*.yml" --include="*.yaml" --include="*.rules" 2>/dev/null
   ```

   Datadog:
   ```bash
   # Look for Datadog monitor configs
   grep -riE "datadog.*monitor|monitor.*type.*metric" . --include="*.yml" --include="*.yaml" --include="*.tf" 2>/dev/null
   ```

   CloudWatch:
   ```bash
   # List CloudWatch alarms
   aws cloudwatch describe-alarms --query 'MetricAlarms[?contains(MetricName, `5xx`) || contains(MetricName, `4xx`) || contains(MetricName, `HTTPCode`)]'
   ```

   PagerDuty/Opsgenie:
   ```bash
   # Look for incident management integration
   grep -riE "pagerduty|opsgenie|victorops|incident" . --include="*.yml" --include="*.yaml" --include="*.json" 2>/dev/null
   ```

2. **Check Sentry or error tracking alerts**:

   ```bash
   # Look for Sentry config
   grep -riE "sentry.*dsn|SENTRY_DSN|@sentry" . --include="*.js" --include="*.ts" --include="*.py" --include="*.env*" 2>/dev/null
   ```

**Ask user for alert configuration details**:
"Please provide details on HTTP error alerting:

**404 Alerts**:
1. Is there an alert for high volume of 404s?
2. What is the threshold? (e.g., >100 per 5 minutes)
3. Where does the alert go? (Slack, PagerDuty, email)

**500 Alerts**:
1. Is there an alert for 500 errors?
2. Is the threshold sensitive enough to catch even a few 500s? (Target: any 500s within 1-minute window)
3. Where does the alert go?

Please provide:
- Screenshot of alert rules, OR
- Alert configuration file/export"

**Cross-reference with**:
- MON-003 (HTTP logging) - alerts need logs/metrics to trigger from
- Section 35 (Incident Response) - alerts should route to on-call
- Section 19 (Error Reporting - Sentry) - Sentry may provide 500 alerting

**Pass criteria**:
- 404 alerting configured with volume threshold (team-defined)
- 500 alerting configured to catch any 500s within 1-minute window
- Alerts route to appropriate channel (on-call, Slack, etc.)
- Alert delivery verified (has fired and been received)

**Fail criteria**:
- No HTTP error alerting configured
- 404 alerting missing
- 500 alerting threshold too high (missing low-volume errors)
- 500 alerting only at high thresholds (e.g., >100)
- Alerts configured but no one receiving them

**Evidence to capture**:
- Alert tool in use
- 404 alert threshold
- 500 alert threshold (should be ~1 per minute)
- Notification channel
- Date of last alert fired (proves it works)

---

## Log Retention

### MON-005: Log retention policy
**Severity**: Recommended

**Check automatically**:

1. **CloudWatch log retention**:
   ```bash
   # List log groups with retention
   aws logs describe-log-groups --query 'logGroups[].{name:logGroupName,retentionDays:retentionInDays}'

   # Flag any with retention < 14 days
   aws logs describe-log-groups --query 'logGroups[?retentionInDays < `14`].{name:logGroupName,retention:retentionInDays}'
   ```

2. **GCP log retention**:
   ```bash
   # Check log bucket retention
   gcloud logging buckets list --format='json' | jq '.[] | {name: .name, retentionDays: .retentionDays}'
   ```

3. **Elasticsearch/OpenSearch ILM**:
   ```bash
   # Check index lifecycle policies
   curl -s localhost:9200/_ilm/policy | jq 'to_entries[] | {policy: .key, delete_after: .value.policy.phases.delete.min_age}'
   ```

4. **Application log rotation**:
   ```bash
   # Check logrotate config
   cat /etc/logrotate.d/* 2>/dev/null | grep -E "rotate|maxage"

   # Check for log retention in app config
   grep -riE "retention|rotate|max.?age|keep.?days" . --include="*.yml" --include="*.yaml" --include="*.json" 2>/dev/null | grep -i log
   ```

**Ask user if retention not found**:
"Could not automatically determine log retention settings.

Please provide:
1. Where are logs stored? (CloudWatch, GCP Logging, Elasticsearch, files, etc.)
2. What is the retention period?
3. Is retention at least 2 weeks?

Note: Minimum 2 weeks retention required for adequate debugging capability."

**Cross-reference with**:
- Section 37 (GDPR & Privacy) - retention may have legal requirements
- Section 38 (Cost Monitoring) - excessive retention increases storage costs

**Pass criteria**:
- Log retention is configured (not infinite/undefined)
- Retention is at least 2 weeks (14 days)
- Retention policy is documented

**Fail criteria**:
- Log retention not configured (logs deleted too quickly or kept forever)
- Retention less than 2 weeks
- Different systems have inconsistent retention
- No documentation of retention policy

**Evidence to capture**:
- Log storage system(s)
- Retention period per system
- Retention policy documentation location
- Any compliance requirements affecting retention

---

## Status Pages

### MON-006: Status pages and downtime alerts
**Severity**: Critical (production), Recommended (staging)

**Check automatically**:

1. **Look for status page references**:
   ```bash
   # Search for status page URLs in docs
   grep -riE "status\.(page|io)|statuspage|instatus|cachet|uptime|status\.your" . --include="*.md" --include="*.yml" --include="*.yaml" 2>/dev/null

   # Check for status page in README
   grep -iE "status|uptime" README.md 2>/dev/null
   ```

2. **Check for uptime monitoring configuration**:
   ```bash
   # Look for uptime monitoring tools
   grep -riE "pingdom|uptimerobot|better.?uptime|statuscake|checkly|pagerduty.*heartbeat" . --include="*.yml" --include="*.yaml" --include="*.json" --include="*.tf" 2>/dev/null
   ```

3. **Verify status page URLs (if found)**:
   ```bash
   # Test status page is accessible
   curl -s -o /dev/null -w "%{http_code}" https://status.example.com
   ```

**Ask user for status page details**:
"Please provide status page and uptime monitoring details:

**Status Pages**:
1. Does a production status page exist? (Required)
   - URL:
   - Provider (Statuspage.io, Instatus, custom, etc.):

2. Does a staging status page exist? (Recommended)
   - URL:
   - Can be internal-only

**Downtime Alerting**:
1. What uptime monitoring is in place? (Pingdom, UptimeRobot, Better Uptime, etc.)
2. What endpoints are monitored?
3. Do monitors check health endpoints or just HTTP 200?
4. Where do downtime alerts go?
5. When did the last downtime alert fire?"

**Cross-reference with**:
- HEALTH-001 (Basic health endpoint) - uptime monitors should check this
- HEALTH-002 (Deep health endpoint) - status page should reflect dependency status
- Section 35 (Incident Response) - status page is incident communication tool
- DEPLOY-002 (Deployment notifications) - deployment status vs uptime status

**Pass criteria**:
- Production status page exists and is accessible
- Uptime monitoring configured for production
- Monitors check health endpoints (not just any HTTP 200)
- Downtime alerts route to appropriate channel
- Staging status page exists (Recommended, not required)

**Fail criteria**:
- No production status page
- No uptime monitoring
- Monitors only check for HTTP 200 (miss dependency failures)
- Downtime alerts not configured
- Status page exists but not maintained/accurate

**Evidence to capture**:
- Production status page URL
- Staging status page URL (if exists)
- Uptime monitoring tool
- Endpoints monitored
- Downtime alert channel
- Date of last downtime alert

---

## Completing the Audit

After checking all items:

1. **Summarize results**:
   - MON-001: PASS/FAIL (Critical)
   - MON-002: PASS/FAIL (Critical)
   - MON-003: PASS/FAIL (Critical)
   - MON-004: PASS/FAIL (Critical)
   - MON-005: PASS/FAIL (Recommended)
   - MON-006: PASS/FAIL (Critical for prod, Recommended for staging)

2. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority

3. **Common recommendations**:
   - If no service inventory: Document all services and their monitoring status
   - If metrics gaps: Add missing metrics to monitoring configuration
   - If slow query logging disabled: Enable with 1-2 second threshold
   - If no slow query review: Create dashboard and schedule regular review
   - If no HTTP logging: Add structured logging middleware
   - If alerting gaps: Configure 404 volume and 500 immediate alerts
   - If retention too short: Increase to minimum 2 weeks
   - If no status page: Set up Statuspage.io, Instatus, or similar
   - If no uptime monitoring: Configure Pingdom, UptimeRobot, or similar

4. **Record audit date** and auditor
