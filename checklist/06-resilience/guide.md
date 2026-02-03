# Resilience Audit Guide

This guide walks you through auditing an application's resilience to third-party service failures.

## Before You Start

1. Confirm you're in the target repository's root directory
2. Identify what external services the app depends on
3. Have Docker available to start/stop dependencies for testing
4. Have the user available for questions about critical vs optional services

## Audit Process

Work through each item below:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## Third-Party Service Resilience

### RES-001: Third-party service resilience
**Severity**: Critical

The app should not crash when external services fail. Other requests should continue working. 500s are acceptable for affected features, but the app must stay up.

**Step 1: Identify external dependencies**

```bash
# Find HTTP clients and external service calls
grep -rE "(axios|fetch|got|request|node-fetch)" --include="*.ts" --include="*.js" -l

# Find service URLs in env configuration
grep -rE "(API_URL|SERVICE_URL|ENDPOINT|_HOST|_URI|_URL)" .env.example .env 2>/dev/null

# Find connection strings (Redis, queues, external databases)
grep -rE "(redis://|amqp://|mongodb\+srv://|mysql://)" --include="*.ts" --include="*.js" -l

# Check Docker Compose for service dependencies
grep -E "^\s+[a-z]+:" docker-compose.yml 2>/dev/null | grep -v "#"
```

**Step 2: Check for error handling patterns**

```bash
# Look for try/catch around external calls
grep -rE "try\s*\{" --include="*.ts" --include="*.js" -l | head -10

# Look for .catch() on promises
grep -rE "\.catch\s*\(" --include="*.ts" --include="*.js" -l | head -10

# Look for timeout configurations
grep -rE "(timeout:|timeout =|setTimeout|AbortController)" --include="*.ts" --include="*.js" | head -10

# Look for circuit breaker patterns (opossum, cockatiel, etc.)
grep -rE "(circuit|CircuitBreaker|opossum|cockatiel)" --include="*.ts" --include="*.js"
```

**Step 3: Test startup resilience**

For each non-critical dependency identified:

```bash
# Start app with broken service URL
REDIS_URL=redis://localhost:9999 npm run dev

# Or start without Docker Compose dependencies
docker compose stop redis  # Stop just redis
npm run dev                 # See if app starts
```

Questions to consider:
- Does the app start?
- Does it log a warning about the unavailable service?
- Or does it crash with an unhandled error?

**Step 4: Test runtime resilience**

With the app running:

```bash
# Kill a non-critical dependency mid-flight
docker compose stop redis

# Hit an unrelated endpoint - should still work
curl -s http://localhost:3000/api/users | head -c 200

# Hit an endpoint that uses the failed service - should error gracefully
curl -s http://localhost:3000/api/cached-data

# Check the process is still alive
pgrep -f "node" | wc -l
```

**Step 5: Verify process stability**

```bash
# Check for uncaught exception handlers
grep -rE "(uncaughtException|unhandledRejection)" --include="*.ts" --include="*.js"

# Look for process exit calls that might be triggered on errors
grep -rE "process\.exit" --include="*.ts" --include="*.js"
```

**Cross-reference with:**
- Section 7 (Health Endpoints) - deep health endpoint should report which services are down
- Section 5 (Database) - database is typically critical and may require different handling

**Pass criteria:**
- App starts even when non-critical services are unavailable
- Process remains running after external service errors occur
- Unaffected endpoints continue responding normally
- Affected endpoints return proper error responses (4xx/5xx), not process crashes
- Error handling exists around external service calls (try/catch, .catch(), timeouts)

**Fail criteria:**
- App refuses to start because an optional service is down
- Unhandled promise rejections or exceptions crash the process
- One failing service causes unrelated endpoints to fail
- No error handling around external service calls
- Process exits on transient external failures

**If unclear, ask user:**
- "Which of these dependencies are critical (app cannot function without) vs optional (can degrade gracefully)?"
- "Is there documentation of external service dependencies?"
- "What's the expected behavior when [service X] is unavailable?"

**Evidence to capture:**
- List of external dependencies discovered (URLs, connection strings)
- Classification: critical vs optional for each dependency
- Error handling patterns found (or missing)
- Startup behavior with each non-critical dependency unavailable
- Runtime behavior when dependency fails mid-operation
- Whether process stayed alive through all tests

---

## Completing the Audit

After checking all items:

1. **Summarize dependency resilience**:
   - List all external dependencies found
   - Note which have proper error handling
   - Note which could crash the app

2. **Prioritize fixes**:
   - Services that crash the app on failure are highest priority
   - Missing timeouts are quick wins
   - Circuit breakers are a larger effort but high value

3. **Record audit date** and auditor
