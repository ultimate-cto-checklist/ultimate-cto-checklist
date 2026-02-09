# Health Endpoints Audit Guide

This guide walks you through auditing a project's health check endpoints for monitoring, load balancing, and infrastructure observability.

## The Goal: Observable Infrastructure

Load balancers, orchestrators, and operators can see exactly what is healthy and what is not, at a glance.

- **Discoverable** — basic health at a standard path (`/health`), no authentication required
- **Fast** — basic health responds instantly without checking external dependencies
- **Comprehensive** — deep health verifies all external services (database, cache, queues, APIs)
- **Protected** — deep health requires authentication to prevent infrastructure exposure
- **Diagnostic** — returns 503 with specific details when dependencies fail

## Before You Start

1. Confirm you're in the target repository's root directory
2. Have the app running locally (or know how to start it)
3. Know what external services the app depends on (database, Redis, external APIs, etc.)

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## Basic Health

### HEALTH-001: Basic health endpoint exists
**Severity**: Critical

**Check automatically**:

1. **Search for health endpoint definitions**:
   ```bash
   # Multi-framework search for health routes
   grep -rE "(app\.get|router\.get|@app\.get|\.GET|HandleFunc)\s*\(['\"]\/?(health|healthz|ping|up)" \
     --include="*.ts" --include="*.js" --include="*.py" --include="*.go" --include="*.rb"

   # Find dedicated health files
   find . -type f -name "*health*" | grep -E "\.(ts|js|py|go|rb)$"

   # Next.js API routes
   ls -la pages/api/health* app/api/health* 2>/dev/null
   ```

2. **Test the endpoint** (requires app running locally):
   ```bash
   # Try common paths - note response time
   curl -s -o /dev/null -w "%{http_code} %{time_total}s" http://localhost:PORT/health
   curl -s -o /dev/null -w "%{http_code} %{time_total}s" http://localhost:PORT/healthz
   curl -s -o /dev/null -w "%{http_code} %{time_total}s" http://localhost:PORT/ping
   curl -s -o /dev/null -w "%{http_code} %{time_total}s" http://localhost:PORT/up
   ```

3. **Verify no authentication required**:
   ```bash
   # Should return 200 without any auth headers
   curl -s -o /dev/null -w "%{http_code}" http://localhost:PORT/health
   ```

4. **Check response body** (optional but good practice):
   ```bash
   curl -s http://localhost:PORT/health
   ```

**Cross-reference with**:
- GIT-001 (Clone and run) - test health endpoint during app startup
- Section 6 (Resilience) - health endpoint should work even when dependencies are down
- Section 12 (Monitoring/Status pages) - status pages typically call health endpoints

**Pass criteria**:
- Health endpoint exists at a standard path (`/health`, `/healthz`, `/ping`, `/up`)
- Returns HTTP 200 when app is running
- Response time < 50ms locally (no expensive operations)
- No authentication required (load balancers need access)
- Does NOT check external dependencies (that's deep health's job)

**Fail criteria**:
- No health endpoint found
- Endpoint returns 500 or error when app is healthy
- Requires authentication
- Response time > 50ms locally (likely doing DB queries or external calls)
- Non-standard path with no documentation

**If no endpoint found, ask user**:
"No health endpoint found at standard paths (/health, /healthz, /ping, /up). Does one exist at a different path? If not, this is required for load balancer health checks and container orchestration."

**Evidence to capture**:
- Endpoint path found (or none)
- HTTP status code
- Response time (ms)
- Response body (if any)
- Whether authentication is required

---

## Deep Health

### HEALTH-002: Deep health endpoint with dependency checks
**Severity**: Critical

**Check automatically**:

1. **Search for deep health endpoint definitions**:
   ```bash
   # Look for deep/ready/detailed health routes
   grep -rE "(health/deep|health/ready|health/detailed|healthcheck|readiness)" \
     --include="*.ts" --include="*.js" --include="*.py" --include="*.go" --include="*.rb"

   # Look for DB connectivity checks in health-related files
   grep -rE "(ping|connect|isAlive|isReady|checkConnection)" \
     $(find . -name "*health*" -type f 2>/dev/null) 2>/dev/null

   # Look for multiple service checks
   grep -rE "(database|redis|postgres|mysql|mongo|rabbit|kafka)" \
     $(find . -name "*health*" -type f 2>/dev/null) 2>/dev/null
   ```

2. **Verify authentication requirement**:
   ```bash
   # Should return 401/403 without auth
   curl -s -o /dev/null -w "%{http_code}" http://localhost:PORT/health/deep

   # Common auth patterns - one of these should work
   curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer TOKEN" http://localhost:PORT/health/deep
   curl -s -o /dev/null -w "%{http_code}" -H "X-Health-Token: TOKEN" http://localhost:PORT/health/deep
   curl -s -o /dev/null -w "%{http_code}" -H "X-API-Key: TOKEN" http://localhost:PORT/health/deep
   ```

3. **Verify dependency checks** (with valid auth):
   ```bash
   curl -s -H "X-Health-Token: TOKEN" http://localhost:PORT/health/deep
   ```

   Expected response should include status of each external service:
   ```json
   {
     "status": "healthy",
     "checks": {
       "database": { "status": "healthy" },
       "redis": { "status": "healthy" }
     }
   }
   ```

4. **Test failure reporting** - stop a dependency and verify deep health reports it:
   ```bash
   # Stop a dependency
   docker compose stop redis

   # Deep health should return 503 with details
   curl -s -w "\nHTTP: %{http_code}" -H "X-Health-Token: TOKEN" http://localhost:PORT/health/deep

   # Restore
   docker compose start redis
   ```

5. **Verify basic health still works when dependency is down**:
   ```bash
   docker compose stop redis
   curl -s -o /dev/null -w "%{http_code}" http://localhost:PORT/health  # Should still be 200
   docker compose start redis
   ```

**Cross-reference with**:
- HEALTH-001 - basic health should still return 200 when dependencies are down
- Section 5 (Database) - deep health verifies DB connectivity
- Section 6 (Resilience) - validates graceful degradation behavior

**Pass criteria**:
- Deep health endpoint exists
- Requires authentication (token, API key, or header)
- Returns 401/403 without valid auth
- Checks all external services the app depends on (database, cache, queues, external APIs)
- Reports individual service status (not just overall pass/fail)
- Returns HTTP 503 when any dependency is unhealthy
- Response body includes which service is down and why
- Basic health (HEALTH-001) still works when dependencies are down

**Fail criteria**:
- No deep health endpoint
- Deep health is unauthenticated (exposes infrastructure details)
- Only checks "is app running" (same as basic health)
- Returns 200 when a dependency is down
- Doesn't report which specific service is down
- Crashes or hangs when a dependency is unavailable
- Missing checks for known dependencies

**If endpoint found but no auth, ask user**:
"Deep health endpoint at [path] doesn't require authentication. This exposes infrastructure details (database status, service names, potential error messages). Is this intentional? Recommend protecting with a token or API key."

**If no deep health found, ask user**:
"No deep health endpoint found. What external services does this app depend on? If any (database, Redis, external APIs), recommend adding a protected endpoint that verifies connectivity to each and returns 503 with details when any is unavailable."

**Evidence to capture**:
- Endpoint path (or none)
- Authentication method required (header name, token type)
- List of services checked
- Sample response when healthy
- Sample response when a dependency is down (should be 503)
- Whether basic health remains 200 when dependency is down

---

## Completing the Audit

After checking all items:

1. **Summarize results**:
   - HEALTH-001: PASS/FAIL
   - HEALTH-002: PASS/FAIL

2. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority (both items are Critical)

3. **Common recommendations**:
   - If no basic health: Add `/health` endpoint returning 200 with no dependencies
   - If no deep health: Add `/health/deep` with token auth checking all services
   - If deep health unprotected: Add authentication requirement
   - If deep health returns 200 on failure: Change to 503 with details

4. **Record audit date** and auditor
