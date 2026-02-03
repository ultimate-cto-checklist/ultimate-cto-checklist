# CTO Checklist Dashboard - Design Document

**Date:** 2026-02-03
**Status:** Approved

## Overview

A web dashboard to browse and reference the CTO checklist content from `checklist/`. Adapts automatically as new sections are added.

## Requirements

- **Primary use case:** Browse & reference (audit tracking planned for later)
- **Audience:** Small team, deployed to Vercel
- **Auth:** None for v1 (add later)
- **Content updates:** Reads filesystem at runtime, updates on redeploy

## Tech Stack

- **Framework:** Next.js (App Router)
- **Deployment:** Vercel
- **Data:** Filesystem reads from `checklist/` directory
- **Parsing:** `yaml` for items.yaml, `react-markdown` for guide.md

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js App (Vercel)                 │
├─────────────────────────────────────────────────────────┤
│  /                    → Section list (cards grid)       │
│  /section/[slug]      → Section detail (items + guide)  │
│  /api/sections        → JSON: all sections metadata     │
│  /api/sections/[slug] → JSON: section items + guide     │
├─────────────────────────────────────────────────────────┤
│  lib/checklist.ts     → Parse checklist/ at runtime     │
│    - listSections()   → Scan dirs, return metadata      │
│    - getSection(slug) → Parse items.yaml + guide.md     │
└─────────────────────────────────────────────────────────┘
```

## File Structure

```
dashboard/                      # New Next.js app
├── app/
│   ├── page.tsx                # Home - section list
│   ├── section/[slug]/page.tsx # Section detail
│   ├── layout.tsx              # Shell with nav
│   └── globals.css
├── lib/
│   └── checklist.ts            # Filesystem reading logic
├── components/
│   ├── SectionCard.tsx         # Card for section list
│   ├── ChecklistItem.tsx       # Single item row
│   └── GuidePanel.tsx          # Expandable guide content
├── package.json
└── tsconfig.json

checklist/                      # Existing - unchanged
├── 01-git-repo-setup/
│   ├── items.yaml
│   └── guide.md
└── ...
```

## Data Types

```typescript
interface Section {
  slug: string;           // "01-git-repo-setup"
  id: string;             // "01"
  name: string;           // "Git Repo Setup"
  description: string;
  items: ChecklistItem[];
  guide: string;          // Raw markdown
}

interface ChecklistItem {
  id: string;             // "GIT-001"
  title: string;
  description: string;
  severity: "critical" | "recommended";
  category: string;
}

interface SectionSummary {
  slug: string;
  id: string;
  name: string;
  description: string;
  itemCount: number;
  criticalCount: number;
}
```

## Page Designs

### Home Page (`/`)

- Header: "CTO Checklist" + total item count
- Grid of section cards (3 cols desktop, 1 col mobile)
- Each card shows:
  - Section number + name
  - Description
  - Item count with severity breakdown
- Sorted by section number

### Section Detail (`/section/[slug]`)

- Back link to home
- Section header (name, description, item count)
- **Main panel:** Items list
  - Grouped by category
  - Each item: ID badge, title, severity chip
  - Click to expand description
- **Side panel:** Guide content
  - Rendered markdown
  - Sticky on desktop, collapsible on mobile
  - Auto-generated TOC from headings

## Visual Style

- Clean, minimal (Notion/Linear aesthetic)
- Severity colors: critical = red/orange, recommended = blue/gray
- Monospace for IDs, system font elsewhere
- Responsive: works on mobile

## Caching Strategy

- Use Next.js caching or simple in-memory cache
- Cache for 60 seconds in production
- No cache in dev mode (always fresh)
- Full invalidation on redeploy

## Error Handling

- Missing section → 404 page
- Malformed YAML → Error page with parse details
- Missing guide.md → Show items without guide panel

## Future: Audit Tracking (v2)

When ready to add audit execution:

1. Add database (Vercel Postgres or Supabase)
2. Add auth (OAuth or invite codes)
3. New tables: `audits`, `audit_results`
4. New pages: `/audits`, `/audits/[id]`
5. Track pass/fail per item per audit

Browse functionality unchanged - clean addition.

## Out of Scope (v1)

- Search across sections
- Filter by severity
- Print/export
- Auth
- Audit tracking

## Implementation Notes

- Dashboard lives in `dashboard/` subdirectory
- Imports checklist from `../checklist/` at runtime
- Single repo deployment - push triggers full redeploy
- No environment variables needed for v1
