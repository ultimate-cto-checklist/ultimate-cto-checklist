import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChecklistItem from '@/components/ChecklistItem';
import type { ChecklistItem as ChecklistItemType } from '@/lib/checklist';

describe('ChecklistItem', () => {
  const mockCriticalItem: ChecklistItemType = {
    id: 'GIT-001',
    title: 'Repository must have a README.md file',
    description: 'A README.md file should exist at the root of the repository with project overview, setup instructions, and basic documentation.',
    severity: 'critical',
    category: 'documentation',
    scope: ['project'],
  };

  const mockRecommendedItem: ChecklistItemType = {
    id: 'GIT-002',
    title: 'Use conventional commit messages',
    description: 'Follow the conventional commits specification for all commit messages to enable automated changelog generation.',
    severity: 'recommended',
    category: 'git-workflow',
    scope: ['project'],
  };

  describe('Rendering', () => {
    it('should render the item ID badge with monospace font', () => {
      render(<ChecklistItem item={mockCriticalItem} />);

      const badge = screen.getByText('GIT-001');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('font-mono');
    });

    it('should render the item title', () => {
      render(<ChecklistItem item={mockCriticalItem} />);

      expect(screen.getByText('Repository must have a README.md file')).toBeInTheDocument();
    });

    it('should not show description by default (collapsed state)', () => {
      render(<ChecklistItem item={mockCriticalItem} />);

      const description = screen.queryByText(/A README.md file should exist/);
      expect(description).not.toBeInTheDocument();
    });
  });

  describe('Severity Chips', () => {
    it('should render critical severity chip with amber styling', () => {
      render(<ChecklistItem item={mockCriticalItem} />);

      const chip = screen.getByText('Critical');
      expect(chip).toBeInTheDocument();
      // Check for amber color classes (used for critical items in bold design)
      expect(chip.className).toMatch(/bg-amber/);
    });

    it('should render recommended severity chip with teal styling', () => {
      render(<ChecklistItem item={mockRecommendedItem} />);

      const chip = screen.getByText('Recommended');
      expect(chip).toBeInTheDocument();
      // Check for teal color classes (used for recommended items in DevOps design)
      expect(chip.className).toMatch(/bg-teal/);
    });
  });

  describe('Expand/Collapse Behavior', () => {
    it('should have a clickable element with button role', () => {
      render(<ChecklistItem item={mockCriticalItem} isSelected={false} />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should have aria-expanded="false" when collapsed', () => {
      render(<ChecklistItem item={mockCriticalItem} isSelected={false} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('should show description when isSelected is true', () => {
      render(<ChecklistItem item={mockCriticalItem} isSelected={true} />);

      // Visible when selected
      expect(screen.getByText(/A README.md file should exist/)).toBeInTheDocument();
    });

    it('should have aria-expanded="true" when isSelected is true', () => {
      render(<ChecklistItem item={mockCriticalItem} isSelected={true} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('should hide description when isSelected is false', () => {
      render(<ChecklistItem item={mockCriticalItem} isSelected={false} />);

      expect(screen.queryByText(/A README.md file should exist/)).not.toBeInTheDocument();
    });

    it('should call onSelect when clicked', () => {
      const onSelect = vi.fn();
      render(<ChecklistItem item={mockCriticalItem} isSelected={false} onSelect={onSelect} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(onSelect).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty description gracefully', () => {
      const itemWithEmptyDescription: ChecklistItemType = {
        ...mockCriticalItem,
        description: '',
      };

      render(<ChecklistItem item={itemWithEmptyDescription} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Should not crash, component should still render
      expect(screen.getByText('GIT-001')).toBeInTheDocument();
    });

    it('should handle long IDs', () => {
      const itemWithLongId: ChecklistItemType = {
        ...mockCriticalItem,
        id: 'VERY-LONG-SECTION-ID-001',
      };

      render(<ChecklistItem item={itemWithLongId} />);

      expect(screen.getByText('VERY-LONG-SECTION-ID-001')).toBeInTheDocument();
    });
  });
});
