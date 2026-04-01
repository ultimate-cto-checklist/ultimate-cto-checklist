# Floating Questions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mixed floating items on the homepage with questions-only bubbles, colored by domain cluster, sourced from `question` fields in each item's YAML.

**Architecture:** Add optional `question` field to items.yaml (252 items across 42 sections). Build-time helper extracts and pre-resolves colors. React island receives flat array of `{ question, bg, border, text }` as prop.

**Tech Stack:** Astro 6, React 19, TypeScript, YAML

**Spec:** `docs/superpowers/specs/2026-04-01-floating-questions-design.md`

---

### Task 1: Update data layer (types + content helper)

**Files:**
- Modify: `website/src/lib/types.ts`
- Modify: `website/src/lib/content.ts`

- [ ] **Step 1: Add `question` field to `Item` type**

In `website/src/lib/types.ts`, add to the `Item` interface:

```typescript
question?: string | string[];
```

- [ ] **Step 2: Extract `question` in `parseItem`**

In `website/src/lib/content.ts`, update `parseItem` to include:

```typescript
question: raw.question as string | string[] | undefined,
```

- [ ] **Step 3: Add `loadAllQuestions()` helper**

In `website/src/lib/content.ts`, add the cluster color map and helper:

```typescript
interface FloatingQuestion {
  question: string;
  bg: string;
  border: string;
  text: string;
}

const CLUSTER_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  infrastructure: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
  data: { bg: '#f5f3ff', border: '#ddd6fe', text: '#5b21b6' },
  observability: { bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
  security: { bg: '#fff1f2', border: '#fecdd3', text: '#9f1239' },
  operations: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' },
};

function getCluster(sectionId: string): string {
  const num = parseInt(sectionId, 10);
  if (num >= 1 && num <= 4) return 'infrastructure';
  if (num === 5 || num === 6 || num === 24 || num === 25) return 'data';
  if ((num >= 7 && num <= 9) || (num >= 12 && num <= 14) || num === 19 || num === 20) return 'observability';
  if ((num >= 30 && num <= 35) || num === 38 || num === 39) return 'security';
  return 'operations';
}

export function loadAllQuestions(): FloatingQuestion[] {
  const sections = loadAllSections();
  const questions: FloatingQuestion[] = [];
  for (const section of sections) {
    const colors = CLUSTER_COLORS[getCluster(section.id)];
    for (const item of section.items) {
      if (!item.question) continue;
      const qs = Array.isArray(item.question) ? item.question : [item.question];
      for (const q of qs) {
        questions.push({ question: q, ...colors });
      }
    }
  }
  return questions;
}
```

- [ ] **Step 4: Export the `FloatingQuestion` type**

Add to the exports in `types.ts`:

```typescript
export interface FloatingQuestion {
  question: string;
  bg: string;
  border: string;
  text: string;
}
```

And import it in `content.ts` instead of defining it locally.

- [ ] **Step 5: Verify build**

Run: `cd website && npx astro check 2>&1 | head -30`
Expected: No new errors related to these changes.

- [ ] **Step 6: Commit**

```bash
git add website/src/lib/types.ts website/src/lib/content.ts
git commit -m "feat(website): add question field to Item type and loadAllQuestions helper"
```

---

### Task 2: Update FloatingItems component

**Files:**
- Modify: `website/src/islands/FloatingItems.tsx`
- Modify: `website/src/pages/index.astro`

- [ ] **Step 1: Rewrite FloatingItems to accept questions as prop**

Replace entire `website/src/islands/FloatingItems.tsx`:

```tsx
import { useEffect, useRef } from 'react';
import type { FloatingQuestion } from '../lib/types';

const MAX_VISIBLE = 7;

export default function FloatingItems({ questions }: { questions: FloatingQuestion[] }) {
  const areaRef = useRef<HTMLDivElement>(null);
  const activeCount = useRef(0);

  useEffect(() => {
    const area = areaRef.current;
    if (!area || questions.length === 0) return;

    function spawn() {
      if (!area || activeCount.current >= MAX_VISIBLE) return;
      const data = questions[Math.floor(Math.random() * questions.length)];
      const el = document.createElement('div');
      el.style.position = 'absolute';
      el.style.borderRadius = '8px';
      el.style.padding = '0.5rem 0.9rem';
      el.style.fontSize = '0.78rem';
      el.style.maxWidth = '340px';
      el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
      el.style.opacity = '0';
      el.style.transition = 'opacity 1.2s ease';
      el.style.background = data.bg;
      el.style.border = `1px solid ${data.border}`;
      el.style.color = data.text;
      el.textContent = data.question;
      const rect = area.getBoundingClientRect();
      el.style.left = `${30 + Math.random() * (rect.width - 350)}px`;
      el.style.top = `${30 + Math.random() * (rect.height - 60)}px`;
      area.appendChild(el);
      activeCount.current++;
      requestAnimationFrame(() => { requestAnimationFrame(() => { el.style.opacity = '1'; }); });
      const lifetime = 3000 + Math.random() * 4000;
      setTimeout(() => {
        el.style.opacity = '0';
        setTimeout(() => { el.remove(); activeCount.current--; }, 1200);
      }, lifetime);
    }
    const initTimers = Array.from({ length: 5 }, (_, i) => setTimeout(spawn, i * 500));
    const interval = setInterval(spawn, 1400);
    return () => { initTimers.forEach(clearTimeout); clearInterval(interval); };
  }, [questions]);

  return (
    <div ref={areaRef} className="relative overflow-hidden" style={{ minHeight: '340px' }}>
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#f8fffe] to-transparent z-10 pointer-events-none" />
    </div>
  );
}
```

- [ ] **Step 2: Update index.astro to pass questions**

In `website/src/pages/index.astro`, update the frontmatter and component usage:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Hero from '../components/Hero.astro';
import HowItWorksExcerpt from '../components/HowItWorksExcerpt.astro';
import DomainGrid from '../components/DomainGrid.astro';
import EmailCapture from '../components/EmailCapture.astro';
import FloatingItems from '../islands/FloatingItems';
import { loadAllQuestions } from '../lib/content';

const questions = loadAllQuestions();
---

<BaseLayout title="Home" description="The open-source audit framework for technical leaders. AI-powered, ruthlessly comprehensive.">
  <Hero />
  <FloatingItems client:idle questions={questions} />
  <HowItWorksExcerpt />
  <DomainGrid />
  <EmailCapture />
</BaseLayout>
```

- [ ] **Step 3: Verify build**

Run: `cd website && npx astro check 2>&1 | head -30`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add website/src/islands/FloatingItems.tsx website/src/pages/index.astro
git commit -m "feat(website): FloatingItems accepts questions prop with cluster colors"
```

---

### Task 3: Generate questions for sections 01-07

**Files:**
- Modify: `checklist/01-git-repo-setup/items.yaml`
- Modify: `checklist/02-dependencies/items.yaml`
- Modify: `checklist/03-authentication-endpoints/items.yaml`
- Modify: `checklist/04-environments/items.yaml`
- Modify: `checklist/05-database-connections/items.yaml`
- Modify: `checklist/06-resilience/items.yaml`
- Modify: `checklist/07-health-endpoints/items.yaml`

Add a `question` field to every item in these files. Questions must be:
- Punchy, second-person, slightly confrontational
- Make a CTO pause and think "...actually, I'm not sure"
- Vary in structure (don't start every question with "Do you...")
- Short enough to fit in a floating bubble (~60 chars max ideal, 80 absolute max)

Reference the full item list for context:
- Section 01 (19 items): GIT-001 through GIT-020 (no GIT-004)
- Section 02 (7 items): DEP-001 through DEP-007
- Section 03 (10 items): AUTH-001 through AUTH-010
- Section 04 (9 items): ENV-001 through ENV-009
- Section 05 (9 items): DB-001 through DB-009
- Section 06 (1 item): RES-001
- Section 07 (2 items): HEALTH-001 through HEALTH-002

Read each items.yaml file, add the `question` field after `title` (for object-style) or after `severity` (wherever natural). Preserve all existing fields exactly.

- [ ] **Step 1: Add questions to sections 01-07**
- [ ] **Step 2: Verify YAML is valid**

Run: `python3 -c "import yaml; [yaml.safe_load(open(f'checklist/{d}/items.yaml')) for d in ['01-git-repo-setup','02-dependencies','03-authentication-endpoints','04-environments','05-database-connections','06-resilience','07-health-endpoints']]; print('OK')"`

- [ ] **Step 3: Commit**

```bash
git add checklist/01-*/items.yaml checklist/02-*/items.yaml checklist/03-*/items.yaml checklist/04-*/items.yaml checklist/05-*/items.yaml checklist/06-*/items.yaml checklist/07-*/items.yaml
git commit -m "feat(checklist): add questions to sections 01-07 (57 items)"
```

---

### Task 4: Generate questions for sections 08-14

**Files:**
- Modify: `checklist/08-testing/items.yaml`
- Modify: `checklist/09-development-flow/items.yaml`
- Modify: `checklist/10-deployments/items.yaml`
- Modify: `checklist/11-production-access/items.yaml`
- Modify: `checklist/12-monitoring/items.yaml`
- Modify: `checklist/13-cloudflare/items.yaml`
- Modify: `checklist/14-documentation/items.yaml`

Same question tone and format as Task 3.

- Section 08 (6 items): TEST-001 through TEST-006
- Section 09 (6 items): FLOW-001 through FLOW-006
- Section 10 (4 items): DEPLOY-001 through DEPLOY-004
- Section 11 (3 items): ACCESS-001 through ACCESS-003
- Section 12 (6 items): MON-001 through MON-006
- Section 13 (7 items): SEC-001 through SEC-007
- Section 14 (3 items): DOC-001 through DOC-003

- [ ] **Step 1: Add questions to sections 08-14**
- [ ] **Step 2: Verify YAML is valid**
- [ ] **Step 3: Commit**

```bash
git add checklist/08-*/items.yaml checklist/09-*/items.yaml checklist/10-*/items.yaml checklist/11-*/items.yaml checklist/12-*/items.yaml checklist/13-*/items.yaml checklist/14-*/items.yaml
git commit -m "feat(checklist): add questions to sections 08-14 (35 items)"
```

---

### Task 5: Generate questions for sections 15-21

**Files:**
- Modify: `checklist/15-admin-features/items.yaml`
- Modify: `checklist/16-cto-features/items.yaml`
- Modify: `checklist/17-performance/items.yaml`
- Modify: `checklist/18-analytics/items.yaml`
- Modify: `checklist/19-error-tracking/items.yaml`
- Modify: `checklist/20-email/items.yaml`
- Modify: `checklist/21-caching/items.yaml`

Same question tone and format as Task 3.

- Section 15 (6 items): ADM-001 through ADM-006
- Section 16 (1 item): CTO-001
- Section 17 (4 items): PERF-001 through PERF-004
- Section 18 (5 items): ANA-001 through ANA-005
- Section 19 (8 items): ERR-001 through ERR-008
- Section 20 (8 items): EMAIL-001 through EMAIL-008
- Section 21 (2 items): CACHE-001 through CACHE-002

- [ ] **Step 1: Add questions to sections 15-21**
- [ ] **Step 2: Verify YAML is valid**
- [ ] **Step 3: Commit**

```bash
git add checklist/15-*/items.yaml checklist/16-*/items.yaml checklist/17-*/items.yaml checklist/18-*/items.yaml checklist/19-*/items.yaml checklist/20-*/items.yaml checklist/21-*/items.yaml
git commit -m "feat(checklist): add questions to sections 15-21 (34 items)"
```

---

### Task 6: Generate questions for sections 22-28

**Files:**
- Modify: `checklist/22-frontend-performance/items.yaml`
- Modify: `checklist/23-client-side-storage/items.yaml`
- Modify: `checklist/24-data-retention/items.yaml`
- Modify: `checklist/25-intrusion-detection/items.yaml`
- Modify: `checklist/26-high-availability/items.yaml`
- Modify: `checklist/27-database-tools/items.yaml`
- Modify: `checklist/28-code-architecture/items.yaml`

Same question tone and format as Task 3.

- Section 22 (4 items): FEP-001 through FEP-004
- Section 23 (3 items): CSS-001 through CSS-003
- Section 24 (5 items): RET-001 through RET-005
- Section 25 (4 items): IDS-001 through IDS-004
- Section 26 (6 items): HA-001 through HA-006
- Section 27 (2 items): DBT-001 through DBT-002
- Section 28 (3 items): ARCH-001 through ARCH-003

- [ ] **Step 1: Add questions to sections 22-28**
- [ ] **Step 2: Verify YAML is valid**
- [ ] **Step 3: Commit**

```bash
git add checklist/22-*/items.yaml checklist/23-*/items.yaml checklist/24-*/items.yaml checklist/25-*/items.yaml checklist/26-*/items.yaml checklist/27-*/items.yaml checklist/28-*/items.yaml
git commit -m "feat(checklist): add questions to sections 22-28 (27 items)"
```

---

### Task 7: Generate questions for sections 29-35

**Files:**
- Modify: `checklist/29-secrets-management/items.yaml`
- Modify: `checklist/30-rate-limiting/items.yaml`
- Modify: `checklist/31-api-security/items.yaml`
- Modify: `checklist/32-csp/items.yaml`
- Modify: `checklist/33-feature-flags/items.yaml`
- Modify: `checklist/34-rollback-recovery/items.yaml`
- Modify: `checklist/35-incident-response/items.yaml`

Same question tone and format as Task 3.

- Section 29 (6 items): SEC-001 through SEC-006
- Section 30 (3 items): RATE-001 through RATE-003
- Section 31 (6 items): API-001 through API-006
- Section 32 (4 items): CSP-001 through CSP-004
- Section 33 (2 items): FF-001 through FF-002
- Section 34 (8 items): RR-001 through RR-008
- Section 35 (7 items): IR-001 through IR-007

- [ ] **Step 1: Add questions to sections 29-35**
- [ ] **Step 2: Verify YAML is valid**
- [ ] **Step 3: Commit**

```bash
git add checklist/29-*/items.yaml checklist/30-*/items.yaml checklist/31-*/items.yaml checklist/32-*/items.yaml checklist/33-*/items.yaml checklist/34-*/items.yaml checklist/35-*/items.yaml
git commit -m "feat(checklist): add questions to sections 29-35 (36 items)"
```

---

### Task 8: Generate questions for sections 36-42

**Files:**
- Modify: `checklist/36-load-testing/items.yaml`
- Modify: `checklist/37-gdpr/items.yaml`
- Modify: `checklist/38-cost-monitoring/items.yaml`
- Modify: `checklist/39-developer-onboarding/items.yaml`
- Modify: `checklist/40-tech-debt/items.yaml`
- Modify: `checklist/41-accessibility/items.yaml`
- Modify: `checklist/42-i18n/items.yaml`

Same question tone and format as Task 3.

- Section 36 (8 items): LST-001 through LST-008
- Section 37 (11 items): GDPR-001 through GDPR-011
- Section 38 (5 items): COST-001 through COST-005
- Section 39 (9 items): DEV-001 through DEV-009
- Section 40 (8 items): DEBT-001 through DEBT-008
- Section 41 (11 items): A11Y-001 through A11Y-011
- Section 42 (11 items): I18N-001 through I18N-011

- [ ] **Step 1: Add questions to sections 36-42**
- [ ] **Step 2: Verify YAML is valid**
- [ ] **Step 3: Commit**

```bash
git add checklist/36-*/items.yaml checklist/37-*/items.yaml checklist/38-*/items.yaml checklist/39-*/items.yaml checklist/40-*/items.yaml checklist/41-*/items.yaml checklist/42-*/items.yaml
git commit -m "feat(checklist): add questions to sections 36-42 (63 items)"
```

---

### Task 9: Verify end-to-end

- [ ] **Step 1: Run full YAML validation**

```bash
python3 -c "
import yaml, glob
total_q = 0
for f in sorted(glob.glob('checklist/*/items.yaml')):
    data = yaml.safe_load(open(f))
    for item in data.get('items', []):
        q = item.get('question')
        if q:
            qs = q if isinstance(q, list) else [q]
            total_q += len(qs)
print(f'Total questions: {total_q}')
assert total_q >= 252, f'Expected >= 252 questions, got {total_q}'
print('PASS')
"
```

- [ ] **Step 2: Build the website**

```bash
cd website && npx astro build 2>&1 | tail -20
```

Expected: Build succeeds, no errors.

- [ ] **Step 3: Spot-check the output**

```bash
cd website && npx astro build 2>&1 > /dev/null && grep -c 'question' dist/index.html
```

Expected: Non-zero count (questions are serialized into the page).

- [ ] **Step 4: Dev server visual check**

```bash
cd website && npx astro dev --port 4321 &
```

Open http://localhost:4321 and verify floating questions appear with varied colors.
