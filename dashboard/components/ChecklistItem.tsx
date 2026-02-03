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
    critical: 'bg-red-100 text-red-800 border-red-200',
    recommended: 'bg-blue-100 text-blue-800 border-blue-200',
  } as const;

  const severityLabel = {
    critical: 'Critical',
    recommended: 'Recommended',
  } as const;

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isExpanded}
        className="w-full text-left"
      >
        {/* Header: ID badge, title, and severity chip */}
        <div className="flex items-start gap-3">
          {/* ID Badge */}
          <span className="font-mono text-sm px-2 py-1 bg-gray-100 text-gray-700 rounded border border-gray-200 flex-shrink-0">
            {item.id}
          </span>

          {/* Title and severity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-medium text-gray-900">
                {item.title}
              </h3>

              {/* Severity chip */}
              <span
                className={`text-xs px-2 py-1 rounded border ${severityStyles[item.severity]}`}
              >
                {severityLabel[item.severity]}
              </span>
            </div>
          </div>

          {/* Expand/collapse indicator */}
          <span className="text-gray-400 flex-shrink-0">
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
      </button>

      {/* Expanded description */}
      {isExpanded && item.description && (
        <div className="mt-3 pl-3 border-l-2 border-gray-200">
          <p className="text-sm text-gray-600 leading-relaxed">
            {item.description}
          </p>
        </div>
      )}
    </div>
  );
}
