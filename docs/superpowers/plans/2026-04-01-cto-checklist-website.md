# CTO Checklist Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the cto-checklist.com public website — an Astro static site with homepage, how-it-works page, and full checklist reference, deployed to GitHub Pages.

**Architecture:** Astro static site with React islands for interactivity (floating items, copy button, search). Content loaded from YAML/MD files at build time via a TypeScript loader that normalizes two YAML formats. Deployed via GitHub Actions to GitHub Pages with custom domain.

**Tech Stack:** Astro 5, React 19, Tailwind CSS 3, TypeScript, GitHub Pages, GitHub Actions

**Spec:** `docs/superpowers/specs/2026-04-01-cto-checklist-website-design.md`

---

## File Structure

```
cto-checklist-website/
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── tailwind.config.mjs
├── public/
│   └── CNAME
├── src/
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── how-it-works.astro
│   │   └── checklist/
│   │       ├── index.astro
│   │       └── [slug].astro
│   ├── components/
│   │   ├── StickyBanner.astro
│   │   ├── Hero.astro
│   │   ├── HowItWorksExcerpt.astro
│   │   ├── DomainGrid.astro
│   │   ├── DomainCard.astro
│   │   ├── EmailCapture.astro
│   │   ├── Footer.astro
│   │   ├── ChecklistSidebar.astro
│   │   ├── SectionHeader.astro
│   │   ├── ItemCard.astro
│   │   ├── GuidePanel.astro
│   │   └── SeverityBadge.astro
│   ├── islands/
│   │   ├── FloatingItems.tsx
│   │   ├── CopyPromptButton.tsx
│   │   └── ChecklistSearch.tsx
│   └── lib/
│       ├── content.ts
│       ├── types.ts
│       └── domains.ts
├── checklist -> ../checklist          # symlink to checklist dir in parent repo
├── tests/
│   └── lib/
│       └── content.test.ts
└── .github/
    └── workflows/
        └── deploy.yml
```

**Note on content source:** The website will live as a directory inside the existing `ultimate-cto-checklist` repo (not a separate repo with submodule). The `checklist/` content is accessed via a symlink from `website/checklist` → `../checklist`. This is simpler than submodules and keeps everything in one repo. The GitHub Actions workflow builds from the repo root.

---

## Task 1: Project Scaffolding

**Files:**
- Create: `website/package.json`
- Create: `website/astro.config.mjs`
- Create: `website/tsconfig.json`
- Create: `website/tailwind.config.mjs`
- Create: `website/public/CNAME`
- Create: `website/src/pages/index.astro` (placeholder)

- [ ] **Step 1: Create the website directory and initialize the Astro project**

```bash
cd /Users/rodric/Claude/personal/ultimate-cto-checklist
mkdir -p website
cd website
pnpm create astro@latest . -- --template minimal --typescript strict --install --no-git
```

Accept defaults. This creates `package.json`, `astro.config.mjs`, `tsconfig.json`, and `src/pages/index.astro`.

- [ ] **Step 2: Add Tailwind CSS and React integrations**

```bash
cd /Users/rodric/Claude/personal/ultimate-cto-checklist/website
pnpm astro add tailwind react
```

This updates `astro.config.mjs` to include both integrations and installs dependencies.

- [ ] **Step 3: Add the yaml package for content loading**

```bash
cd /Users/rodric/Claude/personal/ultimate-cto-checklist/website
pnpm add yaml
pnpm add -D vitest @types/react @types/react-dom
```

- [ ] **Step 4: Create the symlink to checklist content**

```bash
cd /Users/rodric/Claude/personal/ultimate-cto-checklist/website
ln -s ../checklist checklist
```

- [ ] **Step 5: Create CNAME file**

Create `website/public/CNAME`:
```
cto-checklist.com
```

- [ ] **Step 6: Update astro.config.mjs for static output**

Ensure `astro.config.mjs` includes:
```javascript
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [tailwind(), react()],
  output: 'static',
  trailingSlash: 'always',
  site: 'https://cto-checklist.com',
});
```

- [ ] **Step 7: Verify the dev server starts**

```bash
cd /Users/rodric/Claude/personal/ultimate-cto-checklist/website
pnpm dev
```

Expected: Astro dev server starts, `http://localhost:4321` serves the placeholder page.

- [ ] **Step 8: Verify the build succeeds**

```bash
cd /Users/rodric/Claude/personal/ultimate-cto-checklist/website
pnpm build
```

Expected: Static files output to `dist/`.

- [ ] **Step 9: Commit**

```bash
git add website/
git commit -m "feat(website): scaffold Astro project with Tailwind and React"
```

---

## Task 2: Data Layer — Types, Domains, Content Loader

**Files:**
- Create: `website/src/lib/types.ts`
- Create: `website/src/lib/domains.ts`
- Create: `website/src/lib/content.ts`
- Create: `website/tests/lib/content.test.ts`

- [ ] **Step 1: Write the failing test for content loading**

Create `website/tests/lib/content.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { loadAllSections, computeStats } from '../../src/lib/content';

describe('loadAllSections', () => {
  it('loads all 42 sections from checklist directory', () => {
    const sections = loadAllSections();
    expect(sections).toHaveLength(42);
  });

  it('normalizes object-style sections (01-20)', () => {
    const sections = loadAllSections();
    const git = sections.find(s => s.slug === 'git-repo-setup');
    expect(git).toBeDefined();
    expect(git!.id).toBe('01');
    expect(git!.name).toBe('Git Repo Setup & Security');
    expect(git!.items.length).toBeGreaterThan(0);
    expect(git!.domain).toBe('Infrastructure & Setup');
  });

  it('normalizes string-style sections (21-42)', () => {
    const sections = loadAllSections();
    const caching = sections.find(s => s.slug === 'caching');
    expect(caching).toBeDefined();
    expect(caching!.id).toBe('21');
    expect(caching!.name).toBe('Caching');
    expect(caching!.items.length).toBeGreaterThan(0);
    expect(caching!.domain).toBe('Infrastructure Features');
  });

  it('each item has required fields', () => {
    const sections = loadAllSections();
    for (const section of sections) {
      for (const item of section.items) {
        expect(item.id).toBeTruthy();
        expect(item.title).toBeTruthy();
        expect(['critical', 'recommended']).toContain(item.severity);
      }
    }
  });

  it('loads guide content as markdown string', () => {
    const sections = loadAllSections();
    const git = sections.find(s => s.slug === 'git-repo-setup');
    expect(git!.guideContent).toContain('# ');
    expect(git!.guideContent.length).toBeGreaterThan(100);
  });
});

describe('computeStats', () => {
  it('computes correct totals', () => {
    const sections = loadAllSections();
    const stats = computeStats(sections);
    expect(stats.sectionCount).toBe(42);
    expect(stats.itemCount).toBeGreaterThan(200);
    expect(stats.criticalCount).toBeGreaterThan(0);
    expect(stats.criticalCount).toBeLessThan(stats.itemCount);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/rodric/Claude/personal/ultimate-cto-checklist/website
npx vitest run tests/lib/content.test.ts
```

Expected: FAIL — `loadAllSections` and `computeStats` don't exist.

- [ ] **Step 3: Create types.ts**

Create `website/src/lib/types.ts`:

```typescript
export interface Item {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'recommended';
  category: string;
}

export interface Section {
  slug: string;
  id: string;
  name: string;
  description: string;
  defaultScope: string;
  items: Item[];
  guideContent: string;
  domain: string;
}

export interface SiteStats {
  sectionCount: number;
  itemCount: number;
  criticalCount: number;
}
```

- [ ] **Step 4: Create domains.ts**

Create `website/src/lib/domains.ts`:

```typescript
const DOMAIN_RANGES: [string, number, number][] = [
  ['Infrastructure & Setup', 1, 4],
  ['Database & Data', 5, 6],
  ['Monitoring & Health', 7, 9],
  ['Deployment & Operations', 10, 11],
  ['Observability', 12, 14],
  ['Admin & Management', 15, 16],
  ['Performance & Analytics', 17, 18],
  ['Error Tracking & Reliability', 19, 20],
  ['Infrastructure Features', 21, 23],
  ['Data Management', 24, 25],
  ['High Availability & DR', 26, 27],
  ['Code Quality & Architecture', 28, 29],
  ['API & Security', 30, 35],
  ['Operations & Incident Management', 36, 37],
  ['Compliance & Legal', 38, 39],
  ['Team & Development', 40, 42],
];

export function getDomain(sectionId: string): string {
  const num = parseInt(sectionId, 10);
  for (const [domain, start, end] of DOMAIN_RANGES) {
    if (num >= start && num <= end) return domain;
  }
  return 'Other';
}

export function getAllDomains(): string[] {
  return DOMAIN_RANGES.map(([domain]) => domain);
}
```

- [ ] **Step 5: Create content.ts**

Create `website/src/lib/content.ts`:

```typescript
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { getDomain } from './domains';
import type { Section, Item, SiteStats } from './types';

const CHECKLIST_DIR = path.resolve(import.meta.dirname, '../../checklist');

function parseItem(raw: Record<string, unknown>): Item {
  return {
    id: String(raw.id ?? ''),
    title: String(raw.title ?? ''),
    description: String(raw.description ?? raw.summary ?? ''),
    severity: raw.severity === 'critical' ? 'critical' : 'recommended',
    category: String(raw.category ?? 'general'),
  };
}

function parseSection(dirName: string, data: Record<string, unknown>, guideContent: string): Section {
  const slug = dirName.replace(/^\d+-/, '');
  let id: string;
  let name: string;
  let description: string;
  let defaultScope: string;

  if (typeof data.section === 'object' && data.section !== null) {
    // Object-style (sections 01-20)
    const sec = data.section as Record<string, string>;
    id = String(sec.id);
    name = String(sec.name);
    description = String(sec.description ?? '');
  } else {
    // String-style (sections 21-42)
    const secStr = String(data.section);
    id = secStr.split('-')[0];
    name = String(data.title ?? '');
    description = String(data.description ?? '');
  }

  defaultScope = String(data.default_scope ?? 'project');

  const rawItems = (data.items as Record<string, unknown>[]) ?? [];
  const items = rawItems.map(parseItem);

  return {
    slug,
    id,
    name,
    description,
    defaultScope,
    items,
    guideContent,
    domain: getDomain(id),
  };
}

export function loadAllSections(): Section[] {
  if (!fs.existsSync(CHECKLIST_DIR)) {
    throw new Error(
      `Checklist directory not found at ${CHECKLIST_DIR}. ` +
      `Ensure the checklist symlink or submodule is initialized.`
    );
  }

  const dirs = fs.readdirSync(CHECKLIST_DIR)
    .filter(d => /^\d{2}-/.test(d))
    .sort();

  return dirs.map(dir => {
    const yamlPath = path.join(CHECKLIST_DIR, dir, 'items.yaml');
    const guidePath = path.join(CHECKLIST_DIR, dir, 'guide.md');

    const yamlContent = fs.readFileSync(yamlPath, 'utf-8');
    const data = YAML.parse(yamlContent) as Record<string, unknown>;

    const guideContent = fs.existsSync(guidePath)
      ? fs.readFileSync(guidePath, 'utf-8')
      : '';

    return parseSection(dir, data, guideContent);
  });
}

export function computeStats(sections: Section[]): SiteStats {
  const itemCount = sections.reduce((sum, s) => sum + s.items.length, 0);
  const criticalCount = sections.reduce(
    (sum, s) => sum + s.items.filter(i => i.severity === 'critical').length,
    0
  );
  return {
    sectionCount: sections.length,
    itemCount,
    criticalCount,
  };
}
```

- [ ] **Step 6: Add vitest config**

Create `website/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
cd /Users/rodric/Claude/personal/ultimate-cto-checklist/website
npx vitest run tests/lib/content.test.ts
```

Expected: All tests PASS.

- [ ] **Step 8: Commit**

```bash
git add website/src/lib/ website/tests/ website/vitest.config.ts
git commit -m "feat(website): add data layer — types, domains, content loader with tests"
```

---

## Task 3: Base Layout — Banner + Footer

**Files:**
- Create: `website/src/components/StickyBanner.astro`
- Create: `website/src/components/Footer.astro`
- Create: `website/src/layouts/BaseLayout.astro`
- Modify: `website/src/pages/index.astro`

- [ ] **Step 1: Create StickyBanner component**

Create `website/src/components/StickyBanner.astro`:

```astro
---
import { loadAllSections, computeStats } from '../lib/content';
const sections = loadAllSections();
const stats = computeStats(sections);
---

<nav class="sticky top-0 z-50 bg-[#052e16] px-6 py-3 flex items-center justify-between">
  <div class="flex items-center gap-2.5">
    <div class="w-2.5 h-2.5 bg-[#22c55e] rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
    <a href="/" class="text-[#ecfdf5] font-extrabold tracking-tight">CTO Checklist</a>
  </div>
  <div class="flex items-center gap-6">
    <a href="/how-it-works/" class="text-[#86efac] text-sm font-medium hover:text-[#ecfdf5] transition-colors">How It Works</a>
    <a href="/checklist/" class="text-[#86efac] text-sm font-medium hover:text-[#ecfdf5] transition-colors">Checklist</a>
    <a href="https://github.com/rodricBr/ultimate-cto-checklist" class="text-[#86efac] text-sm font-medium hover:text-[#ecfdf5] transition-colors">GitHub</a>
    <span class="text-[#4ade80] text-xs font-mono">{stats.sectionCount} sections · {stats.itemCount} items</span>
  </div>
</nav>
```

- [ ] **Step 2: Create Footer component**

Create `website/src/components/Footer.astro`:

```astro
<footer class="py-10 text-center text-gray-400 text-sm">
  <div class="flex gap-6 justify-center mb-3">
    <a href="https://github.com/rodricBr/ultimate-cto-checklist" class="text-[#16a34a] font-medium hover:underline">GitHub</a>
    <a href="/checklist/" class="text-[#16a34a] font-medium hover:underline">Checklist</a>
    <a href="/how-it-works/" class="text-[#16a34a] font-medium hover:underline">How It Works</a>
  </div>
  <p>CTO Checklist — Open source audit framework for technical leaders.</p>
</footer>
```

- [ ] **Step 3: Create BaseLayout**

Create `website/src/layouts/BaseLayout.astro`:

```astro
---
import StickyBanner from '../components/StickyBanner.astro';
import Footer from '../components/Footer.astro';

interface Props {
  title: string;
  description?: string;
}

const { title, description = 'The audit framework for technical leaders.' } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content={description} />
    <title>{title} — CTO Checklist</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body class="bg-white text-gray-900 antialiased">
    <StickyBanner />
    <slot />
    <Footer />
  </body>
</html>
```

- [ ] **Step 4: Update index.astro to use BaseLayout**

Replace `website/src/pages/index.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="Home">
  <main class="max-w-4xl mx-auto py-20 px-6 text-center">
    <p class="text-gray-500">Homepage coming next...</p>
  </main>
</BaseLayout>
```

- [ ] **Step 5: Verify in browser**

```bash
cd /Users/rodric/Claude/personal/ultimate-cto-checklist/website
pnpm dev
```

Open `http://localhost:4321`. Verify: dark green banner with nav links and computed stats, footer at bottom.

- [ ] **Step 6: Commit**

```bash
git add website/src/components/ website/src/layouts/ website/src/pages/index.astro
git commit -m "feat(website): add base layout with sticky banner and footer"
```

---

## Task 4: Homepage — Hero + How It Works + Domain Grid + Email

**Files:**
- Create: `website/src/components/Hero.astro`
- Create: `website/src/components/HowItWorksExcerpt.astro`
- Create: `website/src/components/DomainGrid.astro`
- Create: `website/src/components/DomainCard.astro`
- Create: `website/src/components/EmailCapture.astro`
- Create: `website/src/islands/CopyPromptButton.tsx`
- Modify: `website/src/pages/index.astro`

- [ ] **Step 1: Create CopyPromptButton island**

Create `website/src/islands/CopyPromptButton.tsx`:

```tsx
import { useState } from 'react';

const AUDIT_PROMPT = `Audit my project against the CTO Checklist. Start a cto-workspace, set up the checklist for audits, and follow the CLAUDE.md instructions.`;

export default function CopyPromptButton() {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(AUDIT_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="bg-[#052e16] text-[#4ade80] px-8 py-3 rounded-lg text-sm font-bold font-mono transition-all hover:bg-[#0a3d1f] hover:shadow-[0_4px_16px_rgba(5,46,22,0.3)] cursor-pointer"
    >
      {copied ? '✓ copied' : '$ copy audit prompt'}
    </button>
  );
}
```

- [ ] **Step 2: Create Hero component**

Create `website/src/components/Hero.astro`:

```astro
---
import { loadAllSections, computeStats } from '../lib/content';
import CopyPromptButton from '../islands/CopyPromptButton';

const sections = loadAllSections();
const stats = computeStats(sections);
---

<section class="py-20 px-6 max-w-3xl mx-auto text-center">
  <span class="inline-block bg-[#f0fdf4] border border-[#bbf7d0] text-[#16a34a] text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
    Open Source Audit Framework
  </span>
  <h1 class="text-5xl font-black text-gray-900 leading-tight tracking-tight mb-4">
    {stats.itemCount} things between you and <span class="text-[#16a34a]">production-ready</span>.
  </h1>
  <p class="text-lg text-gray-500 max-w-xl mx-auto mb-8 leading-relaxed">
    The audit framework for CTOs, founders, and teams who ship to production. AI-powered. Ruthlessly comprehensive.
  </p>
  <div class="flex gap-3 justify-center">
    <CopyPromptButton client:idle />
    <a href="/checklist/" class="bg-[#f0fdf4] text-[#052e16] px-8 py-3 rounded-lg text-sm font-semibold border border-[#bbf7d0] hover:bg-[#dcfce7] transition-colors">
      Browse Checklist
    </a>
  </div>
</section>
```

- [ ] **Step 3: Create HowItWorksExcerpt component**

Create `website/src/components/HowItWorksExcerpt.astro`:

```astro
<section class="bg-[#052e16] py-20 px-6">
  <div class="max-w-5xl mx-auto">
    <p class="text-xs uppercase tracking-widest text-[#4ade80] font-bold mb-3">How It Works</p>
    <h2 class="text-3xl font-black text-[#ecfdf5] tracking-tight mb-2">Three steps to your first audit.</h2>
    <p class="text-[#86efac] mb-12">No setup. No account. Just Claude and your codebase.</p>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="bg-white/5 border border-white/10 rounded-xl p-7">
        <div class="inline-flex items-center justify-center w-8 h-8 bg-[#16a34a] text-[#052e16] rounded-lg font-black text-sm mb-4">1</div>
        <h3 class="text-lg font-bold text-[#ecfdf5] mb-2">Copy the prompt</h3>
        <p class="text-sm text-[#86efac] leading-relaxed mb-3">One prompt bootstraps the entire audit workflow — workspace setup, checklist loading, and section-by-section analysis.</p>
        <code class="block bg-black/30 border border-white/10 rounded-md px-3 py-2.5 font-mono text-xs text-[#4ade80] leading-relaxed whitespace-pre">Audit my project against the
CTO Checklist. Start a
cto-workspace and follow
the CLAUDE.md instructions.</code>
      </div>

      <div class="bg-white/5 border border-white/10 rounded-xl p-7">
        <div class="inline-flex items-center justify-center w-8 h-8 bg-[#16a34a] text-[#052e16] rounded-lg font-black text-sm mb-4">2</div>
        <h3 class="text-lg font-bold text-[#ecfdf5] mb-2">Run with Claude</h3>
        <p class="text-sm text-[#86efac] leading-relaxed mb-3">Paste into Claude Code. It clones your repo, runs automated checks, and asks smart questions about what it can't verify.</p>
        <code class="block bg-black/30 border border-white/10 rounded-md px-3 py-2.5 font-mono text-xs text-[#4ade80] leading-relaxed whitespace-pre">$ claude
&gt; Paste audit prompt
Scanning 42 sections...
✓ 847 pass · ⚠ 203 partial</code>
      </div>

      <div class="bg-white/5 border border-white/10 rounded-xl p-7">
        <div class="inline-flex items-center justify-center w-8 h-8 bg-[#16a34a] text-[#052e16] rounded-lg font-black text-sm mb-4">3</div>
        <h3 class="text-lg font-bold text-[#ecfdf5] mb-2">Get your report</h3>
        <p class="text-sm text-[#86efac] leading-relaxed mb-3">A structured audit report with pass/fail/partial for every item, evidence captured, and actionable recommendations.</p>
        <code class="block bg-black/30 border border-white/10 rounded-md px-3 py-2.5 font-mono text-xs text-[#4ade80] leading-relaxed whitespace-pre">audits/2026-04-01/
├── GIT-001.md  ✓ pass
├── SEC-003.md  ⚠ partial
├── MON-012.md  ✗ fail
└── summary.md</code>
      </div>
    </div>

    <div class="text-center mt-12">
      <a href="/how-it-works/" class="text-[#4ade80] font-semibold border-b border-[#4ade80]/30 hover:border-[#4ade80] pb-0.5 transition-colors">
        Learn more about the audit workflow →
      </a>
    </div>
  </div>
</section>
```

- [ ] **Step 4: Create DomainCard and DomainGrid components**

Create `website/src/components/DomainCard.astro`:

```astro
---
interface Props {
  name: string;
  itemCount: number;
  description: string;
  slug: string;
}
const { name, itemCount, description, slug } = Astro.props;
---

<a href={`/checklist/${slug}/`} class="block bg-white border border-gray-200 rounded-lg p-4 hover:border-[#16a34a] hover:shadow-[0_2px_8px_rgba(22,163,74,0.1)] transition-all">
  <div class="font-bold text-sm text-gray-900 mb-1">{name}</div>
  <div class="text-xs text-[#16a34a] font-semibold">{itemCount} items</div>
  <div class="text-xs text-gray-400 mt-1">{description}</div>
</a>
```

Create `website/src/components/DomainGrid.astro`:

```astro
---
import DomainCard from './DomainCard.astro';
import { loadAllSections } from '../lib/content';

const sections = loadAllSections();

const FEATURED_SLUGS = [
  'git-repo-setup',
  'authentication-endpoints',
  'database-connections',
  'monitoring',
  'infrastructure-security',
  'deployments',
  'secrets-management',
  'incident-response',
  'developer-onboarding',
  'cost-monitoring-budget-alerts',
  'load-stress-testing',
  'gdpr-privacy-compliance',
];

const featured = FEATURED_SLUGS
  .map(slug => sections.find(s => s.slug === slug))
  .filter(Boolean) as typeof sections;
---

<section class="max-w-5xl mx-auto py-20 px-6">
  <p class="text-xs uppercase tracking-widest text-[#16a34a] font-bold text-center mb-2">What's Inside</p>
  <h2 class="text-3xl font-black text-gray-900 tracking-tight text-center mb-2">{sections.length} sections. Every blind spot covered.</h2>
  <p class="text-gray-500 text-center mb-12">From git setup to GDPR compliance. From secrets management to developer onboarding.</p>

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
    {featured.map(s => (
      <DomainCard
        name={s.name}
        itemCount={s.items.length}
        description={s.description}
        slug={s.slug}
      />
    ))}
  </div>

  <div class="text-center mt-8">
    <a href="/checklist/" class="text-[#16a34a] font-semibold border-b border-[#16a34a]/30 hover:border-[#16a34a] pb-0.5 transition-colors">
      View all 42 sections →
    </a>
  </div>
</section>
```

- [ ] **Step 5: Create EmailCapture component**

Create `website/src/components/EmailCapture.astro`:

```astro
<section class="bg-[#f0fdf4] border-y border-[#bbf7d0] py-16 px-6 text-center">
  <h2 class="text-2xl font-extrabold text-[#052e16] mb-2">Stay in the loop.</h2>
  <p class="text-[#16a34a] mb-6">New sections, audit improvements, and the occasional CTO war story.</p>
  <form class="flex gap-2 justify-center max-w-md mx-auto" onsubmit="event.preventDefault()">
    <input
      type="email"
      placeholder="you@company.com"
      class="flex-1 px-4 py-2.5 border border-[#bbf7d0] rounded-lg text-sm bg-white outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/10"
    />
    <button type="submit" class="bg-[#052e16] text-[#4ade80] px-6 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap hover:bg-[#0a3d1f] transition-colors">
      Subscribe
    </button>
  </form>
</section>
```

- [ ] **Step 6: Assemble homepage**

Replace `website/src/pages/index.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Hero from '../components/Hero.astro';
import HowItWorksExcerpt from '../components/HowItWorksExcerpt.astro';
import DomainGrid from '../components/DomainGrid.astro';
import EmailCapture from '../components/EmailCapture.astro';
---

<BaseLayout title="Home" description="The open-source audit framework for technical leaders. AI-powered, ruthlessly comprehensive.">
  <Hero />
  <!-- Floating items area will be added in Task 6 -->
  <HowItWorksExcerpt />
  <DomainGrid />
  <EmailCapture />
</BaseLayout>
```

- [ ] **Step 7: Verify in browser**

```bash
cd /Users/rodric/Claude/personal/ultimate-cto-checklist/website
pnpm dev
```

Open `http://localhost:4321`. Verify: full homepage scroll — hero with computed item count, copy button works, dark how-it-works section, domain grid with 12 cards, email capture.

- [ ] **Step 8: Verify build**

```bash
cd /Users/rodric/Claude/personal/ultimate-cto-checklist/website
pnpm build
```

Expected: Build succeeds.

- [ ] **Step 9: Commit**

```bash
git add website/src/
git commit -m "feat(website): build homepage — hero, how it works, domain grid, email capture"
```

---

## Task 5: Checklist Reference Pages — Sidebar + Section Detail

**Files:**
- Create: `website/src/components/ChecklistSidebar.astro`
- Create: `website/src/components/SectionHeader.astro`
- Create: `website/src/components/ItemCard.astro`
- Create: `website/src/components/SeverityBadge.astro`
- Create: `website/src/components/GuidePanel.astro`
- Create: `website/src/pages/checklist/index.astro`
- Create: `website/src/pages/checklist/[slug].astro`

- [ ] **Step 1: Create SeverityBadge component**

Create `website/src/components/SeverityBadge.astro`:

```astro
---
interface Props {
  severity: 'critical' | 'recommended';
}
const { severity } = Astro.props;
const isCritical = severity === 'critical';
---

<span class:list={[
  'inline-block px-2 py-0.5 rounded text-xs font-semibold',
  isCritical ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800',
]}>
  {severity}
</span>
```

- [ ] **Step 2: Create ItemCard component**

Create `website/src/components/ItemCard.astro`:

```astro
---
import SeverityBadge from './SeverityBadge.astro';
import type { Item } from '../lib/types';

interface Props {
  item: Item;
}
const { item } = Astro.props;
---

<div class="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
  <span class="font-mono text-xs text-[#16a34a] font-semibold mt-0.5 shrink-0">{item.id}</span>
  <div class="flex-1 min-w-0">
    <div class="flex items-center gap-2 mb-0.5">
      <span class="font-semibold text-sm text-gray-900">{item.title}</span>
      <SeverityBadge severity={item.severity} />
    </div>
    {item.description && (
      <p class="text-xs text-gray-500 leading-relaxed">{item.description}</p>
    )}
  </div>
</div>
```

- [ ] **Step 3: Create SectionHeader component**

Create `website/src/components/SectionHeader.astro`:

```astro
---
import type { Section } from '../lib/types';

interface Props {
  section: Section;
}
const { section } = Astro.props;
const criticalCount = section.items.filter(i => i.severity === 'critical').length;
const recommendedCount = section.items.length - criticalCount;
---

<div class="mb-8">
  <p class="text-xs text-gray-400 font-mono mb-1">Section {section.id} · {section.domain}</p>
  <h1 class="text-3xl font-black text-gray-900 tracking-tight mb-2">{section.name}</h1>
  <p class="text-gray-500 mb-4">{section.description}</p>
  <div class="flex gap-4 text-sm">
    <span class="text-gray-600"><strong>{section.items.length}</strong> items</span>
    {criticalCount > 0 && <span class="text-amber-600"><strong>{criticalCount}</strong> critical</span>}
    {recommendedCount > 0 && <span class="text-green-600"><strong>{recommendedCount}</strong> recommended</span>}
  </div>
</div>
```

- [ ] **Step 4: Create GuidePanel component**

Create `website/src/components/GuidePanel.astro`:

```astro
---
interface Props {
  content: string;
}
const { content } = Astro.props;
---

{content && (
  <details class="mt-8 border border-gray-200 rounded-lg">
    <summary class="px-4 py-3 font-semibold text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors">
      Audit Guide
    </summary>
    <div class="px-4 py-4 prose prose-sm max-w-none border-t border-gray-100" set:html={content} />
  </details>
)}
```

Note: The `content` prop should be pre-rendered markdown HTML. The `[slug].astro` page will convert markdown to HTML before passing it.

- [ ] **Step 5: Create ChecklistSidebar component**

Create `website/src/components/ChecklistSidebar.astro`:

```astro
---
import { loadAllSections } from '../lib/content';
import { getAllDomains } from '../lib/domains';

interface Props {
  currentSlug: string;
}
const { currentSlug } = Astro.props;
const sections = loadAllSections();
const domains = getAllDomains();

const sectionsByDomain = new Map<string, typeof sections>();
for (const section of sections) {
  const group = sectionsByDomain.get(section.domain) ?? [];
  group.push(section);
  sectionsByDomain.set(section.domain, group);
}
---

<nav class="w-64 shrink-0 overflow-y-auto max-h-[calc(100vh-3.5rem)] sticky top-14 py-6 pr-4">
  {domains.map(domain => {
    const group = sectionsByDomain.get(domain) ?? [];
    if (group.length === 0) return null;
    return (
      <div class="mb-4">
        <h3 class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 px-2">{domain}</h3>
        {group.map(s => (
          <a
            href={`/checklist/${s.slug}/`}
            class:list={[
              'block px-2 py-1 text-sm rounded transition-colors',
              s.slug === currentSlug
                ? 'bg-[#f0fdf4] text-[#052e16] font-semibold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
            ]}
          >
            {s.name}
          </a>
        ))}
      </div>
    );
  })}
</nav>
```

- [ ] **Step 6: Create checklist index page**

Create `website/src/pages/checklist/index.astro`:

```astro
---
import { loadAllSections } from '../../lib/content';

const sections = loadAllSections();
const firstSlug = sections[0]?.slug ?? 'git-repo-setup';

return Astro.redirect(`/checklist/${firstSlug}/`);
---
```

- [ ] **Step 7: Create section detail page**

Create `website/src/pages/checklist/[slug].astro`:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import ChecklistSidebar from '../../components/ChecklistSidebar.astro';
import SectionHeader from '../../components/SectionHeader.astro';
import ItemCard from '../../components/ItemCard.astro';
import GuidePanel from '../../components/GuidePanel.astro';
import { loadAllSections } from '../../lib/content';
import { marked } from 'marked';

export function getStaticPaths() {
  const sections = loadAllSections();
  return sections.map(s => ({
    params: { slug: s.slug },
    props: { section: s },
  }));
}

const { section } = Astro.props;

// Group items by category
const categories = new Map<string, typeof section.items>();
for (const item of section.items) {
  const group = categories.get(item.category) ?? [];
  group.push(item);
  categories.set(item.category, group);
}

const guideHtml = section.guideContent ? await marked.parse(section.guideContent) : '';
---

<BaseLayout title={section.name} description={section.description}>
  <div class="flex min-h-screen">
    <ChecklistSidebar currentSlug={section.slug} />

    <main class="flex-1 py-8 px-8 max-w-4xl">
      <SectionHeader section={section} />

      {Array.from(categories).map(([category, items]) => (
        <div class="mb-6">
          <h2 class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 border-l-2 border-[#16a34a] pl-3">
            {category}
          </h2>
          {items.map(item => <ItemCard item={item} />)}
        </div>
      ))}

      <GuidePanel content={guideHtml} />
    </main>
  </div>
</BaseLayout>
```

- [ ] **Step 8: Add marked dependency**

```bash
cd /Users/rodric/Claude/personal/ultimate-cto-checklist/website
pnpm add marked
```

- [ ] **Step 9: Verify in browser**

```bash
cd /Users/rodric/Claude/personal/ultimate-cto-checklist/website
pnpm dev
```

Navigate to `http://localhost:4321/checklist/`. Verify: redirects to first section, sidebar shows all 42 sections grouped by domain, section detail shows items grouped by category, guide panel expands.

- [ ] **Step 10: Verify build**

```bash
cd /Users/rodric/Claude/personal/ultimate-cto-checklist/website
pnpm build
```

Expected: Build succeeds, generates 42 section pages + index redirect.

- [ ] **Step 11: Commit**

```bash
git add website/src/ website/package.json website/pnpm-lock.yaml
git commit -m "feat(website): add checklist reference pages with sidebar navigation"
```

---

## Task 6: Floating Items Island

**Files:**
- Create: `website/src/islands/FloatingItems.tsx`
- Modify: `website/src/pages/index.astro`

- [ ] **Step 1: Create FloatingItems component**

Create `website/src/islands/FloatingItems.tsx`:

```tsx
import { useEffect, useRef } from 'react';

interface FloatData {
  type: 'item' | 'section' | 'question';
  id?: string;
  text: string;
  severity?: 'critical' | 'recommended';
}

const ITEMS: FloatData[] = [
  { type: 'item', id: 'GIT-001', text: 'Clone and run immediately', severity: 'critical' },
  { type: 'item', id: 'GIT-005', text: 'Branch protection on main', severity: 'critical' },
  { type: 'item', id: 'SEC-003', text: 'Secrets rotation policy', severity: 'critical' },
  { type: 'item', id: 'MON-012', text: 'Alert routing defined', severity: 'critical' },
  { type: 'item', id: 'DEP-007', text: 'Zero-downtime deploys', severity: 'critical' },
  { type: 'item', id: 'INC-002', text: 'Incident runbooks exist', severity: 'critical' },
  { type: 'item', id: 'ONB-001', text: 'New dev productive day one', severity: 'critical' },
  { type: 'item', id: 'COST-003', text: 'Budget alerts configured', severity: 'critical' },
  { type: 'item', id: 'PERF-008', text: 'P95 latency targets set', severity: 'recommended' },
  { type: 'item', id: 'GDPR-001', text: 'Data processing agreements', severity: 'critical' },
  { type: 'item', id: 'TEST-004', text: 'Integration tests hit real DB', severity: 'critical' },
  { type: 'item', id: 'ACC-015', text: 'Service account audit trail', severity: 'recommended' },
  { type: 'section', text: 'Monitoring & Observability' },
  { type: 'section', text: 'Incident Response' },
  { type: 'section', text: 'Secrets Management' },
  { type: 'section', text: 'Developer Onboarding' },
  { type: 'section', text: 'Infrastructure Security' },
  { type: 'section', text: 'Code Architecture' },
  { type: 'section', text: 'Cost Monitoring & Budgets' },
  { type: 'question', text: 'Can a new hire clone and run in under 10 minutes?' },
  { type: 'question', text: 'What happens when your primary DB goes down?' },
  { type: 'question', text: 'Who gets paged at 3am?' },
  { type: 'question', text: 'When was your last secret rotation?' },
  { type: 'question', text: 'Do you know your cloud spend right now?' },
  { type: 'question', text: 'Could an intern push to production?' },
  { type: 'question', text: 'Are feature flags cleaning up after themselves?' },
  { type: 'question', text: 'Is your CSP header blocking anything?' },
];

const MAX_VISIBLE = 7;

export default function FloatingItems() {
  const areaRef = useRef<HTMLDivElement>(null);
  const activeCount = useRef(0);

  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;

    function spawn() {
      if (!area || activeCount.current >= MAX_VISIBLE) return;

      const data = ITEMS[Math.floor(Math.random() * ITEMS.length)];
      const el = document.createElement('div');

      el.style.position = 'absolute';
      el.style.borderRadius = '8px';
      el.style.padding = '0.5rem 0.9rem';
      el.style.fontSize = '0.78rem';
      el.style.whiteSpace = 'nowrap';
      el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
      el.style.opacity = '0';
      el.style.transition = 'opacity 1.2s ease';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.gap = '0.5rem';

      if (data.type === 'section') {
        el.style.background = '#f0fdf4';
        el.style.border = '1px solid #bbf7d0';
        el.style.fontWeight = '600';
        el.style.color = '#052e16';
        el.innerHTML = `<span style="color:#16a34a">■</span> ${data.text}`;
      } else if (data.type === 'question') {
        el.style.background = '#fffbeb';
        el.style.border = '1px solid #fde68a';
        el.style.fontStyle = 'italic';
        el.style.color = '#92400e';
        el.innerHTML = `? ${data.text}`;
      } else {
        el.style.background = '#ffffff';
        el.style.border = '1px solid #e5e7eb';
        el.style.color = '#374151';
        const dotColor = data.severity === 'critical' ? '#f59e0b' : '#22c55e';
        el.innerHTML = `<div style="width:7px;height:7px;border-radius:2px;background:${dotColor};flex-shrink:0"></div><span style="color:#16a34a;font-family:monospace;font-size:0.63rem;font-weight:600">${data.id}</span><span>${data.text}</span>`;
      }

      const rect = area.getBoundingClientRect();
      el.style.left = `${30 + Math.random() * (rect.width - 350)}px`;
      el.style.top = `${30 + Math.random() * (rect.height - 60)}px`;

      area.appendChild(el);
      activeCount.current++;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => { el.style.opacity = '1'; });
      });

      const lifetime = 3000 + Math.random() * 4000;
      setTimeout(() => {
        el.style.opacity = '0';
        setTimeout(() => {
          el.remove();
          activeCount.current--;
        }, 1200);
      }, lifetime);
    }

    // Stagger initial spawn
    const initTimers = Array.from({ length: 5 }, (_, i) =>
      setTimeout(spawn, i * 500)
    );

    const interval = setInterval(spawn, 1400);

    return () => {
      initTimers.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      ref={areaRef}
      className="relative overflow-hidden"
      style={{ minHeight: '340px' }}
    >
      {/* Top fade */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#f8fffe] to-transparent z-10 pointer-events-none" />
    </div>
  );
}
```

- [ ] **Step 2: Add FloatingItems to homepage**

In `website/src/pages/index.astro`, add the import and insert between Hero and HowItWorksExcerpt:

```astro
---
import FloatingItems from '../islands/FloatingItems';
// ... other imports
---

<BaseLayout ...>
  <Hero />
  <FloatingItems client:idle />
  <HowItWorksExcerpt />
  <DomainGrid />
  <EmailCapture />
</BaseLayout>
```

- [ ] **Step 3: Verify in browser**

Open `http://localhost:4321`. Verify: floating items appear below hero, fade in/out, three visual types visible.

- [ ] **Step 4: Commit**

```bash
git add website/src/islands/FloatingItems.tsx website/src/pages/index.astro
git commit -m "feat(website): add floating items animation to homepage"
```

---

## Task 7: How It Works Page

**Files:**
- Create: `website/src/pages/how-it-works.astro`

- [ ] **Step 1: Create the How It Works page**

Create `website/src/pages/how-it-works.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import CopyPromptButton from '../islands/CopyPromptButton';
---

<BaseLayout title="How It Works" description="Three steps to audit your project against the CTO Checklist using Claude.">

  <!-- Hero -->
  <section class="py-20 px-6 max-w-3xl mx-auto text-center">
    <h1 class="text-4xl font-black text-gray-900 tracking-tight mb-4">How It Works</h1>
    <p class="text-lg text-gray-500 leading-relaxed">
      The CTO Checklist is an open-source audit framework. You run it with Claude Code against your codebase. Here's what that looks like.
    </p>
  </section>

  <!-- Step 1: The Prompt -->
  <section class="bg-[#052e16] py-16 px-6">
    <div class="max-w-3xl mx-auto">
      <div class="inline-flex items-center justify-center w-8 h-8 bg-[#16a34a] text-[#052e16] rounded-lg font-black text-sm mb-4">1</div>
      <h2 class="text-2xl font-bold text-[#ecfdf5] mb-2">Copy the audit prompt</h2>
      <p class="text-[#86efac] mb-6 leading-relaxed">
        One prompt bootstraps everything. It tells Claude to set up a workspace, load the checklist, and start auditing your project section by section.
      </p>
      <div class="bg-black/30 border border-white/10 rounded-lg p-6 font-mono text-sm text-[#4ade80] leading-relaxed mb-6">
        Audit my project against the CTO Checklist. Start a cto-workspace, set up the checklist for audits, and follow the CLAUDE.md instructions.
      </div>
      <CopyPromptButton client:idle />
    </div>
  </section>

  <!-- Step 2: What happens -->
  <section class="py-16 px-6">
    <div class="max-w-3xl mx-auto">
      <div class="inline-flex items-center justify-center w-8 h-8 bg-[#16a34a] text-white rounded-lg font-black text-sm mb-4">2</div>
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Claude runs the audit</h2>
      <p class="text-gray-500 mb-6 leading-relaxed">
        Claude Code clones your repo, scans 42 sections, runs automated checks (git config, CI status, file structure), and asks targeted questions about what it can't verify automatically.
      </p>

      <div class="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 class="font-bold text-sm text-gray-900 mb-4">What a workspace looks like:</h3>
        <pre class="font-mono text-xs text-gray-600 leading-relaxed">cto-workspace/
├── org.yaml              # Your organization config
├── projects/
│   └── my-app.yaml       # Project config + repo URL
├── checklist/            # CTO Checklist (submodule)
│   ├── 01-git-repo-setup/
│   ├── 02-dependencies/
│   └── ... (42 sections)
└── audits/
    └── my-app/
        └── 2026-04-01/   # Dated audit results
            ├── GIT-001.md
            ├── SEC-003.md
            └── summary.md</pre>
      </div>
    </div>
  </section>

  <!-- Step 3: The Report -->
  <section class="bg-gray-50 py-16 px-6">
    <div class="max-w-3xl mx-auto">
      <div class="inline-flex items-center justify-center w-8 h-8 bg-[#16a34a] text-white rounded-lg font-black text-sm mb-4">3</div>
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Get your audit report</h2>
      <p class="text-gray-500 mb-6 leading-relaxed">
        Every item gets a structured result: pass, fail, or partial. Evidence is captured, failures include recommendations, and the summary gives you the full picture.
      </p>

      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <h3 class="font-bold text-sm text-gray-900 mb-4">Sample audit result:</h3>
        <pre class="font-mono text-xs text-gray-600 leading-relaxed">---
item_id: GIT-001
status: pass
---

## Summary
Repository clones cleanly and runs with a single
`pnpm install && pnpm dev` command. All sandbox
env vars provided in .env.example.

## Evidence
- Clone: ✓ completed in 4.2s
- Install: ✓ pnpm install (no errors)
- Dev server: ✓ starts on port 3000
- .env.example: ✓ present with 12 variables</pre>
      </div>
    </div>
  </section>

  <!-- Who It's For -->
  <section class="py-16 px-6">
    <div class="max-w-3xl mx-auto">
      <h2 class="text-2xl font-bold text-gray-900 mb-8 text-center">Built for how you work</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="border border-gray-200 rounded-lg p-6">
          <h3 class="font-bold text-gray-900 mb-2">For CTOs</h3>
          <p class="text-sm text-gray-500 leading-relaxed">
            Run a comprehensive audit across all 42 sections. Delegate to your team with clear pass/fail criteria. Track improvements over time with dated reports.
          </p>
        </div>
        <div class="border border-gray-200 rounded-lg p-6">
          <h3 class="font-bold text-gray-900 mb-2">For Founders</h3>
          <p class="text-sm text-gray-500 leading-relaxed">
            Get CTO-level infrastructure review without hiring one yet. Identify critical gaps in security, monitoring, and deployment before they become incidents.
          </p>
        </div>
        <div class="border border-gray-200 rounded-lg p-6">
          <h3 class="font-bold text-gray-900 mb-2">For CEOs & VPs</h3>
          <p class="text-sm text-gray-500 leading-relaxed">
            Verify your technical team isn't missing critical items. Get a structured report you can read without deep technical knowledge. Evidence-based confidence.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="bg-[#f0fdf4] border-y border-[#bbf7d0] py-16 px-6 text-center">
    <h2 class="text-2xl font-extrabold text-[#052e16] mb-4">Ready to audit your project?</h2>
    <div class="flex gap-3 justify-center">
      <CopyPromptButton client:idle />
      <a href="/checklist/" class="bg-white text-[#052e16] px-8 py-3 rounded-lg text-sm font-semibold border border-[#bbf7d0] hover:bg-[#dcfce7] transition-colors">
        Browse the Checklist
      </a>
    </div>
  </section>

</BaseLayout>
```

- [ ] **Step 2: Verify in browser**

Navigate to `http://localhost:4321/how-it-works/`. Verify: all sections render, copy button works, persona cards display.

- [ ] **Step 3: Verify build**

```bash
cd /Users/rodric/Claude/personal/ultimate-cto-checklist/website
pnpm build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add website/src/pages/how-it-works.astro
git commit -m "feat(website): add How It Works page"
```

---

## Task 8: Checklist Search Island

**Files:**
- Create: `website/src/islands/ChecklistSearch.tsx`
- Modify: `website/src/pages/checklist/[slug].astro`

- [ ] **Step 1: Create ChecklistSearch component**

Create `website/src/islands/ChecklistSearch.tsx`:

```tsx
import { useState } from 'react';

interface SearchItem {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'recommended';
  sectionSlug: string;
  sectionName: string;
}

interface Props {
  items: SearchItem[];
}

export default function ChecklistSearch({ items }: Props) {
  const [query, setQuery] = useState('');

  const results = query.length < 2
    ? []
    : items.filter(item =>
        item.id.toLowerCase().includes(query.toLowerCase()) ||
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 20);

  return (
    <div className="mb-6">
      <input
        type="text"
        placeholder="Search items... (e.g. 'secrets', 'GIT-001')"
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/10"
      />
      {results.length > 0 && (
        <div className="mt-2 border border-gray-200 rounded-lg bg-white divide-y divide-gray-100 max-h-80 overflow-y-auto">
          {results.map(item => (
            <a
              key={item.id}
              href={`/checklist/${item.sectionSlug}/`}
              className="block px-4 py-2.5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#16a34a] font-semibold">{item.id}</span>
                <span className="text-sm text-gray-900">{item.title}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  item.severity === 'critical' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                }`}>
                  {item.severity}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{item.sectionName}</p>
            </a>
          ))}
        </div>
      )}
      {query.length >= 2 && results.length === 0 && (
        <p className="mt-2 text-sm text-gray-400 px-1">No items match "{query}"</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire search into checklist pages**

In `website/src/pages/checklist/[slug].astro`, add the search island. Add to the imports:

```astro
import ChecklistSearch from '../../islands/ChecklistSearch';
```

Build the search index from all sections and pass it as a prop:

```astro
const allSections = loadAllSections();
const searchItems = allSections.flatMap(s =>
  s.items.map(item => ({
    id: item.id,
    title: item.title,
    description: item.description,
    severity: item.severity,
    sectionSlug: s.slug,
    sectionName: s.name,
  }))
);
```

Insert `<ChecklistSearch client:idle items={searchItems} />` above the items listing in the main content area.

- [ ] **Step 3: Verify in browser**

Navigate to a checklist section page. Type "secrets" in the search box. Verify: results filter across all sections, clicking a result navigates to that section.

- [ ] **Step 4: Commit**

```bash
git add website/src/islands/ChecklistSearch.tsx website/src/pages/checklist/\[slug\].astro
git commit -m "feat(website): add client-side checklist search"
```

---

## Task 9: GitHub Actions Deployment

**Files:**
- Create: `website/.github/workflows/deploy.yml`

Note: Since the website lives inside the existing repo, the workflow path is `.github/workflows/deploy-website.yml` at the repo root.

- [ ] **Step 1: Create the deploy workflow**

Create `.github/workflows/deploy-website.yml`:

```yaml
name: Deploy Website

on:
  push:
    branches: [main]
    paths:
      - 'website/**'
      - 'checklist/**'

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
          cache-dependency-path: website/pnpm-lock.yaml

      - name: Install dependencies
        working-directory: website
        run: pnpm install --frozen-lockfile

      - name: Build
        working-directory: website
        run: pnpm build

      - uses: actions/upload-pages-artifact@v3
        with:
          path: website/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Verify build locally**

```bash
cd /Users/rodric/Claude/personal/ultimate-cto-checklist/website
pnpm build
```

Expected: Clean build, static files in `dist/`, CNAME in `dist/`.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy-website.yml
git commit -m "ci: add GitHub Actions workflow for website deployment"
```

---

## Task 10: Final Verification

- [ ] **Step 1: Run all tests**

```bash
cd /Users/rodric/Claude/personal/ultimate-cto-checklist/website
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 2: Full build check**

```bash
cd /Users/rodric/Claude/personal/ultimate-cto-checklist/website
pnpm build
```

Expected: Clean build with no warnings.

- [ ] **Step 3: Check all routes exist in build output**

```bash
ls website/dist/index.html
ls website/dist/how-it-works/index.html
ls website/dist/checklist/index.html
ls website/dist/checklist/git-repo-setup/index.html
ls website/dist/checklist/internationalization/index.html
```

Expected: All files exist.

- [ ] **Step 4: Verify CNAME**

```bash
cat website/dist/CNAME
```

Expected: `cto-checklist.com`

- [ ] **Step 5: Commit any final fixes**

If any issues were found, fix and commit.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat(website): complete cto-checklist.com — ready for deployment"
```
