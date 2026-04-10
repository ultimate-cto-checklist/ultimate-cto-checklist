import { describe, it, expect } from 'vitest';
import type { AuditResult } from '@/lib/checklist';
import {
  computeSectionStats,
  sortSectionsByHealth,
  filterResults,
  computeOverallStats,
  type SectionStats,
} from '@/components/audit/audit-utils';

describe('audit-utils', () => {
  // Sample test data
  const mockResults: AuditResult[] = [
    {
      itemId: 'GIT-001',
      title: 'Repository exists',
      status: 'pass',
      severity: 'critical',
      section: '01-git-repo-setup',
      auditedAt: '2026-02-10',
    },
    {
      itemId: 'GIT-002',
      title: 'Branch protection enabled',
      status: 'fail',
      severity: 'critical',
      section: '01-git-repo-setup',
      auditedAt: '2026-02-10',
    },
    {
      itemId: 'GIT-003',
      title: 'README exists',
      status: 'partial',
      severity: 'recommended',
      section: '01-git-repo-setup',
      auditedAt: '2026-02-10',
    },
    {
      itemId: 'GIT-004',
      title: 'CI/CD configured',
      status: 'blocked',
      severity: 'critical',
      section: '01-git-repo-setup',
      auditedAt: '2026-02-10',
    },
    {
      itemId: 'GIT-005',
      title: 'Git LFS setup',
      status: 'waived',
      severity: 'recommended',
      section: '01-git-repo-setup',
      auditedAt: '2026-02-10',
    },
    {
      itemId: 'DB-001',
      title: 'Database backups',
      status: 'pass',
      severity: 'critical',
      section: '05-database',
      auditedAt: '2026-02-10',
    },
    {
      itemId: 'DB-002',
      title: 'Connection pooling',
      status: 'fail',
      severity: 'recommended',
      section: '05-database',
      auditedAt: '2026-02-10',
    },
    {
      itemId: 'DB-003',
      title: 'Query optimization',
      status: 'blocked',
      severity: 'recommended',
      section: '05-database',
      auditedAt: '2026-02-10',
    },
    {
      itemId: 'SEC-001',
      title: 'HTTPS enabled',
      status: 'pass',
      severity: 'critical',
      section: '30-security',
      auditedAt: '2026-02-10',
    },
    {
      itemId: 'SEC-002',
      title: 'WAF configured',
      status: 'fail',
      severity: 'critical',
      section: '30-security',
      auditedAt: '2026-02-10',
    },
  ];

  describe('computeSectionStats', () => {
    it('should compute stats for each section', () => {
      const stats = computeSectionStats(mockResults);

      expect(stats).toHaveLength(3);

      const gitSection = stats.find(s => s.section === '01-git-repo-setup');
      expect(gitSection).toBeDefined();
      expect(gitSection?.total).toBe(5);
      expect(gitSection?.pass).toBe(1);
      expect(gitSection?.fail).toBe(1);
      expect(gitSection?.partial).toBe(1);
      expect(gitSection?.blocked).toBe(1);
      expect(gitSection?.waived).toBe(1);
    });

    it('should calculate pass rate correctly', () => {
      const stats = computeSectionStats(mockResults);

      const gitSection = stats.find(s => s.section === '01-git-repo-setup');
      // Pass rate = pass / (total - waived - blocked)
      // = 1 / (5 - 1 - 1) = 1/3 = 0.33
      expect(gitSection?.passRate).toBeCloseTo(0.33, 2);

      const dbSection = stats.find(s => s.section === '05-database');
      // Pass rate = 1 / (3 - 0 - 1) = 1/2 = 0.5
      expect(dbSection?.passRate).toBeCloseTo(0.5, 2);
    });

    it('should handle sections with no actionable items (all waived/blocked)', () => {
      const allNaResults: AuditResult[] = [
        {
          itemId: 'TEST-001',
          title: 'Test',
          status: 'waived',
          severity: 'recommended',
          section: 'test-section',
          auditedAt: '2026-02-10',
        },
        {
          itemId: 'TEST-002',
          title: 'Test',
          status: 'blocked',
          severity: 'recommended',
          section: 'test-section',
          auditedAt: '2026-02-10',
        },
      ];

      const stats = computeSectionStats(allNaResults);
      expect(stats[0].passRate).toBe(0);
    });

    it('should count critical failures', () => {
      const stats = computeSectionStats(mockResults);

      const gitSection = stats.find(s => s.section === '01-git-repo-setup');
      expect(gitSection?.criticalFails).toBe(1); // GIT-002

      const secSection = stats.find(s => s.section === '30-security');
      expect(secSection?.criticalFails).toBe(1); // SEC-002
    });

    it('should include items array for each section', () => {
      const stats = computeSectionStats(mockResults);

      const gitSection = stats.find(s => s.section === '01-git-repo-setup');
      expect(gitSection?.items).toHaveLength(5);
      expect(gitSection?.items.map(i => i.itemId)).toEqual([
        'GIT-001',
        'GIT-002',
        'GIT-003',
        'GIT-004',
        'GIT-005',
      ]);
    });

    it('should handle empty results', () => {
      const stats = computeSectionStats([]);
      expect(stats).toEqual([]);
    });
  });

  describe('sortSectionsByHealth', () => {
    it('should sort sections worst-first by pass rate', () => {
      const sections: SectionStats[] = [
        {
          section: 'good-section',
          total: 10,
          pass: 8,
          fail: 2,
          partial: 0,
          blocked: 0,
          waived: 0,
          passRate: 0.8,
          criticalFails: 0,
          items: [],
        },
        {
          section: 'bad-section',
          total: 10,
          pass: 2,
          fail: 8,
          partial: 0,
          blocked: 0,
          waived: 0,
          passRate: 0.2,
          criticalFails: 0,
          items: [],
        },
        {
          section: 'medium-section',
          total: 10,
          pass: 5,
          fail: 5,
          partial: 0,
          blocked: 0,
          waived: 0,
          passRate: 0.5,
          criticalFails: 0,
          items: [],
        },
      ];

      const sorted = sortSectionsByHealth(sections);

      expect(sorted[0].section).toBe('bad-section');
      expect(sorted[1].section).toBe('medium-section');
      expect(sorted[2].section).toBe('good-section');
    });

    it('should use critical fails as tiebreaker when pass rates equal', () => {
      const sections: SectionStats[] = [
        {
          section: 'few-critical',
          total: 10,
          pass: 5,
          fail: 5,
          partial: 0,
          blocked: 0,
          waived: 0,
          passRate: 0.5,
          criticalFails: 1,
          items: [],
        },
        {
          section: 'many-critical',
          total: 10,
          pass: 5,
          fail: 5,
          partial: 0,
          blocked: 0,
          waived: 0,
          passRate: 0.5,
          criticalFails: 3,
          items: [],
        },
      ];

      const sorted = sortSectionsByHealth(sections);

      expect(sorted[0].section).toBe('many-critical');
      expect(sorted[1].section).toBe('few-critical');
    });

    it('should handle empty array', () => {
      const sorted = sortSectionsByHealth([]);
      expect(sorted).toEqual([]);
    });
  });

  describe('filterResults', () => {
    it('should filter by status', () => {
      const filters = {
        statuses: new Set(['pass']),
        severity: 'all' as const,
        search: '',
      };

      const filtered = filterResults(mockResults, filters);
      expect(filtered).toHaveLength(3);
      expect(filtered.every(r => r.status === 'pass')).toBe(true);
    });

    it('should filter by multiple statuses', () => {
      const filters = {
        statuses: new Set(['pass', 'fail']),
        severity: 'all' as const,
        search: '',
      };

      const filtered = filterResults(mockResults, filters);
      expect(filtered).toHaveLength(6);
      expect(filtered.every(r => r.status === 'pass' || r.status === 'fail')).toBe(true);
    });

    it('should filter by severity: critical', () => {
      const filters = {
        statuses: new Set(['pass', 'fail', 'partial', 'blocked', 'waived']),
        severity: 'critical' as const,
        search: '',
      };

      const filtered = filterResults(mockResults, filters);
      expect(filtered).toHaveLength(6);
      expect(filtered.every(r => r.severity === 'critical')).toBe(true);
    });

    it('should filter by severity: recommended', () => {
      const filters = {
        statuses: new Set(['pass', 'fail', 'partial', 'blocked', 'waived']),
        severity: 'recommended' as const,
        search: '',
      };

      const filtered = filterResults(mockResults, filters);
      expect(filtered).toHaveLength(4);
      expect(filtered.every(r => r.severity === 'recommended')).toBe(true);
    });

    it('should search by itemId (case-insensitive)', () => {
      const filters = {
        statuses: new Set(['pass', 'fail', 'partial', 'blocked', 'waived']),
        severity: 'all' as const,
        search: 'git-002',
      };

      const filtered = filterResults(mockResults, filters);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].itemId).toBe('GIT-002');
    });

    it('should search by title (case-insensitive)', () => {
      const filters = {
        statuses: new Set(['pass', 'fail', 'partial', 'blocked', 'waived']),
        severity: 'all' as const,
        search: 'branch protection',
      };

      const filtered = filterResults(mockResults, filters);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].itemId).toBe('GIT-002');
    });

    it('should handle partial search matches', () => {
      const filters = {
        statuses: new Set(['pass', 'fail', 'partial', 'blocked', 'waived']),
        severity: 'all' as const,
        search: 'git',
      };

      const filtered = filterResults(mockResults, filters);
      expect(filtered).toHaveLength(5); // All GIT-* items
    });

    it('should combine all filters', () => {
      const filters = {
        statuses: new Set(['fail']),
        severity: 'critical' as const,
        search: 'sec',
      };

      const filtered = filterResults(mockResults, filters);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].itemId).toBe('SEC-002');
    });

    it('should return empty array when no matches', () => {
      const filters = {
        statuses: new Set(['pass']),
        severity: 'all' as const,
        search: 'nonexistent',
      };

      const filtered = filterResults(mockResults, filters);
      expect(filtered).toEqual([]);
    });

    it('should handle empty status set', () => {
      const filters = {
        statuses: new Set<string>(),
        severity: 'all' as const,
        search: '',
      };

      const filtered = filterResults(mockResults, filters);
      expect(filtered).toEqual([]);
    });
  });

  describe('computeOverallStats', () => {
    it('should compute overall statistics', () => {
      const stats = computeOverallStats(mockResults);

      expect(stats.total).toBe(10);
      expect(stats.pass).toBe(3);
      expect(stats.fail).toBe(3);
      expect(stats.partial).toBe(1);
      expect(stats.blocked).toBe(2);
      expect(stats.waived).toBe(1);
    });

    it('should calculate overall pass rate correctly', () => {
      const stats = computeOverallStats(mockResults);

      // Pass rate = pass / (total - waived - blocked)
      // = 3 / (10 - 1 - 2) = 3/7 = 0.428
      expect(stats.passRate).toBeCloseTo(0.43, 2);
    });

    it('should count critical and recommended failures separately', () => {
      const stats = computeOverallStats(mockResults);

      expect(stats.criticalFails).toBe(2); // GIT-002, SEC-002
      expect(stats.recommendedFails).toBe(1); // DB-002
    });

    it('should handle empty results', () => {
      const stats = computeOverallStats([]);

      expect(stats.total).toBe(0);
      expect(stats.pass).toBe(0);
      expect(stats.fail).toBe(0);
      expect(stats.passRate).toBe(0);
      expect(stats.criticalFails).toBe(0);
      expect(stats.recommendedFails).toBe(0);
    });

    it('should handle results with only non-actionable items', () => {
      const allNaResults: AuditResult[] = [
        {
          itemId: 'TEST-001',
          title: 'Test',
          status: 'waived',
          severity: 'recommended',
          section: 'test-section',
          auditedAt: '2026-02-10',
        },
      ];

      const stats = computeOverallStats(allNaResults);
      expect(stats.passRate).toBe(0);
    });
  });
});
