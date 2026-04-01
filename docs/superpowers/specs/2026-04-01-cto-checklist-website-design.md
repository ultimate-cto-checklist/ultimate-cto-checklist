# CTO Checklist Website — Design Spec

## Overview

Public website for **cto-checklist.com** — the marketing and reference site for the CTO Checklist open-source audit framework. The site serves as both a compelling introduction and the full interactive reference for 42 sections covering everything a CTO needs to verify in production-grade projects.

**Brand:** CTO Checklist
**Tagline:** Computed at build time from actual item count — format: *`{N}` blind spots between you and production-ready.*
**Domain:** cto-checklist.com

**Current stats (as of 2026-04-01):** 42 sections, 252 items. These numbers are computed at build time from the YAML source files and should never be hardcoded.

## Audience

Three primary personas, in priority order:

1. **CTO with a full plate** — knows they have blind spots, wants a structured audit they can delegate or run themselves
2. **Vibe coder / technical founder** — building fast, needs a CTO-level safety net for security, infrastructure, and operations
3. **CEO / VP** — needs confidence their technical team isn't missing critical items

All three share the same entry point. The site speaks to the need ("are you production-ready?"), not the title.

## Design Philosophy

**Hybrid approach:** One killer landing page that earns attention in 10 seconds, then dissolves into the full reference. Marketing and utility are the same site.

Core principle: **"I can use this right now."** The site should feel immediately useful — not a pitch deck with a signup wall.

## Visual Direction

- **Light mode** with a dark forest green banner
- **Banner:** #052e16 (deep forest green) with #22c55e glowing dot, #ecfdf5 text, #4ade80/#86efac accents
- **Page background:** White (#ffffff)
- **Primary accent:** Green (#16a34a)
- **Dark accent:** #052e16 (used for CTAs, code blocks, banner)
- **Typography:** Bold, high-weight headings (900), generous letter-spacing (-0.04em on headlines)
- **Layout rhythm:** Light hero → dark How It Works → light grid → green email capture
- **App Header style:** The dark banner feels like you're already inside a tool, not reading a brochure
- **UX/UI specialist to refine** visual details, spacing, floating animation craft

### Floating Items

The homepage features an ambient floating area below the hero where checklist items, section names, and probing questions fade in and out. Three visual treatments:

- **Items:** White cards with severity dot (amber = critical, green = recommended) + monospace ID + title
- **Sections:** Green-tinted cards with section names
- **Questions:** Amber-tinted italic cards with provocative questions ("Can a new hire clone and run in 10 minutes?")

Purpose: communicate breadth and the nature of the checklist without requiring clicks. Refinement of animation timing, density, and content selection is deferred.

## Routes

| Route | Page | Type |
|-------|------|------|
| `/` | Home | Static |
| `/how-it-works/` | How It Works | Static |
| `/checklist/` | Checklist index (redirects to first section or shows overview) | Static |
| `/checklist/[slug]/` | Section detail (e.g., `/checklist/git-repo-setup/`) | Dynamic (generated from `checklist/*/items.yaml` at build time) |

All routes use trailing slashes for GitHub Pages compatibility.

## Site Structure

### Page 1: Home (`/`)

Scroll flow:

1. **Sticky banner** — green dot + "CTO Checklist" + nav (How It Works, Checklist, GitHub) + meta ("{N} sections · {M} items" — computed at build)
2. **Hero** — badge ("Open Source Audit Framework"), headline ("{M} blind spots between you and production-ready."), subhead, dual CTAs:
   - Primary: `$ copy audit prompt` (terminal-styled, dark bg, green text)
   - Secondary: "Browse Checklist" (light green bg)
3. **Floating items area** — ambient showcase (see Floating Items above)
4. **How It Works excerpt** — dark forest background (#052e16), 3-step grid:
   - Step 1: Copy the prompt (shows the actual prompt text)
   - Step 2: Run with Claude (shows terminal-style output)
   - Step 3: Get your report (shows audit file tree)
   - Link: "Learn more about the audit workflow →"
5. **What's Inside** — section label + "42 sections. Every blind spot covered." + 12 featured domain cards (name, item count, short description) + "View all 42 sections →"
6. **Email capture** — green-tinted section (#f0fdf4), "Stay in the loop." + email input + subscribe button
7. **Footer** — links (GitHub, Checklist, How It Works) + one-liner description

**Featured domains for What's Inside (12 of 42):** Git Repo Setup, Authentication, Database, Monitoring, Infrastructure Security, Deployments, Secrets Management, Incident Response, Developer Onboarding, Cost Monitoring, Load Testing, GDPR & Privacy. Selected for breadth across all domain groups.

### Page 2: How It Works (`/how-it-works/`)

Expanded version of the homepage excerpt:

- Full audit prompt with copy button
- Workspace setup explanation (what a cto-workspace is, how the submodule works)
- What an audit report looks like (sample output with real section/item examples)
- The three personas woven in — not separate pages, but callouts showing how a CTO vs founder vs CEO each benefits
- Link to GitHub repo for setup

### Page 3: Checklist (`/checklist/[slug]/`)

Sidebar navigation + content area (classic docs layout):

- **Sidebar:** All 42 sections listed, grouped by domain. Current section highlighted. Persistent across navigation.
- **Content area:** Section header (name, description, item count, severity breakdown) → items grouped by category → each item shows ID, title, description, severity badge → section guide rendered below items
- **Each section gets its own URL** (e.g., `/checklist/git-repo-setup/`) for SEO and shareability
- **Search/filter** across all items (client-side, since the dataset is static and bounded)

**Domain groupings for sidebar** (from CLAUDE.md):

| Group | Sections |
|-------|----------|
| Infrastructure & Setup | 01-04 |
| Database & Data | 05-06 |
| Monitoring & Health | 07-09 |
| Deployment & Operations | 10-11 |
| Observability | 12-14 |
| Admin & Management | 15-16 |
| Performance & Analytics | 17-18 |
| Error Tracking & Reliability | 19-20 |
| Infrastructure Features | 21-23 |
| Data Management | 24-25 |
| High Availability & DR | 26-27 |
| Code Quality & Architecture | 28-29 |
| API & Security | 30-35 |
| Operations & Incident Management | 36-37 |
| Compliance & Legal | 38-39 |
| Team & Development | 40-42 |

## Data Model

### items.yaml formats

**Sections 01-20 (object-style section header):**
```yaml
section:
  id: "01"
  name: Git Repo Setup & Security
  description: Repository configuration, branch strategy, CI/CD...
default_scope: project

items:
  - id: GIT-001
    title: Clone and run immediately
    description: Repository can be cloned, built, and run...
    severity: critical       # "critical" | "recommended"
    category: clone-and-run  # grouping key for UI
```

**Sections 21-42 (string-style section header):**
```yaml
section: 21-caching
title: Caching
description: Cache strategy, invalidation, CDN configuration...
default_scope: project

items:
  - id: CACHE-001
    title: Cache invalidation strategy documented
    description: ...
    severity: critical
    category: strategy
```

**Loader notes:** Object-style uses `section.name`, string-style uses `title` — the loader normalizes both to the `Section.name` field. For string-style, `id` is extracted from the section string (e.g., `"21-caching"` → `"21"`). Some items include optional fields like `verification` — these are dropped for the website.

### TypeScript types (for Astro content loading)

```typescript
interface Section {
  slug: string;           // e.g., "git-repo-setup" (derived from directory name)
  id: string;             // e.g., "01"
  name: string;           // e.g., "Git Repo Setup & Security"
  description: string;
  defaultScope: string;   // "project" | "org" | "both"
  items: Item[];
  guideContent: string;   // raw markdown from guide.md
  domain: string;         // resolved from domain groupings table
}

interface Item {
  id: string;             // e.g., "GIT-001"
  title: string;
  description: string;
  severity: "critical" | "recommended";
  category: string;
}

interface SiteStats {
  sectionCount: number;   // computed at build
  itemCount: number;      // computed at build
  criticalCount: number;  // computed at build
}
```

### Guide content handling

Each section has one `guide.md` file covering all items in that section. On the checklist page, the full guide is rendered below the item list for that section — it is NOT split per-item. The guide provides context, verification steps, and rationale for the section as a whole.

## Component Inventory

### Astro components (static, no JS)

| Component | Used on | Purpose |
|-----------|---------|---------|
| `StickyBanner` | All pages | Dark forest nav bar with logo, links, stats |
| `Hero` | Home | Headline, subhead, dual CTAs |
| `HowItWorksExcerpt` | Home | 3-step grid on dark background |
| `DomainGrid` | Home | 12 featured section cards |
| `EmailCapture` | Home | Green-tinted email form section |
| `Footer` | All pages | Links and description |
| `ChecklistSidebar` | Checklist | Section list grouped by domain |
| `SectionHeader` | Checklist | Section name, description, stats |
| `ItemCard` | Checklist | Single item with ID, title, severity |
| `GuidePanel` | Checklist | Rendered markdown guide content |
| `SeverityBadge` | Checklist | Amber (critical) or green (recommended) chip |

### React islands (interactive, hydrated client-side)

| Component | Used on | Purpose |
|-----------|---------|---------|
| `FloatingItems` | Home | Animated floating cards |
| `CopyPromptButton` | Home, How It Works | Copy-to-clipboard with feedback |
| `ChecklistSearch` | Checklist | Client-side search/filter across all items |

## Tech Stack

- **Framework:** Astro — static-first, zero JS by default, React islands for interactive components
- **Styling:** Tailwind CSS
- **Hosting:** GitHub Pages
- **Content source:** Git submodule of the checklist repo (see Repo Structure below)
- **Build:** GitHub Actions workflow — builds on push, deploys to GitHub Pages
- **Custom domain:** cto-checklist.com configured via CNAME

## Repo Structure

New repository: `cto-checklist-website` (or similar).

```
cto-checklist-website/
├── astro.config.mjs
├── package.json
├── tailwind.config.mjs
├── public/
│   └── CNAME                    # cto-checklist.com
├── src/
│   ├── layouts/
│   │   └── BaseLayout.astro     # shared banner + footer
│   ├── pages/
│   │   ├── index.astro          # home
│   │   ├── how-it-works.astro   # how it works
│   │   └── checklist/
│   │       ├── index.astro      # checklist overview / redirect to first section
│   │       └── [slug].astro     # dynamic section pages
│   ├── components/              # Astro components (see inventory)
│   ├── islands/                 # React islands (see inventory)
│   └── lib/
│       ├── content.ts           # YAML/MD loader, both formats
│       ├── types.ts             # TypeScript interfaces
│       └── domains.ts           # Section → domain mapping
├── checklist/                   # git submodule → ultimate-cto-checklist
└── .github/
    └── workflows/
        └── deploy.yml           # build + deploy to GitHub Pages
```

**GitHub Actions workflow** must include `submodules: recursive` in the checkout step to initialize the checklist submodule.

**Build-time validation:** If no `items.yaml` files are found in the submodule path, the build should fail with a clear error message indicating the submodule needs initialization.

## Content Strategy

### Checklist content

Read directly from the submodule's `checklist/` directory at build time. The `content.ts` loader normalizes both YAML formats into the unified `Section` type.

### Audit prompt

A single universal prompt displayed on the homepage and How It Works page:

> Audit my project against the CTO Checklist. Start a cto-workspace, set up the checklist for audits, and follow the CLAUDE.md instructions.

Copy-to-clipboard with visual feedback.

### Floating items content

Curated set of:
- 10-15 real checklist items (mix of critical and recommended, from diverse sections)
- 6-8 section names
- 6-8 provocative questions derived from checklist items

Content is hardcoded in the component (not dynamically generated from YAML) to control what visitors see. This is a curated editorial choice — the questions especially are crafted to provoke ("Could an intern push to production?"), not auto-generated.

### Email capture

Simple email collection — provider TBD. No paywall, no gating. Copy: "Stay in the loop. New sections, audit improvements, and the occasional CTO war story."

## Open Questions

1. **Email provider** — Buttondown, Resend, ConvertKit, or other? Deferred.
2. **Analytics** — Plausible, Fathom, or none? Deferred.
3. **Floating items refinement** — animation timing, density, overlap avoidance, mobile behavior. Deferred to UX/UI review.
4. **Mobile responsive design** — general approach is responsive (Tailwind), but specific mobile layouts deferred to UX/UI review.
5. **SEO metadata** — page titles, descriptions, OG images. Needed before launch.
6. **Favicon / logo** — the green dot is a starting point but needs proper assets.
7. **Accessibility** — color contrast on dark banner, keyboard nav for sidebar, ARIA on floating animation, focus management for copy button. Deferred to UX/UI review but required before launch.

## What This Spec Does NOT Cover

- The existing Next.js dashboard (stays separate, internal tool)
- Paid product or pricing — not part of this phase
- User accounts or authentication
- Dynamic features requiring a backend
- Testing strategy (deferred to implementation plan)
