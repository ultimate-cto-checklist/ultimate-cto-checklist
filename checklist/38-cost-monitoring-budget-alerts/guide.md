# Cost Monitoring & Budget Alerts Audit Guide

This guide walks you through auditing a project's cost monitoring setup - cloud budgets, tool costs, visibility, and governance.

## The Goal: No Surprise Bills

Tech spending should be visible, attributed, and controlled. Every cost has an owner, limits are enforced, and spikes are caught early.

- **Visible** — Unified view of all tech costs with historical trends and regular reporting
- **Bounded** — Cloud budgets and tool limits configured with early-warning alerts
- **Owned** — Every paid service has a defined budget and accountable owner
- **Governed** — Regular reviews turn visibility into optimization actions

## Before You Start

1. **Identify cloud providers in use** (AWS, GCP, Azure, etc.)
2. **Get access to billing consoles** (or work with someone who has access)
3. **Identify SaaS tools and subscriptions** (especially usage-based pricing)
4. **Understand project/team structure** (for cost attribution)

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## Cloud Budget Alerts

### COST-001: Cloud provider budget alerts configured
**Severity**: Critical

Runaway cloud costs are a real business risk. Every cloud provider should have budget alerts with defined amounts and multiple thresholds.

**Check automatically**:

```bash
# AWS - List all budgets and their configurations
aws budgets describe-budgets --account-id $(aws sts get-caller-identity --query Account --output text)

# GCP - List billing budgets (requires billing account ID)
gcloud billing budgets list --billing-account=BILLING_ACCOUNT_ID

# Azure - List consumption budgets
az consumption budget list

# Check infrastructure-as-code for budget definitions
grep -riE "budget|billing.*alert|cost.*alert" terraform/ pulumi/ cdk/ infra/ --include="*.tf" --include="*.ts" --include="*.yaml" --include="*.yml" 2>/dev/null
```

**Ask user**:
- "Which cloud providers are in use?"
- "Is there a defined budget for this project? Where documented?"
- "At what thresholds do you get alerted?" (expect 50%, 80%, 100% or similar)
- "Who receives alerts? Is that inbox monitored?"

**Pass criteria**:
- Every active cloud provider has budget alerts configured
- Budget amount defined (not just "alert on any spend")
- Multiple thresholds including early warning (≤50%) and approaching limit (80-90%)
- Alerts go to monitored recipients (not a dead inbox)

**Fail criteria**:
- Any cloud provider without budget alerts
- No defined budget amount ("we just watch the bill")
- Only alerts at 100% (too late to act)
- Alerts go to unmonitored inbox or former employee

**Evidence to capture**:
- Cloud providers in use
- Budget amounts per provider/project
- Threshold percentages configured
- Alert recipients

---

## Anomaly Detection

### COST-002: Anomaly detection and unexpected cost alerts
**Severity**: Recommended

Fixed thresholds miss mid-month spikes. Anomaly detection catches unusual spending patterns regardless of absolute amounts.

**Check automatically**:

```bash
# AWS - Check for Cost Anomaly Detection monitors
aws ce get-anomaly-monitors

# AWS - Check anomaly subscriptions (who gets notified)
aws ce get-anomaly-subscriptions

# Look for third-party cost tools
grep -riE "vantage|cloudhealth|kubecost|finops|cost.*monitor" docs/ README.md package.json --include="*.md" --include="*.json" 2>/dev/null

# Check for usage-based services that could spike
grep -riE "openai|anthropic|twilio|sendgrid|stripe.*metered|bandwidth|cdn" src/ app/ --include="*.ts" --include="*.js" --include="*.py" 2>/dev/null | head -20
```

**Ask user**:
- "Do you have anomaly detection beyond fixed thresholds?"
- "Would you catch a sudden 3x spike mid-month before hitting budget?"
- "Any third-party cost monitoring tools?" (Vantage, CloudHealth, Kubecost)
- "Which tools have usage-based pricing that could spike?" (AI APIs, SMS, bandwidth)

**Common usage-based services to monitor**:
| Service Type | Examples | Spike Risk |
|--------------|----------|------------|
| AI/ML APIs | OpenAI, Anthropic, AWS Bedrock | High - token usage |
| Communications | Twilio, SendGrid | High - per message |
| CDN/Bandwidth | CloudFront, Cloudflare (paid tier) | Medium - traffic spikes |
| Serverless | Lambda, Cloud Functions | Medium - invocation count |
| Database | Aurora Serverless, Firestore | Medium - read/write ops |

**Pass criteria**:
- Anomaly detection enabled for cloud (native or third-party)
- Awareness of usage-based tools with spike potential
- Monitoring in place for high-risk usage-based services
- Would catch unexpected spikes before invoice arrives

**Fail criteria**:
- Only fixed threshold alerts
- "We'd notice when the bill comes"
- Usage-based tools with no monitoring or alerts
- No awareness of which services have variable pricing

**Cross-reference with**:
- COST-001 (anomaly detection complements threshold alerts)
- COST-003 (usage-based tools should have budget awareness)

**Evidence to capture**:
- Anomaly detection tools in use (AWS native, third-party)
- Usage-based services identified
- Monitoring status for each high-risk service

---

## Tool Budgets

### COST-003: Tool budgets defined
**Severity**: Recommended

Beyond cloud, SaaS tools add up. Each paid tool should have an expected cost and owner.

**Check automatically**:

```bash
# Look for tool/vendor documentation
find . -maxdepth 4 -type f \( -name "*tool*" -o -name "*vendor*" -o -name "*stack*" -o -name "*cost*" \) -name "*.md" 2>/dev/null | grep -v node_modules

# Look for cost documentation
grep -riE "cost|budget|subscription|pricing" docs/ --include="*.md" 2>/dev/null

# Identify SaaS tools from codebase
grep -riE "sentry|datadog|intercom|hubspot|zendesk|slack|notion|figma|linear|github|gitlab|vercel|netlify|heroku|planetscale|supabase" package.json .env.example src/ --include="*.json" --include="*.env*" --include="*.ts" --include="*.js" 2>/dev/null | head -30
```

**Ask user**:
- "Do you have a list of all paid tech tools?" (SaaS, APIs, services)
- "Does each have a defined budget or expected monthly cost?"
- "Where is this tracked?" (spreadsheet, finance system, Notion)
- "Who owns each tool budget?" (or category owner)

**Common tool categories to cover**:
| Category | Examples |
|----------|----------|
| Infrastructure | Vercel, Netlify, Heroku, Railway |
| Database | PlanetScale, Supabase, MongoDB Atlas |
| Monitoring | Datadog, Sentry, LogRocket |
| Communication | Slack, Discord |
| Development | GitHub, GitLab, Linear |
| Design | Figma, Framer |
| Analytics | Mixpanel, Amplitude, PostHog |
| Support | Intercom, Zendesk |
| Email | SendGrid, Postmark, Mailgun |

**Pass criteria**:
- Inventory of paid tools exists
- Each tool has expected monthly/annual cost documented
- Budget owner identified (per tool or per category)
- Regular review of tool costs

**Fail criteria**:
- No tool inventory ("we have subscriptions scattered across credit cards")
- Tools listed but no budgets/expected costs
- Only track cloud, ignore SaaS tools
- Nobody owns tool cost management

**Evidence to capture**:
- Location of tool inventory
- Number of tools tracked vs. estimated total
- Whether costs are documented
- Owner for tool budget management

---

## Cost Visibility

### COST-004: Cost visibility and reporting
**Severity**: Recommended

You need a unified view of all tech costs with historical trends and regular reporting.

**Check automatically**:

```bash
# Look for cost dashboards
grep -riE "cost.*dashboard|spend.*report|billing.*report|finops" docs/ README.md --include="*.md" 2>/dev/null

# Check for data warehouse cost data
grep -riE "bigquery.*cost|cost.*bigquery|billing.*export|cost.*warehouse" docs/ src/ --include="*.md" --include="*.sql" --include="*.ts" 2>/dev/null

# Look for Metabase/Looker/reporting tool references
grep -riE "metabase|looker|tableau|grafana.*cost|cost.*grafana" docs/ --include="*.md" 2>/dev/null

# Check for scheduled reports or automation
grep -riE "cost.*report|billing.*email|scheduled.*cost" docs/ src/ --include="*.md" --include="*.ts" --include="*.js" 2>/dev/null
```

**Ask user**:
- "Is there a single place to see all tech costs?" (cloud + SaaS combined)
- "Can you see trends over time?" (month-over-month, year-over-year)
- "Do you get regular cost reports? How often? Who receives them?"
- "Where does cost data live?" (cloud console only, exported to warehouse, spreadsheet)

**Cost visibility maturity**:
| Level | Description |
|-------|-------------|
| 1 - None | Check each cloud console and invoice separately |
| 2 - Basic | Spreadsheet aggregating costs manually |
| 3 - Consolidated | Dashboard combining cloud + SaaS costs |
| 4 - Automated | Scheduled reports, data warehouse, trend analysis |
| 5 - Optimized | Automated recommendations, forecasting, alerts |

**Pass criteria**:
- Unified view of tech costs exists (dashboard, report, or maintained spreadsheet)
- Historical data retained, trends visible
- Regular reports generated (monthly minimum)
- Reports reach relevant stakeholders

**Fail criteria**:
- Costs scattered across cloud consoles, invoices, credit card statements
- Only current month visible, no historical comparison
- No regular reporting cadence
- "We look at costs when something seems wrong"

**Cross-reference with**:
- COST-001 (budget alerts trigger, but dashboard shows context)
- COST-005 (visibility feeds into governance reviews)

**Evidence to capture**:
- Where costs are viewed (dashboard URL, spreadsheet, consoles)
- Historical data availability (months/years)
- Reporting cadence and recipients
- Visibility maturity level

---

## Cost Governance

### COST-005: Cost governance
**Severity**: Recommended

Cost attribution enables accountability. Regular reviews turn visibility into action.

**Check automatically**:

```bash
# Check for cloud tagging policies
grep -riE "tag.*policy|required.*tag|cost.*tag|cost.*center|cost.*allocat" docs/ terraform/ --include="*.md" --include="*.tf" 2>/dev/null

# Look for tagging in infrastructure-as-code
grep -riE "tags.*=|labels.*=" terraform/ pulumi/ cdk/ --include="*.tf" --include="*.ts" --include="*.yaml" 2>/dev/null | head -20

# Check for cost review documentation
grep -riE "cost.*review|budget.*review|spend.*review|finops.*meeting" docs/ --include="*.md" 2>/dev/null

# Look for cost allocation documentation
grep -riE "cost.*attribution|cost.*allocation|chargeback|showback" docs/ --include="*.md" 2>/dev/null
```

**Ask user**:
- "Can you attribute costs to specific projects or teams?" (tags, separate accounts, manual)
- "Is tagging enforced for cloud resources?"
- "Do you review costs regularly? How often? Who participates?"
- "What actions come out of cost reviews?" (optimizations, cleanups, budget adjustments)

**Cost attribution methods**:
| Method | Pros | Cons |
|--------|------|------|
| Resource tagging | Granular, flexible | Requires enforcement |
| Separate accounts | Clean separation | Overhead to manage |
| Manual allocation | Simple to start | Error-prone, labor-intensive |
| Usage-based split | Fair | Complex to implement |

**Pass criteria**:
- Costs attributable to projects/teams (tagging, accounts, or documented allocation)
- Tagging policy exists and is enforced (if using tags)
- Regular review cadence (monthly minimum)
- Reviews lead to actions (optimizations, cleanups, alerts)

**Fail criteria**:
- All costs in one bucket, no breakdown possible
- Tagging exists but not enforced (many untagged resources)
- Reviews are ad-hoc or never happen
- Reviews happen but no actions result ("we just look at the numbers")

**Cross-reference with**:
- COST-004 (need visibility to do governance)
- COST-003 (tool ownership enables accountability)

**Evidence to capture**:
- Cost attribution method (tags, accounts, manual)
- Tagging enforcement (policy exists? enforced?)
- Review cadence and participants
- Recent actions from cost reviews

---

## Completing the Audit

After checking all items:

1. **Summarize results**:
   - COST-001: PASS/FAIL (Critical) - Cloud provider budget alerts configured
   - COST-002: PASS/FAIL (Recommended) - Anomaly detection and unexpected cost alerts
   - COST-003: PASS/FAIL (Recommended) - Tool budgets defined
   - COST-004: PASS/FAIL (Recommended) - Cost visibility and reporting
   - COST-005: PASS/FAIL (Recommended) - Cost governance

2. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority (Critical items first)

3. **Common recommendations**:
   - If no cloud budgets: Set up budgets in each cloud console with 50%/80%/100% thresholds
   - If no anomaly detection: Enable AWS Cost Anomaly Detection or equivalent
   - If no tool inventory: Create spreadsheet listing all paid tools with costs and owners
   - If no visibility: Start with spreadsheet, graduate to dashboard; export cloud billing to BigQuery
   - If no attribution: Implement tagging policy, enforce via CI/Terraform
   - If no reviews: Schedule monthly cost review, start with top 10 spend items

4. **Cost management maturity assessment**:
   - **Level 1**: Blind - No budgets, no visibility, surprise bills
   - **Level 2**: Reactive - See costs after the fact, fix when something breaks
   - **Level 3**: Aware - Budgets set, alerts configured, basic visibility
   - **Level 4**: Proactive - Regular reviews, attribution, trend analysis, optimization
   - **Level 5**: Optimized - Automated recommendations, forecasting, FinOps practice

5. **Record audit date** and auditor
