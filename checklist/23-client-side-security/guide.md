# Client-Side Security & Storage Audit Guide

This guide walks you through auditing a project's client-side security practices, including cookie configuration, browser storage usage, and JWT handling.

## Before You Start

1. **Get access to the codebase** (required for this section)
2. **Identify the auth library** in use (next-auth, iron-session, passport, custom)
3. **Identify if JWTs are used** (some apps use session-based auth only)

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## Cookies

### CSS-001: Cookies use HttpOnly for sensitive data
**Severity**: Critical

Session tokens, auth data, and any sensitive info must use `HttpOnly` so JavaScript cannot access them. This prevents XSS attacks from stealing sessions. Non-sensitive cookies (UI preferences, feature flags) can be JS-accessible.

**Check automatically**:

1. **Find cookie-setting code in the codebase**:
```bash
# Node/Express patterns
grep -rE "res\.cookie\(|\.setCookie\(|cookie\s*:" --include="*.ts" --include="*.js" src/ server/ api/ 2>/dev/null

# Next.js patterns
grep -rE "cookies\(\)\.set|serialize\(" --include="*.ts" --include="*.js" src/ app/ pages/ 2>/dev/null

# Generic Set-Cookie header
grep -rE "Set-Cookie|setHeader.*cookie" --include="*.ts" --include="*.js" src/ 2>/dev/null
```

2. **Check cookie configuration for HttpOnly**:
```bash
# Look for httpOnly: true (good) or httpOnly: false (bad)
grep -rE "httpOnly\s*:" --include="*.ts" --include="*.js" -A2 -B2 src/ 2>/dev/null

# Look for cookie options objects
grep -rE "cookie.*\{|cookieOptions|sessionOptions" --include="*.ts" --include="*.js" src/ 2>/dev/null
```

3. **Check auth/session libraries** (often configure cookies):
```bash
# Common libraries
grep -E "iron-session|next-auth|express-session|cookie-session|passport" package.json

# Find their config
grep -rE "ironOptions|authOptions|sessionConfig|cookieConfig" --include="*.ts" --include="*.js" src/ 2>/dev/null
```

4. **Check for document.cookie usage** (client-side cookie access):
```bash
# Should only be for non-sensitive data (preferences, analytics)
grep -rE "document\.cookie" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" src/ 2>/dev/null
```

5. **Verify with live headers** (if production URL available):
```bash
curl -sI https://example.com | grep -i "set-cookie"
# Check: HttpOnly present? Secure present? SameSite set?
```

**Cross-reference with**:
- CSS-002 (tokens shouldn't be in browser storage either)
- CSS-003 (JWT storage practices)
- SEC-005 (Secure flag and SameSite attribute)

**Pass criteria**:
- Auth/session cookies configured with `httpOnly: true`
- `document.cookie` usage limited to non-sensitive data (preferences, UI state)
- Cookie library configs (iron-session, next-auth) have HttpOnly enabled

**Fail criteria**:
- Session/auth cookies with `httpOnly: false` or not set
- JWT tokens stored in JS-accessible cookies
- `document.cookie` used for auth tokens

**Evidence to capture**:
- Cookie-setting code locations and their httpOnly config
- Which cookies are set (names, purposes)
- Any document.cookie usage and what it's for
- Auth library cookie configuration

---

## Browser Storage

### CSS-002: Browser storage used appropriately
**Severity**: Recommended

`localStorage` persists indefinitely and is accessible to any JS on the domain (XSS risk). Should only store non-sensitive data like UI preferences. `sessionStorage` clears on tab close - better for temporary state. Never store tokens, secrets, or PII in either.

**Check automatically**:

1. **Find all localStorage usage**:
```bash
# All localStorage calls
grep -rE "localStorage\.(get|set|remove)Item|localStorage\[" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" src/ 2>/dev/null
```

2. **Find all sessionStorage usage**:
```bash
grep -rE "sessionStorage\.(get|set|remove)Item|sessionStorage\[" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" src/ 2>/dev/null
```

3. **Check what's being stored** (look for sensitive patterns):
```bash
# Red flags: tokens, auth, jwt, session, password, secret, key
grep -rE "localStorage\.setItem\s*\(\s*['\"]" --include="*.ts" --include="*.js" --include="*.tsx" -A1 src/ 2>/dev/null | grep -iE "token|auth|jwt|session|password|secret|key|user"
```

4. **Check for storage abstraction layers**:
```bash
# Custom hooks or utilities that wrap storage
grep -rE "useLocalStorage|useStorage|storageService|localStorageUtil" --include="*.ts" --include="*.js" src/ 2>/dev/null
```

5. **Review storage keys** (naming reveals intent):
```bash
# Extract all storage key names
grep -rhoE "localStorage\.(get|set)Item\s*\(\s*['\"][^'\"]+['\"]" --include="*.ts" --include="*.js" --include="*.tsx" src/ 2>/dev/null | sort -u
```

**Acceptable localStorage uses**:
- Theme preference (dark/light mode)
- Language/locale preference
- UI state (sidebar collapsed, dismissed banners)
- Feature flags (non-security)
- Anonymous analytics IDs

**Not acceptable in localStorage**:
- JWT tokens, access tokens, refresh tokens
- Session identifiers
- User PII (email, name, etc.)
- API keys or secrets

**Cross-reference with**:
- CSS-001 (sensitive data should be in HttpOnly cookies, not storage)
- CSS-003 (JWT handling practices)

**Pass criteria**:
- localStorage only used for preferences/UI state
- No tokens or auth data in localStorage
- sessionStorage used for temporary state that should clear on tab close

**Fail criteria**:
- JWT/auth tokens in localStorage
- PII stored in localStorage
- Sensitive data in either storage type

**Evidence to capture**:
- All localStorage keys found and their purpose
- Any sessionStorage usage and purpose
- Red flags (tokens, auth data in storage)
- Storage abstraction utilities (if any)

---

## JWT Handling

### CSS-003: JWT handling practices documented and followed
**Severity**: Recommended

JWTs have many footguns - storage location, expiration, refresh flow, signing algorithms. Teams should document their chosen practices and periodically verify compliance.

**Check automatically**:

1. **Find JWT-related documentation**:
```bash
# Look for JWT docs in common locations
find . -type f \( -name "*.md" -o -name "*.txt" \) -exec grep -liE "jwt|json web token|access.?token|refresh.?token" {} \; 2>/dev/null

# Check for auth/security docs
ls -la docs/*auth* docs/*security* docs/*jwt* README*.md SECURITY.md 2>/dev/null
```

2. **Identify JWT library in use**:
```bash
# Common JWT libraries
grep -E "jsonwebtoken|jose|jwt-decode|@auth0/|next-auth|passport-jwt" package.json
```

3. **Find JWT implementation code**:
```bash
# Token creation/signing
grep -rE "jwt\.sign|signJwt|createToken|generateToken|new SignJWT" --include="*.ts" --include="*.js" src/ 2>/dev/null

# Token verification
grep -rE "jwt\.verify|verifyJwt|validateToken|jwtVerify" --include="*.ts" --include="*.js" src/ 2>/dev/null
```

4. **Check JWT configuration** (expiration, algorithm):
```bash
# Expiration settings
grep -rE "expiresIn|exp:|maxAge.*token" --include="*.ts" --include="*.js" src/ 2>/dev/null

# Algorithm settings (RS256/ES256 preferred over HS256 for production)
grep -rE "algorithm.*HS256|algorithm.*RS256|algorithm.*ES256|alg:" --include="*.ts" --include="*.js" src/ 2>/dev/null
```

5. **Check where tokens are stored** (ties back to CSS-001/002):
```bash
# Client-side token storage
grep -rE "localStorage.*token|sessionStorage.*token|token.*localStorage" --include="*.ts" --include="*.tsx" --include="*.js" src/ 2>/dev/null
```

6. **Check for refresh token flow**:
```bash
grep -rE "refreshToken|refresh_token|tokenRefresh|rotateToken" --include="*.ts" --include="*.js" src/ 2>/dev/null
```

**Ask user**:
- "Is JWT usage documented anywhere (Notion, Confluence, README)?"
- "When was the last time JWT practices were reviewed?"
- "Are you using short-lived access tokens + refresh tokens?"

**Key JWT best practices to verify**:
- Short expiration for access tokens (15min-1hr)
- Refresh tokens stored server-side or in HttpOnly cookies
- Strong signing algorithm (RS256/ES256 preferred over HS256)
- Tokens not stored in localStorage
- Token revocation strategy exists

**Cross-reference with**:
- CSS-001 (tokens should be in HttpOnly cookies)
- CSS-002 (tokens should NOT be in localStorage)
- SEC-XXX (signing key rotation)

**Pass criteria**:
- JWT practices documented (in repo or external docs)
- Implementation matches documented practices
- Short-lived access tokens with refresh flow, OR
- Session-based auth (no long-lived JWTs)

**Fail criteria**:
- No documentation of JWT practices
- Long-lived JWTs (>24hr) without refresh mechanism
- JWTs stored in localStorage
- Using `none` algorithm or weak signing

**Evidence to capture**:
- JWT library in use
- Token expiration configuration
- Signing algorithm
- Storage location (cookies vs localStorage)
- Documentation location (if exists)
- Refresh token strategy (if any)

---

## Completing the Audit

After checking all items:

1. **Summarize results**:
   - CSS-001: PASS/FAIL (Critical) - HttpOnly cookies
   - CSS-002: PASS/FAIL (Recommended) - Browser storage
   - CSS-003: PASS/FAIL (Recommended) - JWT practices

2. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority

3. **Common recommendations**:
   - If auth cookies missing HttpOnly: Update cookie config to set `httpOnly: true` for all auth/session cookies
   - If tokens in localStorage: Move to HttpOnly cookies or secure session management
   - If no JWT documentation: Create auth.md documenting token types, expiration, storage, and refresh flow
   - If long-lived JWTs: Implement short-lived access tokens (15min-1hr) with refresh token rotation

4. **Maturity assessment**:
   - **Level 1**: Tokens in localStorage, no HttpOnly, no documentation
   - **Level 2**: HttpOnly cookies used but JWT practices undocumented
   - **Level 3**: Secure storage, documented practices, but no refresh flow
   - **Level 4**: HttpOnly cookies, short-lived JWTs, refresh rotation, documented and audited

5. **Record audit date** and auditor
