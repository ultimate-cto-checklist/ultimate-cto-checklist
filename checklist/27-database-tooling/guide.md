# Database Tooling Audit Guide

This guide walks you through auditing a project's database tooling - specifically, whether developers have visibility into the database schema and the ability to explore data.

## Before You Start

1. **Identify database type** (PostgreSQL, MySQL, MongoDB, etc.)
2. **Identify ORM/schema tool** (Prisma, Drizzle, TypeORM, Django ORM, etc.)
3. **Check for existing admin panels** (Django Admin, Rails Admin, custom)
4. **Understand environment access** (who can access dev/staging/production)

## Audit Process

Work through each item below. For each item:
- Gather evidence (automatic where possible)
- Record PASS, FAIL, or PARTIAL with evidence
- Note any recommendations for failures

---

## Visualization

### DBT-001: Tool to visualize database diagrams (ERD)
**Severity**: Recommended

Developers should have a way to visually understand the database schema - table relationships, foreign keys, and overall structure. This accelerates onboarding and reduces mistakes.

**Check automatically**:

1. **Check for Prisma** (has built-in visualization):
```bash
# Prisma can generate ERD via prisma-erd-generator or Prisma Studio
grep -rE "prisma|@prisma/client" package.json 2>/dev/null

# Check for ERD generator in Prisma schema
grep -rE "prisma-erd-generator|erd-editor" prisma/schema.prisma 2>/dev/null
```

2. **Check for DBML files** (dbdiagram.io format):
```bash
# DBML is a common ERD format
find . -name "*.dbml" -type f 2>/dev/null
```

3. **Check for ERD documentation**:
```bash
# Look for ERD images or documentation
find . -type f \( -name "*erd*" -o -name "*schema*" -o -name "*diagram*" \) \( -name "*.png" -o -name "*.svg" -o -name "*.pdf" \) 2>/dev/null

# Check docs folder specifically
ls -la docs/*erd* docs/*schema* docs/*diagram* 2>/dev/null
```

4. **Check for database visualization packages**:
```bash
# NPM packages for ERD generation
grep -rE "dbdiagram|prisma-erd|tbls|schemaspy|eralchemy" package.json 2>/dev/null

# Python ERD tools
grep -rE "eralchemy|sadisplay|django-extensions" requirements*.txt pyproject.toml 2>/dev/null
```

5. **Check for visualization in docker-compose**:
```bash
# Tools like SchemaSpy or tbls might run as containers
grep -rE "schemaspy|tbls" docker-compose*.yml 2>/dev/null
```

**Ask user**:
- "How do developers visualize the database schema?"
- "What tool do you use to see table relationships?"
- "Where is the ERD documentation (if any)?"

**Common tools** (for reference):
- **Prisma Studio** - Built into Prisma, shows schema visually
- **dbdiagram.io** - Web tool, uses DBML format
- **DBeaver** - Free database IDE with ERD view
- **DataGrip** - JetBrains database IDE with ERD
- **TablePlus** - GUI with schema visualization
- **pgAdmin** - PostgreSQL admin with ERD plugin
- **tbls** - CLI tool that generates schema docs
- **SchemaSpy** - Generates HTML documentation with diagrams

**Cross-reference with**:
- DBT-002 (data exploration - often same tool provides both)
- Section 5 (Database setup - schema should be documented)

**Pass criteria**:
- Team has an accessible way to view database schema visually
- New developers can quickly understand table relationships
- ERD is current (reflects actual schema, not outdated)

**Fail criteria**:
- No visualization tool available
- "We read the migration files" (not visual)
- ERD exists but is outdated/unmaintained
- Only production DBA has access to visualization tools

**Evidence to capture**:
- Tool(s) used for ERD visualization
- Location of ERD documentation (if static)
- Whether ERD is auto-generated or manually maintained
- Accessibility (all developers, or restricted)

---

## Exploration

### DBT-002: Ability to query/explore data from any table
**Severity**: Recommended

Developers need to explore actual data for debugging, development, and understanding the system. This should be easy for dev/staging, and controlled for production.

**Check automatically**:

1. **Check for Prisma Studio**:
```bash
# Prisma Studio provides data browsing
grep -E "\"prisma\":|prisma studio" package.json 2>/dev/null

# Check for studio script
grep -E "prisma studio" package.json 2>/dev/null
```

2. **Check for database admin panels in docker-compose**:
```bash
# pgAdmin, Adminer, phpMyAdmin
grep -rE "pgadmin|adminer|phpmyadmin|mongo-express" docker-compose*.yml 2>/dev/null
```

3. **Check for application admin panels**:
```bash
# Django Admin
grep -rE "admin\.site|AdminSite|django\.contrib\.admin" --include="*.py" 2>/dev/null | head -5

# Rails Admin / ActiveAdmin
grep -rE "rails_admin|activeadmin|administrate" Gemfile 2>/dev/null

# Custom admin routes
grep -rE "/admin|AdminController|admin\.routes" --include="*.ts" --include="*.js" --include="*.py" --include="*.rb" 2>/dev/null | head -10
```

4. **Check for documented database access**:
```bash
# Connection string documentation
grep -rE "DATABASE_URL|connection string|psql|mysql" README.md CONTRIBUTING.md docs/*.md 2>/dev/null | head -10
```

5. **Check for query/seed scripts**:
```bash
# Scripts that suggest ad-hoc querying patterns
ls -la scripts/*query* scripts/*seed* scripts/*db* 2>/dev/null
find . -name "seed*.ts" -o -name "seed*.js" -o -name "*query*.sh" 2>/dev/null | head -5
```

**Ask user**:
- "How do developers browse data in the database?"
- "What tools do you use for ad-hoc queries?"
- "How is production database access controlled?"
- "Is there an audit log for production data access?"

**Production access considerations**:
- Production data access should be restricted to appropriate roles
- Access should be audited (who accessed what, when)
- Consider read replicas for production queries to avoid impacting performance
- PII/sensitive data may require additional controls

**Common tools** (for reference):
- **Prisma Studio** - Built-in data browser for Prisma
- **pgAdmin** - PostgreSQL GUI with query tool
- **DBeaver** - Universal database tool
- **DataGrip** - JetBrains database IDE
- **TablePlus** - Modern database GUI
- **Adminer** - Lightweight web-based admin (single PHP file)
- **Django Admin** - Built into Django
- **Rails Admin / ActiveAdmin** - Rails admin panels

**Cross-reference with**:
- DBT-001 (visualization - often same tool provides both)
- Section 15 (Admin dashboard - may include data browsing)
- Section 25/30 (Security - production access should be controlled)
- DB-001 (Connection pooling - tools should connect appropriately)

**Pass criteria**:
- Developers can easily connect to dev/staging databases and browse data
- Tool available (GUI client, admin panel, or CLI with documented access)
- Production access is restricted to appropriate roles
- Production access is audited (logged)

**Fail criteria**:
- No documented way to explore data
- "We SSH in and run raw psql" with no access controls
- Developers have no visibility into actual data
- Production access is uncontrolled (anyone can connect)
- No audit trail for production data access

**Evidence to capture**:
- Tool(s) used for data exploration
- How dev/staging access is provided
- How production access is controlled
- Whether production access is audited
- Any restrictions on sensitive data access

---

## Completing the Audit

After checking all items:

1. **Summarize results**:
   - DBT-001: PASS/FAIL (Recommended) - Database diagram visualization
   - DBT-002: PASS/FAIL (Recommended) - Data query/exploration capability

2. **List failures with**:
   - What was found (evidence)
   - Recommended fix
   - Priority (both are Recommended but improve developer productivity significantly)

3. **Common recommendations**:
   - If no ERD tool: Set up Prisma Studio (if using Prisma), DBeaver, or dbdiagram.io
   - If no data exploration: Add Adminer to docker-compose for dev, document connection strings
   - If uncontrolled production access: Implement role-based access, add audit logging
   - If outdated ERD: Set up auto-generation from schema (prisma-erd-generator, tbls)

4. **Maturity assessment**:
   - **Level 1**: No database tooling - developers read migrations and run raw SQL
   - **Level 2**: Some tooling but inconsistent - individuals use their own tools
   - **Level 3**: Standard tooling documented - team uses consistent tools for dev/staging
   - **Level 4**: Full tooling with controls - visualization, exploration, production access audited

5. **Record audit date** and auditor
