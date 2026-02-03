import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSection } from '@/lib/checklist';
import ChecklistItem from '@/components/ChecklistItem';
import GuidePanel from '@/components/GuidePanel';
import type { ChecklistItem as ChecklistItemType } from '@/lib/checklist';

interface SectionPageProps {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * Section Detail Page
 *
 * Displays a full checklist section with:
 * - Back navigation to home
 * - Section header (name, description, stats)
 * - Two-column layout: items list + guide panel
 * - Items grouped by category
 * - Responsive: single column on mobile
 */
export default async function SectionPage({ params }: SectionPageProps) {
  // Await params in Next.js 15+
  const { slug } = await params;

  // Fetch section data (server component)
  let section;
  try {
    section = await getSection(slug);
  } catch (error) {
    // If section doesn't exist or can't be loaded, show 404
    console.error(`Failed to load section ${slug}:`, error);
    notFound();
  }

  // Group items by category
  const itemsByCategory = section.items.reduce(
    (acc, item) => {
      const category = item.category || 'uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, ChecklistItemType[]>
  );

  // Sort categories: put "uncategorized" last
  const sortedCategories = Object.keys(itemsByCategory).sort((a, b) => {
    if (a === 'uncategorized') return 1;
    if (b === 'uncategorized') return -1;
    return a.localeCompare(b);
  });

  // Count critical items
  const criticalCount = section.items.filter(
    (item) => item.severity === 'critical'
  ).length;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back navigation */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
        >
          <span>←</span>
          <span>Back to sections</span>
        </Link>
      </div>

      {/* Section header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">
          {section.id} - {section.name}
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-4">
          {section.description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
          <span>
            {section.items.length}{' '}
            {section.items.length === 1 ? 'item' : 'items'}
          </span>
          {criticalCount > 0 && (
            <span className="text-orange-600 dark:text-orange-500">
              {criticalCount} {criticalCount === 1 ? 'critical' : 'critical'}
            </span>
          )}
        </div>
      </header>

      {/* Two-column layout: items + guide */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Items panel (main content on left) */}
        <main className="flex-1 min-w-0">
          <div className="space-y-8">
            {sortedCategories.map((category) => (
              <section key={category}>
                {/* Category header */}
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4 capitalize">
                  {category}
                </h2>

                {/* Items in this category */}
                <div className="space-y-3">
                  {itemsByCategory[category].map((item) => (
                    <ChecklistItem key={item.id} item={item} />
                  ))}
                </div>
              </section>
            ))}

            {/* Empty state */}
            {section.items.length === 0 && (
              <p className="text-zinc-500 dark:text-zinc-500 italic">
                No items in this section yet.
              </p>
            )}
          </div>
        </main>

        {/* Guide panel (sidebar on right) */}
        {section.guide && (
          <aside className="lg:w-96 flex-shrink-0">
            <div className="lg:sticky lg:top-8">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                Verification Guide
              </h2>
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 bg-zinc-50 dark:bg-zinc-900">
                <GuidePanel markdown={section.guide} collapsed={true} />
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
