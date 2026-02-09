# Internationalization (i18n) Audit Guide

This guide walks you through auditing a project's internationalization practices.

## The Goal: Translation-Ready by Default

Internationalization isn't just translation — it's building software that *can* be translated. The goal is:
- **Framework in place** — i18n library configured and working
- **Automated extraction** — Strings flow from code to translators without manual copying
- **Locale-aware** — Dates, numbers, currencies format correctly per locale
- **Tested** — Different locales validated before release

Retrofitting i18n is expensive. This guide verifies the practices that make it painless.

**Cross-references**:
- Section 8 (Testing & Code Metrics) — Testing infrastructure
- Section 14 (Documentation) — Documentation practices
- Section 41 (Accessibility) — Some overlap (screen readers need proper lang attributes)

## Before You Start

1. **Confirm this applies** — This section is for projects that need multi-language support. Single-locale internal tools, CLIs, and backend APIs can skip this audit.
2. **Identify scope** — What languages/locales are required? Are RTL languages (Arabic, Hebrew) in scope?
3. **Check the tech stack** — React, Vue, Next.js, Angular all have different i18n patterns

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, PARTIAL, or N/A with evidence
- Note any recommendations for failures

---

## Multi-Language Support

### I18N-001: i18n framework in place
**Severity**: Critical (if multi-language needed), N/A otherwise

An i18n framework provides the foundation: string lookup, interpolation, pluralization, and locale switching.

**Check automatically**:

```bash
# Check for common i18n libraries
grep -E "i18next|react-intl|@formatjs|vue-i18n|next-intl|ngx-translate|@angular/localize" package.json

# Check for i18n config files
find . -maxdepth 4 -type f \( -name "i18n*" -o -name "*i18next*" -o -name "*.po" -o -name "*.pot" \) 2>/dev/null | grep -v node_modules

# Look for translation files
find . -maxdepth 5 -type f \( -name "*.json" -o -name "*.yaml" \) \( -path "*/locales/*" -o -path "*/translations/*" -o -path "*/i18n/*" \) 2>/dev/null | grep -v node_modules | head -10
```

**Ask user**:
- "Does this project need multi-language support?"
- "What are the target languages/locales?"

**Pass criteria**:
- If multi-language: i18n library installed and configured
- If single-language: N/A (document as intentional)

**Fail criteria**:
- Multi-language needed but no framework
- Framework installed but not wired up

**Evidence to capture**:
- i18n library in use
- Supported locales
- Location of translation files

---

### I18N-002: String extraction automated
**Severity**: Recommended

Manual string extraction is error-prone. Automated extraction ensures all translatable strings are captured.

**Check automatically**:

```bash
# Check for extraction tools in dependencies
grep -E "i18next-scanner|@formatjs/cli|babel-plugin-formatjs|i18next-parser|gettext-extractor" package.json

# Check for extraction scripts in package.json
grep -E "extract|i18n|messages" package.json | grep -E "script"

# Look for extraction config files
find . -maxdepth 3 -type f \( -name "i18next-scanner*" -o -name "formatjs*" -o -name "babel-plugin-react-intl*" \) 2>/dev/null

# Check CI for extraction steps
grep -riE "extract.*message|i18n.*extract|formatjs extract" .github/workflows/ 2>/dev/null
```

**Pass criteria**:
- Extraction tool configured
- Script exists to run extraction (`npm run extract-messages` or similar)
- Ideally: runs in CI to catch missing translations

**Fail criteria**:
- No extraction tooling (manual copy-paste to translation files)
- Tool installed but no script/workflow

**Evidence to capture**:
- Extraction tool in use
- Script command
- CI integration status

---

### I18N-003: Translation workflow documented
**Severity**: Recommended

Without a documented workflow, translations become a bottleneck. Developers don't know how to add strings, translators don't know when new strings appear.

**Check automatically**:

```bash
# Look for translation/i18n docs
find . -maxdepth 4 -type f -name "*.md" | xargs grep -l -iE "translation|i18n|localization" 2>/dev/null | head -5

# Check for translation service integration
grep -riE "crowdin|lokalise|phrase|transifex|weblate|poeditor" . --include="*.json" --include="*.yaml" --include="*.yml" --include="*.md" 2>/dev/null | grep -v node_modules | head -5

# Look for CONTRIBUTING or README mentions
grep -iE "translation|translat|i18n|locale" README.md CONTRIBUTING.md docs/*.md 2>/dev/null
```

**Ask user**:
- "How do translations get from developers to translators and back?"
- "Is there a translation management system?" (Crowdin, Lokalise, Phrase, etc.)
- "Who can add/modify translations?"

**Pass criteria**:
- Workflow documented (even lightweight: "add to en.json, PM notifies translators")
- Clear ownership (who coordinates translations)
- Translation service integrated OR manual process documented

**Fail criteria**:
- No documentation ("ask Sarah, she handles translations")
- Workflow exists in someone's head only
- Developers blocked waiting for unclear process

**Evidence to capture**:
- Documentation location
- Translation management system (if any)
- Workflow owner

---

### I18N-004: Fallback language defined
**Severity**: Recommended

When a translation is missing, the app needs to know what to show. Without a fallback, users see translation keys or blank content.

**Check automatically**:

```bash
# Check i18n config for fallback settings
grep -riE "fallback|defaultLocale|default.*lang|defaultLanguage" src/ --include="*.ts" --include="*.js" --include="*.json" 2>/dev/null | grep -v node_modules | head -10

# Check next.config.js for Next.js i18n
grep -A5 "i18n" next.config.* 2>/dev/null

# Check i18next config specifically
grep -riE "fallbackLng|fallbackLanguage" . --include="*.ts" --include="*.js" --include="*.json" 2>/dev/null | grep -v node_modules
```

**Pass criteria**:
- Fallback language explicitly configured (usually English)
- Fallback chain defined if multiple fallbacks (e.g., `es-MX` → `es` → `en`)
- Tested: missing translation shows fallback, not key

**Fail criteria**:
- No fallback configured (shows raw keys)
- Fallback to empty string (blank UI)
- Assumed but not explicit in config

**Evidence to capture**:
- Fallback language configured
- Fallback chain (if any)
- Config location

---

## Best Practices

### I18N-005: No hardcoded strings in code
**Severity**: Recommended

Hardcoded strings bypass the translation system entirely. They're invisible to translators and create inconsistent UX across locales.

**Check automatically**:

```bash
# Check for i18n lint rules
grep -riE "i18next/no-literal-string|no-literal-string|@calm/react-intl|eslint-plugin-i18n" package.json .eslintrc* eslint.config* 2>/dev/null

# Sample JSX for hardcoded user-facing strings (red flags)
grep -riE ">[A-Z][a-z]+.*</" src/ --include="*.tsx" --include="*.jsx" 2>/dev/null | grep -v node_modules | head -15

# Look for common hardcoded patterns in buttons, labels
grep -riE "<button>[^{<]+</button>|<label>[^{<]+</label>|placeholder=\"[A-Za-z]+" src/ --include="*.tsx" --include="*.jsx" 2>/dev/null | grep -v node_modules | head -10
```

**Pass criteria**:
- Lint rule enforces no literal strings in JSX (or equivalent)
- User-facing strings go through i18n functions (`t()`, `<FormattedMessage>`, etc.)
- Exceptions documented (e.g., brand names, technical terms)

**Fail criteria**:
- No linting enforcement
- Obvious user-facing strings hardcoded
- "We'll extract them later" (they won't)

**Note**: Some strings legitimately don't need translation (brand names, code identifiers). The lint rule should have an escape hatch for these.

**Evidence to capture**:
- Lint rule configured
- Sample of hardcoded strings found (if any)
- Exception handling approach

---

### I18N-006: Date/time/currency formatting localized
**Severity**: Recommended

Dates, numbers, and currencies format differently across locales:
- Dates: US (MM/DD/YYYY), Europe (DD/MM/YYYY), Japan (YYYY/MM/DD)
- Numbers: US (1,000.00), Germany (1.000,00)
- Currency: Position and symbol vary ($100 vs 100€ vs ¥100)

**Check automatically**:

```bash
# Check for Intl API usage (good sign)
grep -riE "Intl\.(DateTimeFormat|NumberFormat|RelativeTimeFormat)" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | head -10

# Check for date libraries with locale support
grep -E "date-fns|dayjs|moment|luxon" package.json 2>/dev/null

# Look for locale-aware formatting in date libs
grep -riE "formatDistanceToNow|formatRelative|\.locale\(|\.tz\(" src/ --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null | head -10

# Check for i18n library formatting (react-intl, etc.)
grep -riE "FormattedDate|FormattedNumber|FormattedTime|formatDate|formatNumber|formatCurrency" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -10

# RED FLAG: Manual date formatting (likely not localized)
grep -riE "toLocaleDateString\(\)|\.toISOString\(\)|MM/DD/YYYY|DD/MM/YYYY" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -5
```

**Pass criteria**:
- Date/time formatting uses `Intl` API or locale-aware library
- Currency displays use locale-appropriate formatting
- Timezone handling is explicit (not assumed)

**Fail criteria**:
- Hardcoded date formats ("MM/DD/YYYY")
- Manual currency symbol placement
- `toLocaleDateString()` without locale argument (uses system default, inconsistent)

**Evidence to capture**:
- Date formatting approach
- Number/currency formatting approach
- Libraries in use

---

### I18N-007: RTL support if needed
**Severity**: Critical (if RTL languages supported), N/A otherwise

RTL (right-to-left) languages like Arabic, Hebrew, Farsi, and Urdu require mirrored layouts.

**Check automatically**:

```bash
# Check for RTL-related code
grep -riE "dir=.rtl|direction:\s*rtl|\[dir=.rtl\]|:dir\(rtl\)" src/ --include="*.tsx" --include="*.jsx" --include="*.css" --include="*.scss" 2>/dev/null | head -10

# Check for CSS logical properties (RTL-friendly)
grep -riE "margin-inline|padding-inline|inset-inline|border-inline|start|end" src/ --include="*.css" --include="*.scss" --include="*.tsx" 2>/dev/null | head -10

# Check for RTL libraries
grep -E "rtlcss|stylis-plugin-rtl|rtl-detect" package.json 2>/dev/null

# Check i18n config for RTL locales
grep -riE "ar|he|fa|ur" src/ --include="*i18n*" --include="*locale*" 2>/dev/null | head -5

# RED FLAG: Physical properties that break in RTL
grep -riE "margin-left|margin-right|padding-left|padding-right|text-align:\s*(left|right)" src/ --include="*.css" --include="*.scss" 2>/dev/null | head -10
```

**Ask user**:
- "Are RTL languages in scope?" (Arabic, Hebrew, Farsi, Urdu)
- "If yes, has the UI been tested in RTL mode?"

**Pass criteria**:
- If RTL needed: CSS uses logical properties or RTL tooling
- `dir` attribute set based on locale
- Layout tested and works in RTL
- If RTL not needed: N/A (document as intentional)

**Fail criteria**:
- RTL language supported but layout broken
- Heavy use of `margin-left`/`padding-right` without RTL override
- Never tested with RTL locale

**Evidence to capture**:
- RTL languages in scope (or not)
- CSS approach (logical properties, RTL tooling)
- Testing status

---

### I18N-008: Plural forms handled correctly
**Severity**: Recommended

Different languages have different plural rules:
- English: 1 item, 2 items (2 forms)
- Russian: 1 товар, 2 товара, 5 товаров (3 forms)
- Arabic: 6 different plural forms

`${count} items` breaks in most languages.

**Check automatically**:

```bash
# Check for ICU message format (handles plurals properly)
grep -riE "plural|selectordinal|\{count,|{n," src/ --include="*.json" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | head -10

# Check i18n library plural support
grep -riE "i18next.*plural|pluralRules|formatPlural|FormattedPlural" src/ --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null | head -5

# Look for translation files with plural keys (i18next convention)
grep -riE "_plural|_one|_other|_zero|_few|_many" src/ --include="*.json" 2>/dev/null | head -10

# RED FLAG: String concatenation for counts (breaks pluralization)
grep -riE '`\$\{.*\}\s*(item|file|user|message|result)s?`|"\s*\+.*\+\s*".*s\b' src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -5
```

**Pass criteria**:
- i18n library with plural support (i18next, react-intl with ICU)
- Translations use plural syntax, not string concatenation
- Multiple plural forms defined for languages that need them

**Fail criteria**:
- `${count} item(s)` or `${count} items` patterns
- Only "one" and "other" forms for languages needing more
- Plural logic in code instead of translation system

**Evidence to capture**:
- Plural handling approach
- ICU/plural syntax in translation files
- Languages with complex plurals supported

---

## Testing

### I18N-009: Test with different locales
**Severity**: Recommended

Tests should validate behavior across locales, not just the default language.

**Check automatically**:

```bash
# Check for locale in test setup/config
grep -riE "locale|i18n|language" jest.config* vitest.config* cypress.config* playwright.config* 2>/dev/null

# Look for locale-specific test files or describe blocks
grep -riE "locale|i18n|language.*test|test.*translation" --include="*.test.*" --include="*.spec.*" . 2>/dev/null | grep -v node_modules | head -10

# Check for test utilities that set locale
grep -riE "setLocale|changeLanguage|IntlProvider|I18nextProvider" --include="*.test.*" --include="*.spec.*" . 2>/dev/null | grep -v node_modules | head -10

# Look for E2E tests with locale switching
grep -riE "locale|language" cypress/ e2e/ tests/ --include="*.ts" --include="*.js" 2>/dev/null | grep -v node_modules | head -10
```

**Ask user**:
- "Are tests run against multiple locales?"
- "Is there a smoke test for each supported language?"
- "How are locale-specific bugs caught before release?"

**Pass criteria**:
- Unit/integration tests can run with different locales
- At least smoke tests exist for non-default locales
- CI runs tests against multiple locales OR manual locale testing before release

**Fail criteria**:
- Tests only run in default locale (usually English)
- "We test manually" but no documented process
- Locale bugs found only by users

**Evidence to capture**:
- Locale testing approach
- Locales tested in CI
- Manual testing process (if any)

---

### I18N-010: Pseudo-localization for catching issues
**Severity**: Optional

Pseudo-localization transforms strings like "Hello" → "[Ħëľľö]" to:
- Reveal hardcoded strings (they won't be transformed)
- Test text expansion (German is ~30% longer than English)
- Expose concatenation issues
- Find truncated text in fixed-width UI

**Check automatically**:

```bash
# Check for pseudo-locale config in i18next
grep -riE "pseudo|cimode|debug.*true" src/ --include="*i18n*" --include="*.json" 2>/dev/null | grep -v node_modules | head -5

# Check for pseudo-localization packages
grep -E "pseudo-localization|@formatjs/cli.*pseudo|i18next-pseudo" package.json 2>/dev/null

# Look for pseudo locale in translation files
find . -maxdepth 5 -type d \( -name "pseudo" -o -name "qps*" -o -name "xx*" \) \( -path "*/locales/*" -o -path "*/translations/*" \) 2>/dev/null | grep -v node_modules

# Check for pseudo in scripts
grep -E "pseudo" package.json 2>/dev/null | grep script
```

**Pass criteria**:
- Pseudo-locale available for testing
- Developers know how to enable it
- Used during development to catch issues early

**Fail criteria**:
- No pseudo-localization tooling
- "What's pseudo-localization?"
- Only test with real translations (too late in the cycle)

**Evidence to capture**:
- Pseudo-localization tooling
- How to enable it
- Usage in development workflow

---

### I18N-011: Layout tested with long strings
**Severity**: Recommended

Text expansion varies by language:
- German is ~30% longer than English
- Finnish and Hungarian can be 40%+ longer
- Buttons, labels, and navigation break when text doesn't fit

**Check automatically**:

```bash
# Check for text overflow handling in CSS
grep -riE "text-overflow|overflow.*hidden|truncate|ellipsis|whitespace.*nowrap" src/ --include="*.css" --include="*.scss" --include="*.tsx" 2>/dev/null | head -10

# Look for Storybook or visual testing with different lengths
grep -riE "long.*text|text.*length|overflow|truncat" --include="*.stories.*" . 2>/dev/null | grep -v node_modules | head -5

# Check for responsive/flexible layouts (good sign)
grep -riE "flex-wrap|min-width|max-width|overflow-wrap|word-break" src/ --include="*.css" --include="*.scss" 2>/dev/null | head -10

# RED FLAG: Fixed widths on text containers
grep -riE "width:\s*\d+px" src/ --include="*.css" --include="*.scss" 2>/dev/null | head -10
```

**Ask user**:
- "Has the UI been tested with longer text (German, Finnish)?"
- "Are there visual regression tests for different locales?"
- "How are overflow issues caught?"

**Pass criteria**:
- UI handles text expansion gracefully (wrapping, truncation with tooltip)
- Tested with a "long" locale (German) or pseudo-localization with expansion
- Fixed-width containers avoided for text content
- Visual regression tests include non-English locales

**Fail criteria**:
- Only tested with English
- Buttons/labels overflow or get cut off in other languages
- "We'll fix it when translators complain"

**Evidence to capture**:
- Text expansion testing approach
- Visual regression tests (if any)
- Overflow handling patterns

---

## Completing the Audit

After checking all items:

1. **Confirm applicability** — If single-language only, document as N/A with rationale

2. **Summarize results**:
   - I18N-001: PASS/FAIL/N/A (Critical*) — i18n framework in place
   - I18N-002: PASS/FAIL (Recommended) — String extraction automated
   - I18N-003: PASS/FAIL (Recommended) — Translation workflow documented
   - I18N-004: PASS/FAIL (Recommended) — Fallback language defined
   - I18N-005: PASS/FAIL (Recommended) — No hardcoded strings in code
   - I18N-006: PASS/FAIL (Recommended) — Date/time/currency formatting localized
   - I18N-007: PASS/FAIL/N/A (Critical*) — RTL support if needed
   - I18N-008: PASS/FAIL (Recommended) — Plural forms handled correctly
   - I18N-009: PASS/FAIL (Recommended) — Test with different locales
   - I18N-010: PASS/FAIL (Optional) — Pseudo-localization for catching issues
   - I18N-011: PASS/FAIL (Recommended) — Layout tested with long strings

   *Critical only if multi-language/RTL is required

3. **Cross-reference related sections**:
   - Section 8 (Testing & Code Metrics) — Testing infrastructure
   - Section 14 (Documentation) — Documentation practices
   - Section 41 (Accessibility) — Lang attributes, screen reader considerations

4. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority (Critical items first)

5. **Common recommendations**:
   - If no framework: Add i18next or react-intl, configure with supported locales
   - If no extraction: Add @formatjs/cli or i18next-scanner, create npm script
   - If no workflow docs: Document the translation process, even if simple
   - If no fallback: Configure explicit fallback language in i18n config
   - If hardcoded strings: Add eslint-plugin-i18next or similar lint rule
   - If date/number issues: Use Intl API or locale-aware libraries
   - If RTL broken: Switch to CSS logical properties, add RTL testing
   - If plural issues: Use ICU message format, add plural forms to translations
   - If no locale testing: Add locale parameter to test setup, run CI with multiple locales
   - If no pseudo-loc: Configure pseudo-locale in i18n library for development
   - If layout breaks: Use flexible layouts, test with German or expanded pseudo-locale

6. **i18n maturity assessment**:
   - **Level 1 — Hardcoded**: Strings in code, no i18n framework
   - **Level 2 — Basic**: Framework in place, extraction manual, English-only testing
   - **Level 3 — Functional**: Automated extraction, multiple locales, basic testing
   - **Level 4 — Robust**: Documented workflow, locale testing in CI, plural handling
   - **Level 5 — Mature**: Pseudo-localization, visual testing, RTL support, translation service integrated

7. **Record audit date** and auditor
