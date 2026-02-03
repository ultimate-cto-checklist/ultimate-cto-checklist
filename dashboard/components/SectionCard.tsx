import Link from 'next/link';
import type { SectionSummary } from '@/lib/checklist';

interface SectionCardProps {
  section: SectionSummary;
}

/**
 * SectionCard component displays a summary card for a checklist section.
 * Links to the detailed section page at /section/[slug].
 */
export default function SectionCard({ section }: SectionCardProps) {
  const { slug, id, name, description, itemCount, criticalCount } = section;

  // Format item count text with proper pluralization
  const itemText = itemCount === 1 ? '1 item' : `${itemCount} items`;

  // Format critical count text with proper pluralization, only show if > 0
  const criticalText = criticalCount > 0
    ? ` · ${criticalCount === 1 ? '1 critical' : `${criticalCount} critical`}`
    : '';

  return (
    <Link
      href={`/section/${slug}`}
      className="block rounded-lg border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      {/* Section number and name */}
      <h2 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        {id} - {name}
      </h2>

      {/* Description */}
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        {description}
      </p>

      {/* Item count and critical badge */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">
          {itemText}
          {criticalText && (
            <span className="text-orange-600 dark:text-orange-500">
              {criticalText}
            </span>
          )}
        </span>
      </div>
    </Link>
  );
}
