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
    // Return content without the heading (we already show the item title)
    return match[2].trim();
  }

  return null;
}

/**
 * Extract the intro/overview section (everything before the horizontal rule divider)
 */
function extractIntroGuide(markdown: string): string {
  // The --- horizontal rule separates intro from item sections
  const hrPattern = /\n---\n/;
  const match = markdown.search(hrPattern);

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
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Get intro guide content
  const introGuide = extractIntroGuide(guide);

  // Build a map of item guides
  const getItemGuide = (itemId: string) => extractItemGuide(guide, itemId);

  const handleItemToggle = (itemId: string) => {
    setExpandedItemId(expandedItemId === itemId ? null : itemId);
  };

  return (
    <div>
      {/* Overview guide at top */}
      {introGuide && (
        <div className="rounded-xl px-5 py-5 mb-10 bg-white border border-slate-200 shadow-sm">
          <GuidePanel markdown={introGuide} showToc={false} />
        </div>
      )}

      {/* Items grouped by category */}
      <div className="space-y-8">
        {sortedCategories.map((category) => (
          <section
            key={category}
            className="rounded-xl px-5 py-5 bg-white border border-slate-200 shadow-sm"
          >
            {/* Category header */}
            <h2 className="text-base font-bold text-slate-800 mb-5 capitalize tracking-tight flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-gradient-to-b from-teal-500 to-cyan-500"></span>
              {category.replace(/-/g, ' ')}
            </h2>

            {/* Items in this category */}
            <div className="space-y-3">
              {itemsByCategory[category].map((item) => (
                <ChecklistItem
                  key={item.id}
                  item={item}
                  isSelected={item.id === expandedItemId}
                  onSelect={() => handleItemToggle(item.id)}
                  guideContent={getItemGuide(item.id)}
                />
              ))}
            </div>
          </section>
        ))}

        {/* Empty state */}
        {items.length === 0 && (
          <div className="rounded-xl px-5 py-12 bg-white border border-slate-200 text-center">
            <p className="text-slate-500 italic">
              No items in this section yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
