# Rate Limiting Audit Guide

This guide walks you through auditing a project's rate limiting configuration - how requests are throttled, how limits are enforced, and how consumers are informed.

## The Goal: Protected Endpoints

APIs must defend themselves against abuse while remaining usable for legitimate consumers who understand the boundaries.

- **Active throttling** — rate limiting at infrastructure or application level protects against abuse and DoS
- **Client isolation** — limits keyed on IP, user ID, or API key so one consumer cannot exhaust limits for others
- **Graceful rejection** — proper 429 responses with helpful information when limits are exceeded
- **Discoverable limits** — consumers can learn limits through documentation or response headers before hitting them

## Before You Start

1. **Identify infrastructure** (Cloudflare, nginx, AWS API Gateway, etc.)
2. **Identify application framework** (Express, Fastify, Django, Flask, etc.)
3. **Understand API architecture** (REST, GraphQL, internal vs public)
4. **Check for existing rate limit libraries** in dependencies

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## Rate Limit Configuration

### RATE-001: Rate Limiting Configured
**Severity**: Critical

Rate limiting must exist at either infrastructure level (Cloudflare, nginx, API Gateway) or application level. Limits should isolate clients so one user can't exhaust limits for others.

**Check automatically**:

1. **Check for infrastructure-level rate limiting**:
```bash
# Cloudflare - check for rate limiting rules (requires API access)
# Look for Cloudflare config in repo
grep -rE "rate_limit|ratelimit" cloudflare/ wrangler.toml 2>/dev/null

# nginx rate limiting
grep -rE "limit_req|limit_conn" nginx/ conf/ *.conf 2>/dev/null

# AWS API Gateway
grep -rE "throttle|rateLimit|quotaSettings" serverless.yml sam.yaml cloudformation/ terraform/ 2>/dev/null

# Traefik rate limiting
grep -rE "rateLimit|averageRate" traefik/ 2>/dev/null
```

2. **Check for application-level rate limiting libraries**:
```bash
# Node.js
grep -E "express-rate-limit|rate-limiter-flexible|bottleneck|p-limit|@fastify/rate-limit" package.json 2>/dev/null

# Python
grep -E "django-ratelimit|Flask-Limiter|slowapi|limits" requirements*.txt pyproject.toml 2>/dev/null

# Go
grep -E "golang.org/x/time/rate|go-redis/redis_rate|ulule/limiter" go.mod 2>/dev/null

# Ruby
grep -E "rack-attack|redis-throttle" Gemfile 2>/dev/null
```

3. **Check rate limit configuration in code**:
```bash
# Express rate limit setup
grep -rE "rateLimit\(|RateLimit\(|createRateLimiter" src/ lib/ app/ --include="*.ts" --include="*.js" 2>/dev/null

# Rate limit middleware registration
grep -rE "app\.use.*rate|rateLimiter|throttle" src/ lib/ app/ --include="*.ts" --include="*.js" 2>/dev/null

# Redis-based rate limiting (common pattern)
grep -rE "redis.*rate|rate.*redis|limiter.*redis" src/ lib/ app/ 2>/dev/null
```

4. **Check rate limit keying strategy** (client isolation):
```bash
# Key generators - should key on IP, user ID, or API key
grep -rE "keyGenerator|key.*req\.ip|key.*user|key.*apiKey|getKey" src/ lib/ app/ 2>/dev/null

# Check for user-based limits
grep -rE "req\.user|request\.user|userId|user_id" src/ lib/ app/ 2>/dev/null | grep -i rate
```

5. **Check for auth-differentiated limits** (recommended):
```bash
# Different limits for authenticated vs anonymous
grep -rE "authenticated.*limit|anon.*limit|public.*limit|skip.*auth" src/ lib/ app/ 2>/dev/null | grep -i rate

# Conditional rate limiting
grep -rE "skip:|skip.*=>|skipIf|skipFailedRequests" src/ lib/ app/ 2>/dev/null
```

**Ask user**:
- "Where is rate limiting configured?" (Cloudflare, nginx, app code, etc.)
- "What do you rate limit on?" (IP, user ID, API key)
- "Do authenticated users have different limits than anonymous?"

**Cross-reference with**:
- RATE-002 (graceful handling when limits hit)
- RATE-003 (documentation of limits)
- AUTH-001 (authentication system)
- INFRA-001 (Cloudflare configuration)

**Pass criteria**:
- Rate limiting exists at infrastructure OR application level
- Clients are isolated (keyed on IP, user, or API key - not a single global counter)
- Authenticated users have different limits than anonymous (recommended, not required)

**Fail criteria**:
- No rate limiting found at any level
- Single global counter that one client can exhaust for everyone
- Public endpoints completely unprotected

**Evidence to capture**:
- Rate limiting mechanism (Cloudflare, nginx, app library, etc.)
- Keying strategy (IP, user ID, API key)
- Sample limits configured (requests per minute/hour)
- Whether auth differentiation exists

---

### RATE-002: Graceful 429 Handling
**Severity**: Recommended

When rate limits are hit, the response should be a proper 429 Too Many Requests with helpful information. The application shouldn't crash or return misleading errors.

**Check automatically**:

1. **Check for 429 status code handling**:
```bash
# Explicit 429 responses in code
grep -rE "429|Too Many Requests|TooManyRequests" src/ lib/ app/ --include="*.ts" --include="*.js" --include="*.py" 2>/dev/null

# Rate limiter response configuration
grep -rE "statusCode.*429|status.*429|message.*rate|response.*limit" src/ lib/ app/ 2>/dev/null
```

2. **Check for Retry-After header** (nice-to-have):
```bash
# Retry-After header configuration
grep -rE "Retry-After|retryAfter|retry-after" src/ lib/ app/ 2>/dev/null

# Rate limit headers
grep -rE "X-RateLimit|RateLimit-|rateLimit.*header" src/ lib/ app/ 2>/dev/null
```

3. **Check rate limiter error handling**:
```bash
# Custom error handlers for rate limiting
grep -rE "onLimitReached|handler.*rate|limitHandler|exceeded" src/ lib/ app/ 2>/dev/null

# Error response format
grep -rE "res\.status\(429\)|response.*429|HttpStatus.*429" src/ lib/ app/ 2>/dev/null
```

4. **Actually test the rate limit** (rigorous verification):
```bash
# If dev server is running, attempt to trigger rate limit
# This is a manual step - run in dev environment only

# Example: rapid requests to trigger limit
# for i in {1..100}; do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/endpoint; done | sort | uniq -c

# Check the response when limit is hit
# curl -v http://localhost:3000/api/endpoint (after triggering limit)
```

**Ask user**:
- "What happens when a client hits the rate limit?"
- "Have you tested hitting the rate limit in dev?"
- "Does the response include retry information?"

**Cross-reference with**:
- RATE-001 (rate limiting configured)
- RATE-003 (documentation includes error responses)
- MON-003 (HTTP logging - 429s should be logged)

**Pass criteria**:
- Returns 429 Too Many Requests status code
- Response body explains the limit was hit
- Application doesn't crash or return 500
- Retry-After header present (nice-to-have)

**Fail criteria**:
- Returns 500 or generic error when limit hit
- Application crashes under rate limiting
- No indication client was rate limited
- Response leaks internal implementation details

**Evidence to capture**:
- Actual 429 response (test in dev)
- Response body content
- Headers included (Retry-After, X-RateLimit-*)
- How rate limit errors are logged

---

## Documentation

### RATE-003: Rate Limits Documented
**Severity**: Recommended

API consumers should be able to discover rate limits before hitting them - either via documentation or response headers.

**Check automatically**:

1. **Check documentation for rate limit info**:
```bash
# README mentions rate limits
grep -iE "rate.?limit|throttl|requests per" README.md 2>/dev/null

# API documentation
grep -rE "rate.?limit|throttl|requests per|quota" docs/ api-docs/ 2>/dev/null

# OpenAPI/Swagger spec
grep -rE "rate|limit|throttle|x-ratelimit" openapi.yaml swagger.json api.yaml 2>/dev/null
```

2. **Check for rate limit response headers**:
```bash
# X-RateLimit headers in code
grep -rE "X-RateLimit-Limit|X-RateLimit-Remaining|X-RateLimit-Reset" src/ lib/ app/ 2>/dev/null

# RateLimit headers (newer standard)
grep -rE "RateLimit-Limit|RateLimit-Remaining|RateLimit-Reset" src/ lib/ app/ 2>/dev/null

# Rate limiter header configuration
grep -rE "headers.*true|standardHeaders|legacyHeaders|draft.*headers" src/ lib/ app/ 2>/dev/null
```

3. **Check API response examples**:
```bash
# Example responses in docs that show rate limit headers
grep -rE "X-RateLimit|RateLimit-" docs/ examples/ 2>/dev/null

# Rate limit error examples
grep -rE "429|Too Many" docs/ examples/ 2>/dev/null
```

**Ask user**:
- "Where would an API consumer learn about rate limits?"
- "Do responses include rate limit headers?"
- "Are different endpoint limits documented separately?"

**Cross-reference with**:
- RATE-001 (actual limits configured)
- RATE-002 (429 response format)
- DOC-001 (API documentation)

**Pass criteria**:
- Rate limits documented in API docs, README, or OpenAPI spec
- OR rate limit headers included in responses (X-RateLimit-* or RateLimit-*)
- Consumers can discover limits before hitting them

**Fail criteria**:
- No documentation of rate limits
- No rate limit headers in responses
- Consumers only discover limits by getting 429'd

**Evidence to capture**:
- Where limits are documented (if anywhere)
- Rate limit headers present in responses
- Whether different endpoints have documented different limits

---

## Completing the Audit

After checking all items:

1. **Summarize results**:
   - RATE-001: PASS/FAIL (Critical) - Rate limiting configured
   - RATE-002: PASS/FAIL (Recommended) - Graceful 429 handling
   - RATE-003: PASS/FAIL (Recommended) - Rate limits documented

2. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority

3. **Common recommendations**:
   - If no rate limiting: Start with Cloudflare rate limiting rules (easiest) or add express-rate-limit/similar
   - If global counter: Add keying on IP or user ID to isolate clients
   - If no 429 handling: Configure rate limiter to return proper status and message
   - If no documentation: Add rate limit headers (standardHeaders: true in express-rate-limit) or document in README

4. **Maturity assessment**:
   - **Level 1**: No rate limiting - vulnerable to abuse and DoS
   - **Level 2**: Basic global rate limiting - some protection but poor isolation
   - **Level 3**: Keyed rate limiting with proper 429 responses - good baseline
   - **Level 4**: Full rate limiting - per-endpoint limits, auth differentiation, documented, headers in responses

5. **Record audit date** and auditor
