# Load & Stress Testing Audit Guide

This guide walks you through auditing a project's load and stress testing practices - performance baselines, capacity planning, and resilience under extreme conditions.

## The Goal: Known Limits, Graceful Failures

Your system should never surprise you under load. Know your capacity, understand your breaking points, and fail gracefully when pushed beyond limits.

- **Measured** — Baselines and capacity limits derived from actual testing, not guesswork
- **Predictable** — Breaking points identified before they occur in production
- **Resilient** — System degrades gracefully under overload with circuit breakers and load shedding
- **Validated** — Auto-scaling and recovery mechanisms tested, not just configured

## Before You Start

1. **Identify the technology stack** (affects which load testing tools are appropriate)
2. **Understand traffic patterns** (steady, spiky, seasonal)
3. **Check for existing load test scripts** (k6, Artillery, Locust, Gatling, etc.)
4. **Review recent incidents** (any caused by traffic spikes or capacity issues?)

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## Load Testing Setup

### LST-001: Load testing tool configured
**Severity**: Recommended

You can't do load testing without a tool. Modern options like k6, Artillery, or Locust make it easy to script realistic traffic patterns and measure system behavior.

**Check automatically**:

1. **Look for load testing tools and scripts**:
```bash
# Look for k6 scripts
find . -name "*.js" -path "*k6*" -o -name "k6*.js" 2>/dev/null | grep -v node_modules

# Look for Artillery configs
find . -name "artillery*.yml" -o -name "artillery*.yaml" -o -name "artillery*.json" 2>/dev/null | grep -v node_modules

# Look for Locust files
find . -name "locustfile.py" -o -name "*locust*.py" 2>/dev/null | grep -v node_modules

# Look for Gatling simulations
find . -name "*.scala" -path "*gatling*" 2>/dev/null | grep -v node_modules

# Look for JMeter test plans
find . -name "*.jmx" 2>/dev/null | grep -v node_modules

# Check package.json for load testing deps
grep -E "k6|artillery|autocannon|loadtest|vegeta" package.json 2>/dev/null

# Check for load test directories
ls -la loadtest/ load-test/ tests/load/ tests/performance/ k6/ artillery/ 2>/dev/null
```

**Ask user**:
- "What tool do you use for load testing?"
- "Are load test scripts checked into the repo or managed elsewhere (k6 Cloud, etc.)?"

**Cross-reference with**:
- LST-002 (baselines need load testing to establish)
- LST-003 (testing before releases requires a tool)
- LST-004 (CI smoke tests use the same tool)

**Pass criteria**:
- Load testing tool configured with scripts in repo
- OR scripts managed externally but documented (e.g., k6 Cloud, Grafana Cloud)
- OR explicit reason load testing isn't needed (internal tool, low traffic, side project)

**Fail criteria**:
- No load testing tool configured
- "We should do that" but never have
- Tool installed but no scripts written

**Evidence to capture**:
- Load testing tool in use
- Location of load test scripts
- Whether scripts cover key endpoints/flows

---

### LST-002: Baseline performance metrics established
**Severity**: Recommended

You can't know if performance degraded if you don't know what "normal" looks like. Baselines are the reference point for all performance work.

**Check automatically**:

1. **Look for performance/baseline documentation**:
```bash
# Look for performance documentation
grep -riE "baseline|benchmark|performance.*metrics|p50|p95|p99|latency|throughput" docs/ README.md CLAUDE.md --include="*.md" 2>/dev/null

# Check for performance test results stored
find . -maxdepth 3 -type d -name "*performance*" -o -name "*benchmark*" -o -name "*loadtest*" 2>/dev/null | grep -v node_modules

# Look for APM dashboards referenced
grep -riE "datadog|newrelic|dynatrace|grafana.*dashboard" docs/ README.md --include="*.md" 2>/dev/null

# Check for benchmark scripts
find . -name "*benchmark*" -type f 2>/dev/null | grep -v node_modules
```

**Ask user**:
- "What's your API's p95 response time under normal load?"
- "How many requests per second can your main endpoints handle?"
- "Where are these baselines documented?"

**Key metrics to have documented**:
| Metric | What It Measures |
|--------|------------------|
| p50/p95/p99 response time | Latency distribution |
| Throughput (RPS) | Requests per second at steady state |
| Error rate | Baseline error percentage |
| Resource utilization | CPU/memory at normal load |

**Cross-reference with**:
- LST-001 (tool needed to measure baselines)
- LST-005 (capacity limits are the upper bound of baselines)
- Section 17 (performance monitoring) - APM tools provide ongoing baselines

**Pass criteria**:
- Key metrics documented (response times, throughput, error rates)
- Baselines established from actual measurements (not guesses)
- Team knows where to find baseline data (APM tool, docs, etc.)

**Fail criteria**:
- No idea what "normal" performance looks like
- Baselines exist but are outdated (pre-major changes)
- Only anecdotal ("it feels fast")

**Evidence to capture**:
- Location of baseline documentation
- Key metrics tracked (p50, p95, p99, throughput, error rate)
- When baselines were last updated

---

## Pre-Release Testing

### LST-003: Load testing before major releases
**Severity**: Recommended

Performance regressions should be caught before they reach production. Load testing before significant releases validates that new code doesn't break under realistic traffic.

**Check automatically**:

1. **Look for release process documentation**:
```bash
# Look for release process mentioning load tests
grep -riE "release.*load|load.*test.*release|pre-release|launch.*checklist" docs/ README.md CLAUDE.md CONTRIBUTING.md --include="*.md" 2>/dev/null

# Check CI for manual load test triggers or release gates
grep -riE "load.*test|performance.*test|stress.*test" .github/workflows/ .circleci/ .gitlab-ci.yml --include="*.yml" --include="*.yaml" 2>/dev/null

# Look for release checklists
find . -maxdepth 3 -name "*release*" -name "*.md" 2>/dev/null | grep -v node_modules

# Check for staging/pre-prod load test evidence
ls -la reports/ results/ loadtest-results/ 2>/dev/null
```

**Ask user**:
- "Do you run load tests before major releases?"
- "What triggers a 'must load test' vs. 'skip it' decision?"
- "When was the last time you load tested before a release?"

**When to load test before release**:
- New database queries or schema changes
- Changed caching strategy
- Infrastructure changes (new regions, instance types)
- Expected traffic increase (launch, marketing campaign)
- Major refactoring of hot paths

**Cross-reference with**:
- LST-001 (need a tool to run tests)
- LST-002 (baselines to compare against)
- LST-004 (smoke tests catch basics, full tests before releases)
- Section 10 (deployment process) - load testing as release gate

**Pass criteria**:
- Documented process for when load testing is required
- Evidence of recent load tests before releases
- Clear criteria for what constitutes "major"

**Fail criteria**:
- No process ("we just ship and hope")
- Process exists but never followed
- Only load test after production issues

**Notes**:
Not every release needs a full load test. The key is having criteria and following them. Small bug fixes don't need load testing; new features affecting hot paths do.

**Evidence to capture**:
- Location of release process documentation
- Criteria for when load testing is required
- Date of last pre-release load test

---

### LST-004: Automated smoke load tests in CI
**Severity**: Optional

Quick, lightweight load tests running in CI catch obvious regressions automatically. Not full production-scale tests, but sanity checks that new code doesn't completely break under any load.

**Check automatically**:

1. **Check CI configs for load test jobs**:
```bash
# Check GitHub Actions
grep -riE "k6|artillery|loadtest|autocannon|smoke.*test|performance.*test" .github/workflows/ --include="*.yml" --include="*.yaml" 2>/dev/null

# Check other CI systems
grep -riE "k6|artillery|loadtest|performance" .circleci/ .gitlab-ci.yml Jenkinsfile bitbucket-pipelines.yml 2>/dev/null

# Look for load test npm scripts
grep -E "\"(load|stress|smoke|perf).*test" package.json 2>/dev/null

# Check for k6 cloud or Artillery Pro CI integrations
grep -riE "K6_CLOUD|ARTILLERY_CLOUD|k6.*run.*--cloud" .github/workflows/ --include="*.yml" 2>/dev/null

# Look for performance test in CI job names
grep -riE "job:.*perf|job:.*load|name:.*performance|name:.*load.*test" .github/workflows/ --include="*.yml" 2>/dev/null
```

**Ask user**:
- "Do you run any load tests automatically in CI?"
- "What level of load? (smoke = light sanity check vs. full = production-like)"
- "Do CI load tests block deploys on failure?"

**Smoke test characteristics**:
- Low concurrency (10-50 virtual users)
- Short duration (30-60 seconds)
- Key endpoints only (health, main API routes)
- Fast feedback (< 5 minutes)

**Cross-reference with**:
- LST-001 (tool needed)
- LST-003 (full load tests complement CI smoke tests)
- Section 5 (CI/CD pipeline) - load tests as pipeline stage

**Pass criteria**:
- Smoke-level load tests run in CI (quick, low concurrency)
- Tests catch obvious regressions (10x slower response, errors under light load)
- Results visible in CI output or dashboard

**Fail criteria**:
- No automated load tests (all manual)
- Tests exist but don't run in CI
- Tests run but nobody looks at results

**Notes**:
This is Optional because not all projects need CI-integrated load tests. For high-traffic production systems, it's valuable. For internal tools or early-stage products, manual load testing (LST-003) may be sufficient.

**Evidence to capture**:
- CI job name/location running load tests
- Concurrency level and duration
- Whether failures block deployment

---

## Capacity Planning

### LST-005: Capacity limits documented
**Severity**: Recommended

"How much traffic can we handle?" is a question every team should be able to answer. Documented capacity limits inform scaling decisions, incident response, and business planning.

**Check automatically**:

1. **Look for capacity documentation**:
```bash
# Look for capacity documentation
grep -riE "capacity|limit|max.*request|rps|requests.*per.*second|concurrent.*users|throughput" docs/ README.md CLAUDE.md --include="*.md" 2>/dev/null

# Check for architecture/scaling docs
find . -maxdepth 3 -name "*capacity*" -o -name "*scaling*" -o -name "*architecture*" 2>/dev/null | grep -v node_modules

# Look for load test results that document limits
find . -maxdepth 3 -type d -name "*loadtest*" -o -name "*results*" 2>/dev/null | grep -v node_modules

# Check for runbooks mentioning capacity
grep -riE "capacity|scaling|traffic.*spike" runbooks/ docs/runbooks/ --include="*.md" 2>/dev/null
```

**Ask user**:
- "What's the max RPS your API can handle?"
- "At what point does your database become the bottleneck?"
- "Where are capacity limits documented?"
- "What component fails first under load?"

**Cross-reference with**:
- LST-002 (baselines include capacity info)
- LST-006 (breaking points are the extreme end of capacity)
- Section 21 (caching) - caching affects capacity
- Section 30 (rate limiting) - rate limits should be below capacity limits

**Pass criteria**:
- Capacity limits documented per service/endpoint
- Limits based on actual testing (not guesses)
- Team knows the bottleneck (database, CPU, memory, external API)

**Fail criteria**:
- No idea what limits are ("never tested")
- Limits documented but never validated
- Only discovered limits during outages

**Evidence to capture**:
- Documented capacity limits (RPS, concurrent users, etc.)
- Known bottleneck(s)
- When limits were last validated

---

## Stress Testing

### LST-006: Breaking points identified (stress testing)
**Severity**: Recommended

Stress testing pushes beyond normal capacity to understand how the system fails. It's not just "it slows down" but "at 2000 RPS the database connection pool exhausts and requests start failing with X error."

**Check automatically**:

1. **Look for stress test documentation**:
```bash
# Look for stress test documentation
grep -riE "stress.*test|breaking.*point|failure.*mode|max.*load|overload" docs/ README.md CLAUDE.md --include="*.md" 2>/dev/null

# Look for stress test scripts (often separate from load tests)
find . -name "*stress*" -type f 2>/dev/null | grep -v node_modules

# Check for chaos engineering / failure injection
grep -riE "chaos|gremlin|litmus|failure.*inject" docs/ .github/ package.json --include="*.md" --include="*.yml" --include="*.json" 2>/dev/null

# Look for documented failure modes
grep -riE "failure.*mode|what.*happens.*when|cascad|circuit.*break" docs/ runbooks/ --include="*.md" 2>/dev/null
```

**Ask user**:
- "Have you ever stress tested to find where things break?"
- "What happens when you hit 5x or 10x normal traffic?"
- "Do you know your failure modes? (timeout, OOM, connection pool exhaustion, etc.)"

**Common failure modes to document**:
| Failure Mode | Symptoms |
|--------------|----------|
| Connection pool exhaustion | Requests queue, then timeout |
| Memory exhaustion (OOM) | Process killed, restarts |
| CPU saturation | Response times spike, eventual timeouts |
| Database locks | Queries queue, deadlocks possible |
| External API rate limits | 429 errors from dependencies |

**Cross-reference with**:
- LST-005 (capacity limits are the boundary before breaking)
- LST-007 (graceful degradation is the response to stress)
- Section 26 (high availability) - understanding failure modes informs HA design

**Pass criteria**:
- Stress tests have been run to find breaking points
- Failure modes documented (what breaks first, how it manifests)
- Team understands the cascade (DB fails → API queues → timeouts → user errors)

**Fail criteria**:
- Never stress tested ("afraid to break things")
- Only discovered breaking points during real incidents
- Breaking points unknown

**Notes**:
Stress testing is different from load testing. Load testing validates expected capacity. Stress testing intentionally exceeds capacity to understand failure behavior. Both are valuable.

**Evidence to capture**:
- Whether stress testing has been performed
- Known breaking points and failure modes
- What component fails first under extreme load

---

### LST-007: Graceful degradation under load
**Severity**: Recommended

When load exceeds capacity, good systems degrade gracefully instead of crashing completely. They shed load, return cached responses, or disable non-critical features.

**Check automatically**:

1. **Look for degradation patterns in code**:
```bash
# Look for circuit breakers, load shedding, degradation patterns
grep -riE "circuit.*breaker|load.*shed|graceful.*degrad|fallback|bulkhead" src/ lib/ app/ --include="*.ts" --include="*.js" --include="*.py" --include="*.go" 2>/dev/null

# Check for libraries that implement these patterns
grep -E "opossum|cockatiel|hystrix|resilience4j|polly|circuitbreaker|pybreaker" package.json requirements.txt go.mod Gemfile 2>/dev/null

# Look for rate limiting / throttling at app level
grep -riE "rate.*limit|throttl|too.*many.*request|429" src/ lib/ app/ --include="*.ts" --include="*.js" 2>/dev/null

# Check for feature flags that could disable features under load
grep -riE "feature.*flag|launchdarkly|flagsmith|unleash|growthbook" package.json src/ --include="*.json" --include="*.ts" 2>/dev/null

# Look for queue/backpressure patterns
grep -riE "backpressure|queue.*full|reject.*request|shed" src/ lib/ --include="*.ts" --include="*.js" 2>/dev/null
```

**Ask user**:
- "What happens when your system is overloaded?"
- "Do you have circuit breakers for external dependencies?"
- "Can you disable non-critical features under load?"
- "Is there a 'degraded mode' the system can operate in?"

**Graceful degradation strategies**:
| Strategy | Description |
|----------|-------------|
| Circuit breakers | Stop calling failing services, return fallback |
| Load shedding | Reject excess requests early (429) |
| Feature flags | Disable non-critical features |
| Cached fallbacks | Return stale data instead of failing |
| Queue limits | Cap queue depth, reject when full |

**Cross-reference with**:
- LST-006 (stress testing reveals what needs degradation handling)
- LST-008 (auto-scaling is one response, degradation is another)
- Section 30 (rate limiting) - rate limiting is a form of load shedding
- Section 19 (error handling) - graceful errors under load
- Section 33 (feature flags) - kill switches for degradation

**Pass criteria**:
- Degradation strategy documented and implemented
- Circuit breakers protect against cascading failures
- Non-critical features can be disabled (feature flags, config)
- System returns errors gracefully rather than hanging/crashing

**Fail criteria**:
- System crashes or hangs completely under overload
- No circuit breakers (one slow dependency takes down everything)
- "We just hope it doesn't happen"
- Degradation is uncontrolled (random failures)

**Evidence to capture**:
- Degradation strategies in place (circuit breakers, load shedding, feature flags)
- Libraries/patterns used
- What features can be disabled under load

---

### LST-008: Auto-scaling triggers tested
**Severity**: Recommended

Auto-scaling that's never been triggered is theoretical. It might not scale fast enough, might have permission issues, or might hit account limits. If you rely on auto-scaling, test it.

**Check automatically**:

1. **Check for auto-scaling configs**:
```bash
# Check for Kubernetes HPA
find . -name "*.yaml" -o -name "*.yml" | xargs grep -l "HorizontalPodAutoscaler" 2>/dev/null | grep -v node_modules

# Check Terraform for auto-scaling
grep -riE "autoscal|aws_autoscaling|google_compute_autoscaler" terraform/ infrastructure/ --include="*.tf" 2>/dev/null

# Check for AWS auto-scaling
grep -riE "AutoScalingGroup|TargetTrackingScaling|ScalingPolicy" terraform/ cloudformation/ --include="*.tf" --include="*.yml" --include="*.yaml" --include="*.json" 2>/dev/null

# Check for GCP auto-scaling
grep -riE "autoscaler|minReplicas|maxReplicas" terraform/ --include="*.tf" 2>/dev/null

# Check for scaling documentation
grep -riE "auto.*scal|scale.*up|scale.*down|scaling.*trigger|hpa" docs/ README.md CLAUDE.md --include="*.md" 2>/dev/null

# Check Kubernetes manifests for resource requests (needed for HPA)
grep -riE "resources:|requests:|limits:|cpu:|memory:" k8s/ kubernetes/ helm/ --include="*.yaml" --include="*.yml" 2>/dev/null
```

**Ask user**:
- "Do you use auto-scaling?"
- "Has it ever actually triggered? (intentionally or during an incident)"
- "What are the scaling triggers? (CPU, memory, request count, custom metrics)"
- "How long does it take to scale up?"

**Auto-scaling validation checklist**:
- [ ] Scaling triggers defined and appropriate
- [ ] Min/max instances configured
- [ ] Scale-up time measured (cold start + provisioning)
- [ ] Account quotas checked (won't hit limits during scale)
- [ ] Scaling has been tested under real load
- [ ] Cooldown periods appropriate

**Cross-reference with**:
- LST-006 (stress testing can validate auto-scaling)
- LST-007 (graceful degradation while waiting for scale-up)
- Section 26 (high availability) - auto-scaling is part of HA strategy
- Section 38 (cost monitoring) - auto-scaling affects costs

**Pass criteria**:
- Auto-scaling configured with appropriate triggers
- Scaling has been tested under load (not just configured and hoped)
- Scale-up time is known and acceptable
- Account/quota limits checked (won't hit "max instances" unexpectedly)

**Fail criteria**:
- Auto-scaling configured but never tested
- Scaling triggers misconfigured (scales on wrong metric, too slow)
- Hits account limits during scale-up
- No auto-scaling when traffic is unpredictable

**Notes**:
Not all systems need auto-scaling. Fixed capacity is fine if traffic is predictable and you've sized appropriately. The key is: if you're relying on auto-scaling, test it.

**Evidence to capture**:
- Auto-scaling configuration (triggers, min/max instances)
- Whether scaling has been tested
- Scale-up time under load
- Any account limits that could block scaling

---

## Completing the Audit

After checking all items:

1. **Summarize results**:
   - LST-001: PASS/FAIL (Recommended) - Load testing tool configured
   - LST-002: PASS/FAIL (Recommended) - Baseline performance metrics established
   - LST-003: PASS/FAIL (Recommended) - Load testing before major releases
   - LST-004: PASS/FAIL (Optional) - Automated smoke load tests in CI
   - LST-005: PASS/FAIL (Recommended) - Capacity limits documented
   - LST-006: PASS/FAIL (Recommended) - Breaking points identified (stress testing)
   - LST-007: PASS/FAIL (Recommended) - Graceful degradation under load
   - LST-008: PASS/FAIL (Recommended) - Auto-scaling triggers tested

2. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority

3. **Common recommendations**:
   - If no load testing tool: Start with k6 (free, scriptable, modern) - write tests for top 3 endpoints
   - If no baselines: Run load tests at current traffic levels, document p50/p95/p99 and throughput
   - If no pre-release testing: Define criteria ("load test when: new DB queries, infra changes, expected traffic increase")
   - If no CI smoke tests: Add 60-second smoke test to CI with 10 VUs on health + main endpoints
   - If capacity unknown: Run load tests incrementally (100, 500, 1000 RPS) until errors appear
   - If no stress testing: Schedule a stress test day - intentionally push past limits in staging
   - If no graceful degradation: Add circuit breakers for external dependencies, implement rate limiting
   - If auto-scaling untested: Manually trigger scale events, measure time to scale

4. **Maturity assessment**:
   - **Level 1**: No process - no load testing, unknown capacity
   - **Level 2**: Ad-hoc - occasional manual load tests, undocumented results
   - **Level 3**: Documented - load testing tool, baselines documented, capacity known
   - **Level 4**: Integrated - CI smoke tests, pre-release testing process, graceful degradation
   - **Level 5**: Proactive - regular stress testing, auto-scaling validated, chaos engineering

5. **Record audit date** and auditor
