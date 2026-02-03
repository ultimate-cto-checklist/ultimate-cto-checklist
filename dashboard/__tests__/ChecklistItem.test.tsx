import { describe, it, expect } from 'vitest';
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
  };

  const mockRecommendedItem: ChecklistItemType = {
    id: 'GIT-002',
    title: 'Use conventional commit messages',
    description: 'Follow the conventional commits specification for all commit messages to enable automated changelog generation.',
    severity: 'recommended',
    category: 'git-workflow',
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
    it('should render critical severity chip with red/orange styling', () => {
      render(<ChecklistItem item={mockCriticalItem} />);

      const chip = screen.getByText('Critical');
      expect(chip).toBeInTheDocument();
      // Check for red/orange color classes (bg-red or bg-orange)
      expect(chip.className).toMatch(/bg-(red|orange)/);
    });

    it('should render recommended severity chip with blue/gray styling', () => {
      render(<ChecklistItem item={mockRecommendedItem} />);

      const chip = screen.getByText('Recommended');
      expect(chip).toBeInTheDocument();
      // Check for blue/gray color classes (bg-blue or bg-gray)
      expect(chip.className).toMatch(/bg-(blue|gray)/);
    });
  });

  describe('Expand/Collapse Behavior', () => {
    it('should have a clickable element with button role', () => {
      render(<ChecklistItem item={mockCriticalItem} />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should have aria-expanded="false" when collapsed', () => {
      render(<ChecklistItem item={mockCriticalItem} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('should expand and show description when clicked', () => {
      render(<ChecklistItem item={mockCriticalItem} />);

      const button = screen.getByRole('button');

      // Initially collapsed
      expect(screen.queryByText(/A README.md file should exist/)).not.toBeInTheDocument();

      // Click to expand
      fireEvent.click(button);

      // Now visible
      expect(screen.getByText(/A README.md file should exist/)).toBeInTheDocument();
    });

    it('should have aria-expanded="true" when expanded', () => {
      render(<ChecklistItem item={mockCriticalItem} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('should collapse and hide description when clicked again', () => {
      render(<ChecklistItem item={mockCriticalItem} />);

      const button = screen.getByRole('button');

      // Expand
      fireEvent.click(button);
      expect(screen.getByText(/A README.md file should exist/)).toBeInTheDocument();

      // Collapse
      fireEvent.click(button);
      expect(screen.queryByText(/A README.md file should exist/)).not.toBeInTheDocument();
    });

    it('should toggle aria-expanded attribute on each click', () => {
      render(<ChecklistItem item={mockCriticalItem} />);

      const button = screen.getByRole('button');

      // Initial state
      expect(button).toHaveAttribute('aria-expanded', 'false');

      // First click - expand
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');

      // Second click - collapse
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'false');

      // Third click - expand again
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
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
