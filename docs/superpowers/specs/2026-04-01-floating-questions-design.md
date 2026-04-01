# Floating Questions Design

## Summary

Replace the FloatingItems component's mixed content (checklist items, section names, questions) with **questions only** — one or more per checklist item (252 items total). Questions use a punchy, second-person, slightly uncomfortable tone. Visual variety comes from coloring bubbles by domain cluster.

## Data Layer

### `question` field in items.yaml

Each item gets an optional `question` field — string or array of strings:

```yaml
- id: GIT-001
  title: Clone and run immediately
  question: "Can a new hire clone and run your app in under 10 minutes?"

- id: SEC-003
  title: Secrets rotation policy
  question:
    - "When was your last secret rotation?"
    - "Do you even know which secrets are in production right now?"
```

The field is optional. Items without a `question` are skipped by the build helper. This supports incremental rollout — the component works with however many questions exist. Both items.yaml formats (object-style sections 01-20, flat-style sections 21-42) support the field identically.

### Domain Clusters (visual only)

Five visual-only clusters for coloring floating bubbles. These are distinct from the 16-domain model in `website/src/lib/domains.ts` — they exist only in the FloatingItems component for visual variety.

| Cluster | Sections | Background | Border | Text |
|---------|----------|------------|--------|------|
| Infrastructure | 01-04 | `#eff6ff` | `#bfdbfe` | `#1e40af` |
| Data & Resilience | 05-06, 24-25 | `#f5f3ff` | `#ddd6fe` | `#5b21b6` |
| Observability & Reliability | 07-09, 12-14, 19-20 | `#fffbeb` | `#fde68a` | `#92400e` |
| Security & Compliance | 30-35, 38-39 | `#fff1f2` | `#fecdd3` | `#9f1239` |
| Operations & Team | 10-11, 15-18, 21-23, 26-29, 36-37, 40-42 | `#f0fdf4` | `#bbf7d0` | `#166534` |

## Build Pipeline

Files that need modification:

1. **`website/src/lib/types.ts`** — add `question?: string | string[]` to `Item` type
2. **`website/src/lib/content.ts`** — extract the `question` field in `parseItem`, add new `loadAllQuestions()` helper that returns `{ question: string, bg: string, border: string, text: string }[]` (pre-resolved colors, keeps the React island small)
3. **`website/src/pages/index.astro`** — call `loadAllQuestions()`, pass result as prop
4. **`website/src/islands/FloatingItems.tsx`** — accept props, render questions with pre-resolved styles

Color resolution happens server-side in the helper, not in the React island. The prop is pre-resolved `{ question, bg, border, text }[]` — no cluster mapping needed client-side.

## Component Changes

- Single bubble type: question text in cluster-colored bubble
- No "?" prefix or italic — clean text only
- Same animation: random position, max 7 visible, 1.2s fade, 3-7s lifetime, 1.4s spawn interval
- Style per bubble: pre-resolved bg, border, text from props
- With 252+ questions, inline JSON will be ~15-25KB — acceptable for a landing page

## Question Tone

Punchy, second-person, slightly confrontational. Examples:
- "What happens to your app when Stripe goes down?"
- "Could someone push straight to main right now?"
- "Do your error alerts actually wake someone up?"
- "How long until a new hire ships their first PR?"
