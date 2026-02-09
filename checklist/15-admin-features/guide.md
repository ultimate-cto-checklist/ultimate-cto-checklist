# Admin Features Audit Guide

This guide walks you through auditing a project's admin features, ensuring admin parity with user-facing features and proper security controls on admin access.

## The Goal: Empowered and Accountable

Admins need power to help users, but that power must be traceable. The goal is full operational capability without direct database access, with every action logged and access revocable in minutes.

- **Parity** — Every major user-facing feature has admin equivalents for viewing, managing, and debugging
- **Enumerable** — All admin users listable with access levels; periodic reviews ensure minimal footprint
- **Tracked** — Admin logins logged with timestamps and IPs; unusual patterns detectable
- **Auditable** — Admin actions (especially destructive ones) recorded with enough detail to reconstruct incidents
- **Revocable** — Compromised accounts disabled immediately via UI, active sessions invalidated

## Before You Start

1. Identify the admin panel/interface location (in-app, separate app, etc.)
2. Understand what user-facing features exist in the project
3. Have access to review admin user management (or ask user for evidence)

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## Admin Parity

### ADM-001: Admin feature parity
**Severity**: Recommended

**Check automatically**:

1. **Find admin routes/controllers**:
```bash
# Look for admin routes
find . -type f \( -name "*.ts" -o -name "*.js" \) -path "*/admin/*" | head -20

# Find admin route definitions
grep -riE "router\.(get|post|put|delete).*admin|/admin/" --include="*.ts" --include="*.js" | head -20

# Look for admin controllers/pages
find . -type f \( -name "*admin*" -o -name "*Admin*" \) \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) | head -20
```

2. **Compare to user-facing features**:
```bash
# Find main feature areas (non-admin)
find . -type d -name "components" -o -name "pages" -o -name "routes" 2>/dev/null | head -10

# List user-facing routes for comparison
grep -riE "router\.(get|post)|app\.(get|post)" --include="*.ts" --include="*.js" | grep -v admin | head -20
```

**Cross-reference with**:
- DOC-002 (complex systems documented - admin features mentioned)

**Ask user**:
- What are the major user-facing features in this project?
- Which ones have admin equivalents for viewing/managing/debugging?
- For features without admin equivalents - intentional or gap?

**Pass criteria**:
- Each major user-facing feature has admin capability to view/manage/debug
- Admins can troubleshoot user issues without direct database queries
- At minimum: view user data, view activity, manage state

**Fail criteria**:
- Major features (payments, orders, subscriptions, user accounts) have no admin visibility
- Admins must query database directly to debug user issues
- Admin panel exists but only covers a fraction of features

**Evidence to capture**:
- List of user-facing features
- Corresponding admin capabilities (or gaps)
- Coverage assessment (e.g., "5/7 major features have admin support")

---

## Admin Panel Security

### ADM-002: Admin access auditing
**Severity**: Recommended

**Check automatically**:

1. **Find admin user management**:
```bash
# Look for admin user model/table
grep -riE "admin.*(user|role|permission)|role.*admin" --include="*.ts" --include="*.js" --include="*.prisma" --include="*.sql" | head -10

# Find admin list/index endpoints
grep -riE "(list|index|all).*(admin|user)|getAdmins|fetchAdmins" --include="*.ts" --include="*.js" | head -10
```

2. **Check for activity tracking fields**:
```bash
# Look for last_login, last_activity fields
grep -riE "last_login|lastLogin|last_activity|lastActivity|last_seen" --include="*.ts" --include="*.js" --include="*.prisma" | head -10
```

3. **Look for role/permission system**:
```bash
# Find role definitions
grep -riE "enum.*role|type.*role|roles?\s*=" --include="*.ts" --include="*.js" --include="*.prisma" | head -10
```

**Cross-reference with**:
- ACCESS-001 (tiered access model)
- ACCESS-002 (minimal production access)

**Ask user**:
- Can you list all admin users and when they last logged in?
- Is there a process/schedule for reviewing admin access? (monthly, quarterly?)
- When was the last admin access audit?
- How do you suspend/remove admin users who shouldn't have access?

**Pass criteria**:
- Can enumerate all admin users with access levels
- Process exists (even informal) to periodically review who has admin access
- Easy to suspend/disable users identified as no longer needing access (via UI, not DB)

**Fail criteria**:
- No way to list all admin users
- No process for periodic access review
- Difficult or dangerous to remove admin access (requires direct DB changes)

**Evidence to capture**:
- How to list admin users
- Last audit date (if known)
- Process for removing access
- Any users identified as needing review

---

### ADM-003: Track login IPs and login frequency
**Severity**: Recommended

**Check automatically**:

1. **Find login tracking**:
```bash
# Look for login event logging
grep -riE "(login|sign.?in).*(log|track|event|record)" --include="*.ts" --include="*.js" | head -10

# Look for session/login history
grep -riE "login.?history|session.?history|auth.?log" --include="*.ts" --include="*.js" | head -10
```

2. **Check for IP capture**:
```bash
# Find IP address capture
grep -riE "ip.?address|req\.ip|x-forwarded-for|clientIp|remoteAddress" --include="*.ts" --include="*.js" | head -10

# Look for IP storage in user/session models
grep -riE "ip.*string|last_ip|login_ip" --include="*.prisma" --include="*.ts" --include="*.js" | head -10
```

3. **Check for login frequency tracking**:
```bash
# Look for login count or frequency fields
grep -riE "login_count|loginCount|sign_in_count|failed_attempts" --include="*.ts" --include="*.js" --include="*.prisma" | head -10
```

**Ask user**:
- Do you track when admins log in and from where?
- Can you see login history for admin users?
- Would unusual login patterns (new IP, odd hours, multiple failures) be noticed?

**Pass criteria**:
- Admin logins are logged with timestamp and IP
- Login history is viewable (at least for security review)
- Failed login attempts are tracked

**Fail criteria**:
- No login tracking for admin users
- Can't tell when or where an admin logged in from
- No visibility into failed login attempts

**Evidence to capture**:
- Login tracking implementation (if any)
- What's captured (timestamp, IP, user agent, success/failure?)
- Where logs are stored (database, log service, etc.)

---

### ADM-004: Audit trail for admin requests
**Severity**: Recommended

**Check automatically**:

1. **Find audit logging**:
```bash
# Look for audit log implementation
grep -riE "audit.?log|action.?log|activity.?log" --include="*.ts" --include="*.js" | head -10

# Find audit trail table/model
grep -riE "model.*audit|table.*audit|AuditLog|ActivityLog" --include="*.prisma" --include="*.ts" --include="*.sql" | head -10
```

2. **Check for admin middleware logging**:
```bash
# Look for admin action middleware
grep -riE "middleware.*(admin|audit)|admin.*(middleware|interceptor)" --include="*.ts" --include="*.js" | head -10

# Find action recording on mutations
grep -riE "log.*(create|update|delete)|record.*(action|change)" --include="*.ts" --include="*.js" | head -10
```

3. **Check what's being logged**:
```bash
# Look for audit log fields
grep -riE "userId|action|resource|timestamp|before|after|changes" --include="*.ts" --include="*.js" | grep -iE "audit|log" | head -10
```

**Cross-reference with**:
- MON-005 (log retention policies)

**Ask user**:
- Are admin actions logged? (user edits, deletions, permission changes)
- Can you see what an admin did recently?
- How long is the audit trail retained?
- Can you reconstruct what happened if there's an incident?

**Pass criteria**:
- Admin actions (especially destructive ones) are logged
- Logs include: who, what, when, and affected resource
- At least recent history is queryable (last 30 days minimum)

**Fail criteria**:
- No logging of admin actions
- Can't determine what an admin changed or when
- Only login logging, no action logging

**Evidence to capture**:
- Audit logging implementation (if any)
- What actions are logged (all mutations? only destructive?)
- Retention period
- How to query audit trail

---

### ADM-005: Easy to disable admin users immediately
**Severity**: Recommended

**Check automatically**:

1. **Find disable/suspend functionality**:
```bash
# Look for disable/suspend functions
grep -riE "(disable|suspend|deactivate|revoke|block).*(user|admin|account)" --include="*.ts" --include="*.js" | head -10

# Find active/disabled flags
grep -riE "is_active|isActive|is_disabled|isDisabled|suspended|blocked|status" --include="*.prisma" --include="*.ts" | head -10
```

2. **Check for session invalidation**:
```bash
# Look for session invalidation on disable
grep -riE "invalidate.*(session|token)|revoke.*(session|token)|logout.*all" --include="*.ts" --include="*.js" | head -10

# Find session management
grep -riE "destroySession|clearSession|revokeTokens" --include="*.ts" --include="*.js" | head -10
```

3. **Check admin UI for user management**:
```bash
# Look for admin user management UI
find . -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec grep -l -iE "disable.*user|suspend.*user|block.*user" {} \; | head -5
```

**Ask user**:
- If an admin account is compromised, how quickly can you disable it?
- Does disabling immediately invalidate active sessions?
- Can this be done without deploying code or direct DB access?

**Pass criteria**:
- Admin users can be disabled via admin UI (not just DB)
- Disable takes effect immediately (active sessions invalidated)
- No code deploy required
- Can be done in under 5 minutes from decision

**Fail criteria**:
- Must edit database directly to disable admin
- Disabled admins can continue using existing sessions
- Requires code deploy to remove access

**Evidence to capture**:
- How to disable an admin user (steps)
- Whether sessions are immediately invalidated
- Time from decision to effective disable (estimate)

---

### ADM-006: Claude skill to audit admin access
**Severity**: Optional

**Check automatically**:

1. **Look for audit automation**:
```bash
# Find audit scripts or skills
find . -type f \( -name "*.md" -o -name "*.ts" -o -name "*.js" \) -exec grep -l -iE "audit.*admin|admin.*audit|check.*access" {} \; | head -10

# Look in skills/scripts folders
ls -la skills/ scripts/ tools/ 2>/dev/null

# Find runbooks
find . -type f -name "*.md" -exec grep -l -iE "runbook|playbook|admin.*review" {} \; | head -5
```

2. **Check for API access to admin data**:
```bash
# Look for admin user listing API
grep -riE "api.*(admin|users)|getAdminUsers|listAdmins" --include="*.ts" --include="*.js" | head -10
```

**Ask user**:
- Is there an automated way to audit admin access? (script, Claude skill, runbook)
- Can an AI agent enumerate admin users and flag anomalies?
- If not, would this be valuable to create?

**Pass criteria**:
- Automated tooling exists to audit admin access
- OR clear runbook/process that could be automated
- Audit can identify: inactive admins, over-privileged users, missing MFA

**Fail criteria**:
- No automation or clear process for admin audits
- Auditing requires manual DB queries with no documentation

**Evidence to capture**:
- Existing audit tooling (if any)
- Gap: what automation would be valuable
- Recommendation for creating audit skill

---

## Completing the Audit

After checking all items:

1. **Summarize results**:
   - ADM-001: PASS/FAIL (Recommended)
   - ADM-002: PASS/FAIL (Recommended)
   - ADM-003: PASS/FAIL (Recommended)
   - ADM-004: PASS/FAIL (Recommended)
   - ADM-005: PASS/FAIL (Recommended)
   - ADM-006: PASS/FAIL (Optional)

2. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority

3. **Common recommendations**:
   - If no admin parity: Prioritize admin features for payment, orders, user accounts
   - If no access auditing: Implement admin user list with last_login, create quarterly review process
   - If no login tracking: Add IP and timestamp capture on admin login events
   - If no audit trail: Implement action logging middleware for admin mutations
   - If disable is hard: Add is_active flag with session invalidation on toggle
   - If no audit tooling: Create runbook first, automate later

4. **Record audit date** and auditor
