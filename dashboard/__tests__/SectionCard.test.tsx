import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SectionCard from '@/components/SectionCard';
import type { SectionSummary } from '@/lib/checklist';

describe('SectionCard', () => {
  const mockSection: SectionSummary = {
    slug: '01-git-repo-setup',
    id: '01',
    name: 'Git Repo Setup',
    description: 'Essential git repository configuration and best practices',
    defaultScope: 'project',
    itemCount: 12,
    criticalCount: 3,
  };

  it('renders section with correct number badge and name', () => {
    render(<SectionCard section={mockSection} />);

    // Number is now in its own badge element
    expect(screen.getByText('01')).toBeInTheDocument();
    // Name is in a separate heading
    expect(screen.getByText('Git Repo Setup')).toBeInTheDocument();
  });

  it('renders section description', () => {
    render(<SectionCard section={mockSection} />);

    expect(screen.getByText('Essential git repository configuration and best practices')).toBeInTheDocument();
  });

  it('renders item count with critical count when criticalCount > 0', () => {
    render(<SectionCard section={mockSection} />);

    expect(screen.getByText(/12 items/)).toBeInTheDocument();
    expect(screen.getByText(/3 critical/)).toBeInTheDocument();
  });

  it('renders item count without critical part when criticalCount is 0', () => {
    const sectionWithoutCritical: SectionSummary = {
      ...mockSection,
      criticalCount: 0,
    };

    render(<SectionCard section={sectionWithoutCritical} />);

    expect(screen.getByText('12 items')).toBeInTheDocument();
    expect(screen.queryByText(/critical/)).not.toBeInTheDocument();
  });

  it('links to correct section detail page', () => {
    render(<SectionCard section={mockSection} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/section/01-git-repo-setup');
  });

  it('handles single item count correctly', () => {
    const singleItemSection: SectionSummary = {
      ...mockSection,
      itemCount: 1,
      criticalCount: 0,
    };

    render(<SectionCard section={singleItemSection} />);

    // Should show "1 item" not "1 items"
    expect(screen.getByText('1 item')).toBeInTheDocument();
  });

  it('handles single critical count correctly', () => {
    const singleCriticalSection: SectionSummary = {
      ...mockSection,
      itemCount: 5,
      criticalCount: 1,
    };

    render(<SectionCard section={singleCriticalSection} />);

    // Should show "1 critical" not "1 criticals"
    expect(screen.getByText(/1 critical/)).toBeInTheDocument();
  });
});
