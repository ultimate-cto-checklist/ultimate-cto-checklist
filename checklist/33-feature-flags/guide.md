# Feature Flags & Rollouts Audit Guide

This guide walks you through auditing a project's feature flag system - gradual rollouts, A/B testing capabilities, kill switches, and targeting.

## The Goal: Deployments Decoupled from Releases

Ship code anytime, release features when ready. Feature flags give you control over what users see without redeploying.

- **Enabled** — A feature flag system exists and is actively used (env vars for small projects, dedicated service for larger ones)
- **Gradual** — Percentage-based rollouts, sticky user assignment, and segment targeting are available
- **Kill switches** — Critical features (payments, external APIs, new features) can be toggled without a deploy
- **Instant** — Kill switch toggle time is under 5 minutes, ideally instant via dashboard
- **Documented** — Runbooks exist for disabling features during incidents

## Before You Start

1. **Identify project scale** (small projects can use env vars, larger projects need dedicated service)
2. **Identify feature flag service** (GrowthBook, LaunchDarkly, Unleash, Flagsmith, custom)
3. **Identify deployment frequency** (frequent deploys benefit more from feature flags)
4. **Check for existing flags** (are they actually in use or just installed?)

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## Feature Flag System

### FF-001: Feature flag system configured
**Severity**: Recommended

Feature flags decouple deployments from releases, enabling gradual rollouts, A/B testing, and quick rollbacks. Small projects can use environment variables; larger projects need a dedicated service like GrowthBook.

**Check automatically**:

1. **Check for feature flag libraries**:
```bash
# GrowthBook (recommended)
grep -E "\"@growthbook/growthbook\"|\"@growthbook/growthbook-react\"" package.json 2>/dev/null

# Other feature flag services
grep -E "\"launchdarkly|\"unleash-client\"|\"flagsmith\"|\"@openfeature\"" package.json 2>/dev/null

# Posthog (includes feature flags)
grep -E "\"posthog-js\"|\"posthog-node\"" package.json 2>/dev/null
```

2. **Check for feature flag configuration**:
```bash
# GrowthBook configuration
grep -rE "GrowthBook|growthbook" src/ app/ lib/ --include="*.ts" --include="*.js" 2>/dev/null

# Feature flag environment variables
grep -rE "GROWTHBOOK|LAUNCHDARKLY|UNLEASH|FLAGSMITH" .env* 2>/dev/null
env | grep -iE "growthbook|feature" 2>/dev/null
```

3. **Check for feature flag usage in code**:
```bash
# Common feature flag patterns
grep -rE "isOn\(|isFeatureEnabled|useFeature|useFeatureFlag|getFeatureValue|feature\." src/ app/ lib/ --include="*.ts" --include="*.js" 2>/dev/null

# GrowthBook specific
grep -rE "\.isOn\(|\.evalFeature\(|useFeatureIsOn|useFeatureValue" src/ app/ lib/ --include="*.ts" --include="*.js" 2>/dev/null

# Simple env var flags (acceptable for small projects)
grep -rE "FEATURE_|ENABLE_|FF_" src/ app/ lib/ --include="*.ts" --include="*.js" 2>/dev/null
grep -rE "process\.env\.FEATURE_|process\.env\.ENABLE_" src/ app/ lib/ --include="*.ts" --include="*.js" 2>/dev/null
```

4. **Check for feature flag configuration files**:
```bash
# GrowthBook features JSON
find . -name "features.json" -o -name "growthbook*.json" 2>/dev/null

# Feature flag configs
find . -name "*feature*flag*" -o -name "*flags*" 2>/dev/null | grep -v node_modules
```

5. **Check capabilities** (if using a feature flag service):

For GrowthBook or similar services, verify these capabilities exist:
- **A/B testing**: Can assign users to variants and measure outcomes
- **Percentage rollouts**: Can roll out to X% of users
- **Sticky assignment**: Same user gets same variant consistently (user ID hashing)
- **User segment targeting**: Can target by user attributes (plan, role, region, etc.)

```bash
# Check for experiment/variant usage (A/B testing)
grep -rE "experiment|variant|useExperiment|runExperiment" src/ app/ lib/ --include="*.ts" --include="*.js" 2>/dev/null

# Check for targeting attributes being set
grep -rE "setAttributes|setAttribute|attributes:" src/ app/ lib/ --include="*.ts" --include="*.js" 2>/dev/null

# Check for percentage/weight configurations
grep -rE "coverage|weight|percentage|rollout" src/ app/ lib/ --include="*.ts" --include="*.js" 2>/dev/null
```

**Ask user**:
- "What's the project scale? (Small = env vars OK, Large = need GrowthBook)"
- "Are feature flags actively used, or just installed?"
- "Do you need A/B testing capabilities?"
- "Do you need to target features by user attributes (plan type, region, etc.)?"

**Cross-reference with**:
- FF-002 (kill switches use the same infrastructure)
- DEPLOY-001 (deployments should be decoupled from releases)
- Section 35 (incident response - kill switches in playbooks)

**Pass criteria**:
- Feature flag system exists (env vars for small projects, dedicated service for larger)
- Flags are actually used in production code (not just installed)
- Clear pattern for adding new flags
- For dedicated services: percentage rollouts, sticky assignment, and segment targeting supported

**Fail criteria**:
- No feature flag system
- Library installed but never used in code
- Only hardcoded boolean toggles with no external control
- Large project using only env var flags (need proper service)

**Evidence to capture**:
- Feature flag system in use (GrowthBook, env vars, etc.)
- Count of active flags in codebase
- Capabilities available (A/B testing, percentage rollouts, targeting)
- Whether flags are actually being used (not just configured)

---

## Kill Switches

### FF-002: Kill switches for quick disable
**Severity**: Recommended

Kill switches are feature flags that can instantly disable functionality in production without a deploy. Critical for incident response when a feature causes problems.

**Check automatically**:

1. **Check for kill switch naming patterns**:
```bash
# Common kill switch naming
grep -rE "KILL_|DISABLE_|ENABLE_|EMERGENCY_" src/ app/ lib/ --include="*.ts" --include="*.js" 2>/dev/null

# Feature flags that control critical features
grep -rE "isOn\(['\"].*payment|isOn\(['\"].*checkout|isOn\(['\"].*auth" src/ app/ lib/ --include="*.ts" --include="*.js" 2>/dev/null
```

2. **Check toggle speed** (can flags be changed without deploy?):

For **env var flags**:
- Require restart/redeploy to toggle = slow (minutes to hours)
- NOT suitable for kill switches

For **GrowthBook/feature flag services**:
- Toggle via dashboard = instant (seconds)
- Suitable for kill switches

```bash
# Check if using env vars (slow toggle) vs SDK (fast toggle)
grep -rE "process\.env\.(FEATURE_|ENABLE_|DISABLE_)" src/ app/ lib/ --include="*.ts" --include="*.js" 2>/dev/null

# Check for GrowthBook SDK (fast toggle)
grep -rE "gb\.isOn|gb\.evalFeature|useFeatureIsOn" src/ app/ lib/ --include="*.ts" --include="*.js" 2>/dev/null
```

3. **Check for documented kill switch procedures**:
```bash
# Look for runbooks or incident docs
find . -name "*.md" -exec grep -l -iE "kill switch|disable feature|emergency" {} \; 2>/dev/null

# Check CLAUDE.md or operational docs
grep -iE "kill switch|disable|emergency" CLAUDE.md README.md docs/*.md 2>/dev/null
```

4. **Check for critical features that should have kill switches**:

Identify features that could cause incidents if they break:
- Payment processing
- External API integrations
- New features in active development
- Third-party service dependencies

```bash
# Find critical integrations that might need kill switches
grep -rE "stripe|paypal|twilio|sendgrid|openai|anthropic" src/ app/ lib/ --include="*.ts" --include="*.js" 2>/dev/null | head -20
```

**Ask user**:
- "How quickly can you disable a feature in production? (< 5 min = good, requires deploy = bad)"
- "Which features have kill switches? (payments, external APIs, new features)"
- "Is there documentation on how to disable features in an emergency?"
- "Who has access to toggle kill switches?"

**Cross-reference with**:
- FF-001 (kill switches are a type of feature flag)
- Section 35 (incident response - kill switches in runbooks)
- DEPLOY-001 (deployments should be fast, but kill switches should be faster)

**Pass criteria**:
- Critical features have kill switches
- Kill switches can be toggled in < 5 minutes (ideally instant via dashboard)
- Team knows how to use them (documented or well-known)
- Kill switch access is controlled but available to on-call

**Fail criteria**:
- No kill switches for risky features (payments, external APIs)
- Toggling requires a deploy (defeats the purpose)
- No documentation on how to disable features in emergency
- Only one person knows how to toggle (bus factor = 1)

**Notes on kill switch implementation**:

**Env var kill switches** (acceptable for simple cases):
- Set `DISABLE_PAYMENTS=true` in environment
- Requires restart/redeploy to take effect
- OK for non-urgent features, not for emergencies

**Feature flag service kill switches** (recommended):
- Toggle in GrowthBook dashboard
- Takes effect immediately (SDK polls or uses SSE)
- Proper audit trail of who toggled what when

**Hybrid approach**:
- Use feature flag service for instant toggles
- Have env var override as backup if flag service is down
- `process.env.DISABLE_PAYMENTS || !gb.isOn('payments')`

**Evidence to capture**:
- Kill switches identified and their toggle speed
- Critical features covered (or not)
- Documentation/runbook status
- Who has access to toggle kill switches

---

## Completing the Audit

After checking all items:

1. **Summarize results**:
   - FF-001: PASS/FAIL (Recommended) - Feature flag system configured
   - FF-002: PASS/FAIL (Recommended) - Kill switches for quick disable

2. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority

3. **Common recommendations**:
   - If no feature flags: Start with GrowthBook (free, self-hostable, good DX)
   - If only env var flags and large project: Migrate to GrowthBook for gradual rollouts
   - If no kill switches: Add them for payment flows, external APIs, new features
   - If kill switches require deploy: Move to feature flag service for instant toggling
   - If no documentation: Add runbook section for "how to disable feature X"

4. **Maturity assessment**:
   - **Level 1**: No feature flags - all-or-nothing deploys
   - **Level 2**: Env var flags only - requires restart to toggle
   - **Level 3**: Feature flag service - instant toggling, but limited use
   - **Level 4**: Full feature flag culture - gradual rollouts, A/B testing, kill switches, segment targeting, documented procedures

5. **Record audit date** and auditor
