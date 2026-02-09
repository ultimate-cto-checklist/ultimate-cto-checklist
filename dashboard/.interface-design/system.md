# CTO Checklist Design System

## Intent

**Who:** CTOs and technical leads auditing their technical infrastructure. Busy, technical, want confidence their systems are solid.

**Task:** Verify technical infrastructure, check items, find gaps, feel assured.

**Feel:** Command center for technical leadership. Modern DevOps energy. Confident and authoritative without being cold.

---

## Palette

### Brand Colors — Teal/Cyan
Modern DevOps feel inspired by Docker, AWS, Kubernetes ecosystem.

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `teal-600` (#0d9488) | Headers, accents, interactive elements |
| Primary Light | `teal-400` (#2dd4bf) | Hover states, gradients |
| Primary Dark | `teal-800` (#115e59) | Gradient anchors |
| Secondary | `cyan-500` (#06b6d4) | Gradient endpoints, code highlights |

### Severity Colors

| Severity | Background | Text | Indicator |
|----------|------------|------|-----------|
| Critical | `amber-100` | `amber-800` | `amber-500` |
| Recommended | `teal-50` | `teal-700` | `teal-400` |

### Status Colors

| Status | Color | Usage |
|--------|-------|-------|
| Success/Items | `emerald-500` | Item counts, passing states |
| Warning/Critical | `amber-500` | Critical counts, warnings |

### Foundation

- Background: `slate-50` (#f8fafc) — subtle off-white
- Foreground: `slate-800` (#1e293b)
- Card background: white
- Borders: `slate-200`

---

## Typography

**Font:** Geist (sans) and Geist Mono

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Page title | 2xl | bold | white (on gradient header) |
| Section number badge | sm | bold | `teal-700` |
| Section name | lg | semibold | `slate-800` |
| Card description | sm | normal | `slate-600` |
| Category header | base | bold | `slate-800` |
| Item title | base | medium | `slate-800` |
| Body text | sm | normal | `slate-600` |
| Code inline | sm | medium | `cyan-400` on `slate-800` |

---

## Spacing

Base unit: 4px (Tailwind default)

| Context | Value |
|---------|-------|
| Card padding | p-5 (20px) |
| Card gap | gap-5 (20px) |
| Section spacing | space-y-8 (32px) |
| Item spacing | space-y-3 (12px) |

---

## Depth & Surfaces

### Cards
- Base: `rounded-xl bg-white border border-slate-200 shadow-sm`
- Hover: `hover:shadow-lg hover:shadow-teal-500/10 hover:border-teal-300`
- Selected: `border-teal-400 ring-2 ring-teal-100 shadow-md shadow-teal-500/10`

### Accent Bar
Top accent bar on cards:
```
h-1 bg-gradient-to-r from-teal-500 to-cyan-500
```

### Header
Gradient header bar:
```
bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-600 shadow-lg shadow-teal-500/20
```

---

## Components

### Section Number Badge
```
w-10 h-10 rounded-lg bg-teal-50 text-teal-700 font-bold text-sm
```
Large variant (section detail):
```
w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white font-bold text-lg shadow-lg shadow-teal-500/25
```

### Severity Chip
```
text-xs px-2.5 py-1 rounded-full font-semibold border
```
Critical: `bg-amber-100 text-amber-800 border-amber-200`
Recommended: `bg-teal-50 text-teal-700 border-teal-100`

### Stats Pill
```
inline-flex items-center gap-1.5 text-sm
```
With colored dot indicator (`w-2 h-2 rounded-full`)

### Category Header
```
text-base font-bold text-slate-800 capitalize tracking-tight flex items-center gap-2
```
With vertical accent bar: `w-1 h-5 rounded-full bg-gradient-to-b from-teal-500 to-cyan-500`

---

## Prose Styling

Links: `text-teal-600 hover:underline`
Inline code: `bg-slate-800 text-cyan-400 rounded-md`
Code blocks: `bg-slate-900 border-slate-700`
Blockquotes: `border-l-3 border-teal-400 bg-teal-50`

---

## Transitions

Standard: `transition-all duration-200`
Hover transforms: `group-hover:-translate-x-0.5` (back arrow)
Expand indicator: `transition-transform duration-200 rotate-90` when expanded
