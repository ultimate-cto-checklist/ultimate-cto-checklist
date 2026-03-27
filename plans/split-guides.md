# Plan: Split guide.md into overview.md + per-item {ITEM-ID}.md files

## Context

Each of the 42 checklist sections currently has a single `guide.md` containing both the section overview/preamble and all per-item verification guides. Splitting into individual files makes items easier to find in the filesystem and simplifies how skills/agents load item-specific content (direct file read vs regex extraction).

## Target Structure

```
checklist/01-git-repo-setup/
├── items.yaml              # unchanged
├── overview.md             # preamble: title, goal, before-you-start, audit process
├── GIT-001.md              # per-item verification guide
├── GIT-002.md
├── GIT-003.md
└── ...
```

- `guide.md` is **deleted** (no backward compat shim)
- `overview.md` = everything before the first `---` separator in the current guide.md
- `{ITEM-ID}.md` = the `### ITEM-ID: Title` block content (heading included)
- Closing "Completing the Audit" section goes into `overview.md` (it's section-level, not item-level)

## Implementation Steps

### 1. Write a split script
Create `scripts/split-guides.ts` that:
- For each section, reads `guide.md`
- Extracts overview (before `---`) + closing section (after last item) → `overview.md`
- Extracts each `### ITEM-ID:` block → `{ITEM-ID}.md`
- Handles section 05's `## ITEM-ID:` variant
- Deletes the original `guide.md`
- Reports stats (sections processed, files created)

### 2. Run the script
Execute to generate all ~320 item files + 42 overview files.

### 3. Update dashboard (`dashboard/lib/checklist.ts`)
**`getSection()`** (line 254-266):
- Change from reading `guide.md` to reading `overview.md` for the intro
- Read individual `{ITEM-ID}.md` files per item
- Store per-item guides in a new `itemGuides: Record<string, string>` field on Section (or keep compositing a single string — TBD based on simplicity)

**`listSections()`** (line 140-150):
- Change `guide.md` → `overview.md` for goal extraction

**Section interface** (line 28-36):
- Either keep `guide: string` and reconstruct, or change to `overview: string` + `itemGuides: Record<string, string>`

### 4. Update dashboard (`dashboard/components/SectionContent.tsx`)
- Remove `extractItemGuide()` and `extractIntroGuide()` functions — no longer needed
- Accept `overview` and `itemGuides` map instead of single `guide` string
- Pass item guide directly from the map to `ChecklistItem`

### 5. Update dashboard section page (`dashboard/app/section/[slug]/page.tsx`)
- Pass the new props to `SectionContent`

### 6. Update 5 skills that reference guide.md
- **audit-start**: `guide.md section for this item` → `checklist/[section]/[ITEM-ID].md`
- **audit-continue**: same pattern
- **audit-item**: same pattern
- **audit-fix**: same pattern
- **audit-section**: `reads the section's guide.md` → `reads overview.md and [ITEM-ID].md files`

### 7. Update tests
- `dashboard/__tests__/checklist.test.ts` — update guide-related assertions
- `dashboard/__tests__/GuidePanel.test.tsx` — should still work (renders markdown)

### 8. Update CLAUDE.md and memory
- Remove references to `guide.md`, document new structure

## Key Files to Modify

- `scripts/split-guides.ts` (new)
- `checklist/*/guide.md` → `overview.md` + `{ID}.md` (42 sections)
- `dashboard/lib/checklist.ts`
- `dashboard/components/SectionContent.tsx`
- `dashboard/app/section/[slug]/page.tsx`
- `skills/audit-start/SKILL.md`
- `skills/audit-continue/SKILL.md`
- `skills/audit-item/SKILL.md`
- `skills/audit-fix/SKILL.md`
- `skills/audit-section/SKILL.md`
- `dashboard/__tests__/checklist.test.ts`
- `CLAUDE.md`

## Verification

1. Run the split script and verify file counts match item counts per section
2. `pnpm --prefix dashboard build` — TypeScript compiles
3. Start dashboard dev server and browse a section — overview shows at top, item guides show when expanded
4. Spot-check 3-4 sections to confirm content is intact
5. Run `pnpm --prefix dashboard test` for existing tests
