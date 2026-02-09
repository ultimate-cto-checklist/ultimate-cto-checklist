# Front-End Performance Audit Guide

This guide walks you through auditing a project's front-end performance, including Core Web Vitals and resource loading optimization.

## The Goal: Fast, Measurable Rendering

Every page load should be snappy, and you should know immediately when a change makes it slower.

- **Automated monitoring** — Lighthouse CI catches performance regressions before they reach production
- **Green Core Web Vitals** — FCP, LCP, and CLS meet thresholds that keep users happy and SEO strong
- **Preloaded fonts** — Critical fonts load early, preventing Flash of Invisible/Unstyled Text
- **Optimized CSS delivery** — Critical CSS inlined or preloaded, non-critical loaded asynchronously

## Before You Start

1. **Get the production URL** from the user (or staging if production not available)
2. **Identify the build tool** (Vite, Webpack, Next.js, etc.)
3. **Identify key pages** to test (homepage, landing pages, marketing pages for SEO)

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## Page Rendering & Core Web Vitals

### FEP-001: Automated Lighthouse reports
**Severity**: Recommended

Lighthouse should run automatically in CI/CD to catch performance regressions before deployment. Manual PageSpeed Insights checks are not repeatable or enforceable.

**Check automatically**:

1. **Look for Lighthouse CI config**:
```bash
# Check for Lighthouse CI configuration files
ls -la lighthouserc.* .lighthouserc.* lhci.* 2>/dev/null

# Check for lighthouse in package.json scripts or devDeps
grep -E "lighthouse|lhci" package.json 2>/dev/null
```

2. **Check GitHub Actions for Lighthouse**:
```bash
# Look for lighthouse steps in CI
grep -rE "lighthouse|lhci|treosh/lighthouse-ci-action" .github/workflows/ 2>/dev/null
```

3. **Check for performance budgets**:
```bash
# Budgets in Lighthouse CI config
grep -rE "budgets|performance.*budget" lighthouserc.* .lighthouserc.* 2>/dev/null

# Or in package.json
grep -E "budgets" package.json 2>/dev/null
```

4. **Check for alternatives** (Calibre, SpeedCurve, WebPageTest):
```bash
# Look for other performance monitoring tools
grep -rE "calibre|speedcurve|webpagetest" . --include="*.json" --include="*.yml" --include="*.yaml" 2>/dev/null | head -5
```

**Cross-reference with**:
- FEP-002 (automated reports should track Core Web Vitals over time)
- DEPLOY-002 (performance check as part of deployment pipeline)

**Pass criteria**:
- Lighthouse CI or equivalent integrated in CI/CD pipeline
- Reports generated on PRs or scheduled runs
- Performance budgets defined (bonus, not required for pass)

**Fail criteria**:
- No automated performance testing
- Only manual PageSpeed Insights checks (not repeatable)

**Evidence to capture**:
- Lighthouse CI config location (if found)
- Where reports are stored/published
- Performance budget thresholds (if defined)
- Alternative tools in use

---

### FEP-002: Core Web Vitals optimized
**Severity**: Recommended

Core Web Vitals (FCP, LCP, CLS) directly impact SEO rankings and user experience. These metrics should be measured and optimized, especially for marketing/SEO-critical pages.

**Check automatically**:

1. **Run PageSpeed Insights API** (free, no auth required):
```bash
# Replace URL with actual production URL
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://example.com&category=performance" | jq '{
  performance_score: (.lighthouseResult.categories.performance.score * 100),
  FCP: .lighthouseResult.audits["first-contentful-paint"].displayValue,
  LCP: .lighthouseResult.audits["largest-contentful-paint"].displayValue,
  CLS: .lighthouseResult.audits["cumulative-layout-shift"].displayValue,
  TBT: .lighthouseResult.audits["total-blocking-time"].displayValue
}'
```

2. **Check for CLS culprits** (images without dimensions, dynamic content):
```bash
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://example.com&category=performance" | jq '.lighthouseResult.audits["layout-shift-elements"].details.items // empty'
```

3. **Check for render-blocking resources**:
```bash
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://example.com&category=performance" | jq '.lighthouseResult.audits["render-blocking-resources"].details.items | length'
```

4. **Test multiple key pages** (not just homepage):
```bash
# Test landing page, product page, etc.
for url in "https://example.com" "https://example.com/pricing" "https://example.com/product"; do
  echo "Testing: $url"
  curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=$url&category=performance" | jq '{
    url: .lighthouseResult.finalUrl,
    score: (.lighthouseResult.categories.performance.score * 100),
    LCP: .lighthouseResult.audits["largest-contentful-paint"].displayValue
  }'
done
```

**Ask user**:
- "Which pages are SEO-critical or marketing landing pages?"
- If scores are low: "Is this a known issue being addressed?"

**Pass criteria**:
- Performance score ≥ 90 (good), ≥ 50 (acceptable)
- FCP < 1.8s (good), < 3s (acceptable)
- LCP < 2.5s (good), < 4s (acceptable)
- CLS < 0.1 (good), < 0.25 (acceptable)

**Fail criteria**:
- Performance score < 50
- LCP > 4s
- CLS > 0.25 (significant layout shifts)
- FCP > 3s

**Cross-reference with**:
- FEP-001 (automated reports should catch regressions)
- FEP-003 (font preloading improves FCP/LCP)
- FEP-004 (CSS preloading improves FCP)
- CACHE-001/002 (caching improves repeat visits)

**Evidence to capture**:
- Performance score
- All Core Web Vitals values (FCP, LCP, CLS, TBT)
- URLs tested
- Any flagged layout shift elements
- Number of render-blocking resources

---

## Resource Loading

### FEP-003: Preload critical fonts
**Severity**: Recommended

Fonts used above-the-fold should be preloaded to avoid Flash of Invisible Text (FOIT) or Flash of Unstyled Text (FOUT). Late font discovery delays First Contentful Paint.

**Check automatically**:

1. **Check HTML for font preload tags**:
```bash
# Look for preload links for fonts
curl -sL https://example.com | grep -iE '<link[^>]*rel="preload"[^>]*(font|\.woff)'

# Or check for as="font" attribute
curl -sL https://example.com | grep -iE '<link[^>]*as="font"'
```

2. **Check response headers for Link preload**:
```bash
# Some sites use HTTP headers instead of HTML tags
curl -sI https://example.com | grep -i "link:.*preload.*font"
```

3. **List all fonts loaded** (to compare against preloads):
```bash
# Find font URLs referenced in CSS/HTML
curl -sL https://example.com | grep -oE 'url\([^)]*\.(woff2?|ttf|otf)[^)]*\)' | head -5

# Or check the CSS files
curl -sL https://example.com | grep -oE 'href="[^"]*\.css"' | head -3
```

4. **Check for font-display property** (alternative to preload):
```bash
# font-display: swap prevents FOIT
curl -sL https://example.com | grep -i "font-display"
```

5. **Verify preload has required attributes**:
```bash
# Preload must have crossorigin for fonts
curl -sL https://example.com | grep -iE '<link[^>]*preload[^>]*font' | grep -i "crossorigin"
```

**Ask user**:
- If no preloads found: "Are custom fonts used above-the-fold?"
- If using system fonts only: N/A (no preload needed)

**Pass criteria**:
- Primary fonts (above-the-fold) have preload tags, OR
- `font-display: swap` or `optional` is used, OR
- Only system fonts used (no custom fonts)
- Preload uses correct attributes: `as="font"`, `crossorigin`, `type="font/woff2"`

**Fail criteria**:
- Custom fonts used without preload AND without font-display fallback
- Missing `crossorigin` attribute on font preloads (breaks preload)
- Using heavy font formats (ttf/otf) instead of woff2

**Evidence to capture**:
- Preload tags found (or absence)
- Font formats in use (woff2 preferred)
- font-display value if set
- Number of font files loaded

---

### FEP-004: Preload critical CSS
**Severity**: Recommended

CSS required for above-the-fold content should load as early as possible. Options include inlining critical CSS, preloading, or ensuring CSS isn't render-blocking.

**Check automatically**:

1. **Check for CSS preload tags**:
```bash
# Preload for stylesheets
curl -sL https://example.com | grep -iE '<link[^>]*rel="preload"[^>]*style|<link[^>]*as="style"'
```

2. **Check for inlined critical CSS** (better approach):
```bash
# Style tags in head before external CSS
curl -sL https://example.com | sed -n '/<head>/,/<\/head>/p' | grep -c '<style'
```

3. **Check build config for critical CSS extraction**:
```bash
# Vite plugin
grep -rE "critical|critters" vite.config.* 2>/dev/null

# Webpack plugin
grep -rE "critical|critters|html-critical-webpack-plugin" webpack.config.* 2>/dev/null

# Next.js (experimental)
grep -rE "optimizeCss|critters" next.config.* 2>/dev/null

# Package.json deps
grep -E "critical|critters" package.json 2>/dev/null
```

4. **Check for render-blocking CSS** (via PageSpeed API):
```bash
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://example.com&category=performance" | jq '[.lighthouseResult.audits["render-blocking-resources"].details.items[] | select(.url | contains(".css"))] | length'
```

5. **Check if using async CSS loading pattern**:
```bash
# media="print" onload pattern for non-critical CSS
curl -sL https://example.com | grep -iE 'media="print".*onload|rel="preload".*as="style"'
```

**Cross-reference with**:
- FEP-002 (render-blocking CSS affects FCP/LCP)
- FEP-003 (fonts and CSS both affect first paint)
- CACHE-001 (CSS should be cached, but first load matters most)

**Pass criteria**:
- Critical CSS inlined in `<head>` (ideal), OR
- Primary CSS preloaded with `rel="preload"`, OR
- No render-blocking CSS flagged by Lighthouse, OR
- Render-blocking CSS is small (<50KB) and cached

**Fail criteria**:
- Large external CSS files blocking render (>100KB)
- Multiple render-blocking stylesheets
- No critical CSS strategy for slow connections

**Evidence to capture**:
- Preload tags found (or absence)
- Whether critical CSS is inlined
- Render-blocking CSS count and size from Lighthouse
- Build tool critical CSS plugin (if configured)

---

## Completing the Audit

After checking all items:

1. **Summarize results**:
   - FEP-001: PASS/FAIL (Recommended) - Automated Lighthouse
   - FEP-002: PASS/FAIL (Recommended) - Core Web Vitals
   - FEP-003: PASS/FAIL (Recommended) - Font preloading
   - FEP-004: PASS/FAIL (Recommended) - CSS preloading

2. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority

3. **Common recommendations**:
   - If no automated Lighthouse: Add `@lhci/cli` to CI pipeline with `treosh/lighthouse-ci-action`
   - If poor Core Web Vitals: Run Lighthouse locally, address top opportunities
   - If no font preload: Add `<link rel="preload" href="/font.woff2" as="font" type="font/woff2" crossorigin>`
   - If no critical CSS: Add `vite-plugin-critical` or `critters` to build pipeline
   - If high CLS: Add explicit width/height to images, avoid dynamically injected content above fold

4. **Maturity assessment**:
   - **Level 1**: No performance monitoring (no Lighthouse, no metrics)
   - **Level 2**: Manual checks only (occasional PageSpeed Insights)
   - **Level 3**: Automated monitoring but metrics need work (CI integrated, scores < 90)
   - **Level 4**: Optimized (automated CI, all Core Web Vitals green, preloading in place)

5. **Record audit date** and auditor
