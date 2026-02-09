import { listSections } from '@/lib/checklist';
import SectionCard from '@/components/SectionCard';

export default async function Home() {
  // Fetch all sections (server component - no "use client" needed)
  const sections = await listSections();

  // Calculate total item count across all sections
  const totalItems = sections.reduce((sum, section) => sum + section.itemCount, 0);
  const totalCritical = sections.reduce((sum, section) => sum + section.criticalCount, 0);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Summary stats - inline display, not a card */}
      <div className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-teal-500"></div>
          <span>{sections.length} sections</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span>{totalItems} items</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
          <span>{totalCritical} critical</span>
        </div>
      </div>

      {/* Grid of section cards */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
        {sections.map((section) => (
          <SectionCard key={section.slug} section={section} />
        ))}
      </div>
    </div>
  );
}
