# Infrastructure Security Audit Guide

This guide walks you through auditing a project's infrastructure security setup, ensuring all environments are protected behind Cloudflare, origin servers are not directly exposed, security headers are properly configured, and SSL certificate issuance is monitored.

## Before You Start

1. Have Cloudflare API token with read access (Zone:Read, DNS:Read)
2. Know all environment domains (production, staging, dev)
3. Have access to web server configuration (nginx, Apache, or app-level)
4. Know what third-party scripts are loaded (GTM, CDN libraries, etc.)

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## Cloudflare Protection

### SEC-001: All environments behind Cloudflare
**Severity**: Critical

**Check automatically**:

1. **Via Cloudflare API (preferred)**:
```bash
# List all zones
curl -s -X GET "https://api.cloudflare.com/client/v4/zones" \
  -H "Authorization: Bearer $CF_API_TOKEN" | jq '.result[] | {name: .name, status: .status}'

# List DNS records for a zone - check proxied status
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CF_API_TOKEN" | jq '.result[] | {name: .name, type: .type, proxied: .proxied}'
```

2. **Via HTTP headers (no token needed)**:
```bash
# Check for cf-ray header on each environment
curl -sI https://example.com | grep -i "cf-ray"
curl -sI https://staging.example.com | grep -i "cf-ray"
curl -sI https://dev.example.com | grep -i "cf-ray"
```

3. **Via DNS lookup**:
```bash
# Check if DNS resolves to Cloudflare IPs
dig +short example.com
# Cloudflare IPs are in known ranges (104.16.x.x, 172.64.x.x, etc.)
```

**Ask user**:
- List all environment domains (prod, staging, dev)
- Cloudflare API token available? (read-only is sufficient)
- Any intentional exceptions? (e.g., internal dev behind VPN)

**Pass criteria**:
- All public-facing environments show `proxied: true` in Cloudflare API, OR
- All return `cf-ray` header in HTTP response

**Fail criteria**:
- Any public environment has `proxied: false` or missing Cloudflare
- Environment domains not in any Cloudflare zone

**Evidence to capture**:
- List of all environment domains
- Cloudflare zone status for each
- `cf-ray` header presence per environment
- Any documented exceptions

---

### SEC-002: No direct IP exposure
**Severity**: Critical

**Check automatically**:

1. **Verify origin rejects direct connections**:
```bash
# If origin IP is known, verify it rejects direct connections
curl -sI --connect-timeout 5 http://ORIGIN_IP
# Should timeout, refuse connection, or return 403

curl -sI --connect-timeout 5 https://ORIGIN_IP -k
# Same - should not serve content
```

2. **Check Cloudflare firewall rules**:
```bash
# List firewall rules - should have origin protection
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/ZONE_ID/firewall/rules" \
  -H "Authorization: Bearer $CF_API_TOKEN" | jq '.result'
```

3. **Check for IP leaks in DNS history**:
```bash
# Historical DNS records can reveal origin IPs
# Manual check: SecurityTrails, DNSdumpster, or similar services
# Search: site:securitytrails.com example.com
```

4. **Verify origin firewall (on server)**:
```bash
# Cloudflare publishes IP ranges at:
# https://www.cloudflare.com/ips-v4
# https://www.cloudflare.com/ips-v6

# Check iptables/ufw only allows CF IPs on 80/443
sudo iptables -L -n | grep -E "80|443"
sudo ufw status verbose
```

**Ask user**:
- Is the origin server configured to only accept connections from Cloudflare IPs?
- Is there a firewall rule (cloud or server-level) enforcing this?
- Has the origin IP ever been exposed in DNS history?

**Cross-reference with**:
- SEC-001 (Cloudflare protection) - must be behind CF first

**Pass criteria**:
- Origin server rejects direct connections (not from Cloudflare)
- Firewall rules restrict port 80/443 to Cloudflare IP ranges
- No historical DNS leaks exposing origin

**Fail criteria**:
- Origin IP directly accessible on port 80/443
- No firewall restriction to Cloudflare IPs
- Origin IP discoverable via DNS history tools

**Evidence to capture**:
- Origin IP (if known)
- Firewall rule configuration
- Result of direct connection attempt
- DNS history check result

---

### SEC-003: Cloudflare respects cache-control headers
**Severity**: Recommended

**Check automatically**:

1. **Check Cloudflare cache settings via API**:
```bash
# Check Browser Cache TTL setting
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/ZONE_ID/settings/browser_cache_ttl" \
  -H "Authorization: Bearer $CF_API_TOKEN" | jq '.result'
# value: 0 means "Respect Existing Headers"

# Check Edge Cache TTL setting
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/ZONE_ID/settings/edge_cache_ttl" \
  -H "Authorization: Bearer $CF_API_TOKEN" | jq '.result'
```

2. **Check page rules for cache overrides**:
```bash
# List page rules
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/ZONE_ID/pagerules" \
  -H "Authorization: Bearer $CF_API_TOKEN" | jq '.result[] | {targets: .targets, actions: .actions}'
# Look for "cache_level" or "edge_cache_ttl" overrides
```

3. **Check app cache-control settings (in codebase)**:
```bash
# Look for cache-control header settings
grep -riE "cache-control|max-age|s-maxage|stale-while" . --include="*.js" --include="*.ts" --include="*.py" --include="*.rb" --include="*.go" 2>/dev/null | head -20
```

4. **Verify via Cloudflare response**:
```bash
# Check headers through Cloudflare
curl -sI https://example.com/static/app.js | grep -iE "cache-control|cf-cache-status"
# cf-cache-status: HIT/MISS/DYNAMIC indicates CF caching behavior
```

**Ask user**:
- Is "Browser Cache TTL" set to "Respect Existing Headers"?
- What cache-control headers does your app set for static assets vs API responses?
- Any known issues where CF caches things it shouldn't (or vice versa)?

**Cross-reference with**:
- Section 22 (Caching Strategy) - cache headers should be intentional

**Pass criteria**:
- Browser Cache TTL = 0 (Respect Existing Headers), OR explicitly configured with documented reason
- Page rules documented if overriding defaults
- `cf-cache-status` behavior matches expectations

**Fail criteria**:
- CF overrides cache headers without documented reason
- Static assets not cached when they should be
- API responses cached when they shouldn't be

**Evidence to capture**:
- Browser Cache TTL setting
- Edge Cache TTL setting
- Page rules affecting caching
- Sample cf-cache-status responses

---

## Security Headers

### SEC-004: Response header hygiene
**Severity**: Recommended

**Check automatically**:

1. **Fetch headers and audit for leaks**:
```bash
# Get all response headers
curl -sI https://example.com

# Check multiple endpoints
curl -sI https://example.com/api/health
curl -sI https://example.com/static/app.js
```

2. **Flag tech stack leaks**:
```bash
# Look for leaky headers
curl -sI https://example.com | grep -iE "x-powered-by|x-aspnet|x-drupal|x-generator|x-php|x-framework"

# Check Server header for version info
curl -sI https://example.com | grep -i "^server:"
# Bad: "Server: nginx/1.18.0"
# Good: "Server: cloudflare" or absent
```

3. **Headers to flag**:
   - `X-Powered-By` (any value - Express, PHP, ASP.NET)
   - `Server` with version number (nginx/1.18.0, Apache/2.4.41)
   - `X-AspNet-Version`, `X-AspNetMvc-Version`
   - `X-Drupal-Cache`, `X-Generator`
   - `X-Debug-*` headers in production
   - Any internal/debug headers leaking to public

4. **Check app config for header hardening**:
```bash
# Node.js - look for helmet or manual removal
grep -riE "helmet|removeHeader|x-powered-by" . --include="*.js" --include="*.ts" 2>/dev/null | head -10

# Check nginx/apache config
grep -riE "server_tokens|ServerTokens|Header unset" . --include="*.conf" --include="nginx*" 2>/dev/null
```

**Ask user**:
- Are any headers intentionally exposed for debugging/tracing? (e.g., X-Request-Id)
- Is there a web server config (nginx/apache) that should be stripping headers?

**Cross-reference with**:
- SEC-005 (HSTS) - security headers should be present while debug headers removed

**Pass criteria**:
- No `X-Powered-By` header
- `Server` header absent, generic, or version-less
- No framework-specific headers exposed
- Only necessary headers present (CORS, cache-control, security headers)

**Fail criteria**:
- Tech stack exposed via headers (X-Powered-By: Express)
- Server version exposed (nginx/1.18.0)
- Debug/internal headers leaking in production

**Evidence to capture**:
- Full header dump from production
- Any leaky headers found
- Header hardening configuration location

---

### SEC-005: HTTPS-only headers (HSTS)
**Severity**: Critical

**Check automatically**:

1. **Check for HSTS header**:
```bash
# Check Strict-Transport-Security header
curl -sI https://example.com | grep -i "strict-transport-security"

# Expected format:
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

2. **Check Cloudflare HSTS settings**:
```bash
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/ZONE_ID/settings/security_header" \
  -H "Authorization: Bearer $CF_API_TOKEN" | jq '.result'
```

3. **Check HSTS preload status**:
```bash
# Check if domain is on HSTS preload list
curl -s "https://hstspreload.org/api/v2/status?domain=example.com" | jq '.status'
# "preloaded" = best, "pending" = submitted, "unknown" = not submitted

# Manual check: https://hstspreload.org/?domain=example.com
```

4. **Check all environments**:
```bash
# Production (required)
curl -sI https://example.com | grep -i "strict-transport-security"

# Staging (recommended)
curl -sI https://staging.example.com | grep -i "strict-transport-security"
```

**HSTS header components**:
- `max-age=31536000` - 1 year minimum for preload eligibility
- `includeSubDomains` - applies to all subdomains
- `preload` - allows browser preload list inclusion

**Pass criteria**:
- HSTS header present on production
- `max-age` >= 31536000 (1 year) for production
- `includeSubDomains` present (if subdomains should be HTTPS-only)
- Preload submitted (recommended, not required)

**Fail criteria**:
- No HSTS header on production
- `max-age` too short (< 6 months / 15768000)
- Missing `includeSubDomains` when subdomains exist
- HTTP still accessible without redirect

**Evidence to capture**:
- HSTS header value
- max-age duration
- Preload status
- Cloudflare HSTS configuration

---

### SEC-006: Subresource Integrity (SRI) and GTM controls
**Severity**: Recommended (Critical if third-party CDNs or uncontrolled GTM)

**Check automatically**:

1. **Check HTML for integrity attributes**:
```bash
# Fetch page and look for integrity attributes
curl -s https://example.com | grep -oE '<(script|link)[^>]*(integrity="sha[^"]+")[^>]*>'

# Find external scripts WITHOUT integrity (excluding GTM)
curl -s https://example.com | grep -oE '<script[^>]*src="https?://[^"]*cdn[^"]*"[^>]*>' | grep -v 'integrity='
```

2. **Check for GTM usage**:
```bash
# Detect GTM
curl -s https://example.com | grep -oE 'googletagmanager.com/gtm.js\?id=GTM-[A-Z0-9]+'
```

3. **Check build system for SRI support**:
```bash
# Look for SRI in build config
grep -riE "integrity|sri" . --include="*.js" --include="*.ts" --include="*.json" --include="webpack*" --include="vite*" 2>/dev/null | head -10
```

4. **Check CSP for script restrictions**:
```bash
curl -sI https://example.com | grep -i "content-security-policy"
# Look for script-src restrictions
```

**External scripts requiring SRI**:
- CDN-hosted libraries (jQuery, Bootstrap, lodash, etc.)
- Font libraries (Google Fonts CSS)
- Any script not from your origin

**GTM-specific checks** (GTM cannot have SRI - Google updates it dynamically):
- **CSP script-src**: Restrict domains GTM can load from
- **GTM access audit**: Who has access to add tags?
- **Custom templates only**: Use GTM's sandboxed templates, not custom HTML
- **Server-side GTM**: Consider for sensitive data

**Ask user if GTM detected**:
- Who has access to the GTM container?
- Is GTM access audited regularly?
- Are custom HTML tags allowed, or only approved templates?
- Is server-side GTM in use?

**Cross-reference with**:
- Section 30 (API Security) - CSP headers
- Section 15 (Admin Security) - GTM access is admin-level access

**Pass criteria**:
- All external CDN scripts have `integrity` attribute
- `crossorigin="anonymous"` present alongside integrity
- If GTM in use:
  - GTM container access is restricted and audited
  - CSP limits script sources
  - Custom HTML tags disabled or require review

**Fail criteria**:
- External CDN scripts missing SRI
- GTM in use with no access controls
- Anyone can add arbitrary scripts via GTM
- No CSP restrictions on script sources

**Evidence to capture**:
- List of external scripts with/without SRI
- GTM container ID (if present)
- GTM access list
- CSP header value

---

## SSL/Certificates

### SEC-007: SSL transparency reports
**Severity**: Recommended

**Check automatically**:

1. **Check current certificates via CT logs**:
```bash
# Query crt.sh for issued certificates
curl -s "https://crt.sh/?q=example.com&output=json" | jq '.[] | {issuer: .issuer_name, not_before: .not_before, not_after: .not_after}' | head -20
```

2. **Check for CT monitoring config in codebase**:
```bash
# Look for CT monitoring references
grep -riE "certificate.?transparency|ct.?monitor|cert.?alert|ssl.?monitor" . --include="*.yml" --include="*.yaml" --include="*.json" --include="*.md" 2>/dev/null
```

3. **Check Cloudflare CT monitoring (Pro+ plans)**:
```bash
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/ZONE_ID/ssl/certificate_packs" \
  -H "Authorization: Bearer $CF_API_TOKEN" | jq '.result'
```

**CT Monitoring services**:
- **Cloudflare** - Built-in for Pro+ plans
- **Cert Spotter** (sslmate.com) - Free monitoring + email alerts
- **Facebook CT Monitor** - developers.facebook.com/tools/ct
- **crt.sh** - Free lookup (no alerting)

**Ask user**:
- Is there a CT monitoring service configured?
- Where do alerts go when new certs are issued?
- Has a CT alert ever fired? (proves it works)

**Cross-reference with**:
- SEC-001 (Cloudflare) - Cloudflare can provide CT monitoring
- Section 35 (Incident Response) - Rogue cert issuance is a security incident

**Pass criteria**:
- CT monitoring service configured for all domains
- Alerts route to security/ops team
- Can produce list of all valid certificates for domains

**Fail criteria**:
- No CT monitoring in place
- CT monitoring exists but no alerting configured
- Unknown/unexpected certificates found in CT logs
- Team unaware of recently issued certificates

**Evidence to capture**:
- CT monitoring service in use
- Alert destination
- Recent certificate list from crt.sh
- Date of last CT alert (if any)

---

## Completing the Audit

After checking all items:

1. **Summarize results**:
   - SEC-001: PASS/FAIL (Critical)
   - SEC-002: PASS/FAIL (Critical)
   - SEC-003: PASS/FAIL (Recommended)
   - SEC-004: PASS/FAIL (Recommended)
   - SEC-005: PASS/FAIL (Critical)
   - SEC-006: PASS/FAIL (Recommended/Critical)
   - SEC-007: PASS/FAIL (Recommended)

2. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority

3. **Common recommendations**:
   - If not behind Cloudflare: Add all environments to Cloudflare
   - If origin exposed: Configure firewall to only allow Cloudflare IPs
   - If cache misconfigured: Set Browser Cache TTL to "Respect Existing Headers"
   - If headers leak tech stack: Add helmet (Node.js) or configure server_tokens off (nginx)
   - If no HSTS: Enable via Cloudflare or add header with 1-year max-age
   - If missing SRI: Add integrity attributes to external scripts
   - If GTM uncontrolled: Restrict access, audit tags, consider server-side
   - If no CT monitoring: Set up Cert Spotter or Cloudflare CT alerts

4. **Record audit date** and auditor
