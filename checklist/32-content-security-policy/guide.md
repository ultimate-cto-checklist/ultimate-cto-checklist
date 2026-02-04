# Content Security Policy Audit Guide

This guide walks you through auditing a project's Content Security Policy (CSP) configuration - headers, reporting, inline script handling, and source whitelisting.

## Before You Start

1. **Identify where CSP could be configured** (application code, nginx, Cloudflare, Vercel/Netlify headers)
2. **Identify frontend architecture** (SPA, SSR, static site - affects CSP complexity)
3. **Identify third-party script usage** (analytics, chat widgets, payment forms, fonts)
4. **Check if site is live** (can test actual response headers)

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## CSP Headers

### CSP-001: Full CSP headers configured
**Severity**: Recommended

CSP headers provide defense-in-depth against XSS by restricting what resources the browser can load. Even with good input sanitization, CSP is a safety net.

**Check automatically**:

1. **Check for CSP middleware/libraries**:
```bash
# Helmet (most common in Node.js)
grep -E "\"helmet\"" package.json 2>/dev/null

# CSP-specific packages
grep -E "\"content-security-policy\"|\"csp\"" package.json 2>/dev/null
```

2. **Check for CSP header configuration in code**:
```bash
# Direct header setting
grep -rE "Content-Security-Policy|contentSecurityPolicy" src/ app/ lib/ --include="*.ts" --include="*.js" 2>/dev/null

# Helmet CSP config
grep -rE "helmet\.contentSecurityPolicy|contentSecurityPolicy\(" src/ app/ --include="*.ts" --include="*.js" 2>/dev/null

# Next.js CSP in headers
grep -rE "Content-Security-Policy" next.config.* 2>/dev/null
```

3. **Check for CSP in infrastructure configs**:
```bash
# nginx
grep -rE "Content-Security-Policy|add_header.*CSP" nginx/ *.conf 2>/dev/null

# Cloudflare headers (transform rules)
grep -rE "Content-Security-Policy" cloudflare/ wrangler.toml 2>/dev/null

# Vercel/Netlify headers
grep -rE "Content-Security-Policy" vercel.json netlify.toml _headers 2>/dev/null
```

4. **Check actual response headers** (if site is live):
```bash
curl -sI https://example.com | grep -i "content-security-policy"
```

5. **Check for key directives** (once CSP is found):
```
Must-have directives to look for in CSP value:
- default-src (fallback for all resource types)
- script-src (JavaScript sources)
- style-src (CSS sources)
- frame-ancestors (clickjacking protection, replaces X-Frame-Options)
- upgrade-insecure-requests (force HTTPS for resources)
```

**Ask user**:
- "Where is CSP configured? (application code, nginx, Cloudflare, Vercel/Netlify headers)"
- "Is this a SPA, SSR, or static site? (affects CSP complexity)"
- "Do you use any third-party scripts (analytics, chat widgets, etc.)?"

**Cross-reference with**:
- API-005 (XSS prevention - CSP is defense in depth)
- SEC-001 (Cloudflare - can set CSP headers at edge)
- CSP-002 (report-only mode)

**Pass criteria**:
- CSP header present in responses
- Policy includes key directives: `default-src`, `script-src`, `frame-ancestors`
- Not overly permissive (`default-src *` or `unsafe-inline` everywhere)

**Fail criteria**:
- No CSP header configured anywhere
- CSP is `default-src *` (provides no protection)
- Missing `frame-ancestors` (clickjacking vulnerability)

**Evidence to capture**:
- Where CSP is configured (middleware, nginx, edge)
- Full CSP policy value
- Which key directives are present/missing
- Any overly permissive directives noted

---

### CSP-002: Report-only mode for testing
**Severity**: Recommended

Before enforcing CSP, use `Content-Security-Policy-Report-Only` to monitor violations without breaking the site. This lets you tune the policy before going live.

**Check automatically**:

1. **Check for report-only header**:
```bash
# Report-only mode in code
grep -rE "Content-Security-Policy-Report-Only|reportOnly" src/ app/ lib/ --include="*.ts" --include="*.js" 2>/dev/null

# Helmet reportOnly option
grep -rE "reportOnly:\s*true" src/ app/ --include="*.ts" --include="*.js" 2>/dev/null
```

2. **Check for report-uri or report-to directive**:
```bash
# report-uri (deprecated but still used)
grep -rE "report-uri|report-to" src/ app/ lib/ nginx/ *.conf 2>/dev/null

# Reporting endpoint configuration
grep -rE "Report-To|Reporting-Endpoints" src/ app/ --include="*.ts" --include="*.js" 2>/dev/null
```

3. **Check for CSP reporting services**:
```bash
# Common reporting services in CSP
grep -rE "report-uri\.com|sentry\.io.*csp|uri\.report" src/ app/ lib/ 2>/dev/null
```

4. **Check actual headers**:
```bash
curl -sI https://example.com | grep -iE "content-security-policy|report-to"
```

**Ask user**:
- "Is CSP currently in report-only mode or enforcing?"
- "Where do CSP violation reports go? (Sentry, report-uri.com, custom endpoint)"
- "Have you reviewed CSP violation reports before enforcing?"

**Cross-reference with**:
- CSP-001 (full CSP headers - this is the testing phase)
- CSP-003 (blocking inline - reports show what would break)

**Pass criteria**:
- If CSP is new: report-only mode is active with reporting endpoint configured
- If CSP is mature: enforcing mode is fine (report-only phase already completed)
- Violation reports are being collected somewhere

**Fail criteria**:
- CSP jumped straight to enforcing without testing (unless very simple policy)
- No reporting endpoint configured (can't see what's breaking)
- Report-only mode with no one reviewing the reports

**Reporting service options**:
- **Sentry** - CSP reports can be sent to Sentry's security endpoint
- **report-uri.com** - Dedicated CSP reporting service with dashboards
- **uri.report** - Simple CSP report collection
- **Custom endpoint** - Build your own if you need it (log and analyze)

**Evidence to capture**:
- Current mode (report-only vs enforcing)
- Reporting endpoint (if configured)
- Whether violations are being monitored

---

## Inline Script Handling

### CSP-003: Block inline scripts where possible
**Severity**: Recommended

Inline scripts (`<script>alert('xss')</script>`) are the primary XSS attack vector. Blocking them via CSP forces all JavaScript to come from trusted files, making XSS much harder to exploit.

**Check automatically**:

1. **Check script-src directive for unsafe-inline**:
```bash
# Look for unsafe-inline in CSP (bad)
grep -rE "script-src[^;]*unsafe-inline" src/ app/ lib/ nginx/ *.conf 2>/dev/null

# Look for strict script-src (good)
grep -rE "script-src[^;]*'self'" src/ app/ lib/ 2>/dev/null
```

2. **Check for nonce-based CSP** (allows specific inline scripts):
```bash
# Nonce generation
grep -rE "nonce|cspNonce|generateNonce" src/ app/ lib/ --include="*.ts" --include="*.js" 2>/dev/null

# Nonce in script tags
grep -rE "<script[^>]*nonce=" src/ app/ components/ pages/ --include="*.html" --include="*.tsx" --include="*.jsx" 2>/dev/null

# Next.js nonce support
grep -rE "nonce" next.config.* 2>/dev/null
```

3. **Check for hash-based CSP** (allows specific inline script content):
```bash
# SHA hashes in CSP
grep -rE "'sha256-|'sha384-|'sha512-" src/ app/ lib/ nginx/ 2>/dev/null
```

4. **Check for inline scripts in HTML**:
```bash
# Inline script tags (potential issues if CSP blocks inline)
grep -rE "<script>[^<]+" src/ app/ pages/ components/ --include="*.html" --include="*.tsx" --include="*.jsx" 2>/dev/null

# Inline event handlers (also blocked by strict CSP)
grep -rE "onclick=|onload=|onerror=|onmouseover=" src/ app/ components/ --include="*.html" --include="*.tsx" --include="*.jsx" 2>/dev/null
```

5. **Check for strict-dynamic** (modern approach):
```bash
# strict-dynamic allows nonce-loaded scripts to load other scripts
grep -rE "'strict-dynamic'" src/ app/ lib/ nginx/ 2>/dev/null
```

6. **Check style-src for unsafe-inline**:
```bash
# style-src with unsafe-inline (common for CSS-in-JS)
grep -rE "style-src[^;]*unsafe-inline" src/ app/ lib/ nginx/ 2>/dev/null
```

7. **Check for Google Tag Manager**:
```bash
# GTM script tags
grep -rE "googletagmanager|GTM-" src/ app/ pages/ components/ 2>/dev/null

# GTM in CSP whitelist
grep -rE "googletagmanager\.com|tagmanager\.google\.com" src/ app/ lib/ nginx/ 2>/dev/null
```

**Ask user**:
- "Do you use inline scripts or event handlers in your HTML?"
- "Is your build pipeline configured to add nonces to script tags?"
- "Do you use Google Tag Manager? What scripts does it load?"
- "Do you use CSS-in-JS (styled-components, emotion, Tailwind)?"

**Cross-reference with**:
- CSP-001 (full CSP headers - script-src is a key directive)
- CSP-002 (report-only mode - shows what inline scripts would break)
- API-005 (XSS prevention - this is the CSP enforcement layer)

**Pass criteria**:
- `script-src` does NOT include `'unsafe-inline'`, OR
- `'unsafe-inline'` is present but with nonce/hash (nonce takes precedence)
- Inline scripts use nonces or are moved to external files
- No inline event handlers (`onclick`, `onerror`, etc.)
- GTM strategy documented if GTM is used

**Fail criteria**:
- `script-src 'unsafe-inline'` without nonce/hash fallback
- Many inline scripts with no plan to externalize or add nonces
- Inline event handlers throughout codebase
- GTM in use with no CSP strategy

**Notes on style-src 'unsafe-inline'**:

Often necessary for CSS-in-JS libraries (styled-components, emotion, MUI). Less dangerous than script-src unsafe-inline since CSS can't execute arbitrary code. Acceptable if:
- Using CSS-in-JS that requires it
- Consider nonce-based styles for stricter security

**Google Tag Manager strategy**:

GTM dynamically injects scripts, which conflicts with strict CSP. Options:
1. **Nonce propagation**: Pass nonce to GTM, use Custom Templates that support nonces
2. **Server-side GTM**: Run GTM server-side to control what scripts load
3. **Whitelist approach**: Add all GTM-loaded domains to script-src (less secure, more brittle)
4. **Hash known scripts**: If GTM scripts are static, hash them

Recommend: Start with report-only to see what GTM loads, then whitelist specific domains or move to server-side GTM for tighter control.

**Evidence to capture**:
- Current `script-src` directive value
- Current `style-src` directive value
- Whether nonces or hashes are used
- Count of inline scripts/event handlers found
- GTM usage and current strategy
- CSS-in-JS library in use (if any)

---

## Source Whitelisting

### CSP-004: Whitelist trusted sources
**Severity**: Recommended

CSP should explicitly whitelist only the domains you trust, rather than allowing everything. Each whitelisted domain is an attack surface.

**Check automatically**:

1. **Check for overly permissive policies**:
```bash
# Wildcard sources (bad)
grep -rE "default-src[^;]*\*|script-src[^;]*\*|style-src[^;]*\*" src/ app/ lib/ nginx/ 2>/dev/null

# data: URIs for scripts (can be abused)
grep -rE "script-src[^;]*data:" src/ app/ lib/ nginx/ 2>/dev/null

# blob: URIs (sometimes needed, but review)
grep -rE "script-src[^;]*blob:" src/ app/ lib/ nginx/ 2>/dev/null
```

2. **Check for unsafe-eval**:
```bash
# unsafe-eval in script-src (security risk)
grep -rE "script-src[^;]*unsafe-eval" src/ app/ lib/ nginx/ 2>/dev/null
```

3. **Extract and review whitelisted domains**:
```bash
# Find all CSP policies and extract domains
grep -rEo "(default-src|script-src|style-src|img-src|connect-src|font-src|frame-src)[^;]+" src/ app/ lib/ nginx/ 2>/dev/null
```

4. **Check for common CDNs and third-parties**:
```bash
# Common legitimate sources
grep -rE "cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com" src/ app/ lib/ nginx/ 2>/dev/null

# Analytics/tracking
grep -rE "google-analytics\.com|googletagmanager\.com|analytics\.google\.com|plausible\.io|segment\.com" src/ app/ lib/ nginx/ 2>/dev/null

# Common third-party widgets
grep -rE "intercom\.io|crisp\.chat|zendesk\.com|stripe\.com|js\.stripe\.com" src/ app/ lib/ nginx/ 2>/dev/null
```

5. **Check for 'self' as baseline**:
```bash
# 'self' should be the foundation
grep -rE "default-src[^;]*'self'" src/ app/ lib/ nginx/ 2>/dev/null
```

6. **Check connect-src for API endpoints**:
```bash
# API endpoints that frontend can call
grep -rE "connect-src[^;]+" src/ app/ lib/ nginx/ 2>/dev/null
```

**Ask user**:
- "What third-party services does the frontend load? (analytics, chat, payments, fonts)"
- "Are there any CDNs used for static assets?"
- "Do you have a process for reviewing new third-party script additions?"
- "When was the CSP whitelist last reviewed?"

**Cross-reference with**:
- CSP-001 (full CSP headers)
- CSP-003 (blocking inline - whitelisting is the alternative)
- API-006 (API gateway - connect-src should match API domains)

**Pass criteria**:
- `default-src 'self'` as baseline
- Only necessary domains whitelisted
- No wildcard `*` in script-src or default-src
- Each whitelisted domain has a clear purpose
- No `unsafe-eval` unless justified and documented

**Fail criteria**:
- `default-src *` or `script-src *`
- `data:` allowed in script-src without justification
- `unsafe-eval` present without documented reason
- Long list of whitelisted domains with no documentation
- Domains whitelisted that are no longer used

**Notes on unsafe-eval**:

`'unsafe-eval'` allows `eval()`, `Function()`, and similar dynamic code execution. Security risk because XSS can use these to run arbitrary code.

**When it's sometimes needed**:
- Vue.js with runtime template compilation (not pre-compiled)
- Angular JIT mode (development only - production should use AOT)
- Some charting libraries (Chart.js older versions)
- Legacy code using `eval()` for JSON parsing

**Recommendation**:
- Never use in production if avoidable
- If needed: document why, isolate to specific pages if possible
- Vue: use pre-compiled templates (default in Vue CLI/Vite)
- Angular: use AOT compilation for production
- Chart.js: upgrade to v3+ which doesn't require eval

**Periodic audit recommendation**:

Review CSP whitelist quarterly:
1. List all whitelisted domains
2. Verify each is still in use (check network tab, grep codebase)
3. Remove domains for deprecated third-party services
4. Document purpose of each domain in code comments or docs
5. Check if any whitelisted domains have been compromised (rare but happens)

**Evidence to capture**:
- Full list of whitelisted domains per directive
- Purpose of each whitelisted domain (if documented)
- Any wildcards or overly permissive patterns
- Presence and justification of `unsafe-eval`
- Domains that appear unused or questionable
- Date of last whitelist review

---

## Completing the Audit

After checking all items:

1. **Summarize results**:
   - CSP-001: PASS/FAIL (Recommended) - Full CSP headers configured
   - CSP-002: PASS/FAIL (Recommended) - Report-only mode for testing
   - CSP-003: PASS/FAIL (Recommended) - Block inline scripts where possible
   - CSP-004: PASS/FAIL (Recommended) - Whitelist trusted sources

2. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority

3. **Common recommendations**:
   - If no CSP: Start with report-only mode using Helmet or edge headers
   - If overly permissive: Tighten `default-src` to `'self'`, whitelist only what's needed
   - If using inline scripts: Add nonces via build pipeline or move scripts to external files
   - If GTM conflicts: Use server-side GTM or whitelist specific domains after report-only analysis
   - If `unsafe-eval`: Check if framework requires it, upgrade or document exception

4. **Maturity assessment**:
   - **Level 1**: No CSP configured - missing defense-in-depth layer
   - **Level 2**: CSP exists but overly permissive (`default-src *`, `unsafe-inline` everywhere)
   - **Level 3**: Reasonable CSP with `'self'` baseline, some whitelisted domains, possibly `unsafe-inline` for CSS-in-JS
   - **Level 4**: Strict CSP - nonce-based scripts, no `unsafe-eval`, documented whitelist, regular reviews, reporting configured

5. **Record audit date** and auditor
