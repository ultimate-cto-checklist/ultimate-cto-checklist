# API Design Audit Guide

This guide walks you through auditing a project's API design practices - versioning strategy, input validation, injection prevention, and gateway/proxy configuration.

## The Goal: Secure by Design

APIs are your attack surface. This audit ensures your endpoints are hardened against injection attacks and architected for safe, consistent behavior.

- **Consistent** — APIs use versioning strategies appropriate to their audience (public vs internal)
- **Validated** — All user input is validated server-side before processing
- **Injection-proof** — Database queries are protected through parameterized queries or ORM usage
- **XSS-safe** — User-generated content is properly sanitized before rendering
- **Centralized** — Authentication, rate limiting, and CORS are handled via gateway or proxy configuration

## Before You Start

1. **Identify API architecture** (REST, GraphQL, gRPC, internal vs public)
2. **Identify backend framework** (Express, Fastify, Django, Flask, Go, etc.)
3. **Check if API is public or internal-only** (versioning more important for public)
4. **Identify database access pattern** (ORM vs raw queries)

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## Versioning

### API-001: API Versioning Strategy
**Severity**: Optional

If the API uses versioning, it should follow a consistent strategy. Not all projects need versioning - internal APIs, early-stage projects, and single-consumer APIs may not require it.

**Check automatically**:

1. **Check for version patterns in routes**:
```bash
# URL path versioning
grep -rE "/v[0-9]+/" src/ app/ routes/ api/ --include="*.ts" --include="*.js" --include="*.py" --include="*.go" 2>/dev/null

# Check route definitions
grep -rE "('|\")/api/v[0-9]+|/v[0-9]+/|version.*[0-9]" src/ app/ routes/ 2>/dev/null

# Express/Fastify router prefixes
grep -rE "router.*v[0-9]|prefix.*v[0-9]|basePath.*v[0-9]" src/ app/ 2>/dev/null
```

2. **Check for header-based versioning**:
```bash
# Version headers
grep -rE "Accept-Version|API-Version|X-API-Version|api-version" src/ app/ lib/ 2>/dev/null

# Custom version extraction
grep -rE "req\.headers.*version|request\.headers.*version|getHeader.*version" src/ app/ 2>/dev/null
```

3. **Check for versioning middleware/libraries**:
```bash
# Node.js
grep -E "express-version-route|@fastify/versioning|express-routes-versioning" package.json 2>/dev/null

# Check OpenAPI spec version
grep -rE "^version:|\"version\":" openapi.yaml swagger.json api.yaml 2>/dev/null
```

4. **Check for consistency**:
```bash
# Find all route definitions and check if versioning is consistent
grep -rE "app\.(get|post|put|patch|delete)|router\.(get|post|put|patch|delete)" src/ app/ routes/ --include="*.ts" --include="*.js" 2>/dev/null | head -20

# Look for mixed patterns (some versioned, some not)
grep -rE "('|\")/api/" src/ app/ routes/ 2>/dev/null | grep -v "/v[0-9]" | head -10
```

**Ask user**:
- "Is this a public API that needs backward compatibility?"
- "Do you use URL versioning (/v1/) or header versioning?"
- "Are there multiple API versions currently active?"

**Cross-reference with**:
- API-002 (deprecation strategy if versions exist)
- DOC-001 (API documentation should mention versioning)

**Pass criteria**:
- Consistent versioning strategy (all versioned routes use same approach), OR
- No versioning (acceptable for internal/early-stage/single-consumer APIs)
- If public API with external consumers: versioning should exist

**Fail criteria**:
- Mixed versioning (some routes `/v1/`, some unversioned)
- Inconsistent strategy (URL for some, header for others)
- Public API with external consumers but no versioning

**Evidence to capture**:
- Versioning approach (URL path, header, or none)
- Sample versioned routes
- Whether API is public or internal
- Any consistency issues found

---

### API-002: API Deprecation Strategy
**Severity**: Optional

If multiple API versions exist, there should be a plan for sunsetting old versions.

**Check automatically**:

1. **Check for deprecation headers in code**:
```bash
# RFC 8594 Deprecation header
grep -rE "Deprecation|Sunset|deprecat" src/ app/ lib/ --include="*.ts" --include="*.js" --include="*.py" 2>/dev/null

# Custom deprecation warnings
grep -rE "deprecated|will be removed|end of life|sunset" src/ app/ lib/ 2>/dev/null | grep -i api
```

2. **Check documentation for deprecation policy**:
```bash
# Deprecation in docs
grep -riE "deprecat|sunset|migration|upgrade" docs/ README.md CHANGELOG.md API.md 2>/dev/null

# Version lifecycle documentation
grep -riE "version.*lifecycle|api.*lifecycle|supported.*version" docs/ README.md 2>/dev/null
```

3. **Check for deprecated route markers**:
```bash
# JSDoc/annotations
grep -rE "@deprecated|#.*deprecated|//.*deprecated" src/ app/ routes/ 2>/dev/null

# Deprecation logging
grep -rE "console\.(warn|log).*deprecat|log.*deprecat|warning.*deprecat" src/ app/ 2>/dev/null
```

4. **Check for migration guides**:
```bash
# Migration documentation
ls -la docs/*migration* docs/*upgrade* MIGRATION* UPGRADE* 2>/dev/null

# Version-specific docs
ls -la docs/v1* docs/v2* 2>/dev/null
```

**Ask user**:
- "How many API versions are currently active?"
- "What's the timeline for deprecating old versions?"
- "Is there a migration guide for consumers?"

**Cross-reference with**:
- API-001 (versioning strategy)
- DOC-001 (documentation should cover deprecation)

**Pass criteria**:
- Deprecation strategy documented OR implemented (headers/warnings), OR
- Single version exists (no deprecation needed yet)
- Migration guides available for version upgrades

**Fail criteria**:
- Multiple versions exist with no deprecation plan
- Old versions still active with no sunset timeline
- No migration path documented between versions
- Deprecated endpoints without warnings to consumers

**Evidence to capture**:
- Number of active versions
- Deprecation mechanisms in use (headers, warnings, docs)
- Migration documentation availability
- Sunset timeline if defined

---

## Input Validation

### API-003: Server-Side Input Validation
**Severity**: Critical

All user input must be validated on the server. Client-side validation alone is not sufficient - it can be bypassed.

**Check automatically**:

1. **Check for validation libraries**:
```bash
# Node.js
grep -E "\"zod\"|\"joi\"|\"yup\"|\"class-validator\"|\"express-validator\"|\"@sinclair/typebox\"|\"ajv\"" package.json 2>/dev/null

# Python
grep -E "pydantic|marshmallow|cerberus|voluptuous|jsonschema" requirements*.txt pyproject.toml setup.py 2>/dev/null

# Go
grep -E "go-playground/validator|ozzo-validation|govalidator" go.mod 2>/dev/null

# Ruby
grep -E "dry-validation|activemodel|strong_parameters" Gemfile 2>/dev/null
```

2. **Check validation usage in route handlers**:
```bash
# Zod/Joi/Yup schema validation
grep -rE "\.parse\(|\.validate\(|\.validateAsync\(|schema\.(parse|validate)" src/ app/ routes/ --include="*.ts" --include="*.js" 2>/dev/null

# Express-validator
grep -rE "body\(|param\(|query\(|validationResult" src/ app/ routes/ --include="*.ts" --include="*.js" 2>/dev/null

# Class-validator decorators
grep -rE "@IsString|@IsNumber|@IsEmail|@IsNotEmpty|@ValidateNested" src/ app/ --include="*.ts" 2>/dev/null

# Pydantic models
grep -rE "class.*BaseModel|Field\(|validator" src/ app/ --include="*.py" 2>/dev/null
```

3. **Check for validation middleware**:
```bash
# Middleware patterns
grep -rE "validateRequest|validateBody|validationMiddleware|zodMiddleware" src/ app/ lib/ 2>/dev/null

# Request body parsing with validation
grep -rE "app\.use.*json|bodyParser|express\.json" src/ app/ 2>/dev/null
```

4. **Check for unvalidated req.body usage**:
```bash
# Direct req.body access without validation (potential red flag)
grep -rE "req\.body\." src/ app/ routes/ --include="*.ts" --include="*.js" 2>/dev/null | head -20

# Check if validation happens before these usages
# (Manual review needed)
```

5. **Check for error responses on invalid input**:
```bash
# 400 Bad Request responses
grep -rE "400|BadRequest|ValidationError|Invalid" src/ app/ --include="*.ts" --include="*.js" --include="*.py" 2>/dev/null | head -10
```

**Ask user**:
- "What validation library do you use?"
- "Are all API endpoints validated before processing?"
- "What happens when validation fails? (400 response?)"

**Cross-reference with**:
- API-004 (SQL injection - validation is first line of defense)
- API-005 (XSS - input validation helps but output encoding is key)

**Pass criteria**:
- Validation library in use
- Request handlers validate input before processing
- Invalid input returns 400 with helpful error messages

**Fail criteria**:
- No validation library found
- Route handlers trust `req.body` without validation
- Validation only exists in frontend code
- Invalid input causes 500 errors instead of 400

**Evidence to capture**:
- Validation library/approach used
- Sample validated endpoints
- Error response format for validation failures
- Any routes that appear to skip validation

---

### API-004: SQL Injection Prevention
**Severity**: Critical

Database queries must use parameterized queries or ORM methods - never string concatenation with user input.

**Check automatically**:

1. **Check for ORM usage** (inherently safe when used properly):
```bash
# Node.js ORMs
grep -E "\"prisma\"|\"@prisma/client\"|\"typeorm\"|\"sequelize\"|\"drizzle-orm\"|\"knex\"|\"objection\"" package.json 2>/dev/null

# Python ORMs
grep -E "sqlalchemy|django|peewee|tortoise-orm" requirements*.txt pyproject.toml 2>/dev/null

# Go ORMs
grep -E "gorm|sqlx|ent" go.mod 2>/dev/null

# Ruby ORMs
grep -E "activerecord|sequel" Gemfile 2>/dev/null
```

2. **Check for dangerous raw query patterns**:
```bash
# Template literals in SQL (JavaScript) - HIGH RISK
grep -rE "\`SELECT.*\\\$\{|\`INSERT.*\\\$\{|\`UPDATE.*\\\$\{|\`DELETE.*\\\$\{" src/ app/ lib/ --include="*.ts" --include="*.js" 2>/dev/null

# String concatenation in SQL - HIGH RISK
grep -rE "\"SELECT.*\" \+|\"INSERT.*\" \+|\"UPDATE.*\" \+|\"DELETE.*\" \+" src/ app/ lib/ 2>/dev/null

# Python f-strings in SQL - HIGH RISK
grep -rE "f\"SELECT|f\"INSERT|f\"UPDATE|f\"DELETE|f'SELECT|f'INSERT" src/ app/ lib/ --include="*.py" 2>/dev/null

# .format() in SQL - HIGH RISK
grep -rE "\"SELECT.*\.format\(|\"INSERT.*\.format\(" src/ app/ lib/ --include="*.py" 2>/dev/null
```

3. **Check for raw query methods** (need manual review):
```bash
# Raw query execution that MIGHT be safe (if parameterized)
grep -rE "\.raw\(|\.execute\(|\$queryRaw|\$executeRaw|rawQuery|executeSql" src/ app/ lib/ 2>/dev/null

# Prisma raw queries (check for parameterization)
grep -rE "Prisma\.\\\$queryRaw|Prisma\.\\\$executeRaw|\\\$queryRawUnsafe|\\\$executeRawUnsafe" src/ app/ lib/ 2>/dev/null
```

4. **Check for safe parameterized patterns**:
```bash
# Parameterized queries (safe patterns)
grep -rE "\\\$1|\\\$2|:param|:name|\?.*\?|\[.*\]" src/ app/ lib/ 2>/dev/null | grep -iE "select|insert|update|delete" | head -10

# Prepared statements
grep -rE "prepare\(|prepared|parameterized" src/ app/ lib/ 2>/dev/null
```

**Ask user**:
- "Do you use an ORM or raw SQL queries?"
- "Are there any raw SQL queries in the codebase?"
- "How do you handle dynamic query conditions?"

**Cross-reference with**:
- API-003 (input validation - first line of defense)
- DB-004 (database users - limited permissions reduce impact)

**Pass criteria**:
- Uses ORM for all queries, OR
- Raw queries use parameterized placeholders (`$1`, `?`, `:name`)
- No string interpolation/concatenation with user input in SQL
- `$queryRawUnsafe` / `$executeRawUnsafe` not used (or justified and audited)

**Fail criteria**:
- String concatenation in SQL queries
- Template literals with `${variable}` in SQL
- Python f-strings or `.format()` in SQL
- `*Unsafe` raw query methods with user input

**Evidence to capture**:
- ORM used (if any)
- Any raw SQL found and whether it's parameterized
- Any dangerous patterns detected
- Use of unsafe raw query methods

---

### API-005: XSS Prevention
**Severity**: Critical

User-generated content must be escaped/sanitized before rendering to prevent script injection.

**Check automatically**:

1. **Check framework** (many auto-escape by default):
```bash
# React/Vue/Angular (auto-escape by default)
grep -E "\"react\"|\"vue\"|\"@angular/core\"|\"svelte\"|\"solid-js\"" package.json 2>/dev/null

# Server-side templating (check escape mode)
grep -E "\"ejs\"|\"pug\"|\"handlebars\"|\"mustache\"|\"nunjucks\"" package.json 2>/dev/null
grep -E "jinja2|django|mako" requirements*.txt 2>/dev/null
```

2. **Check for dangerous bypass patterns**:
```bash
# React dangerouslySetInnerHTML
grep -rE "dangerouslySetInnerHTML" src/ app/ components/ --include="*.tsx" --include="*.jsx" 2>/dev/null

# Vue v-html directive
grep -rE "v-html" src/ app/ components/ --include="*.vue" 2>/dev/null

# Angular innerHTML binding
grep -rE "\[innerHTML\]" src/ app/ --include="*.html" --include="*.ts" 2>/dev/null

# Direct innerHTML assignment
grep -rE "\.innerHTML\s*=" src/ app/ --include="*.ts" --include="*.js" 2>/dev/null

# jQuery html()
grep -rE "\.html\(" src/ app/ --include="*.ts" --include="*.js" 2>/dev/null
```

3. **Check for sanitization libraries**:
```bash
# Sanitization libraries (good sign if dangerous patterns exist)
grep -E "\"dompurify\"|\"sanitize-html\"|\"xss\"|\"isomorphic-dompurify\"|\"js-xss\"" package.json 2>/dev/null

# Python sanitization
grep -E "bleach|html\.escape|markupsafe" requirements*.txt 2>/dev/null

# Sanitization usage
grep -rE "DOMPurify\.sanitize|sanitizeHtml|xss\(|escape\(" src/ app/ --include="*.ts" --include="*.js" 2>/dev/null
```

4. **Check for user content rendering**:
```bash
# User content fields being rendered (manual review needed)
grep -rE "user\.bio|user\.description|comment\.content|post\.body|message\.text" src/ app/ components/ 2>/dev/null | head -10

# Markdown rendering (often allows HTML)
grep -E "\"marked\"|\"markdown-it\"|\"remark\"|\"showdown\"" package.json 2>/dev/null
grep -rE "marked\(|markdownIt|renderMarkdown" src/ app/ 2>/dev/null
```

5. **Check Content-Security-Policy** (defense in depth):
```bash
# CSP headers in code
grep -rE "Content-Security-Policy|contentSecurityPolicy|helmet" src/ app/ lib/ 2>/dev/null

# Next.js CSP config
grep -rE "contentSecurityPolicy" next.config.* 2>/dev/null
```

**Ask user**:
- "What frontend framework do you use?"
- "Is there any user-generated content that's rendered as HTML?"
- "Do you use a markdown renderer? Does it allow HTML?"

**Cross-reference with**:
- Section 32 (Content Security Policy - defense in depth)
- API-003 (input validation)
- CSS-001 (HttpOnly cookies - XSS can't steal them)

**Pass criteria**:
- Framework with auto-escaping (React, Vue, Angular, Svelte)
- Dangerous bypasses only used with sanitized content (DOMPurify, sanitize-html)
- OR no user-generated content rendered as HTML

**Fail criteria**:
- `dangerouslySetInnerHTML` with unsanitized user content
- `v-html` with unsanitized user content
- Direct `.innerHTML` assignment from user input
- Markdown rendered without HTML sanitization

**Evidence to capture**:
- Frontend framework (and whether it auto-escapes)
- Dangerous patterns found and whether sanitized
- Sanitization library used (if any)
- CSP headers present (defense in depth)

---

## API Architecture

### API-006: API Gateway / Proxy Configuration
**Severity**: Recommended

APIs should use a gateway/proxy for centralized concerns (auth, rate limiting, logging), or properly configure CORS for simpler setups.

**Check automatically**:

1. **Check for API gateway infrastructure**:
```bash
# AWS API Gateway
grep -rE "aws_api_gateway|apigateway|API Gateway" terraform/ cloudformation/ serverless.yml sam.yaml 2>/dev/null

# Kong configuration
ls -la kong.yml kong.conf 2>/dev/null
grep -E "kong" docker-compose*.yml 2>/dev/null

# Traefik
ls -la traefik.yml traefik.toml 2>/dev/null
grep -E "traefik" docker-compose*.yml 2>/dev/null

# nginx as reverse proxy
ls -la nginx.conf nginx/ 2>/dev/null
grep -E "nginx" docker-compose*.yml 2>/dev/null
grep -rE "proxy_pass|upstream" nginx/ *.conf 2>/dev/null
```

2. **Check for edge platforms**:
```bash
# Cloudflare Workers
ls -la wrangler.toml 2>/dev/null
grep -E "cloudflare" package.json 2>/dev/null

# Vercel Edge / Netlify Functions
ls -la vercel.json netlify.toml 2>/dev/null
grep -rE "edge|middleware" src/ app/ pages/ 2>/dev/null

# GraphQL Gateway
grep -E "\"@apollo/gateway\"|\"graphql-mesh\"|\"graphql-yoga\"" package.json 2>/dev/null
```

3. **Check for centralized concerns at gateway**:
```bash
# Auth at gateway level
grep -rE "authorize|authentication|jwt|bearer" nginx/ kong.yml traefik.yml 2>/dev/null

# Rate limiting at gateway (cross-ref RATE-001)
grep -rE "rate_limit|ratelimit|throttle" nginx/ kong.yml traefik.yml 2>/dev/null

# Logging at gateway
grep -rE "access_log|logging|log_format" nginx/ kong.yml 2>/dev/null
```

4. **If no gateway, check CORS configuration**:
```bash
# CORS middleware
grep -E "\"cors\"" package.json 2>/dev/null
grep -rE "cors\(|Access-Control-Allow" src/ app/ lib/ --include="*.ts" --include="*.js" 2>/dev/null

# CORS configuration
grep -rE "origin:|allowedOrigins|corsOptions" src/ app/ lib/ 2>/dev/null

# Wildcard origin (dangerous in production)
grep -rE "origin:\s*['\"]?\*['\"]?|Access-Control-Allow-Origin.*\*" src/ app/ lib/ 2>/dev/null
```

5. **Check for direct service exposure**:
```bash
# Backend ports exposed directly
grep -rE "ports:|expose:" docker-compose*.yml 2>/dev/null | grep -v "80\|443\|3000"

# Multiple services without unified entry point
grep -rE "services:" docker-compose*.yml 2>/dev/null
```

**Ask user**:
- "Do you use an API gateway or expose services directly?"
- "Is CORS configured, and what origins are allowed?"
- "Are auth/rate-limiting handled centrally or per-service?"

**Cross-reference with**:
- RATE-001 (rate limiting - often at gateway)
- AUTH-001 (authentication - can be centralized at gateway)
- Section 32 (CSP headers - often set at gateway/proxy)
- SEC-001 (Cloudflare - acts as proxy/gateway)

**Pass criteria**:
- API gateway in use with centralized auth/rate-limiting/logging, OR
- CORS properly configured (whitelisted origins, not `*` in production)
- Clear architectural decision documented
- Single entry point for API traffic (not multiple exposed services)

**Fail criteria**:
- CORS with `*` origin in production
- Auth logic duplicated across multiple services with no gateway
- Backend services directly exposed to internet without proxy
- No clear API architecture decision

**Evidence to capture**:
- Gateway/proxy in use (if any)
- CORS configuration (origins allowed)
- Whether concerns are centralized or distributed
- Architectural documentation

---

## Completing the Audit

After checking all items:

1. **Summarize results**:
   - API-001: PASS/FAIL/N/A (Optional) - API versioning strategy
   - API-002: PASS/FAIL/N/A (Optional) - API deprecation strategy
   - API-003: PASS/FAIL (Critical) - Server-side input validation
   - API-004: PASS/FAIL (Critical) - SQL injection prevention
   - API-005: PASS/FAIL (Critical) - XSS prevention
   - API-006: PASS/FAIL (Recommended) - API gateway / proxy configuration

2. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority

3. **Common recommendations**:
   - If no validation: Add Zod (TypeScript) or Joi (JavaScript) for schema validation
   - If SQL injection risk: Use ORM methods, never string concatenation; switch to parameterized queries
   - If XSS risk: Add DOMPurify for user content, review all `dangerouslySetInnerHTML` usage
   - If CORS `*` in prod: Whitelist specific origins
   - If no gateway: Start with nginx reverse proxy or Cloudflare for centralized concerns

4. **Maturity assessment**:
   - **Level 1**: No input validation, raw SQL with string concatenation - critical vulnerabilities
   - **Level 2**: Basic validation exists, ORM in use, but inconsistent practices
   - **Level 3**: Comprehensive validation, parameterized queries, proper CORS - good baseline
   - **Level 4**: Full API design maturity - versioning strategy, gateway with centralized concerns, sanitization for all user content, CSP headers

5. **Record audit date** and auditor
