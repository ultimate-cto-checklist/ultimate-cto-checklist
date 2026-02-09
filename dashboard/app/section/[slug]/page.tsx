import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSection } from '@/lib/checklist';
import SectionContent from '@/components/SectionContent';
import type { ChecklistItem as ChecklistItemType } from '@/lib/checklist';

interface SectionPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: SectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const section = await getSection(slug);
    return {
      title: `${section.name} - CTO Checklist`,
    };
  } catch {
    return {
      title: 'Section Not Found - CTO Checklist',
    };
  }
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
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Back navigation */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-800 transition-colors group"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
          <span>Back to sections</span>
        </Link>
      </div>

      {/* Section header */}
      <header className="mb-8 pb-6 border-b border-slate-200">
        <div className="flex items-start gap-4">
          <span className="flex-shrink-0 inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white font-bold text-lg shadow-lg shadow-teal-500/25">
            {section.id}
          </span>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">
              {section.name}
            </h1>
            <p className="text-base text-slate-600 mb-4 leading-relaxed">
              {section.description}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {section.items.length} {section.items.length === 1 ? 'item' : 'items'}
              </span>
              {criticalCount > 0 && (
                <span className="inline-flex items-center gap-1.5 text-sm text-amber-800 bg-amber-100 px-3 py-1 rounded-full font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  {criticalCount} critical
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Two-column layout: items + guide */}
      <SectionContent
        items={section.items}
        guide={section.guide}
        itemsByCategory={itemsByCategory}
        sortedCategories={sortedCategories}
      />
    </div>
  );
}
