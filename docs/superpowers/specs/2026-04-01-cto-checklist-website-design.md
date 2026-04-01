# CTO Checklist Website — Design Spec

## Overview

Public website for **cto-checklist.com** — the marketing and reference site for the CTO Checklist open-source audit framework. The site serves as both a compelling introduction and the full interactive reference for 42 sections and 1,199 checklist items.

**Brand:** CTO Checklist
**Tagline:** *1,199 things between you and production-ready.*
**Domain:** cto-checklist.com

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

Purpose: communicate scale, breadth, and the nature of the checklist without requiring clicks. Refinement of animation timing, density, and content selection is deferred.

## Site Structure

### Page 1: Home

Scroll flow:

1. **Sticky banner** — green dot + "CTO Checklist" + nav (How It Works, Checklist, GitHub) + meta ("42 sections · 1,199 items")
2. **Hero** — badge ("Open Source Audit Framework"), headline ("1,199 things between you and production-ready."), subhead, dual CTAs:
   - Primary: `$ copy audit prompt` (terminal-styled, dark bg, green text)
   - Secondary: "Browse Checklist" (light green bg)
3. **Floating items area** — ambient proof of scale (see Floating Items above)
4. **How It Works excerpt** — dark forest background (#052e16), 3-step grid:
   - Step 1: Copy the prompt (shows the actual prompt text)
   - Step 2: Run with Claude (shows terminal-style output)
   - Step 3: Get your report (shows audit file tree)
   - Link: "Learn more about the audit workflow →"
5. **What's Inside** — section label + "42 sections. Every blind spot covered." + 12 featured domain cards (name, item count, short description) + "View all 42 sections →"
6. **Email capture** — green-tinted section (#f0fdf4), "Stay in the loop." + email input + subscribe button
7. **Footer** — links (GitHub, Checklist, How It Works) + one-liner description

### Page 2: How It Works

Expanded version of the homepage excerpt:

- Full audit prompt with copy button
- Workspace setup explanation (what a cto-workspace is, how the submodule works)
- What an audit report looks like (sample output with real section/item examples)
- The three personas woven in — not separate pages, but callouts showing how a CTO vs founder vs CEO each benefits
- Link to GitHub repo for setup

### Page 3: Checklist (Reference)

Sidebar navigation + content area (classic docs layout):

- **Sidebar:** All 42 sections listed, grouped by domain (Infrastructure, Database, Monitoring, etc.). Current section highlighted. Persistent across navigation.
- **Content area:** Section header (name, description, item count, severity breakdown) → items grouped by category → each item shows ID, title, description, severity badge → expandable guide content per item
- **Each section gets its own URL** (e.g., `/checklist/git-repo-setup/`) for SEO and shareability
- **Search/filter** across all 1,199 items (client-side, since the dataset is static and bounded)

## Tech Stack

- **Framework:** Astro — static-first, zero JS by default, React islands for interactive components
- **Styling:** Tailwind CSS
- **Hosting:** GitHub Pages
- **Content source:** Git submodule of the checklist repo. Astro reads `checklist/*/items.yaml` and `checklist/*/guide.md` at build time.
- **Interactive islands (React):**
  - Floating items animation (homepage)
  - Copy-to-clipboard prompt button
  - Checklist search/filter
  - Email capture form (connects to TBD provider)
- **Build:** GitHub Actions workflow — builds on push, deploys to GitHub Pages
- **Custom domain:** cto-checklist.com configured via CNAME

## Content Strategy

### Checklist content

Read directly from the existing `checklist/` directory structure at build time:

```
checklist/
├── 01-git-repo-setup/
│   ├── guide.md    → rendered as section guide content
│   └── items.yaml  → parsed for item list, severity, categories
├── 02-dependencies/
│   ├── guide.md
│   └── items.yaml
└── ... (42 sections)
```

Two items.yaml formats exist (object-style sections 01-12, string-style 13-42). The build step handles both.

### Audit prompt

A single universal prompt displayed on the homepage and How It Works page:

> Audit my project against the CTO Checklist. Start a cto-workspace, set up the checklist for audits, and follow the CLAUDE.md instructions.

Copy-to-clipboard with visual feedback.

### Floating items content

Curated set of:
- 10-15 real checklist items (mix of critical and recommended, from diverse sections)
- 6-8 section names
- 6-8 provocative questions derived from checklist items

Content is hardcoded in the component (not dynamically generated from YAML) to control what visitors see first.

### Email capture

Simple email collection — provider TBD. No paywall, no gating. Copy: "Stay in the loop. New sections, audit improvements, and the occasional CTO war story."

## Open Questions

1. **Email provider** — Buttondown, Resend, ConvertKit, or other? Deferred.
2. **Analytics** — Plausible, Fathom, or none? Deferred.
3. **Floating items refinement** — animation timing, density, overlap avoidance, mobile behavior. Deferred to UX/UI review.
4. **Mobile responsive design** — general approach is responsive (Tailwind), but specific mobile layouts deferred to UX/UI review.
5. **SEO metadata** — page titles, descriptions, OG images. Needed before launch.
6. **Favicon / logo** — the green dot is a starting point but needs proper assets.

## What This Spec Does NOT Cover

- The existing Next.js dashboard (stays separate, internal tool)
- Paid product or pricing — not part of this phase
- User accounts or authentication
- Dynamic features requiring a backend
