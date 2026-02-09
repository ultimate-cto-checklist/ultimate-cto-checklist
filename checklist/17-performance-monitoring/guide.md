# Performance Monitoring Audit Guide

This guide walks you through auditing a project's performance monitoring capabilities, covering response time tracking and memory management.

## The Goal: Proactive Performance Visibility

Performance issues should be detected and diagnosed before users notice. Complete monitoring coverage means you see slowdowns, memory growth, and resource pressure as they develop.

- **Per-endpoint** — response time monitoring identifies slow requests at the route level
- **Historical** — memory usage tracked over time enables capacity planning and trend analysis
- **Alerting** — automated detection of memory leaks before they cause outages
- **Protected** — heap dump capabilities secured from unauthorized access

## Before You Start

1. Identify the monitoring stack (Datadog, New Relic, Prometheus/Grafana, Sentry Performance, etc.)
2. Get access to monitoring dashboards if external
3. Understand the deployment environment (containers, serverless, VMs)

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## Response Time

### PERF-001: Response time monitoring
**Severity**: Recommended

**Check automatically**:

1. **Look for APM/monitoring integration**:
```bash
# Check for monitoring env vars
grep -riE "datadog|newrelic|new_relic|prometheus|grafana|sentry.*dsn|apm" .env.example .env* 2>/dev/null

# Look for timing/metrics middleware
grep -riE "responseTime|request.duration|metrics|histogram|latency" --include="*.ts" --include="*.js" src/ lib/ app/ 2>/dev/null | head -20

# Check for prometheus metrics endpoint
grep -riE "/metrics|prom-client|prometheus" --include="*.ts" --include="*.js" src/ lib/ app/ 2>/dev/null | head -10
```

2. **Check for monitoring config files**:
```bash
# Look for APM config
ls -la datadog.yaml newrelic.js prometheus.yml grafana/ monitoring/ 2>/dev/null

# Check package.json for monitoring packages
grep -E "datadog|newrelic|prom-client|@sentry/.*tracing" package.json 2>/dev/null
```

3. **If monitoring tool identified, verify endpoint-level visibility**:
   - Request dashboard access or URL
   - Confirm response times are graphed per endpoint (not just aggregate)
   - Check that slowest endpoints are identifiable

**If not found in code, ask user**:
- "What monitoring tool do you use for request performance?"
- "Can you share the dashboard URL for response time graphs?"

**Cross-reference with**:
- MON-001 (Section 12 - infrastructure monitoring)

**Pass criteria**:
- Monitoring solution configured and active
- Response time graphs available per endpoint
- Can identify top slowest endpoints from the tool

**Fail criteria**:
- No response time monitoring configured
- Only aggregate metrics (no per-endpoint breakdown)
- Monitoring configured but not deployed/active

**Warning (not a fail)**:
- Any endpoint averaging >500ms response time - flag for optimization review

**Evidence to capture**:
- Monitoring tool name and version
- Dashboard URL (if external)
- Screenshot or list of top 5 slowest endpoints with avg response times

---

## Memory Monitoring

### PERF-002: Memory usage tracking over time
**Severity**: Recommended

**Check automatically**:

1. **Look for memory metrics collection**:
```bash
# Check for memory-related monitoring in code
grep -riE "memoryUsage|heap|rss|memory.used|process.memory" --include="*.ts" --include="*.js" src/ lib/ app/ 2>/dev/null | head -10

# Check for memory in monitoring/metrics config
grep -riE "memory|heap" --include="*.yaml" --include="*.yml" --include="*.json" monitoring/ config/ 2>/dev/null | head -10
```

2. **Check container/orchestration memory config** (implies monitoring exists):
```bash
# Docker memory limits
grep -iE "memory|mem_limit" docker-compose*.yml Dockerfile 2>/dev/null

# Kubernetes memory config
grep -iE "memory" kubernetes/*.yaml k8s/*.yaml deploy/*.yaml 2>/dev/null
```

3. **Verify historical data available**:
   - Memory graphs should show hours/days of history
   - Not just current point-in-time value

**If not found in code, ask user**:
- "Where can I see memory usage graphs for the app?"
- "Is memory tracked in the same tool as response times?"
- "Can you show historical memory trends (last 24h, 7d)?"

**Cross-reference with**:
- PERF-001 (often same monitoring tool)
- MON-001 (Section 12 - infrastructure monitoring)

**Pass criteria**:
- Memory usage visible over time (at minimum 24h history)
- Can see historical trends, not just current value
- Graphs show heap/RSS or equivalent memory metrics

**Fail criteria**:
- No memory tracking
- Only point-in-time checks (no historical graph)
- Memory only visible in container orchestrator, not application level

**Evidence to capture**:
- Monitoring tool used for memory
- Dashboard URL or screenshot
- Sample memory trend (24h or 7d graph)

---

### PERF-003: Memory leak detection alerting
**Severity**: Recommended

**Check automatically**:

1. **Look for memory alerting rules**:
```bash
# Check for memory alerts in monitoring config
grep -riE "memory.*alert|alert.*memory|threshold|oom" --include="*.yaml" --include="*.yml" --include="*.json" . 2>/dev/null | grep -v node_modules | head -10

# Check alerting config files
ls -la alerts/ alerting/ *alerts*.yaml *alerts*.yml 2>/dev/null

# Look for memory threshold configuration
grep -riE "memory.*threshold|max.*memory|memory.*limit|heap.*max" .env.example .env* config/ 2>/dev/null
```

2. **Check monitoring tool for alert rules**:
   - Request list of configured alerts
   - Look for memory-related triggers

**If not found in code, ask user**:
- "Do you have alerts configured for memory growth?"
- "What triggers when memory usage trends upward?"
- "How would you know if a memory leak started?"

**Cross-reference with**:
- PERF-002 (requires memory tracking to alert on it)
- MON-005 (Section 12 - alerting configuration)

**Pass criteria**:
- Automated alert exists for memory exceeding threshold, OR
- Automated alert exists for memory growth rate (trend-based)
- Alert notifies team (Slack, PagerDuty, email, etc.)

**Fail criteria**:
- No alerting on memory issues
- Only OOM-kill as the "detection" (too late)
- Manual review process only (no automation)

**Evidence to capture**:
- Alert rule configuration or screenshot
- Threshold values configured
- Notification channel for alerts

---

### PERF-004: Heap dump capability
**Severity**: Optional

This is a debugging tool - only needed when investigating memory leaks. However, if it exists, it must be properly protected.

**Check automatically**:

1. **Look for heap dump mechanism**:
```bash
# Look for heap dump endpoints or functions
grep -riE "heapdump|heap.dump|writeHeapSnapshot|v8.getHeapSnapshot" --include="*.ts" --include="*.js" src/ lib/ app/ 2>/dev/null | head -10

# Check for debug endpoints
grep -riE "/debug|/diagnostic|/profil" --include="*.ts" --include="*.js" src/ lib/ app/ 2>/dev/null | head -10

# Look for heapdump package
grep -E "heapdump|v8-profiler|heap-profile" package.json 2>/dev/null
```

2. **If endpoint found, verify protection**:
```bash
# Check for auth on debug endpoints
grep -riE "debug.*token|debug.*key|x-debug|admin.*header|auth.*debug" --include="*.ts" --include="*.js" src/ lib/ app/ 2>/dev/null | head -10
```

3. **Verify protection mechanism**:
   - Requires secret token/header, AND/OR
   - Behind Zero Trust/VPN
   - Not publicly accessible

**If not found, ask user**:
- "Is there a way to capture heap dumps from production?"
- "How would you debug a memory leak in production?"

**Cross-reference with**:
- PERF-003 (heap dumps useful when leak detected)
- SEC-001 (Section 13 - Zero Trust protection)

**Pass criteria**:
- No heap dump capability (acceptable - it's optional), OR
- Heap dump mechanism exists AND is protected by:
  - Secret token/header, AND/OR
  - Zero Trust/VPN access only

**Fail criteria**:
- Heap dump endpoint exists but is unprotected (security issue)
- Heap dump accessible without authentication

**Partial (acceptable)**:
- No built-in endpoint but can SSH/exec into container to trigger dump
  (as long as SSH/exec access is properly restricted)

**Evidence to capture**:
- Heap dump mechanism (endpoint URL, CLI command, or cloud feature)
- Protection method (token, Zero Trust, SSH-only, etc.)
- If none exists, note "Not implemented (acceptable)"

---

## Completing the Audit

After checking all items:

1. **Summarize results**:
   - PERF-001: PASS/FAIL (Recommended)
   - PERF-002: PASS/FAIL (Recommended)
   - PERF-003: PASS/FAIL (Recommended)
   - PERF-004: PASS/FAIL/N/A (Optional)

2. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority

3. **Common recommendations**:
   - If no response time monitoring: Integrate APM (Datadog, New Relic) or add Prometheus + Grafana
   - If no memory tracking: Add memory metrics to existing monitoring stack
   - If no memory alerts: Configure threshold-based alerts (e.g., >80% of limit)
   - If heap dump unprotected: Add token/header auth immediately

4. **Performance flags** (not failures, but note for review):
   - Endpoints averaging >500ms
   - Memory usage trending upward over past 7 days
   - Frequent near-threshold memory alerts

5. **Record audit date** and auditor
