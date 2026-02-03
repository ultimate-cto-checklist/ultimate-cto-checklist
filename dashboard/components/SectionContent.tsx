'use client';

import { useState } from 'react';
import ChecklistItem from './ChecklistItem';
import GuidePanel from './GuidePanel';
import type { ChecklistItem as ChecklistItemType } from '@/lib/checklist';

interface SectionContentProps {
  items: ChecklistItemType[];
  guide: string;
  itemsByCategory: Record<string, ChecklistItemType[]>;
  sortedCategories: string[];
}

/**
 * Extract the guide section for a specific item ID from markdown.
 * Looks for patterns like "### DEP-001:" or "### DEP-001 "
 */
function extractItemGuide(markdown: string, itemId: string): string | null {
  // Escape special regex characters in itemId
  const escapedId = itemId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Match heading with item ID (### DEP-001: or ### DEP-001 Title)
  const pattern = new RegExp(
    `(###\\s+${escapedId}[:\\s][^\\n]*\\n)([\\s\\S]*?)(?=\\n###\\s|\\n---\\n|$)`,
    'i'
  );

  const match = markdown.match(pattern);
  if (match) {
    return match[1] + match[2].trim();
  }

  return null;
}

/**
 * Extract the intro/overview section (everything before the first item section)
 */
function extractIntroGuide(markdown: string): string {
  // Find first ### heading that looks like an item ID (e.g., ### DEP-001)
  const itemPattern = /\n###\s+[A-Z]+-\d+/;
  const match = markdown.search(itemPattern);

  if (match > 0) {
    return markdown.slice(0, match).trim();
  }

  return markdown;
}

export default function SectionContent({
  items,
  guide,
  itemsByCategory,
  sortedCategories,
}: SectionContentProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Get the guide content to display
  const guideContent = selectedItemId
    ? extractItemGuide(guide, selectedItemId) || guide
    : extractIntroGuide(guide);

  const selectedItem = selectedItemId
    ? items.find((item) => item.id === selectedItemId)
    : null;

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Items panel (main content on left) */}
      <main className="flex-1 min-w-0">
        <div className="space-y-8">
          {sortedCategories.map((category) => (
            <section key={category}>
              {/* Category header */}
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4 capitalize">
                {category.replace(/-/g, ' ')}
              </h2>

              {/* Items in this category */}
              <div className="space-y-3">
                {itemsByCategory[category].map((item) => (
                  <ChecklistItem
                    key={item.id}
                    item={item}
                    isSelected={item.id === selectedItemId}
                    onSelect={() => setSelectedItemId(
                      item.id === selectedItemId ? null : item.id
                    )}
                  />
                ))}
              </div>
            </section>
          ))}

          {/* Empty state */}
          {items.length === 0 && (
            <p className="text-zinc-500 dark:text-zinc-500 italic">
              No items in this section yet.
            </p>
          )}
        </div>
      </main>

      {/* Guide panel (sidebar on right) */}
      {guide && (
        <aside className="lg:w-[420px] flex-shrink-0">
          <div className="lg:sticky lg:top-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {selectedItem ? (
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-sm px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">
                      {selectedItem.id}
                    </span>
                    <span>Guide</span>
                  </span>
                ) : (
                  'Overview'
                )}
              </h2>
              {selectedItemId && (
                <button
                  onClick={() => setSelectedItemId(null)}
                  className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  Show overview
                </button>
              )}
            </div>
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 bg-zinc-50 dark:bg-zinc-900 max-h-[calc(100vh-12rem)] overflow-y-auto">
              <GuidePanel markdown={guideContent} collapsed={false} />
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
