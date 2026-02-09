# Authentication & Endpoints Audit Guide

This guide walks you through auditing a project's authentication system and HTTP endpoint security.

## The Goal: Secure by Default

Authentication should be simple enough to explain in two sentences, yet robust enough to withstand scrutiny. Every endpoint should be protected unless explicitly marked public, and the system should fail fast before wasting resources on unauthorized requests.

- **Simple** — auth flow explainable in 2-3 sentences, single entry point
- **Documented** — auth system described for developers and AI agents
- **Tested** — comprehensive tests covering happy paths and failure cases
- **Default-deny** — endpoints protected unless explicitly public
- **Fail-fast** — auth validated before any expensive operations
- **Verified** — webhooks validate signatures before processing payloads

## Before You Start

1. Confirm you're in the target repository's root directory
2. Complete AUTH-001 first - tracing the auth flow informs all other checks
3. Have the user available for questions about auth architecture and external services

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## Auth System

### AUTH-001: Auth system is simple, not convoluted
**Severity**: Recommended

**Check automatically**:

1. **Find auth-related files**:
   ```bash
   find . -type f \( -name "*auth*" -o -name "*session*" -o -name "*middleware*" \) \
     -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null
   ```

2. **Identify auth mechanism(s) in use**:
   ```bash
   grep -rl "passport\|jsonwebtoken\|express-session\|next-auth\|lucia\|clerk\|auth0\|supabase/auth" \
     --include="*.ts" --include="*.js" --include="*.tsx" . 2>/dev/null | head -20
   ```

3. **Read auth files and trace the flow**:
   - Read the identified auth files
   - Trace: request → auth check → user resolution → protected resource
   - Identify where tokens/sessions are created, validated, and invalidated

**Pass criteria**:
- Auditor can explain the auth flow in 2-3 sentences
- Single clear entry point for authentication
- Auth mechanism is obvious from reading the code

**Fail criteria**:
- Auditor cannot explain auth flow after reading code
- Multiple competing auth mechanisms with unclear boundaries
- Auth logic scattered with no discernible pattern

**If auth flow is unclear, ask user**:
"Unable to trace the auth flow from the code. Can you explain how authentication works in this project?"

**Evidence to capture**:
- Written explanation of auth flow (2-5 sentences)
- Simple diagram if multiple components (e.g., "Request → Middleware → JWT validation → User lookup → Handler")
- List of auth entry points (login, logout, token refresh)

---

### AUTH-002: Auth system is documented
**Severity**: Recommended

**Check automatically**:

1. **Search for auth documentation**:
   ```bash
   # Check README for auth section
   grep -i "auth\|authentication\|login\|session" README.md 2>/dev/null

   # Check for dedicated auth docs
   find . -type f \( -name "*.md" -o -name "*.txt" \) -path "*/docs/*" 2>/dev/null | xargs grep -li "auth" 2>/dev/null

   # Check for inline documentation in auth files
   find . -type f \( -name "*auth*" \) -not -path "*/node_modules/*" 2>/dev/null | head -5
   ```

2. **Check for API documentation covering auth endpoints**:
   ```bash
   # OpenAPI/Swagger
   find . -type f \( -name "openapi*.yaml" -o -name "openapi*.json" -o -name "swagger*.yaml" -o -name "swagger*.json" \) 2>/dev/null
   ```

3. **Read any found documentation and auth files** to verify:
   - Documentation exists
   - Documentation matches actual implementation (cross-reference AUTH-001 findings)

**Cross-reference with**:
- AUTH-001: Documentation should match the auth flow you traced

**Pass criteria**:
- Auth flow documented somewhere (README, docs/, or inline comments)
- Documentation matches actual implementation
- A new developer could understand auth from docs alone

**Fail criteria**:
- No auth documentation anywhere
- Documentation exists but contradicts implementation
- Documentation is outdated (references removed mechanisms)

**If no docs found, ask user**:
"No auth documentation found. Is the auth system documented elsewhere (Notion, Confluence, etc.)? If not, this should be added."

**Evidence to capture**:
- Location of auth documentation (file path or external URL)
- Whether documentation matches AUTH-001 traced flow
- Any gaps between docs and implementation

---

### AUTH-003: AI agents can verify auth implementation
**Severity**: Recommended

**Check automatically**:

1. **Verify auth code is readable (not obfuscated/minified)**:
   ```bash
   # Check auth files are source, not bundled
   find . -type f \( -name "*auth*" \) -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.next/*" 2>/dev/null
   ```

2. **Check for CLAUDE.md or AGENTS.md with auth context**:
   ```bash
   cat CLAUDE.md 2>/dev/null | grep -i "auth"
   cat AGENTS.md 2>/dev/null | grep -i "auth"
   ```

3. **Attempt to trace auth as an AI agent would**:
   - Read auth files identified in AUTH-001
   - Can you determine: login flow, token/session handling, protected route pattern?
   - Are there magic strings, undocumented env vars, or external dependencies that block understanding?

**Cross-reference with**:
- AUTH-001: If you could trace the flow, agents can too
- AUTH-002: Good docs help agents verify

**Pass criteria**:
- Auth source files are in repo (not external/compiled)
- No critical auth logic hidden in env vars or external services without documentation
- An AI agent reading the codebase can answer: "How does auth work here?"

**Fail criteria**:
- Auth logic in compiled/minified files only
- Critical auth decisions depend on undocumented external services
- Auth code uses patterns an AI cannot follow (excessive indirection, dynamic requires)

**If auth relies on external service, ask user**:
"Auth appears to use [Clerk/Auth0/etc.]. Is the integration documented? Can an AI agent understand how it connects to your app?"

**Evidence to capture**:
- Whether auth source is available in repo
- External auth dependencies (if any)
- Gaps that would block AI verification

---

### AUTH-004: Comprehensive tests on auth system
**Severity**: Critical

**Check automatically**:

1. **Find auth-related test files**:
   ```bash
   find . -type f \( -name "*.test.ts" -o -name "*.spec.ts" -o -name "*.test.js" -o -name "*.spec.js" \) \
     -not -path "*/node_modules/*" 2>/dev/null | xargs grep -li "auth\|login\|session\|token" 2>/dev/null
   ```

2. **Check test coverage of auth files** (if coverage report exists):
   ```bash
   # Look for coverage reports
   find . -type d -name "coverage" -not -path "*/node_modules/*" 2>/dev/null
   cat coverage/lcov-report/index.html 2>/dev/null | grep -A5 "auth"
   ```

3. **Read auth test files and verify coverage of**:
   - Login success and failure cases
   - Token/session creation and validation
   - Token/session expiration and refresh
   - Logout/invalidation
   - Protected route access (with and without auth)
   - Edge cases (expired token, malformed token, missing token)

**Cross-reference with**:
- AUTH-001: Tests should cover the auth flow you traced

**Pass criteria**:
- Dedicated auth test file(s) exist
- Tests cover happy path (login, access protected resource, logout)
- Tests cover failure cases (invalid credentials, expired token, unauthorized access)
- Tests run and pass

**Fail criteria**:
- No auth-specific tests
- Tests only cover happy path, no failure cases
- Auth tests exist but are skipped or failing

**If tests are minimal, ask user**:
"Found auth tests but they only cover [X]. Are there additional auth tests elsewhere, or is this a known gap?"

**Evidence to capture**:
- Auth test file locations
- Scenarios covered (login, logout, expiry, invalid token, etc.)
- Test pass/fail status (run them if possible)
- Coverage gaps identified

---

## HTTP Endpoints / Webhooks

### AUTH-005: All endpoints documented
**Severity**: Recommended

**Check automatically**:

1. **Look for API documentation**:
   ```bash
   # OpenAPI/Swagger files
   find . -type f \( -name "openapi*.yaml" -o -name "openapi*.json" -o -name "swagger*.yaml" -o -name "swagger*.json" \) \
     -not -path "*/node_modules/*" 2>/dev/null

   # Check for API docs in docs folder
   find . -type f -name "*.md" -path "*/docs/*" 2>/dev/null | xargs grep -li "endpoint\|api\|route" 2>/dev/null
   ```

2. **Find all route definitions in code**:
   ```bash
   # Express/Node patterns
   grep -rn "app\.\(get\|post\|put\|patch\|delete\)\|router\.\(get\|post\|put\|patch\|delete\)" \
     --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules | head -30

   # Next.js API routes
   find . -type f -path "*/api/*" \( -name "*.ts" -o -name "*.js" \) -not -path "*/node_modules/*" 2>/dev/null
   ```

3. **Check if docs are exposed in production**:
   ```bash
   # Look for Swagger UI routes
   grep -rn "swagger-ui\|/api-docs\|/docs\|/swagger" --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules

   # Check if gated by environment
   grep -rn "swagger\|api-docs" --include="*.ts" --include="*.js" . 2>/dev/null | grep -i "NODE_ENV\|production\|isDev"
   ```

4. **Cross-reference**: Compare documented endpoints against actual routes in code

**Pass criteria**:
- API documentation exists (OpenAPI, Swagger, or markdown)
- Documentation covers all routes found in code
- Docs endpoint disabled in production OR project intentionally exposes public API docs

**Fail criteria**:
- No endpoint documentation
- Documentation exists but is incomplete (missing endpoints)
- Swagger UI / docs endpoint exposed in production without intentional reason

**If no formal docs, ask user**:
"No OpenAPI/Swagger found. Are endpoints documented elsewhere? How do consumers know what's available?"

**If docs exposed in production, ask user**:
"API docs appear accessible in production (/api-docs, /swagger). Is this intentional? For internal APIs, docs should be dev-only."

**Evidence to capture**:
- Documentation location (file path or URL)
- Count: documented endpoints vs actual endpoints in code
- Whether docs are production-accessible (and if intentional)

---

### AUTH-006: Endpoints easily auditable
**Severity**: Recommended

**Check automatically**:

1. **Use framework CLI to list routes** (if available):
   ```bash
   # Laravel
   php artisan route:list 2>/dev/null

   # Rails
   rails routes 2>/dev/null

   # Django (with django-extensions)
   python manage.py show_urls 2>/dev/null

   # Symfony
   php bin/console debug:router 2>/dev/null

   # Phoenix/Elixir
   mix phx.routes 2>/dev/null
   ```

2. **Check if routes are centralized or scattered**:
   ```bash
   # Count files containing route definitions
   grep -rl "app\.\(get\|post\|put\|patch\|delete\)\|router\.\(get\|post\|put\|patch\|delete\)" \
     --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules | wc -l

   # List route files
   grep -rl "app\.\(get\|post\|put\|patch\|delete\)\|router\.\(get\|post\|put\|patch\|delete\)" \
     --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules
   ```

3. **Check for route index or manifest**:
   ```bash
   # Look for centralized route registration
   find . -type f \( -name "routes.ts" -o -name "routes.js" -o -name "router.ts" -o -name "index.ts" -path "*/routes/*" \) \
     -not -path "*/node_modules/*" 2>/dev/null
   ```

4. **For file-based routing (Next.js, Nuxt, SvelteKit)**:
   ```bash
   # List API route structure
   find . -type f -path "*/api/*" \( -name "*.ts" -o -name "*.js" \) -not -path "*/node_modules/*" 2>/dev/null | sort
   ```

**Pass criteria**:
- Framework CLI lists all routes, OR
- All endpoints can be listed in under 2 minutes of code reading
- Routes are centralized or follow predictable file-based pattern
- No hidden endpoints (registered dynamically at runtime from config/DB)

**Fail criteria**:
- No CLI command and routes scattered across 10+ files
- Endpoints registered dynamically (hard to audit statically)
- Cannot produce complete endpoint list from code or CLI

**If routes are scattered, ask user**:
"Routes are spread across [X] files with no CLI listing. Is there a route manifest or way to list all endpoints? Dynamic route registration makes security audits difficult."

**Evidence to capture**:
- Route listing method (CLI command, file-based, or manual grep)
- Complete list of endpoints found
- Any dynamic/runtime route registration detected

---

### AUTH-007: Endpoints follow auth best practices
**Severity**: Critical

**Check automatically**:

1. **Verify all non-public endpoints require auth**:
   ```bash
   # Find routes and check for auth middleware
   grep -rn "app\.\(get\|post\|put\|patch\|delete\)\|router\.\(get\|post\|put\|patch\|delete\)" \
     --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules | head -30

   # Look for auth middleware patterns
   grep -rn "isAuthenticated\|requireAuth\|authMiddleware\|protect\|authenticate\|@UseGuards\|@Authorized" \
     --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules
   ```

2. **Check for default-deny pattern** (auth required unless explicitly public):
   ```bash
   # Look for global auth middleware applied
   grep -rn "app\.use.*auth\|app\.use.*protect\|app\.use.*authenticate" \
     --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules

   # Look for public route allowlist pattern
   grep -rn "publicRoutes\|whitelist\|excludeRoutes\|isPublic" \
     --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules
   ```

3. **Check for authorization (not just authentication)**:
   ```bash
   # Role/permission checks
   grep -rn "hasRole\|hasPermission\|isAdmin\|canAccess\|@Roles\|authorize" \
     --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules
   ```

4. **Review a sample of protected endpoints**:
   - Read 3-5 sensitive endpoints (user data, admin, payments)
   - Verify auth check happens before any business logic

**Cross-reference with**:
- AUTH-001: Auth flow should show where checks happen
- AUTH-006: Use endpoint list to identify what needs protection

**Pass criteria**:
- Default-deny pattern (global auth, explicit public routes), OR
- All sensitive endpoints have explicit auth middleware
- Authorization checks exist for role-restricted endpoints
- No sensitive endpoints unprotected

**Fail criteria**:
- Sensitive endpoints without auth middleware
- Default-allow pattern (no global auth, must remember to add per-route)
- Authentication only, no authorization for admin/privileged routes

**If default-allow pattern, ask user**:
"Auth is applied per-route rather than globally. How do you ensure new endpoints aren't accidentally left unprotected?"

**Evidence to capture**:
- Auth pattern (default-deny vs default-allow)
- Sample of protected endpoints reviewed
- Any unprotected sensitive endpoints found

---

### AUTH-008: Fail fast - no heavy work before auth validation
**Severity**: Critical

**Check automatically**:

1. **Sample protected endpoints and check order of operations**:
   ```bash
   # Find route handlers with auth
   grep -rn -A20 "isAuthenticated\|requireAuth\|authMiddleware\|protect" \
     --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules | head -50
   ```

2. **Look for expensive operations that might run before auth**:
   ```bash
   # Database calls, file reads, external API calls
   grep -rn "prisma\.\|mongoose\.\|sequelize\.\|fetch(\|axios\.\|fs\.\|readFile" \
     --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules | head -30
   ```

3. **Review middleware order in route definitions**:
   - Auth middleware should be first (or near-first) in chain
   - Body parsing is OK before auth
   - Database queries, file uploads, external calls should be AFTER auth

4. **Check for file upload handling**:
   ```bash
   # Multer, formidable, busboy - file uploads before auth is dangerous
   grep -rn "multer\|formidable\|busboy\|upload\." \
     --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules
   ```

**Pass criteria**:
- Auth middleware runs before business logic
- No database queries before auth validation
- No file uploads processed before auth validation
- No external API calls before auth validation

**Fail criteria**:
- Database queries in middleware that runs before auth
- File uploads accepted before checking auth
- Heavy computation or external calls before auth check
- Request body fully parsed/validated before auth (for large payloads)

**If heavy work found before auth, ask user**:
"Found [database query/file upload/etc.] running before auth check in [endpoint]. Is this intentional? Unauthenticated requests shouldn't trigger expensive operations."

**Evidence to capture**:
- Middleware order for sample endpoints
- Any expensive operations found before auth
- File upload handling pattern

---

### AUTH-009: Auth check is cheap (no expensive CPU before validation)
**Severity**: Recommended

**Check automatically**:

1. **Identify the auth validation mechanism**:
   ```bash
   # JWT verification (cheap - cryptographic signature check)
   grep -rn "jwt\.verify\|jsonwebtoken\|jose\|verifyToken" \
     --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules

   # Session lookup (depends - check if cached)
   grep -rn "session\.\|getSession\|findSession" \
     --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules
   ```

2. **Check if auth hits database on every request**:
   ```bash
   # Look inside auth middleware for DB calls
   grep -rn -A15 "isAuthenticated\|requireAuth\|authMiddleware" \
     --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules | grep -i "prisma\|mongoose\|findOne\|findById\|query"
   ```

3. **Check for expensive operations in auth flow**:
   ```bash
   # bcrypt/argon comparison on every request (should only be at login)
   grep -rn "bcrypt\.compare\|argon2\.verify\|scrypt" \
     --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules
   ```

4. **Check for caching on session/user lookups**:
   ```bash
   # Redis session store or cache
   grep -rn "redis\|memcached\|cache\.\|lru-cache" \
     --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules
   ```

**Pass criteria**:
- JWT-based: signature verification only (no DB call per request)
- Session-based: session store is in-memory or Redis (not DB per request)
- User lookup (if needed) is cached
- No password hashing/comparison on every request

**Fail criteria**:
- Database query on every authenticated request for session lookup
- User permissions fetched from DB on every request without caching
- Expensive crypto operations (bcrypt/argon) outside of login flow

**If DB hit on every request, ask user**:
"Auth appears to query the database on every request. Is this cached? Consider Redis sessions or JWT to reduce DB load."

**Evidence to capture**:
- Auth validation method (JWT, session, API key)
- Whether DB is hit per request
- Caching mechanism (if any)

---

### AUTH-010: Webhooks verify signatures
**Severity**: Critical

**Check automatically**:

1. **Find webhook endpoints**:
   ```bash
   # Common webhook path patterns
   grep -rn "webhook\|/hook\|/callback\|/notify" \
     --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules | grep -i "route\|app\.\|router\."

   # Stripe, GitHub, Slack, etc. specific
   grep -rn "stripe.*webhook\|github.*webhook\|slack.*event\|twilio.*webhook" \
     --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules
   ```

2. **Check for signature verification**:
   ```bash
   # Common signature verification patterns
   grep -rn "verifySignature\|constructEvent\|verify.*signature\|x-hub-signature\|stripe-signature\|webhook.*secret" \
     --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules

   # Crypto/HMAC verification
   grep -rn "createHmac\|timingSafeEqual" \
     --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules
   ```

3. **Cross-reference webhook endpoints with verification**:
   - Read each webhook handler
   - Verify signature check happens before processing payload

4. **Check for raw body access** (required for signature verification):
   ```bash
   # Express raw body
   grep -rn "rawBody\|bodyParser\.raw\|express\.raw" \
     --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules
   ```

**Pass criteria**:
- All webhook endpoints verify signatures before processing
- Using provider SDK methods (e.g., `stripe.webhooks.constructEvent`)
- Raw body preserved for signature verification
- Webhook secrets stored in env vars, not hardcoded

**Fail criteria**:
- Webhook endpoints with no signature verification
- Signature check after processing begins
- Webhook secrets hardcoded in source
- Raw body not available (signature verification will fail)

**If no signature verification found, ask user**:
"Webhook endpoint [path] has no signature verification. Is this protected by Cloudflare Zero Trust or another mechanism? Unverified webhooks can be spoofed."

**Exception**:
- Webhooks behind Cloudflare Zero Trust don't need signature verification (but document this)

**Evidence to capture**:
- List of webhook endpoints found
- Verification method per endpoint (SDK, HMAC, or none)
- Any unverified webhooks and their protection mechanism

---

## Completing the Audit

After checking all items:

1. **Summarize results** by category:
   - Critical items: X passed, Y failed
   - Recommended items: X passed, Y failed

2. **List all failures** with:
   - Item ID and title
   - What was found (evidence)
   - Recommended fix

3. **Prioritize fixes**:
   - Critical failures first (AUTH-004, AUTH-007, AUTH-008, AUTH-010)
   - Auth system issues affect everything downstream
   - Quick wins vs larger refactors

4. **Record audit date** and auditor (you + user confirmation)
