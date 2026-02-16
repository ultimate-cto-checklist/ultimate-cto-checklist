"use client";

import { useState } from "react";
const ChevronDown = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);
const ChevronRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);
import { AuditResult } from "@/lib/checklist";
import { SectionStats, formatSectionName } from "./audit-utils";
import AuditItem from "./AuditItem";

interface SectionCardProps {
  stats: SectionStats;
  filteredItems: AuditResult[];
  defaultExpanded?: boolean;
  description?: string;
}

export default function SectionCard({
  stats,
  filteredItems,
  defaultExpanded = false,
  description,
}: SectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const sectionName = formatSectionName(stats.section);

  // Calculate proportions for progress bar
  const total = stats.total;
  const passWidth = total > 0 ? (stats.pass / total) * 100 : 0;
  const partialWidth = total > 0 ? (stats.partial / total) * 100 : 0;
  const failWidth = total > 0 ? (stats.fail / total) * 100 : 0;

  return (
    <div className="border-b border-gray-200">
      {/* Header row - clickable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
      >
        {/* Chevron */}
        <div className="flex-shrink-0 text-gray-400">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </div>

        {/* Section name */}
        <div className="flex-shrink-0 min-w-[200px]">
          <h3 className="font-semibold text-gray-900">{sectionName}</h3>
          {description && (
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-sm text-gray-600 flex-shrink-0">
          <span>
            {stats.pass}/{stats.total} pass
          </span>
          {stats.criticalFails > 0 && (
            <span className="text-red-600 font-medium">
              {stats.criticalFails} critical fail{stats.criticalFails !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Progress bar — fills remaining space */}
        <div className="flex-1 min-w-[100px]">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden flex">
            {passWidth > 0 && (
              <div
                className="bg-green-500"
                style={{ width: `${passWidth}%` }}
              />
            )}
            {partialWidth > 0 && (
              <div
                className="bg-amber-500"
                style={{ width: `${partialWidth}%` }}
              />
            )}
            {failWidth > 0 && (
              <div
                className="bg-red-500"
                style={{ width: `${failWidth}%` }}
              />
            )}
          </div>
        </div>

        {/* Pass rate % */}
        <span className={`text-sm font-semibold flex-shrink-0 tabular-nums w-[3.5ch] text-right ${
          stats.passRate >= 0.6 ? "text-green-600" :
          stats.passRate >= 0.3 ? "text-amber-600" :
          "text-red-600"
        }`}>
          {Math.round(stats.passRate * 100)}%
        </span>
      </button>

      {/* Expanded content */}
      {isExpanded && filteredItems.length > 0 && (
        <div className="bg-white">
          {filteredItems.map((item) => (
            <AuditItem key={item.itemId} result={item} />
          ))}
        </div>
      )}

      {/* Empty state when expanded but no filtered items */}
      {isExpanded && filteredItems.length === 0 && (
        <div className="px-4 py-8 text-center text-gray-500 text-sm">
          No items match the current filters
        </div>
      )}
    </div>
  );
}
