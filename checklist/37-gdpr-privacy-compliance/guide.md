# GDPR & Privacy Compliance Audit Guide

This guide walks you through auditing a project's GDPR and privacy compliance - user rights, consent management, and required documentation.

## Before You Start

1. **Identify target markets** (EU users trigger GDPR, California triggers CCPA, etc.)
2. **Understand data collected** (what personal data, how sensitive)
3. **Check for existing privacy documentation** (privacy policy, ROPA, DPAs)
4. **Review user-facing flows** (signup, consent banners, account settings)

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## Right to Be Forgotten

### GDPR-001: Data deletion request mechanism
**Severity**: Critical

Users have the right to request deletion of their personal data. You need a mechanism to receive and process these requests.

**Check automatically**:

```bash
# Look for deletion-related endpoints or handlers
grep -riE "delete.*account|account.*delet|gdpr|right.*forgotten|erasure|remove.*user" src/ app/ lib/ routes/ controllers/ --include="*.ts" --include="*.js" --include="*.py"

# Look for documentation about deletion
grep -riE "deletion.*request|data.*deletion|right.*forgotten|gdpr.*request" docs/ README.md CLAUDE.md --include="*.md"

# Check for admin tooling for deletion
grep -riE "admin.*delete|delete.*user|purge.*user" src/ app/ --include="*.ts" --include="*.js"
```

**Ask user**:
- "How do users request data deletion?" (self-service? email support@? contact form?)
- "Is there a documented process for handling these requests?"
- "Who handles deletion requests internally?"

**Pass criteria**:
- User-facing mechanism exists (self-service endpoint OR documented email/form process)
- Internal process documented (who handles, how to execute)

**Fail criteria**:
- No mechanism ("we'd figure it out if someone asked")
- Mechanism exists but undocumented (tribal knowledge)

**Evidence to capture**:
- Deletion request mechanism (endpoint, email, form)
- Location of process documentation
- Who owns the process

---

### GDPR-002: Deletion request audit trail
**Severity**: Recommended

You need records of deletion requests for compliance inquiries and to prove you processed them.

**Check automatically**:

```bash
# Look for deletion logging/audit
grep -riE "deletion.*log|audit.*delet|log.*erasure|deletion.*record|gdpr.*log" src/ app/ lib/ --include="*.ts" --include="*.js" --include="*.py"

# Check for audit tables or models
grep -riE "deletion_request|erasure_request|gdpr_request|audit_log" src/ app/ models/ migrations/ --include="*.ts" --include="*.js" --include="*.sql"

# Look for admin views of deletion history
grep -riE "deletion.*history|request.*log|audit.*trail" src/ app/ --include="*.ts" --include="*.js"
```

**Ask user**:
- "Do you track deletion requests? (who requested, when, what was deleted)"
- "Where is this audit trail stored?"
- "How long do you retain deletion audit records?"

**Pass criteria**:
- Deletion requests logged (requester, date, what was deleted, who processed)
- Audit trail accessible for compliance inquiries
- Retention period defined for audit records

**Fail criteria**:
- No record of past deletions
- Deletions happen but aren't tracked
- "We'd have to check server logs"

**Evidence to capture**:
- Audit mechanism (database table, log system, ticket system)
- Fields captured (requester, date, scope, processor)
- Retention period for audit records

---

### GDPR-003: Deletion timelines defined
**Severity**: Critical

GDPR Article 17 requires response "without undue delay" and within one month. You need defined timelines and tracking.

**Check automatically**:

```bash
# Look for timeline/SLA documentation
grep -riE "30.*day|one.*month|deletion.*timeline|response.*time|sla.*delet" docs/ README.md CLAUDE.md --include="*.md"

# Check for automated reminders or deadline tracking
grep -riE "deadline|due.*date|sla|remind.*delet" src/ app/ --include="*.ts" --include="*.js" --include="*.py"
```

**Ask user**:
- "What's your committed timeline for completing deletion requests?"
- "Is this documented anywhere users can see? (privacy policy, terms)"
- "Do you track against this timeline? (alerts if approaching deadline)"

**Legal context**:
GDPR requires response within one month. Can extend by two months for complex requests but must notify user within first month.

**Pass criteria**:
- Timeline defined (typically 30 days, max 90 for complex cases)
- Timeline communicated to users (privacy policy or confirmation email)
- Internal tracking to meet deadlines

**Fail criteria**:
- No defined timeline ("we get to it when we can")
- Timeline exists but not tracked
- Regularly exceeds GDPR limits

**Evidence to capture**:
- Defined timeline (days)
- Where timeline is documented (internal + user-facing)
- Tracking mechanism for deadlines

---

### GDPR-004: Cross-service data deletion
**Severity**: Critical

User data lives in many places beyond your main database. Deletion must cover all of them.

**Check automatically**:

```bash
# Look for deletion propagation logic
grep -riE "cascade.*delet|propagate.*delet|delete.*all|cleanup.*user|purge.*service" src/ app/ lib/ --include="*.ts" --include="*.js" --include="*.py"

# Check for third-party service cleanup
grep -riE "stripe.*delet|intercom.*delet|segment.*delet|analytics.*delet|mailchimp.*delet|hubspot.*delet" src/ app/ --include="*.ts" --include="*.js"

# Look for data mapping documentation
grep -riE "data.*map|where.*stored|user.*data.*location|data.*inventory" docs/ --include="*.md"

# Check for queue/async deletion jobs
grep -riE "deletion.*job|cleanup.*job|purge.*queue|gdpr.*worker" src/ app/ jobs/ workers/ --include="*.ts" --include="*.js"
```

**Ask user**:
- "Where does user data live beyond your main database?" (analytics, CRM, email provider, payment processor, logs, backups, CDN, Redis, Elasticsearch)
- "Is there a data map documenting all locations?"
- "Does your deletion process cover all these services?"

**Common data locations to check**:
| Service Type | Examples | Deletion Method |
|--------------|----------|-----------------|
| Payment processor | Stripe, Braintree | API call to delete customer |
| Email/CRM | Mailchimp, HubSpot, Intercom | API call or manual |
| Analytics | Segment, Mixpanel, Amplitude | API or data deletion request |
| Search | Elasticsearch, Algolia | Remove from index |
| Logs | CloudWatch, Datadog | May need retention policy |
| Backups | Database backups | Complex - often exempted with disclosure |

**Cross-reference with**:
- GDPR-010 (ROPA documents where data lives)
- GDPR-011 (third-party processors need deletion too)

**Pass criteria**:
- Data map exists (inventory of where user data lives)
- Deletion process covers all services (automated or documented manual steps)
- Third-party deletion APIs integrated where available

**Fail criteria**:
- Only delete from main database, forget third parties
- No inventory of where data lives
- "We probably have data in Intercom but don't clean it up"

**Notes**:
Backups are tricky - GDPR allows keeping backups if disclosed and data is deleted when backup is restored. Document this exception.

**Evidence to capture**:
- Data inventory/map location
- Services covered by deletion process
- Any known gaps or exceptions (e.g., backups)

---

## Data Export

### GDPR-005: Data export / portability
**Severity**: Critical

GDPR Article 20 gives users the right to receive their data in a machine-readable format.

**Check automatically**:

```bash
# Look for export endpoints or functionality
grep -riE "export.*data|download.*data|data.*portability|user.*export|gdpr.*export|my.*data" src/ app/ routes/ controllers/ --include="*.ts" --include="*.js" --include="*.py"

# Check for export format handling
grep -riE "to.*json|to.*csv|export.*format|serialize.*user" src/ app/ lib/ --include="*.ts" --include="*.js" --include="*.py"

# Look for export documentation
grep -riE "export.*data|download.*your.*data|data.*portability" docs/ README.md --include="*.md"

# Check for admin export tools
grep -riE "admin.*export|generate.*export|user.*dump" src/ app/ --include="*.ts" --include="*.js"
```

**Ask user**:
- "Can users export their data?" (self-service or request-based?)
- "What format?" (JSON, CSV, other?)
- "Is the export complete?" (all user data, or just some?)
- "How do users access this feature?"

**Data completeness checklist**:
| Data Type | Included? |
|-----------|-----------|
| Profile information | |
| Activity/usage history | |
| User-generated content | |
| Preferences/settings | |
| Transaction history | |
| Communications (messages, emails sent) | |

**Pass criteria**:
- Export mechanism exists (self-service or documented request process)
- Machine-readable format (JSON or CSV, not PDF)
- Covers all user data (not just profile basics)

**Fail criteria**:
- No export capability
- Export exists but incomplete (only profile, missing activity)
- Non-portable format (PDF, screenshots)

**Notes**:
Self-service is ideal but not required. Request-based export (email support, respond within 30 days) is compliant. Machine-readable is key - users should be able to import elsewhere.

**Evidence to capture**:
- Export mechanism (self-service endpoint, request process)
- Format(s) available
- Data coverage (complete or partial - list what's included)

---

## Consent Management

### GDPR-006: Consent enforced before tracking
**Severity**: Critical

No tracking should occur before the user gives consent. This requires proper configuration of tag managers and backend systems.

**Check automatically**:

```bash
# Look for consent mode / GTM consent integration
grep -riE "consent.*mode|gtag.*consent|consent.*update|granted|denied" src/ app/ public/ --include="*.ts" --include="*.js" --include="*.html"

# Check for cookie consent libraries
grep -riE "cookieconsent|cookie.*banner|consent.*banner|onetrust|cookiebot|trustarc|osano" package.json src/ public/ --include="*.json" --include="*.ts" --include="*.js" --include="*.html"

# Look for consent checks before analytics
grep -riE "if.*consent|consent.*check|has.*consent|analytics.*consent" src/ app/ --include="*.ts" --include="*.js"

# Check GTM container for consent settings (if exported)
find . -name "GTM-*.json" -o -name "*tag*manager*.json" 2>/dev/null | head -5

# Backend consent flag handling
grep -riE "consent.*header|consent.*cookie|check.*consent|x-consent" src/ app/ middleware/ --include="*.ts" --include="*.js" --include="*.py"
```

**Ask user**:
- "What consent tool do you use?" (OneTrust, Cookiebot, custom, none?)
- "Is GTM configured with consent mode?" (default denied until consent?)
- "Does your backend check consent before server-side tracking?"
- "Have you verified no tracking fires before consent is given?"

**Consent enforcement checklist**:
| Component | Consent-Aware? |
|-----------|----------------|
| Google Analytics | |
| Facebook Pixel | |
| Other marketing tags | |
| Server-side analytics | |
| Session recording (Hotjar, FullStory) | |
| A/B testing tools | |

**Cross-reference with**:
- Section 22 (Frontend Performance) - consent banners affect page load
- Section 32 (CSP) - consent scripts need CSP allowlisting

**Pass criteria**:
- Consent banner/mechanism implemented
- GTM consent mode configured (or equivalent for other tag managers)
- Backend respects consent flags for server-side tracking
- Verified: no tracking scripts fire before consent granted

**Fail criteria**:
- No consent mechanism (tracking fires immediately)
- Consent banner exists but GTM ignores it
- Frontend consent-aware but backend tracks regardless
- "We have a banner but haven't verified it actually blocks anything"

**Evidence to capture**:
- Consent tool in use
- GTM consent mode status (configured or not)
- Backend consent handling (yes/no/N/A)
- Verification method (how do you know it works?)

---

### GDPR-007: Consent stored and auditable
**Severity**: Critical

You need proof of what users consented to and when, in case of regulatory inquiry.

**Check automatically**:

```bash
# Look for consent storage
grep -riE "consent.*store|store.*consent|save.*consent|consent.*record|consent.*log" src/ app/ lib/ --include="*.ts" --include="*.js" --include="*.py"

# Check for consent database models/tables
grep -riE "consent|user_consent|consent_log|consent_record" src/ models/ migrations/ prisma/ --include="*.ts" --include="*.js" --include="*.sql" --include="*.prisma"

# Look for consent audit/history
grep -riE "consent.*history|consent.*audit|consent.*change" src/ app/ --include="*.ts" --include="*.js"

# Check if consent tool handles storage (OneTrust, Cookiebot store receipts)
grep -riE "onetrust|cookiebot|consent.*receipt|proof.*consent" docs/ src/ --include="*.md" --include="*.ts" --include="*.js"
```

**Ask user**:
- "Where is consent stored?" (your database, consent tool's cloud, cookies only?)
- "Do you store consent receipts/proof?" (timestamp, IP, version of policy agreed to)
- "Can you prove what a user consented to on a specific date?"
- "How long do you retain consent records?"

**What to store for audit**:
| Field | Purpose |
|-------|---------|
| User ID / identifier | Who consented |
| Timestamp | When they consented |
| Consent categories | What they agreed to (analytics, marketing, etc.) |
| Policy version | Which version of privacy policy |
| Collection method | Banner, signup form, etc. |
| IP address (optional) | Additional proof |

**Pass criteria**:
- Consent decisions stored persistently (not just cookies)
- Audit trail includes: who, when, what categories, policy version
- Can retrieve consent proof for any user
- Retention period defined

**Fail criteria**:
- Consent only in browser cookies (lost on clear)
- No server-side record of consent
- Can't prove what user consented to
- "Our consent tool handles it" but never verified

**Evidence to capture**:
- Storage location (database table, consent tool, etc.)
- Fields captured
- Retention period
- How to retrieve consent proof for a specific user

---

### GDPR-008: Consent withdrawal mechanism
**Severity**: Critical

GDPR requires that withdrawing consent is as easy as giving it. Users need a persistent way to change their preferences.

**Check automatically**:

```bash
# Look for consent withdrawal/revoke functionality
grep -riE "withdraw.*consent|revoke.*consent|remove.*consent|opt.*out|unsubscribe" src/ app/ --include="*.ts" --include="*.js" --include="*.py"

# Check for preference center or settings
grep -riE "preference.*center|privacy.*setting|cookie.*setting|manage.*consent|consent.*preference" src/ app/ --include="*.ts" --include="*.js" --include="*.html"

# Look for consent update endpoints
grep -riE "update.*consent|consent.*update|change.*consent" src/ app/ routes/ controllers/ --include="*.ts" --include="*.js"

# Check for re-accessible consent banner
grep -riE "reopen.*banner|show.*consent|manage.*cookie|cookie.*icon|privacy.*icon" src/ app/ --include="*.ts" --include="*.js"
```

**Ask user**:
- "How do users withdraw consent?" (settings page, re-open banner, email request?)
- "Is it as easy as giving consent?" (GDPR requirement)
- "Does withdrawal actually stop tracking?" (verified?)
- "Is there a persistent way to access consent settings?" (footer link, settings page)

**Withdrawal accessibility**:
| Method | GDPR Compliant? |
|--------|-----------------|
| Settings page with toggle | Yes |
| Footer link to re-open banner | Yes |
| "Email us to opt out" | No - too difficult |
| Clear cookies manually | No - not a real mechanism |
| Floating privacy icon | Yes |

**Pass criteria**:
- Users can withdraw consent without contacting support
- Withdrawal is as easy as initial consent (one-click or similar)
- Persistent access to consent settings (not just on first visit)
- Withdrawal actually stops tracking (verified)

**Fail criteria**:
- No withdrawal mechanism
- Must email support to withdraw
- Can only withdraw by clearing cookies
- Consent banner only shows once, no way to change later
- Withdrawal UI exists but doesn't actually stop tracking

**Evidence to capture**:
- Withdrawal mechanism (settings page, banner re-open, etc.)
- How users access it (footer link, account settings, floating icon)
- Verification that withdrawal stops tracking

---

## Privacy Documentation

### GDPR-009: Privacy policy current and complete
**Severity**: Critical

Your privacy policy is a legal document that must accurately reflect your data practices and include GDPR-required disclosures.

**Check automatically**:

```bash
# Look for privacy policy
find . -maxdepth 3 -name "*privacy*" -name "*.md" -o -name "*privacy*" -name "*.html" 2>/dev/null | grep -v node_modules

# Check for privacy policy route/page
grep -riE "privacy.*policy|/privacy|privacy-policy" src/ app/ routes/ pages/ --include="*.ts" --include="*.js" --include="*.tsx"

# Look for last updated date in policy
grep -riE "last.*updated|effective.*date|updated.*on" public/ docs/ --include="*.html" --include="*.md" 2>/dev/null

# Check for required GDPR disclosures in docs
grep -riE "data.*controller|legal.*basis|data.*retention|your.*rights|contact.*dpo" public/ docs/ --include="*.html" --include="*.md" 2>/dev/null
```

**Ask user**:
- "When was your privacy policy last updated?"
- "Does it cover all current data practices?" (new features, new third parties)
- "Who reviews/updates it?" (legal, internal, template?)
- "Does it include GDPR-required disclosures?"

**GDPR-required disclosures**:
| Disclosure | Present? |
|------------|----------|
| Identity of data controller | |
| Contact details (DPO if applicable) | |
| Purposes of processing | |
| Legal basis for processing | |
| Data retention periods | |
| User rights (access, deletion, portability, etc.) | |
| Right to lodge complaint with supervisory authority | |
| Third parties data is shared with | |
| International transfers (if applicable) | |

**Pass criteria**:
- Privacy policy exists and is accessible
- Updated within last 12 months (or after last significant change)
- Covers GDPR-required disclosures
- Reflects current data practices (not outdated)

**Fail criteria**:
- No privacy policy
- Policy exists but severely outdated
- Missing key GDPR disclosures
- Doesn't reflect actual practices (says "we don't share data" but uses 10 third-party tools)

**Evidence to capture**:
- Privacy policy location (URL)
- Last updated date
- Whether GDPR disclosures are present
- Any obvious gaps

---

### GDPR-010: Data processing records maintained
**Severity**: Critical

GDPR Article 30 requires maintaining a Record of Processing Activities (ROPA) - an internal document of all data processing.

**Check automatically**:

```bash
# Look for data processing documentation
find . -maxdepth 4 -type f \( -name "*processing*" -o -name "*data*map*" -o -name "*data*inventory*" -o -name "*ropa*" \) 2>/dev/null | grep -v node_modules

# Check for GDPR compliance docs
grep -riE "processing.*activit|data.*register|article.*30|ropa|record.*processing" docs/ --include="*.md" 2>/dev/null

# Look for data flow documentation
grep -riE "data.*flow|data.*map|where.*data.*stored|data.*lifecycle" docs/ --include="*.md" 2>/dev/null
```

**Ask user**:
- "Do you maintain a Record of Processing Activities (ROPA)?"
- "Where is it documented?" (spreadsheet, Notion, compliance tool?)
- "When was it last reviewed/updated?"
- "Who owns keeping it current?"

**ROPA should include** (per Article 30):
| Field | Description |
|-------|-------------|
| Processing activity name | e.g., "User registration", "Marketing emails" |
| Purpose | Why you process this data |
| Categories of data subjects | Users, employees, prospects |
| Categories of personal data | Email, name, IP, payment info, etc. |
| Recipients | Who receives this data (internal teams, third parties) |
| Transfers to third countries | If data leaves EU |
| Retention periods | How long data is kept |
| Security measures | How data is protected |

**Cross-reference with**:
- GDPR-004 (data map needed for complete deletion)
- GDPR-011 (third-party processors are part of ROPA)

**Pass criteria**:
- ROPA exists and is documented
- Covers all significant processing activities
- Updated when new features/data uses added
- Owner assigned for maintenance

**Fail criteria**:
- No ROPA ("what's that?")
- Started one but never completed
- Exists but severely outdated
- Only in someone's head

**Notes**:
ROPA is mandatory for organizations with 250+ employees, or any org processing sensitive data or high-risk processing. Even if not legally required, it's best practice and essential for responding to GDPR requests.

**Evidence to capture**:
- ROPA location (document, tool)
- Last updated date
- Owner responsible for updates
- Completeness (all processing activities covered?)

---

### GDPR-011: Third-party processors documented
**Severity**: Critical

You need to know every third party that processes your users' data, have DPAs with them, and disclose them to users.

**Check automatically**:

```bash
# Look for vendor/processor documentation
grep -riE "third.*party|vendor|processor|sub.*processor|data.*sharing" docs/ --include="*.md" 2>/dev/null

# Check for DPA (Data Processing Agreement) references
grep -riE "dpa|data.*processing.*agreement|processor.*agreement" docs/ contracts/ --include="*.md" --include="*.pdf" 2>/dev/null

# Identify third parties from code (common services)
grep -riE "stripe|sendgrid|mailchimp|intercom|segment|mixpanel|amplitude|hubspot|zendesk|twilio|cloudflare|aws|gcp|azure|datadog|sentry" package.json src/ --include="*.json" --include="*.ts" --include="*.js" 2>/dev/null | head -20

# Check privacy policy for third-party disclosures
grep -riE "third.*part|share.*with|service.*provider|processor" public/ docs/ --include="*.html" --include="*.md" 2>/dev/null
```

**Ask user**:
- "Do you have a list of all third parties that process user data?"
- "Do you have DPAs (Data Processing Agreements) with each?"
- "Are these disclosed in your privacy policy?"
- "How do you vet new vendors for GDPR compliance?"

**Common processors to document**:
| Category | Examples | DPA Required? |
|----------|----------|---------------|
| Payment | Stripe, Braintree | Yes |
| Email | SendGrid, Mailchimp, Postmark | Yes |
| Analytics | Segment, Mixpanel, Amplitude | Yes |
| Support | Intercom, Zendesk | Yes |
| Error tracking | Sentry, Bugsnag | Yes |
| Infrastructure | AWS, GCP, Azure | Yes (usually covered) |
| CRM | HubSpot, Salesforce | Yes |

**Cross-reference with**:
- GDPR-004 (need to delete from third parties too)
- GDPR-009 (privacy policy should list processors)
- GDPR-010 (processors are part of ROPA)

**Pass criteria**:
- Complete list of third-party processors maintained
- DPAs in place with each processor
- Processors disclosed in privacy policy
- Process for vetting new vendors

**Fail criteria**:
- No list ("we use a bunch of tools but haven't documented them")
- Missing DPAs ("we just signed up, never asked about GDPR")
- Processors not disclosed to users
- New tools added without GDPR consideration

**Evidence to capture**:
- Location of processor list
- Number of processors with DPAs vs. without
- Whether disclosed in privacy policy
- Vendor vetting process (exists/doesn't exist)

---

## Completing the Audit

After checking all items:

1. **Summarize results**:
   - GDPR-001: PASS/FAIL (Critical) - Data deletion request mechanism
   - GDPR-002: PASS/FAIL (Recommended) - Deletion request audit trail
   - GDPR-003: PASS/FAIL (Critical) - Deletion timelines defined
   - GDPR-004: PASS/FAIL (Critical) - Cross-service data deletion
   - GDPR-005: PASS/FAIL (Critical) - Data export / portability
   - GDPR-006: PASS/FAIL (Critical) - Consent enforced before tracking
   - GDPR-007: PASS/FAIL (Critical) - Consent stored and auditable
   - GDPR-008: PASS/FAIL (Critical) - Consent withdrawal mechanism
   - GDPR-009: PASS/FAIL (Critical) - Privacy policy current and complete
   - GDPR-010: PASS/FAIL (Critical) - Data processing records maintained
   - GDPR-011: PASS/FAIL (Critical) - Third-party processors documented

2. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority (Critical items first)

3. **Common recommendations**:
   - If no deletion mechanism: Add account deletion in settings or document email process
   - If no audit trail: Create deletion_requests table (user_id, requested_at, completed_at, processed_by)
   - If no data map: Start with infrastructure audit - list every service that touches user data
   - If no export: Build JSON export of user profile + activity, expose via settings or support request
   - If consent not enforced: Configure GTM consent mode, default all tags to "denied"
   - If consent not stored: Store consent server-side with timestamp and policy version
   - If no withdrawal: Add footer link to re-open consent banner or settings page
   - If privacy policy outdated: Review and update, ensure all GDPR disclosures present
   - If no ROPA: Create spreadsheet with Article 30 fields, assign owner
   - If missing DPAs: Audit all vendors, request DPAs (most major vendors have them ready)

4. **Compliance maturity assessment**:
   - **Level 1**: Non-compliant - missing basic mechanisms (deletion, export, consent)
   - **Level 2**: Reactive - mechanisms exist but undocumented, handled ad-hoc
   - **Level 3**: Documented - processes documented, ROPA exists, DPAs in place
   - **Level 4**: Proactive - regular audits, automated consent enforcement, complete data map
   - **Level 5**: Privacy by design - privacy considered in all new features, automated compliance

5. **Record audit date** and auditor
