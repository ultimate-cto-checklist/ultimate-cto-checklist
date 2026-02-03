# Analytics Audit Guide

This guide walks you through auditing a project's analytics capabilities, covering data ownership, pipelines, reporting, and engineering metrics.

## Before You Start

1. Identify the analytics stack (PostHog, Segment, Mixpanel, custom, etc.)
2. Identify the data warehouse (BigQuery, Snowflake, Redshift, etc.)
3. Get access to BI dashboards if external (Metabase, Looker, etc.)

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## Server-Side Tracking & Data Ownership

### ANA-001: Server-side analytics and data ownership
**Severity**: Recommended

Analytics should not be delegated entirely to client-side third-party tools. Server-side tracking ensures data completeness (ad blockers don't affect it) and data ownership means you can query raw events.

**Check automatically**:

1. **Look for server-side analytics implementation**:
```bash
# Check for analytics packages that support server-side
grep -riE "posthog|segment|mixpanel|amplitude|@analytics|rudderstack" package.json 2>/dev/null

# Look for analytics in backend code (not just frontend)
grep -riE "analytics\.(track|identify|page)|trackEvent|logEvent" --include="*.ts" --include="*.js" --include="*.py" src/ lib/ app/ api/ server/ 2>/dev/null | grep -v node_modules | head -15

# Check for analytics middleware or event handlers
grep -riE "analytics.*middleware|event.*tracking|track.*event" --include="*.ts" --include="*.js" src/ lib/ app/ 2>/dev/null | grep -v node_modules | head -10
```

2. **Check for self-hosted or data-owning solutions**:
```bash
# Self-hosted analytics (PostHog, Plausible, Matomo)
grep -riE "POSTHOG_HOST|PLAUSIBLE|MATOMO|self.hosted" .env.example .env* docker-compose*.yml 2>/dev/null

# Check for warehouse destination config
grep -riE "warehouse|bigquery|snowflake|redshift|destination" --include="*.ts" --include="*.js" --include="*.json" config/ 2>/dev/null | head -10
```

3. **Red flags for client-only analytics**:
```bash
# Google Analytics without server-side component = data not owned
grep -riE "gtag|google.analytics|ga\('|GA_MEASUREMENT_ID" --include="*.ts" --include="*.js" --include="*.html" . 2>/dev/null | grep -v node_modules | head -5
```

**If not found in code, ask user**:
- "What analytics tool do you use and is it server-side or client-side?"
- "Where does your analytics data ultimately live? Can you query raw events?"
- "Do you own your analytics data or is it locked in a third-party dashboard?"

**Cross-reference with**:
- ANA-002 (data ownership requires warehouse access)

**Pass criteria**:
- Analytics events sent from server (not just client-side JavaScript)
- Data accessible in a warehouse you control, OR self-hosted solution (PostHog, Plausible)
- Can query raw event data with SQL or equivalent

**Fail criteria**:
- Client-only analytics (GA4, Mixpanel frontend-only)
- No ability to query raw event data
- Data locked in third-party dashboard without export

**Partial (acceptable)**:
- Server-side tracking exists but some events are client-only (document which)
- Data exported to warehouse on schedule (not real-time) - note the delay

**Evidence to capture**:
- Analytics tool name and deployment (self-hosted vs managed)
- Where raw event data lives (warehouse, self-hosted DB, etc.)
- Evidence of server-side tracking code

---

## Data Pipeline

### ANA-002: Analytics data flows to data warehouse
**Severity**: Recommended

Raw analytics data should flow to a queryable warehouse for ad-hoc analysis, custom reports, and data science work.

**Check automatically**:

1. **Look for BigQuery integration**:
```bash
# BigQuery client libraries
grep -riE "bigquery|@google-cloud/bigquery|BIGQUERY" --include="*.ts" --include="*.js" --include="*.py" --include="*.json" . 2>/dev/null | grep -v node_modules | head -10

# BigQuery service account or credentials
ls -la *bigquery*.json *-credentials.json service-account*.json 2>/dev/null
grep -riE "GOOGLE_APPLICATION_CREDENTIALS|bigquery.*key" .env.example .env* 2>/dev/null
```

2. **Check for Dataform (transformation layer)**:
```bash
# Dataform config and SQLX files
ls -la dataform.json 2>/dev/null
find . -name "*.sqlx" -type f 2>/dev/null | head -5
grep -riE "dataform" package.json .github/workflows/*.yml 2>/dev/null
```

3. **Check for ETL/pipeline tools**:
```bash
# Managed ETL services
grep -riE "fivetran|airbyte|stitch|meltano" . 2>/dev/null | grep -v node_modules | head -5

# Segment warehouse destinations
grep -riE "segment.*warehouse|warehouse.*destination" . 2>/dev/null | grep -v node_modules | head -5
```

4. **Check for alternative warehouses**:
```bash
# Snowflake, Redshift, ClickHouse
grep -riE "snowflake|redshift|clickhouse" --include="*.ts" --include="*.js" --include="*.py" --include="*.json" --include="*.yml" . 2>/dev/null | grep -v node_modules | head -10
```

**If not found in code, ask user**:
- "Where does your analytics data end up for querying?"
- "Is there an automated pipeline to a data warehouse?"
- "Can data analysts run SQL queries against raw analytics events?"

**Cross-reference with**:
- ANA-001 (server-side tracking feeds the pipeline)
- ANA-004 (warehouse needs BI layer to be useful)

**Pass criteria**:
- Analytics data flows to a queryable warehouse (BigQuery, Snowflake, Redshift, ClickHouse)
- Pipeline is automated (not manual exports)
- Data is queryable via SQL

**Fail criteria**:
- No warehouse integration
- Data only accessible via SaaS dashboard (can't write SQL against it)
- Manual CSV exports as the "pipeline"

**Partial (acceptable)**:
- Pipeline runs on schedule (daily, hourly) rather than real-time - note the latency
- Warehouse exists but only contains subset of events - document what's missing

**Recommendations**:
- **Warehouse**: BigQuery (recommended for GCP shops), Snowflake, Redshift
- **Transformation**: Dataform (recommended), dbt
- **ETL**: Fivetran, Airbyte (self-hosted option)

**Evidence to capture**:
- Warehouse name and region
- Pipeline tool/method
- Data freshness (real-time, hourly, daily)
- Evidence of automated sync (CI config, cron, managed service)

---

### ANA-003: GitHub data flows to warehouse
**Severity**: Optional

Engineering metrics (PRs, commits, contributors) in the warehouse enable correlation with product analytics and custom engineering reports.

**Check automatically**:

1. **Look for GitHub data extraction**:
```bash
# GitHub API usage for analytics
grep -riE "octokit|@octokit|github.*api" --include="*.ts" --include="*.js" --include="*.py" . 2>/dev/null | grep -v node_modules | head -10

# Scripts that extract PR/commit data
grep -riE "pulls|commits|contributors|pull_request" --include="*.ts" --include="*.js" --include="*.py" scripts/ jobs/ cron/ 2>/dev/null | head -10
```

2. **Check for GitHub webhooks feeding data**:
```bash
# Webhook handlers for GitHub events
grep -riE "webhook.*github|github.*webhook|pull_request.*event|push.*event" --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules | head -10
```

3. **Check for GitHub data in pipeline configs**:
```bash
# GitHub in ETL/Dataform configs
grep -riE "github" dataform.json definitions/*.sqlx 2>/dev/null | head -5
grep -riE "github" fivetran/ airbyte/ 2>/dev/null | head -5
```

4. **Check for engineering analytics tools**:
```bash
# Dedicated tools that sync GitHub data
grep -riE "linearb|sleuth|swarmia|gitprime|pluralsight.*flow|faros" . 2>/dev/null | grep -v node_modules | head -5
```

**If not found in code, ask user**:
- "Do you track GitHub activity (PRs, commits) in your data warehouse?"
- "Can you correlate engineering activity with product metrics?"
- "How do you measure engineering velocity?"

**Cross-reference with**:
- ANA-002 (requires warehouse to exist)
- ANA-005 (GitHub data enables git analytics)

**Pass criteria**:
- GitHub data (PRs, commits, contributors) flows to warehouse
- Can query engineering metrics alongside product analytics
- Automated sync (webhook or scheduled job)

**Fail criteria**:
- No GitHub data in warehouse
- Only using GitHub's built-in insights (can't write custom queries)

**Partial (acceptable)**:
- Using a dedicated tool (LinearB, Sleuth) instead of warehouse - still provides visibility
- Only PR data synced, not commits - note limitation

**Evidence to capture**:
- Sync method (webhook, API polling, managed connector)
- Data points captured (PRs, commits, reviews, etc.)
- Where data lands (warehouse table names or external tool)

---

### ANA-004: BI reporting layer (Metabase recommended)
**Severity**: Recommended

Data in a warehouse is only valuable if it's accessible. A BI layer lets non-engineers build reports and dashboards without writing SQL.

**Check automatically**:

1. **Check for Metabase**:
```bash
# Metabase references
grep -riE "metabase|METABASE" .env.example .env* docker-compose*.yml 2>/dev/null

# Metabase in Docker
grep -iE "metabase" docker-compose*.yml 2>/dev/null
```

2. **Check for alternative BI tools**:
```bash
# Looker, Superset, Redash, Tableau, Mode
grep -riE "looker|superset|redash|tableau|mode.*analytics|preset\.io" . 2>/dev/null | grep -v node_modules | head -10

# Looker specifically (often in config or .lookml files)
find . -name "*.lookml" -o -name "*.lkml" 2>/dev/null | head -5
ls -la looker/ lookml/ 2>/dev/null
```

3. **Check for embedded analytics**:
```bash
# Embedded dashboard configs
grep -riE "embed.*dashboard|dashboard.*embed|iframe.*metabase|iframe.*looker" --include="*.ts" --include="*.js" --include="*.tsx" . 2>/dev/null | grep -v node_modules | head -5
```

**If not found in code, ask user**:
- "What tool do you use for analytics dashboards and reports?"
- "Can non-engineers (product, marketing) build their own reports?"
- "Is there a URL where I can see your analytics dashboards?"

**Cross-reference with**:
- ANA-002 (BI connects to the warehouse)

**Pass criteria**:
- BI tool connected to data warehouse
- Non-engineers can view dashboards
- Ability to create new reports without engineering help (self-serve)

**Fail criteria**:
- No BI layer - only raw SQL access to warehouse
- Reports are one-off scripts engineers run manually
- No dashboards exist

**Partial (acceptable)**:
- Dashboards exist but only engineers can create/modify them
- Read-only access for non-engineers (can view, not build)

**Recommendations**:
- **Metabase** (recommended) - open source, easy to deploy, good SQL mode
- Looker - enterprise, strong semantic layer
- Superset - open source alternative
- Redash - lightweight, query-focused

**Evidence to capture**:
- BI tool name
- Dashboard URL (if shareable)
- Who has access (engineers only, or self-serve for all)
- Number of active dashboards/reports

---

## Git Analytics

### ANA-005: Engineering/git analytics visibility
**Severity**: Optional

Track PR activity, commit patterns, and contributor metrics to understand engineering health and velocity.

**Check automatically**:

1. **Check for dedicated git analytics tools**:
```bash
# Engineering analytics platforms
grep -riE "linearb|sleuth|swarmia|gitprime|pluralsight.*flow|jellyfish|faros|haystack" . 2>/dev/null | grep -v node_modules | head -5
```

2. **Check for custom engineering metrics**:
```bash
# Custom PR/commit metrics tracking
grep -riE "pr.*metrics|commit.*metrics|cycle.time|lead.time|deployment.frequency|dora.*metrics" --include="*.ts" --include="*.js" --include="*.py" --include="*.sql" --include="*.sqlx" . 2>/dev/null | grep -v node_modules | head -10

# Engineering dashboards
grep -riE "engineering.*dashboard|developer.*metrics|team.*velocity" . 2>/dev/null | grep -v node_modules | head -5
```

3. **Check if GitHub data exists in warehouse (from ANA-003)**:
```bash
# GitHub-related tables in Dataform/dbt
grep -riE "github|pull_request|commit" definitions/*.sqlx models/*.sql 2>/dev/null | head -10
```

**If not found in code, ask user**:
- "How do you track PR throughput and cycle time?"
- "Do you have visibility into who's contributing and how often?"
- "Can you answer: 'What's our average time from PR open to merge?'"

**Cross-reference with**:
- ANA-003 (GitHub data in warehouse enables custom analytics)
- ANA-004 (dashboards for visualizing git metrics)

**Pass criteria**:
- Can answer: "What's our average PR cycle time?"
- Can answer: "Who are the top contributors this month?"
- Some form of engineering metrics visibility (dedicated tool OR custom dashboard)

**Fail criteria**:
- No visibility into PR activity beyond GitHub's basic Insights tab
- No way to track engineering trends over time
- No answer to "how long do PRs take to merge?"

**Partial (acceptable)**:
- Using GitHub Insights only - provides some visibility but limited customization
- Manual tracking (spreadsheet) - better than nothing but not scalable

**Recommendations**:
- If you have ANA-003 (GitHub → warehouse): Build custom dashboards in Metabase
- If you want turnkey: LinearB, Sleuth, or Swarmia
- DORA metrics (deployment frequency, lead time, MTTR, change failure rate) as north star

**Evidence to capture**:
- Tool or method used for git analytics
- Sample metrics available (cycle time, throughput, etc.)
- Dashboard URL or screenshot

---

## Completing the Audit

After checking all items:

1. **Summarize results**:
   - ANA-001: PASS/FAIL (Recommended)
   - ANA-002: PASS/FAIL (Recommended)
   - ANA-003: PASS/FAIL/N/A (Optional)
   - ANA-004: PASS/FAIL (Recommended)
   - ANA-005: PASS/FAIL/N/A (Optional)

2. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority

3. **Common recommendations**:
   - If client-only analytics: Add server-side tracking via Segment or PostHog
   - If no warehouse: Set up BigQuery + Dataform pipeline
   - If no BI layer: Deploy Metabase connected to warehouse
   - If no git analytics: Start with LinearB (quick) or build from GitHub data in warehouse

4. **Maturity assessment**:
   - **Level 1**: Client-only analytics, no warehouse (common in early startups)
   - **Level 2**: Server-side tracking, data in warehouse, basic dashboards
   - **Level 3**: Full pipeline with Dataform transformations, self-serve BI, GitHub data integrated
   - **Level 4**: Engineering metrics correlated with product analytics, DORA metrics tracked

5. **Record audit date** and auditor
