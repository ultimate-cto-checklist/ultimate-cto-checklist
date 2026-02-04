# Caching Audit Guide

This guide walks you through auditing a project's static asset caching configuration, including CDN caching and content hash-based cache invalidation.

## Before You Start

1. **Get the production URL** from the user
2. **Identify the CDN provider** (Cloudflare, Fastly, CloudFront, Vercel, etc.)
3. **Identify the build tool** (Vite, Webpack, Next.js, etc.)

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## Static Asset Caching

### CACHE-001: Static assets cached by CDN
**Severity**: Recommended

Static assets (JS, CSS, images, fonts) should be served through a CDN with appropriate cache headers. This reduces latency and origin server load.

**Check automatically**:

1. **Identify static asset URLs from the site**:
```bash
# Fetch homepage and extract JS/CSS/image URLs
curl -sL https://example.com | grep -oE '(src|href)="[^"]*\.(js|css|png|jpg|svg|woff2?)"' | head -10
```

2. **Check cache headers on static assets**:
```bash
# For each asset URL
curl -sI https://example.com/assets/main.js | grep -iE "cache-control|cf-cache-status|age|x-cache"
```

3. **Verify CDN is serving assets** (Cloudflare-specific):
```bash
# Look for CF-Cache-Status header
curl -sI https://example.com/assets/main.js | grep -i "cf-cache-status"
# Expected: HIT, MISS (first request), or DYNAMIC
```

4. **For other CDNs**:
```bash
# CloudFront
curl -sI https://example.com/assets/main.js | grep -i "x-cache"
# Expected: Hit from cloudfront

# Fastly
curl -sI https://example.com/assets/main.js | grep -i "x-served-by"

# Vercel
curl -sI https://example.com/assets/main.js | grep -i "x-vercel-cache"
```

**Ask user**:
- "What CDN do you use?" (Cloudflare, Fastly, CloudFront, Vercel, etc.)
- If no CDN: "Are static assets served from origin on every request?"

**Pass criteria**:
- Static assets (JS, CSS, images, fonts) have `Cache-Control` with long TTL
- CDN cache status shows HIT on subsequent requests
- Assets served from CDN edge, not origin

**Fail criteria**:
- No `Cache-Control` header on static assets
- `Cache-Control: no-cache` or `max-age=0` on static assets
- No CDN in front of static assets (served from origin every time)

**Evidence to capture**:
- CDN provider
- Sample cache headers from JS, CSS, image assets
- Cache hit rate if available (CDN dashboard)

---

### CACHE-002: Content hashes for cache invalidation
**Severity**: Recommended

Static asset filenames should include content hashes (e.g., `main.a1b2c3d4.js`). This enables aggressive caching while ensuring users always get the latest version when code changes.

**Check automatically**:

1. **Check build output for hashed filenames**:
```bash
# Look for hash patterns in dist/build folder
ls -la dist/assets/ 2>/dev/null | grep -E '\.[a-f0-9]{6,}\.(js|css)$'

# Or in Next.js
ls -la .next/static/chunks/ 2>/dev/null | head -5

# Or in Vite
ls -la dist/assets/ 2>/dev/null | head -5
```

2. **Check HTML references for hashed assets**:
```bash
# Extract script/link tags and check for hashes
curl -sL https://example.com | grep -oE '(src|href)="[^"]*\.[a-f0-9]{6,}\.(js|css)"' | head -5
```

3. **Check build config for content hashing**:
```bash
# Vite (default enabled)
grep -r "build" vite.config.* 2>/dev/null | grep -i hash

# Webpack
grep -rE "contenthash|chunkhash" webpack.config.* 2>/dev/null

# Next.js (enabled by default, no config needed)
```

**Cross-reference with**:
- CACHE-001 (hashed assets should have immutable/long-TTL cache headers)

**Pass criteria**:
- JS and CSS filenames include content hashes (e.g., `main.a1b2c3d4.js`)
- HTML references updated on each build to point to new hashes
- Cache-Control set to long TTL (1 year) or `immutable` since hash handles invalidation

**Fail criteria**:
- Static assets use fixed filenames (`main.js`, `styles.css`)
- Query string cache busting only (`main.js?v=123`) - less reliable
- No build pipeline (hand-editing JS/CSS files)

**Evidence to capture**:
- Sample hashed filenames from build output
- Build tool used (Vite, Webpack, Next.js, etc.)
- Cache-Control header on hashed assets

---

## Completing the Audit

After checking all items:

1. **Summarize results**:
   - CACHE-001: PASS/FAIL (Recommended)
   - CACHE-002: PASS/FAIL (Recommended)

2. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority

3. **Common recommendations**:
   - If no CDN: Add Cloudflare (free tier) or use hosting provider's CDN (Vercel, Netlify)
   - If no content hashes: Enable in build tool (Vite/Webpack default, or configure)
   - If short cache TTL on hashed assets: Set `Cache-Control: public, max-age=31536000, immutable`
   - If query string cache busting: Migrate to filename hashing

4. **Maturity assessment**:
   - **Level 1**: No caching (assets served from origin with no-cache)
   - **Level 2**: Basic caching (CDN in place but short TTLs or no hashing)
   - **Level 3**: Proper caching (CDN + content hashes + long TTLs)

5. **Record audit date** and auditor
