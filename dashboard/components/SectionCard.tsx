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
  const { slug, id, name, description, goal, itemCount, criticalCount } = section;

  return (
    <Link
      href={`/section/${slug}`}
      className="group flex flex-col h-full rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:shadow-teal-500/10 hover:border-teal-300 transition-all duration-200 overflow-hidden"
    >
      {/* Colored top accent bar */}
      <div className="h-1 bg-gradient-to-r from-teal-500 to-cyan-500 group-hover:from-teal-400 group-hover:to-cyan-400 transition-colors" />

      <div className="flex flex-col h-full p-5">
        {/* Section number badge + name */}
        <div className="flex items-start gap-3 mb-2">
          <span className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-teal-50 text-teal-700 font-bold text-sm group-hover:bg-teal-100 transition-colors">
            {id}
          </span>
          <div className="pt-0.5">
            <h2 className="text-lg font-semibold text-slate-800 group-hover:text-teal-600 transition-colors leading-tight">
              {name}
            </h2>
            {goal && (
              <p className="text-sm text-slate-500 mt-0.5">
                {goal}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="mb-4 text-sm text-slate-500 flex-grow leading-relaxed">
          {description}
        </p>

        {/* Stats footer */}
        <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
          <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
          {criticalCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-sm text-amber-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              {criticalCount} critical
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
