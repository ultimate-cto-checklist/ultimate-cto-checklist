'use client';

import { useState } from 'react';
import type { ChecklistItem as ChecklistItemType } from '@/lib/checklist';

interface ChecklistItemProps {
  item: ChecklistItemType;
}

/**
 * ChecklistItem Component
 *
 * Displays a single checklist item with:
 * - ID badge (monospace font)
 * - Title
 * - Severity chip (critical = red/orange, recommended = blue/gray)
 * - Expandable description (click to show/hide)
 *
 * @param props.item - The checklist item data
 */
export default function ChecklistItem({ item }: ChecklistItemProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const handleToggle = () => {
    setIsExpanded(prev => !prev);
  };

  // Severity chip styles based on severity level
  const severityStyles = {
    critical: 'bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400',
    recommended: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  } as const;

  const severityLabel = {
    critical: 'Critical',
    recommended: 'Recommended',
  } as const;

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isExpanded}
        className="w-full text-left p-4"
      >
        {/* Header: ID badge, title, and severity chip */}
        <div className="flex items-center gap-3">
          {/* ID Badge */}
          <span className="font-mono text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded flex-shrink-0">
            {item.id}
          </span>

          {/* Title */}
          <span className="flex-1 min-w-0 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {item.title}
          </span>

          {/* Severity chip */}
          <span
            className={`text-xs px-2 py-0.5 rounded font-medium flex-shrink-0 ${severityStyles[item.severity]}`}
          >
            {severityLabel[item.severity]}
          </span>

          {/* Expand/collapse indicator */}
          <span className="text-zinc-400 dark:text-zinc-500 flex-shrink-0 text-xs">
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
      </button>

      {/* Expanded description */}
      {isExpanded && item.description && (
        <div className="px-4 pb-4">
          <div className="pl-3 border-l-2 border-zinc-200 dark:border-zinc-700">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {item.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
