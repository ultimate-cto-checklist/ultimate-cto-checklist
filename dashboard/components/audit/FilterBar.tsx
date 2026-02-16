"use client";

const SearchIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

interface FilterBarProps {
  activeStatuses: Set<string>;
  onStatusToggle: (status: string) => void;
  severity: "all" | "critical" | "recommended";
  onSeverityChange: (s: "all" | "critical" | "recommended") => void;
  search: string;
  onSearchChange: (s: string) => void;
  visibleCount: number;
  totalCount: number;
}

const statusConfig = {
  fail: { label: "Fail", bg: "bg-red-100", border: "border-red-300", text: "text-red-700" },
  partial: { label: "Partial", bg: "bg-amber-100", border: "border-amber-300", text: "text-amber-700" },
  pass: { label: "Pass", bg: "bg-green-100", border: "border-green-300", text: "text-green-700" },
  blocked: { label: "Blocked", bg: "bg-orange-100", border: "border-orange-300", text: "text-orange-700" },
  "not-applicable": { label: "N/A", bg: "bg-gray-100", border: "border-gray-300", text: "text-gray-600" },
};

const allStatuses = ["fail", "partial", "pass", "blocked", "not-applicable"];

export default function FilterBar({
  activeStatuses,
  onStatusToggle,
  severity,
  onSeverityChange,
  search,
  onSearchChange,
  visibleCount,
  totalCount,
}: FilterBarProps) {
  const allSelected = allStatuses.every((s) => activeStatuses.has(s));

  const handleAllToggle = () => {
    // Always select all statuses
    allStatuses.forEach((s) => {
      if (!activeStatuses.has(s)) {
        onStatusToggle(s);
      }
    });
  };

  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Status filters */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleAllToggle}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              allSelected
                ? "bg-blue-600 text-white"
                : "border border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            All
          </button>

          {Object.entries(statusConfig).map(([status, config]) => {
            const isActive = activeStatuses.has(status);
            return (
              <button
                key={status}
                onClick={() => onStatusToggle(status)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? `${config.bg} ${config.text} ${config.border} border`
                    : `border ${config.border} ${config.text} hover:${config.bg}`
                }`}
              >
                {config.label}
              </button>
            );
          })}
        </div>

        {/* Severity toggle */}
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          {(["all", "critical", "recommended"] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => onSeverityChange(sev)}
              className={`px-3 py-1 text-sm font-medium transition-colors ${
                severity === sev
                  ? "bg-gray-800 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {sev.charAt(0).toUpperCase() + sev.slice(1)}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1 min-w-[120px]"></div>

        {/* Search */}
        <div className="relative flex items-center">
          <span className="absolute left-2"><SearchIcon /></span>
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 pr-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Count */}
        <div className="text-sm text-gray-600 whitespace-nowrap">
          {visibleCount} of {totalCount} items
        </div>
      </div>
    </div>
  );
}
