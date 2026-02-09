# Email Infrastructure Audit Guide

This guide walks you through auditing a project's email infrastructure, covering DNS authentication (MX, SPF, DKIM, DMARC), deliverability testing, and email logging for both transactional and marketing emails.

## The Goal: Trusted, Visible Email

Email infrastructure should be authenticated, monitored, and auditable. Every email your domain sends should be trusted by receivers and visible to your team.

- **Authenticated** — SPF, DKIM, and DMARC configured with enforcement enabled
- **Routable** — MX records correctly configured with reachable mail servers
- **Visible** — transactional and marketing emails flow through providers with full delivery and engagement metrics
- **Tested** — periodic deliverability testing prevents inbox placement degradation
- **Retained** — email log retention policies intentionally defined and documented

## Before You Start

1. **Get domain inventory from user**:
   - Root domain(s)
   - Subdomains that send email (e.g., mail.example.com, transactional.example.com)

2. **Get DNS read access**:
   - Cloudflare API token (read-only) OR
   - AWS Route53 access OR
   - Other DNS provider API access
   - This enables automated discovery of all email-related DNS records

3. **Identify email providers**:
   - Transactional email provider (SendGrid, Mailgun, Postmark, SES, etc.)
   - Marketing email provider (Mailchimp, Klaviyo, HubSpot, etc.)

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## DNS Authentication

### EMAIL-001: MX records configured
**Severity**: Critical

MX records determine where email for your domain is delivered. Without proper MX records, you cannot receive email and sending reputation suffers.

**Check automatically**:

1. **Query MX records for each domain in inventory**:
```bash
# Root domain
dig MX example.com +short

# Subdomains (if they receive email)
dig MX mail.example.com +short
```

2. **Verify MX hosts resolve**:
```bash
# For each MX host returned
dig A mx1.example-provider.com +short
```

3. **Verify MX hosts are reachable on SMTP port**:
```bash
# Test SMTP port connectivity (timeout 5 seconds)
nc -zv mx1.example-provider.com 25 -w 5
```

4. **With Cloudflare API** (preferred):
```bash
# List all MX records in zone
curl -X GET "https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records?type=MX" \
  -H "Authorization: Bearer $CF_API_TOKEN" | jq '.result[] | {name, content, priority}'
```

**Ask user**:
- "What domains should have email infrastructure?" (build inventory)
- "What mail provider do you use?" (Google Workspace, Microsoft 365, etc.)

**Pass criteria**:
- At least one MX record exists for each domain that receives email
- MX hosts resolve to IP addresses
- MX hosts are reachable on port 25
- Priority ordering makes sense (lower number = higher priority)

**Fail criteria**:
- No MX records for a domain that should receive email
- MX hosts don't resolve (NXDOMAIN)
- MX hosts unreachable on port 25

**Evidence to capture**:
- Domain inventory (root + subdomains)
- MX records per domain
- Mail provider identified
- Reachability status for each MX host

---

### EMAIL-002: SPF configured
**Severity**: Critical

SPF (Sender Policy Framework) declares which servers are authorized to send email for your domain. Without SPF, anyone can spoof emails from your domain.

**Check automatically**:

1. **Query SPF for each domain/subdomain that sends email**:
```bash
# SPF is a TXT record
dig TXT example.com +short | grep -i "v=spf1"
dig TXT mail.example.com +short | grep -i "v=spf1"
dig TXT transactional.example.com +short | grep -i "v=spf1"
```

2. **With Cloudflare API**:
```bash
# List TXT records and filter for SPF
curl -X GET "https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records?type=TXT" \
  -H "Authorization: Bearer $CF_API_TOKEN" | jq '.result[] | select(.content | contains("v=spf1"))'
```

3. **Analyze SPF record**:
- Check for authorized senders (e.g., `include:_spf.google.com`, `include:sendgrid.net`)
- Check enforcement level at the end (`-all`, `~all`, `+all`)

**Ask user**:
- "Which subdomains send email?" (add to inventory)
- If `~all` (soft fail) found: "Is this intentional? How long has soft fail been in place?"

**Pass criteria**:
- SPF record exists for each domain/subdomain that sends email
- Includes authorized senders matching actual email providers
- Ends with `-all` (hard fail) or `~all` (soft fail)

**Partial (acceptable)**:
- `~all` (soft fail) is OK short-term during rollout - note duration and plan to move to `-all`

**Fail criteria**:
- No SPF record on a sending domain
- SPF ends with `+all` (allows anyone to spoof - security hole)
- Syntax errors in SPF record

**Evidence to capture**:
- SPF records per domain/subdomain
- Authorized senders identified
- Enforcement level (`-all` vs `~all`)
- Duration if soft fail (and plan to harden)

---

### EMAIL-003: DKIM configured
**Severity**: Critical

DKIM (DomainKeys Identified Mail) cryptographically signs outgoing emails, proving they haven't been tampered with and came from an authorized sender.

**Check automatically**:

1. **With DNS API access** (preferred - discovers all selectors):
```bash
# Cloudflare - find all _domainkey TXT records
curl -X GET "https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records?type=TXT" \
  -H "Authorization: Bearer $CF_API_TOKEN" | jq '.result[] | select(.name | contains("_domainkey"))'

# Or list all TXT and filter
curl ... | jq '.result[] | select(.name | contains("domainkey")) | {name, content}'
```

2. **Without API access** (check common selectors):
```bash
# Common DKIM selectors by provider
dig TXT google._domainkey.example.com +short         # Google Workspace
dig TXT selector1._domainkey.example.com +short      # Microsoft 365
dig TXT selector2._domainkey.example.com +short      # Microsoft 365
dig TXT s1._domainkey.example.com +short             # Generic
dig TXT s2._domainkey.example.com +short             # Generic
dig TXT k1._domainkey.example.com +short             # Mailchimp
dig TXT smtpapi._domainkey.example.com +short        # SendGrid
dig TXT mailo._domainkey.example.com +short          # Mailgun
dig TXT pm._domainkey.example.com +short             # Postmark
```

3. **Validate DKIM record format**:
- Should contain `v=DKIM1`
- Should contain `p=<public_key>` (not empty)

**Ask user**:
- "Can you provide DNS read access to list all TXT records?"
- "What DKIM selectors does your email provider use?"

**Pass criteria**:
- At least one DKIM record exists for each sending domain/subdomain
- Records contain valid public keys (`p=...` not empty)
- Selectors match configured email providers

**Fail criteria**:
- No DKIM records found for a sending domain
- DKIM key is empty/revoked (`p=` with no key)

**Evidence to capture**:
- All DKIM selectors found (via API discovery)
- Providers identified from selector names
- Subdomains covered
- Key validity (present and non-empty)

---

### EMAIL-004: DMARC configured
**Severity**: Critical

DMARC (Domain-based Message Authentication, Reporting & Conformance) tells receiving servers what to do when SPF/DKIM fail, and provides reporting on authentication failures.

**Check automatically**:

1. **Query DMARC for root domain and subdomains**:
```bash
# DMARC is always at _dmarc subdomain
dig TXT _dmarc.example.com +short
dig TXT _dmarc.mail.example.com +short
dig TXT _dmarc.transactional.example.com +short
```

2. **With Cloudflare API**:
```bash
curl -X GET "https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records?type=TXT" \
  -H "Authorization: Bearer $CF_API_TOKEN" | jq '.result[] | select(.name | contains("_dmarc"))'
```

3. **Analyze DMARC record**:
- `v=DMARC1` - version tag
- `p=none|quarantine|reject` - policy for root domain
- `sp=none|quarantine|reject` - subdomain policy (if different)
- `rua=mailto:...` - aggregate reporting address
- `ruf=mailto:...` - forensic reporting address (optional)

**Ask user**:
- If `p=none`: "Is this intentional monitoring mode? How long has it been in monitoring?"
- "Do you actively review DMARC reports?"

**Cross-reference with**:
- EMAIL-002 (SPF must pass for DMARC to work)
- EMAIL-003 (DKIM must pass for DMARC to work)

**Pass criteria**:
- DMARC record exists for root domain
- Subdomains have DMARC or inherit from root (check `sp=` policy)
- Policy is `p=quarantine` or `p=reject`
- Reporting address configured (`rua=mailto:...`)
- Reports are actually reviewed

**Partial (acceptable)**:
- `p=none` during initial rollout to monitor before enforcement - note duration and plan

**Fail criteria**:
- No DMARC record
- No reporting address configured (can't monitor failures)
- `p=none` for extended period with no plan to enforce

**Evidence to capture**:
- DMARC records per domain/subdomain
- Policy levels (none/quarantine/reject)
- Subdomain policy (`sp=`) if different from root
- Reporting addresses
- Whether reports are reviewed (and by whom)
- Duration and plan if in monitoring mode

---

## Email Monitoring

### EMAIL-005: Email deliverability testing
**Severity**: Recommended

Email deliverability testing ensures your emails reach the inbox, not spam. This includes spam scoring tools and periodic placement tests with fresh accounts.

**Check automatically**:

1. **Check for automated email testing in CI/CD**:
```bash
grep -riE "mail-tester|spamassassin|glockapps|litmus|email.*score|deliverability" .github/workflows/*.yml scripts/ 2>/dev/null
```

2. **Check for deliverability monitoring in codebase**:
```bash
grep -riE "spam.*score|deliverability|placement.*test" --include="*.md" --include="*.yml" . 2>/dev/null | grep -v node_modules
```

**Ask user**:
- "What tool do you use to test spam score?" (mail-tester.com, GlockApps, Litmus, etc.)
- "Do you periodically test placement with fresh accounts?"
- "What providers do you test against?" (Gmail, Outlook, Yahoo, etc.)
- "How often do you run these tests?" (monthly, quarterly, after major changes)
- "Where do your emails typically land?" (Inbox, Promotions, Spam)

**Pass criteria**:
- Spam scoring tool identified and used periodically
- Placement tests with fresh accounts performed (at minimum: Gmail, Outlook)
- Testing cadence defined (monthly or quarterly minimum)

**Recommended (bonus)**:
- Automated spam scoring in CI/CD or scheduled job

**Fail criteria**:
- No spam scoring tool
- Never tested placement with fresh accounts
- Only tested once at initial setup, never since

**Evidence to capture**:
- Spam scoring tool used
- Placement testing cadence
- Providers tested (Gmail, Outlook, Yahoo, etc.)
- Typical results (inbox vs promotions vs spam)
- Manual vs automated
- Recent score/results if available

---

### EMAIL-006: Transactional email control and logging
**Severity**: Critical

Transactional emails (password resets, order confirmations, etc.) must be fully controlled and logged. You need visibility into every email sent, bounces, and engagement.

**Check automatically**:

1. **Check for transactional email providers**:
```bash
grep -riE "sendgrid|mailgun|postmark|ses|amazon.*ses|sparkpost|mandrill|resend" package.json .env.example 2>/dev/null
```

2. **Check for email sending code**:
```bash
grep -riE "sendEmail|sendMail|transporter\.send|sgMail|mailgun\.messages|postmark.*send|ses.*send" --include="*.ts" --include="*.js" src/ lib/ app/ 2>/dev/null | head -10
```

3. **Check for email configuration**:
```bash
grep -riE "SMTP_|MAIL_|EMAIL_|SENDGRID_|MAILGUN_|POSTMARK_" .env.example 2>/dev/null
```

**Ask user**:
- "What transactional email provider do you use?"
- "Can you see all emails sent from your domain in the provider dashboard?"
- "Do you have access to bounce logs?"
- "Do you have open/click tracking enabled?"
- If tracking disabled for some emails: "Which email types have tracking disabled and why?"

**Cross-reference with**:
- EMAIL-001 through EMAIL-004 (DNS authentication must be configured for the sending domain)

**Pass criteria**:
- Dedicated transactional email provider identified (SendGrid, Mailgun, Postmark, SES, etc.)
- Dashboard access to view all sent emails
- Bounce tracking enabled and monitored
- Open/click tracking enabled (or documented exceptions for privacy-sensitive emails like password resets, 2FA codes)

**Fail criteria**:
- No dedicated transactional provider (using raw SMTP with no logging)
- Can't see what emails were sent
- No bounce visibility
- Tracking disabled without documented rationale

**Evidence to capture**:
- Provider used
- Dashboard URL (for audit access)
- Metrics available (bounces, opens, clicks)
- Documented exceptions for tracking-disabled email types

---

### EMAIL-007: Marketing email logging
**Severity**: Recommended

Marketing emails need separate tracking from transactional. You need to see who received what, when, and engagement metrics.

**Check automatically**:

1. **Check for marketing email providers**:
```bash
grep -riE "mailchimp|klaviyo|hubspot|convertkit|activecampaign|brevo|sendinblue|customer\.io|iterable" package.json .env.example 2>/dev/null
```

2. **Check for marketing email integration code**:
```bash
grep -riE "mailchimp|klaviyo|hubspot|campaign" --include="*.ts" --include="*.js" src/ lib/ 2>/dev/null | head -10
```

**Ask user**:
- "What marketing email platform do you use?"
- "Can you see send logs (who, when) for each campaign?"
- "Can you see open rates and click rates per campaign?"
- "Can you see individual recipient activity?"
- If no marketing emails: "Does your product send any marketing/promotional emails?"

**Pass criteria**:
- Marketing email platform identified (or documented that no marketing emails are sent)
- Send logs available (recipient, timestamp, campaign)
- Open/click rates tracked per campaign
- Individual recipient activity visible

**Fail criteria**:
- Marketing emails sent but no dedicated platform
- Can't see who received emails
- No engagement metrics

**Partial (acceptable)**:
- Not applicable if no marketing emails sent - document this explicitly

**Evidence to capture**:
- Platform used (or "N/A - no marketing emails")
- Metrics available (send logs, opens, clicks)
- Whether individual recipient tracking exists

---

### EMAIL-008: Email log retention
**Severity**: Recommended

Email logs should be retained long enough to investigate issues but not indefinitely. 2 weeks to 1 month is typically sufficient.

**Ask user**:
- "What's your email log retention period for transactional emails?"
- "What's your email log retention period for marketing emails?"
- "Is this intentionally configured or just the provider default?"
- If outside 2-4 weeks: "What's the rationale for this retention period?"

**Pass criteria**:
- Retention period defined for both transactional and marketing
- Retention is an intentional decision (not "whatever the default is")

**Note (not fail)**:
- Retention outside 2-4 weeks range - just document the rationale
- Longer retention may be required for compliance
- Shorter retention may be intentional for privacy

**Fail criteria**:
- No defined retention policy ("I don't know" or "whatever the default is")
- Keeping logs indefinitely with no rationale (storage waste, privacy risk)

**Evidence to capture**:
- Retention period for transactional logs
- Retention period for marketing logs
- Whether configured intentionally or default
- Rationale if outside typical 2-4 week range

---

## Completing the Audit

After checking all items:

1. **Summarize results**:
   - EMAIL-001: PASS/FAIL (Critical)
   - EMAIL-002: PASS/FAIL (Critical)
   - EMAIL-003: PASS/FAIL (Critical)
   - EMAIL-004: PASS/FAIL (Critical)
   - EMAIL-005: PASS/FAIL (Recommended)
   - EMAIL-006: PASS/FAIL (Critical)
   - EMAIL-007: PASS/FAIL (Recommended)
   - EMAIL-008: PASS/FAIL (Recommended)

2. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority

3. **Common recommendations**:
   - If no SPF: Add `v=spf1 include:<provider> -all` TXT record immediately
   - If no DKIM: Configure DKIM in email provider and add DNS records
   - If no DMARC: Start with `v=DMARC1; p=none; rua=mailto:dmarc@example.com` then progress to `p=reject`
   - If `~all` for extended period: Move to `-all` (hard fail)
   - If `p=none` for extended period: Progress to `p=quarantine` then `p=reject`
   - If no deliverability testing: Set up monthly mail-tester.com checks
   - If no transactional logging: Migrate to dedicated provider (SendGrid, Postmark, etc.)

4. **Maturity assessment**:
   - **Level 1**: No email authentication (SPF/DKIM/DMARC missing or misconfigured)
   - **Level 2**: DNS authentication complete (SPF, DKIM, DMARC with enforcement)
   - **Level 3**: Full logging and monitoring (transactional + marketing with metrics)
   - **Level 4**: Proactive testing (automated deliverability checks, defined retention policies)

5. **Record audit date** and auditor
