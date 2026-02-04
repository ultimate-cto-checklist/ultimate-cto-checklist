# Incident Response Audit Guide

This guide walks you through auditing a project's incident response capabilities - on-call coverage, escalation procedures, runbooks, and post-mortem practices.

## Before You Start

1. **Identify team size and coverage needs** (24/7 vs business hours only)
2. **Identify incident management tools** (PagerDuty, Opsgenie, incident.io, etc.)
3. **Check for existing runbooks/playbooks** (docs/, runbooks/, wiki)
4. **Review recent incidents** (if any) to understand current practices

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## On-Call & Escalation

### IR-001: On-call rotation defined
**Severity**: Recommended

When incidents happen outside business hours, someone needs to be responsible. A defined rotation ensures 24/7 coverage without burning out individuals.

**Check automatically**:

1. **Look for on-call documentation**:
```bash
# Search for on-call docs
grep -riE "on-?call|rotation|pager|schedule" docs/ runbooks/ README.md CLAUDE.md --include="*.md" 2>/dev/null

# Check for PagerDuty/Opsgenie config
grep -riE "pagerduty|opsgenie|incident\.io" package.json .github/ terraform/ --include="*.json" --include="*.yml" --include="*.tf" 2>/dev/null
```

**Ask user**:
- "Do you have 24/7 coverage requirements?"
- "Who gets paged when production goes down at 3am?"
- "Is the rotation documented somewhere?"

**Cross-reference with**:
- IR-002 (escalation paths) - who to escalate to from on-call
- IR-004 (incident management tool) - often manages on-call scheduling
- Section 12 (monitoring/alerting) - alerts need to reach on-call

**Pass criteria**:
- On-call rotation documented (even if it's "founder handles everything for now")
- Clear who is responsible at any given time
- OR explicitly no after-hours coverage needed (side project, internal tool)

**Fail criteria**:
- Nobody knows who's on call
- Verbal-only rotation ("I think it's Bob this week?")
- Single point of failure with no backup

**Evidence to capture**:
- Location of on-call documentation
- Current rotation schedule or responsible person
- Tool used for scheduling (if any)

---

### IR-002: Escalation paths documented
**Severity**: Recommended

When the on-call person can't resolve an issue alone, they need to know who to escalate to. Clear paths prevent "who do I call?" panic during incidents.

**Check automatically**:

1. **Look for escalation documentation**:
```bash
# Search for escalation docs
grep -riE "escalat|tier|level.*support|who.*to.*call" docs/ runbooks/ README.md CLAUDE.md --include="*.md" 2>/dev/null

# Check incident management tool configs for escalation policies
grep -riE "escalation.*policy|escalation_policy" terraform/ .github/ --include="*.tf" --include="*.yml" 2>/dev/null
```

**Ask user**:
- "If the on-call engineer can't fix it, who do they call?"
- "Are there different escalation paths for different systems (database vs app vs infra)?"
- "Is there a 'wake the CTO' threshold defined?"

**Cross-reference with**:
- IR-001 (on-call rotation) - escalation starts from on-call
- IR-003 (contact list) - escalation needs contact info
- IR-004 (incident management tool) - often manages escalation policies

**Pass criteria**:
- Written escalation path (Tier 1 → Tier 2 → management)
- Clear criteria for when to escalate
- Contact info for each tier

**Fail criteria**:
- No escalation path ("figure it out")
- Escalation exists but criteria undefined (when do you escalate?)
- Single tier only - nowhere to go if stuck

**Evidence to capture**:
- Location of escalation documentation
- Number of escalation tiers
- Criteria for escalation (severity-based, time-based, etc.)

---

### IR-003: Contact list for emergencies
**Severity**: Critical

During an incident, you shouldn't be hunting for phone numbers. A readily accessible contact list with multiple reach methods saves critical minutes.

**Check automatically**:

1. **Look for contact documentation**:
```bash
# Search for contact lists
grep -riE "contact|emergency|phone|mobile|\+1|\+44" docs/ runbooks/ README.md CLAUDE.md CONTACTS.md ONCALL.md --include="*.md" 2>/dev/null

# Look for dedicated contact files
find . -maxdepth 3 -name "*contact*" -o -name "*emergency*" -o -name "*oncall*" 2>/dev/null | grep -v node_modules
```

**Ask user**:
- "Where's the emergency contact list stored?"
- "Does it include multiple contact methods (phone, Slack, email)?"
- "Is it accessible when your primary systems are down?" (not just in a wiki that might be offline)

**Cross-reference with**:
- IR-001/IR-002 (on-call and escalation) - contact list supports both
- IR-004 (incident management tool) - tool often stores contacts
- Section 12 (monitoring) - alerting tools need contact info configured

**Pass criteria**:
- Contact list exists with key people (on-call, escalation contacts, vendors)
- Multiple contact methods per person (phone + Slack/email)
- Accessible during outages (not solely in a system that could be down)

**Fail criteria**:
- No contact list
- List exists but only has email (useless at 3am)
- List is only in production systems (inaccessible during outage)

**Evidence to capture**:
- Location of contact list
- Contact methods included (phone, Slack, email, etc.)
- Whether it's accessible offline/during outages

---

### IR-004: PagerDuty/Opsgenie or similar
**Severity**: Recommended

Incident management tools handle alerting, on-call scheduling, escalation, and incident tracking in one place. They're the glue between monitoring and humans.

**Check automatically**:

1. **Check for incident management tools**:
```bash
# Search package.json and configs
grep -riE "pagerduty|opsgenie|incident\.io|rootly|firehydrant|victorops|splunk-on-call" package.json .github/ terraform/ infrastructure/ --include="*.json" --include="*.yml" --include="*.tf" 2>/dev/null

# Look for webhook configs pointing to incident platforms
grep -riE "events\.pagerduty\.com|api\.opsgenie\.com|api\.incident\.io" .github/ terraform/ --include="*.yml" --include="*.tf" 2>/dev/null

# Check for config files
find . -maxdepth 2 -name "*pagerduty*" -o -name "*opsgenie*" 2>/dev/null | grep -v node_modules
```

2. **Check monitoring tool integrations**:
```bash
# Datadog, Sentry, etc. often integrate with incident tools
grep -riE "pagerduty|opsgenie" datadog/ sentry/ monitoring/ --include="*.yml" --include="*.json" 2>/dev/null
```

**Ask user**:
- "What tool do you use for incident management/paging?"
- "Is it integrated with your monitoring/alerting?" (Datadog → PagerDuty, etc.)
- "Does it handle on-call scheduling, or do you manage that separately?"

**Cross-reference with**:
- IR-001/IR-002 (on-call and escalation) - tool often manages both
- IR-003 (contact list) - tool becomes the source of truth for contacts
- Section 12 (monitoring/alerting) - alerts should trigger the incident tool

**Pass criteria**:
- Using an incident management tool (PagerDuty, Opsgenie, incident.io, etc.)
- Tool is integrated with monitoring/alerting systems
- On-call schedules managed in the tool

**Fail criteria**:
- No incident management tool (relying on Slack mentions or manual calls)
- Tool exists but not integrated with monitoring (alerts don't auto-page)
- Tool exists but nobody uses it properly

**Notes**:
For small teams/early stage: not having PagerDuty is fine if you have a simple contact list and Slack alerts. This becomes more critical as team grows or when 24/7 uptime matters.

**Evidence to capture**:
- Incident management tool in use (or none)
- Integrations with monitoring tools
- Whether on-call scheduling is managed there

---

## Runbooks

### IR-005: Common incidents have runbooks
**Severity**: Critical

Runbooks turn tribal knowledge into documented steps anyone can follow. During an incident isn't the time to figure out "how do we restart the database?"

**Check automatically**:

1. **Look for runbook directories and files**:
```bash
# Check for runbook directories
ls -la runbooks/ playbooks/ docs/incidents/ docs/runbooks/ 2>/dev/null

# Search for runbook content
grep -riE "runbook|playbook|incident.*response|troubleshoot" docs/ README.md CLAUDE.md --include="*.md" 2>/dev/null

# Look for specific incident types
grep -riE "server.*down|database.*issue|high.*traffic|outage|incident" docs/ runbooks/ --include="*.md" 2>/dev/null
```

2. **Check for runbook templates**:
```bash
# Look for templates
find . -maxdepth 3 -name "*template*" -path "*/runbook*" -o -name "*template*" -path "*/playbook*" 2>/dev/null | grep -v node_modules
```

**Ask user**:
- "Do you have written runbooks for common incidents?"
- "What incidents have you had before? Are they documented?"
- "Can a new team member follow the runbook without help?"

**Minimum runbooks to have**:
| Incident Type | What It Covers |
|---------------|----------------|
| Server/app down | How to check status, restart, rollback, who to contact |
| Database issues | Connection problems, slow queries, failover procedures |
| High traffic/load | Scaling procedures, what to shed, caching knobs |
| Security incident | Who to contact, containment steps, communication plan |

**Cross-reference with**:
- Section 34 (rollback/recovery) - rollback procedure is a type of runbook
- IR-001/IR-002 (on-call/escalation) - runbooks reference who to escalate to
- Section 12 (monitoring) - runbooks triggered by alerts

**Pass criteria**:
- Runbooks exist for the most common/critical incident types
- Runbooks are step-by-step (not just "fix the database")
- Runbooks are accessible during outages
- Team knows where to find them

**Fail criteria**:
- No runbooks ("we wing it")
- Runbooks exist but are outdated/wrong
- Runbooks only in one person's head
- Runbooks stored only in systems that could be down

**Evidence to capture**:
- Location of runbooks
- Incident types covered
- Last update date (if visible)
- Whether they're accessible offline

---

## Post-Mortems

### IR-006: Blameless post-mortems after incidents
**Severity**: Recommended

Post-mortems turn incidents into learning opportunities. "Blameless" means focusing on systems and processes, not individuals - people make mistakes, systems should catch them.

**Check automatically**:

1. **Look for post-mortem documentation**:
```bash
# Check for post-mortem directories
ls -la postmortems/ post-mortems/ incidents/ docs/postmortems/ docs/incidents/ 2>/dev/null

# Search for post-mortem content
grep -riE "post-?mortem|incident.*review|RCA|root.*cause|blameless" docs/ README.md CLAUDE.md --include="*.md" 2>/dev/null

# Look for post-mortem templates
find . -maxdepth 3 -name "*postmortem*" -o -name "*post-mortem*" -o -name "*incident*template*" 2>/dev/null | grep -v node_modules
```

**Ask user**:
- "Do you write post-mortems after incidents?"
- "Is there a template or standard format?"
- "Are post-mortems blameless? (focus on systems, not 'Bob broke it')"

**What a good post-mortem covers**:
1. **Timeline** - What happened and when
2. **Impact** - Who/what was affected, for how long
3. **Root cause** - Why did it happen (5 whys)
4. **Contributing factors** - What made it worse or delayed recovery
5. **What went well** - What worked during response
6. **Action items** - Concrete steps to prevent recurrence

**Cross-reference with**:
- IR-007 (action items tracked) - post-mortem outputs action items
- Section 34 (rollback/recovery) - post-mortems often reveal rollback gaps
- All other sections - post-mortems may surface gaps anywhere

**Pass criteria**:
- Post-mortems written for significant incidents
- Blameless culture (focus on systems, not people)
- Documents what happened, why, and how to prevent
- Template or consistent format used

**Fail criteria**:
- No post-mortems ("we just fix and move on")
- Blame-focused ("this is Bob's fault")
- Post-mortems written but superficial (no root cause analysis)
- Only for major outages (missing learning from smaller incidents)

**Evidence to capture**:
- Location of post-mortems (if any exist)
- Template in use (if any)
- Number of post-mortems written (indicates culture)
- Whether they include root cause analysis

---

### IR-007: Action items tracked to completion
**Severity**: Recommended

Post-mortems are worthless if action items never get done. "We should add monitoring for this" means nothing if it's forgotten by next week.

**Check automatically**:

1. **Look for action item tracking**:
```bash
# Check post-mortems for action item sections
grep -riE "action.*item|follow.*up|TODO|task|ticket" postmortems/ post-mortems/ incidents/ docs/postmortems/ --include="*.md" 2>/dev/null

# Look for links to issue trackers
grep -riE "linear\.app|github\.com/.*issues|jira|asana" postmortems/ post-mortems/ incidents/ --include="*.md" 2>/dev/null
```

**Ask user**:
- "Where do post-mortem action items go? (Issue tracker, doc, nowhere)"
- "Who owns making sure they get done?"
- "What percentage of action items actually get completed?"

**Cross-reference with**:
- IR-006 (post-mortems) - post-mortems generate the action items
- Section 40 (tech debt tracking) - unfinished action items become tech debt

**Pass criteria**:
- Action items from post-mortems go into a tracked system (Linear, Jira, GitHub issues)
- Someone owns following up on completion
- Most action items actually get done (not just filed and forgotten)

**Fail criteria**:
- Action items stay in the post-mortem doc (never transferred to tracker)
- No ownership of follow-through
- Pattern of same issues recurring because action items weren't completed
- "We'll get to it" culture

**Evidence to capture**:
- Where action items are tracked
- Who owns follow-through
- Completion rate (if knowable)
- Whether same issues recur (indicates incomplete follow-through)

---

## Completing the Audit

After checking all items:

1. **Summarize results**:
   - IR-001: PASS/FAIL (Recommended) - On-call rotation defined
   - IR-002: PASS/FAIL (Recommended) - Escalation paths documented
   - IR-003: PASS/FAIL (Critical) - Contact list for emergencies
   - IR-004: PASS/FAIL (Recommended) - PagerDuty/Opsgenie or similar
   - IR-005: PASS/FAIL (Critical) - Common incidents have runbooks
   - IR-006: PASS/FAIL (Recommended) - Blameless post-mortems after incidents
   - IR-007: PASS/FAIL (Recommended) - Action items tracked to completion

2. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority

3. **Common recommendations**:
   - If no on-call rotation: Document who's responsible, even if it's one person
   - If no escalation paths: Define at least two tiers (on-call → senior/management)
   - If no contact list: Create one with phone numbers, store it offline-accessible
   - If no incident tool: Consider PagerDuty/Opsgenie as team grows; Slack alerts OK for small teams
   - If no runbooks: Start with top 3 incident types you've experienced
   - If no post-mortems: Create a simple template and commit to using it after next incident
   - If action items not tracked: Link post-mortem action items to your issue tracker

4. **Maturity assessment**:
   - **Level 1**: No process - incidents handled ad-hoc, no documentation
   - **Level 2**: Basic process - someone responds, but no formal rotation or runbooks
   - **Level 3**: Documented process - on-call rotation, escalation, basic runbooks
   - **Level 4**: Mature process - incident tool, comprehensive runbooks, post-mortems
   - **Level 5**: Continuous improvement - post-mortems drive action, metrics tracked, regular drills

5. **Record audit date** and auditor
