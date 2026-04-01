# Floating Questions Design

## Summary

Replace the FloatingItems component's mixed content (checklist items, section names, questions) with **questions only** — one or more per checklist item (252 items total). Questions use a punchy, second-person, slightly uncomfortable tone. Visual variety comes from coloring bubbles by domain cluster.

## Data Layer

### `question` field in items.yaml

Each item gets a `question` field — string or array of strings:

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

### Domain Clusters

Five clusters, each with a color palette:

| Cluster | Sections | Background | Border |
|---------|----------|------------|--------|
| Infrastructure | 01-04 | `#eff6ff` | `#bfdbfe` |
| Data & Resilience | 05-06, 24-25 | `#f5f3ff` | `#ddd6fe` |
| Observability & Reliability | 07-09, 12-14, 19-20 | `#fffbeb` | `#fde68a` |
| Security & Compliance | 30-35, 38-39 | `#fff1f2` | `#fecdd3` |
| Operations & Team | 10-11, 15-18, 21-23, 26-29, 36-37, 40-42 | `#f0fdf4` | `#bbf7d0` |

Text color: darker shade of each cluster's hue.

## Build Pipeline

1. `loadAllSections()` already parses items.yaml at build time
2. New helper extracts all questions with section number
3. Maps section number to cluster
4. Passes flat `{ question: string, cluster: string }[]` as prop to FloatingItems

## Component Changes

- Single bubble type: question text in cluster-colored bubble
- No "?" prefix or italic — clean text only
- Same animation: random position, max 7 visible, 1.2s fade, 3-7s lifetime, 1.4s spawn interval
- Style per cluster: background, border, text color from mapping

## Question Tone

Punchy, second-person, slightly confrontational. Examples:
- "What happens to your app when Stripe goes down?"
- "Could someone push straight to main right now?"
- "Do your error alerts actually wake someone up?"
- "How long until a new hire ships their first PR?"
