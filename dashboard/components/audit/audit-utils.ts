import type { AuditResult } from '@/lib/checklist';

export interface SectionStats {
  section: string;
  total: number;
  pass: number;
  fail: number;
  partial: number;
  blocked: number;
  waived: number;
  passRate: number;
  criticalFails: number;
  items: AuditResult[];
}

export interface OverallStats {
  total: number;
  pass: number;
  fail: number;
  partial: number;
  blocked: number;
  waived: number;
  passRate: number;
  criticalFails: number;
  recommendedFails: number;
}

/**
 * Compute statistics for each section from audit results.
 * Groups results by section and calculates pass rate, critical failures, etc.
 * Optimized to use a single pass through the items array.
 */
export function computeSectionStats(results: AuditResult[]): SectionStats[] {
  if (results.length === 0) {
    return [];
  }

  // Group results by section
  const sectionMap = new Map<string, AuditResult[]>();
  for (const result of results) {
    const items = sectionMap.get(result.section) || [];
    items.push(result);
    sectionMap.set(result.section, items);
  }

  // Compute stats for each section using single pass
  const sections: SectionStats[] = [];
  for (const [section, items] of sectionMap.entries()) {
    let pass = 0;
    let fail = 0;
    let partial = 0;
    let blocked = 0;
    let waived = 0;
    let criticalFails = 0;

    // Single pass through items
    for (const item of items) {
      switch (item.status) {
        case 'pass':
          pass++;
          break;
        case 'fail':
          fail++;
          if (item.severity === 'critical') {
            criticalFails++;
          }
          break;
        case 'partial':
          partial++;
          break;
        case 'blocked':
          blocked++;
          break;
        case 'waived':
          waived++;
          break;
      }
    }

    const total = items.length;
    const actionableCount = total - waived - blocked;
    const passRate = actionableCount > 0 ? pass / actionableCount : 0;

    sections.push({
      section,
      total,
      pass,
      fail,
      partial,
      blocked,
      waived,
      passRate,
      criticalFails,
      items,
    });
  }

  return sections;
}

/**
 * Sort sections by health, worst-first.
 * Primary sort: lowest pass rate first
 * Tiebreaker: most critical failures first
 */
export function sortSectionsByHealth(sections: SectionStats[]): SectionStats[] {
  return [...sections].sort((a, b) => {
    // Sort by pass rate ascending (worst first)
    if (a.passRate !== b.passRate) {
      return a.passRate - b.passRate;
    }

    // Tiebreaker: most critical failures first
    return b.criticalFails - a.criticalFails;
  });
}

/**
 * Filter audit results by status, severity, and search query.
 */
export function filterResults(
  results: AuditResult[],
  filters: {
    statuses: Set<string>;
    severity: 'all' | 'critical' | 'recommended';
    search: string;
  }
): AuditResult[] {
  return results.filter(result => {
    // Filter by status - if statuses set is empty, return no results
    if (filters.statuses.size === 0) {
      return false;
    }
    if (!filters.statuses.has(result.status)) {
      return false;
    }

    // Filter by severity
    if (filters.severity !== 'all' && result.severity !== filters.severity) {
      return false;
    }

    // Filter by search (case-insensitive, matches itemId or title)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesItemId = result.itemId.toLowerCase().includes(searchLower);
      const matchesTitle = result.title.toLowerCase().includes(searchLower);
      if (!matchesItemId && !matchesTitle) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Compute overall statistics across all audit results.
 * Optimized to use a single pass through the results array.
 */
export function computeOverallStats(results: AuditResult[]): OverallStats {
  if (results.length === 0) {
    return {
      total: 0,
      pass: 0,
      fail: 0,
      partial: 0,
      blocked: 0,
      waived: 0,
      passRate: 0,
      criticalFails: 0,
      recommendedFails: 0,
    };
  }

  let pass = 0;
  let fail = 0;
  let partial = 0;
  let blocked = 0;
  let waived = 0;
  let criticalFails = 0;
  let recommendedFails = 0;

  // Single pass through results
  for (const result of results) {
    switch (result.status) {
      case 'pass':
        pass++;
        break;
      case 'fail':
        fail++;
        if (result.severity === 'critical') {
          criticalFails++;
        } else {
          recommendedFails++;
        }
        break;
      case 'partial':
        partial++;
        break;
      case 'blocked':
        blocked++;
        break;
      case 'waived':
        waived++;
        break;
    }
  }

  const total = results.length;
  const actionableCount = total - waived - blocked;
  const passRate = actionableCount > 0 ? pass / actionableCount : 0;

  return {
    total,
    pass,
    fail,
    partial,
    blocked,
    waived,
    passRate,
    criticalFails,
    recommendedFails,
  };
}

/**
 * Calculate statistics for a section's audit results (legacy function for backward compatibility)
 */
export function calculateSectionStats(
  section: string,
  items: AuditResult[]
): SectionStats {
  const total = items.length;
  const pass = items.filter((i) => i.status === 'pass').length;
  const fail = items.filter((i) => i.status === 'fail').length;
  const partial = items.filter((i) => i.status === 'partial').length;
  const blocked = items.filter((i) => i.status === 'blocked').length;
  const waived = items.filter((i) => i.status === 'waived').length;
  const criticalFails = items.filter(
    (i) => i.status === 'fail' && i.severity === 'critical'
  ).length;

  const scorableTotal = total - waived - blocked;
  const passRate = scorableTotal > 0 ? pass / scorableTotal : 0;

  return {
    section,
    total,
    pass,
    fail,
    partial,
    blocked,
    waived,
    passRate,
    criticalFails,
    items,
  };
}

/**
 * Format section name: strip leading number, replace hyphens with spaces, capitalize
 */
export function formatSectionName(slug: string): string {
  return slug
    .replace(/^\d{2}-/, '') // Remove leading number prefix
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
