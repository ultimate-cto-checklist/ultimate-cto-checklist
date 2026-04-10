"use client";

import { useState, useMemo } from "react";
import type { AuditResult } from "@/lib/checklist";
import ScoreRing from "./ScoreRing";
import FilterBar from "./FilterBar";
import SectionCard from "./SectionCard";
import {
  computeOverallStats,
  computeSectionStats,
  sortSectionsByHealth,
  filterResults,
} from "./audit-utils";

interface AuditDashboardProps {
  results: AuditResult[];
  project: string;
  date: string;
  sectionDescriptions: Record<string, string>;
  displayName?: string;
}

const ALL_STATUSES = new Set([
  "pass",
  "fail",
  "partial",
  "blocked",
  "waived",
]);

export default function AuditDashboard({
  results,
  project,
  date,
  sectionDescriptions,
  displayName,
}: AuditDashboardProps) {
  const [activeStatuses, setActiveStatuses] = useState<Set<string>>(
    new Set(ALL_STATUSES)
  );
  const [severity, setSeverity] = useState<"all" | "critical" | "recommended">(
    "all"
  );
  const [search, setSearch] = useState("");

  const overall = useMemo(() => computeOverallStats(results), [results]);
  const passRatePercent = Math.round(overall.passRate * 100);

  const filtered = useMemo(
    () => filterResults(results, { statuses: activeStatuses, severity, search }),
    [results, activeStatuses, severity, search]
  );

  const sectionStats = useMemo(() => {
    const stats = computeSectionStats(results);
    return sortSectionsByHealth(stats);
  }, [results]);

  // Pre-filter items per section
  const filteredBySection = useMemo(() => {
    const map = new Map<string, AuditResult[]>();
    for (const item of filtered) {
      const section = item.section || "uncategorized";
      const arr = map.get(section) || [];
      arr.push(item);
      map.set(section, arr);
    }
    return map;
  }, [filtered]);

  // Only show sections that have filtered items (or show all if all statuses active)
  const visibleSections = useMemo(() => {
    return sectionStats.filter(
      (s) => (filteredBySection.get(s.section) || []).length > 0
    );
  }, [sectionStats, filteredBySection]);

  const handleStatusToggle = (status: string) => {
    setActiveStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  return (
    <div>
      {/* Hero Section */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <a
          href={`/audits/${project}`}
          className="text-teal-600 hover:text-teal-800 text-sm mb-4 inline-block"
        >
          &larr; Back to history
        </a>

        <div className="flex items-start gap-8 mt-2">
          {/* Score Ring */}
          <div className="flex-shrink-0">
            <ScoreRing
              score={passRatePercent}
              size={140}
              strokeWidth={12}
              label="pass rate"
            />
          </div>

          {/* Stats Breakdown */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{displayName ?? project}</h1>
            <p className="text-sm text-gray-500 mb-4">{date}</p>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              <StatPill
                count={overall.pass}
                label="Pass"
                color="text-green-700"
                bg="bg-green-50"
              />
              <StatPill
                count={overall.fail}
                label="Fail"
                color="text-red-700"
                bg="bg-red-50"
              />
              <StatPill
                count={overall.partial}
                label="Partial"
                color="text-amber-700"
                bg="bg-amber-50"
              />
              <StatPill
                count={overall.blocked}
                label="Blocked"
                color="text-orange-700"
                bg="bg-orange-50"
              />
              <StatPill
                count={overall.waived}
                label="Waived"
                color="text-gray-500"
                bg="bg-gray-50"
              />
            </div>

            <div className="flex gap-4 mt-3 text-sm">
              <span className="text-red-600 font-medium">
                {overall.criticalFails} critical fails
              </span>
              <span className="text-gray-500">
                {overall.recommendedFails} recommended fails
              </span>
              <span className="text-gray-400">
                {overall.total} total items
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        activeStatuses={activeStatuses}
        onStatusToggle={handleStatusToggle}
        severity={severity}
        onSeverityChange={setSeverity}
        search={search}
        onSearchChange={setSearch}
        visibleCount={filtered.length}
        totalCount={results.length}
      />

      {/* Section Cards */}
      <div>
        {visibleSections.map((stats) => (
          <SectionCard
            key={stats.section}
            stats={stats}
            filteredItems={filteredBySection.get(stats.section) || []}
            description={sectionDescriptions[stats.section]}
          />
        ))}

        {visibleSections.length === 0 && (
          <div className="px-4 py-16 text-center text-gray-500">
            No sections match the current filters
          </div>
        )}
      </div>
    </div>
  );
}

function StatPill({
  count,
  label,
  color,
  bg,
}: {
  count: number;
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <div className={`${bg} rounded-lg px-3 py-2 text-center`}>
      <div className={`text-xl font-bold ${color}`}>{count}</div>
      <div className={`text-xs ${color} opacity-80`}>{label}</div>
    </div>
  );
}
