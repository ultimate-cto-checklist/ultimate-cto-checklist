'use client';

import ReactMarkdown from 'react-markdown';
import type { ChecklistItem as ChecklistItemType } from '@/lib/checklist';

interface ChecklistItemProps {
  item: ChecklistItemType;
  isSelected?: boolean;
  onSelect?: () => void;
  guideContent?: string | null;
}

/**
 * ChecklistItem Component
 *
 * Displays a single checklist item with:
 * - ID badge (monospace font)
 * - Title
 * - Severity chip (critical = amber, recommended = indigo)
 * - Expandable accordion with description and verification guide
 */
export default function ChecklistItem({ item, isSelected, onSelect, guideContent }: ChecklistItemProps) {
  const handleToggle = () => {
    onSelect?.();
  };

  // Severity styles
  const severityConfig = {
    critical: {
      chip: 'bg-amber-100 text-amber-800 border border-amber-200',
      indicator: 'bg-amber-500',
      label: 'Critical',
    },
    recommended: {
      chip: 'bg-teal-50 text-teal-700 border border-teal-100',
      indicator: 'bg-teal-400',
      label: 'Recommended',
    },
  } as const;

  const severityKey = item.severity?.toLowerCase() as keyof typeof severityConfig;
  const config = severityConfig[severityKey] || severityConfig.recommended;

  const borderClass = isSelected
    ? 'border-teal-400 ring-2 ring-teal-100'
    : 'border-slate-200 hover:border-teal-300';

  const shadowClass = isSelected
    ? 'shadow-md shadow-teal-500/10'
    : 'shadow-sm hover:shadow-md hover:shadow-teal-500/5';

  return (
    <div className={`border rounded-xl bg-white transition-all duration-200 ${borderClass} ${shadowClass}`}>
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isSelected}
        className="w-full text-left p-4"
      >
        {/* Header: ID badge, title, and severity chip */}
        <div className="flex items-center gap-3">
          {/* ID Badge */}
          <span className="font-mono text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md flex-shrink-0 font-medium">
            {item.id}
          </span>

          {/* Title */}
          <span className="flex-1 min-w-0 text-base font-medium text-slate-800">
            {item.title}
          </span>

          {/* Severity chip */}
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${config.chip}`}>
            {config.label}
          </span>

          {/* Expand/collapse indicator */}
          <span className={`flex-shrink-0 text-sm transition-transform duration-200 ${isSelected ? 'text-teal-500 rotate-90' : 'text-slate-400'}`}>
            ▶
          </span>
        </div>
      </button>

      {/* Expanded content: description + guide */}
      {isSelected && (
        <div className="px-4 pb-4 space-y-4">
          {/* Item description */}
          {item.description && (
            <p className="text-base text-slate-600 leading-relaxed pl-[calc(2.5rem+0.75rem)]">
              {item.description}
            </p>
          )}

          {/* Verification guide */}
          {guideContent && (
            <div className="border-t border-slate-200 pt-4 mt-4">
              <div className="bg-gradient-to-br from-slate-50 to-teal-50/30 rounded-xl p-5 border border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-600 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                  Verification Guide
                </h4>
                <div className="prose prose-slate max-w-none
                  prose-headings:font-semibold prose-headings:tracking-tight
                  prose-h3:text-base prose-h3:text-slate-700 prose-h3:mt-5 prose-h3:mb-2
                  prose-h4:text-sm prose-h4:text-slate-600 prose-h4:mt-4 prose-h4:mb-2
                  prose-p:text-slate-600 prose-p:my-2.5 prose-p:leading-relaxed prose-p:text-sm
                  prose-code:bg-slate-800 prose-code:text-cyan-400 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:font-medium prose-code:before:content-none prose-code:after:content-none
                  prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700 prose-pre:rounded-lg prose-pre:p-3 prose-pre:my-3
                  prose-pre:prose-code:bg-transparent prose-pre:prose-code:text-slate-300 prose-pre:prose-code:p-0
                  prose-ul:my-2.5 prose-ul:list-disc prose-ul:pl-5 prose-ul:text-sm
                  prose-ol:my-2.5 prose-ol:list-decimal prose-ol:pl-5 prose-ol:text-sm
                  prose-li:text-slate-600 prose-li:my-1 prose-li:pl-1
                  prose-strong:text-slate-800 prose-strong:font-semibold
                  prose-a:text-teal-600 prose-a:no-underline hover:prose-a:underline
                ">
                  <ReactMarkdown>{guideContent}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
