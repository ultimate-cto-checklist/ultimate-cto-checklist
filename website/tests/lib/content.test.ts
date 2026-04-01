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
