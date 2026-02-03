import { listSections } from '@/lib/checklist';
import SectionCard from '@/components/SectionCard';

export default async function Home() {
  // Fetch all sections (server component - no "use client" needed)
  const sections = await listSections();

  // Calculate total item count across all sections
  const totalItems = sections.reduce((sum, section) => sum + section.itemCount, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Summary stats */}
      <div className="mb-8">
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          {sections.length} sections · {totalItems} total items
        </p>
      </div>

      {/* Grid of section cards - 3 cols desktop, 1 col mobile */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <SectionCard key={section.slug} section={section} />
        ))}
      </div>
    </div>
  );
}
