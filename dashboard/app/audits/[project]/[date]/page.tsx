import { getAuditResults } from "@/lib/checklist";
import Link from "next/link";

interface Props {
  params: Promise<{ project: string; date: string }>;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pass: { label: "Pass", color: "text-green-700", bg: "bg-green-50" },
  fail: { label: "Fail", color: "text-red-700", bg: "bg-red-50" },
  partial: { label: "Partial", color: "text-amber-700", bg: "bg-amber-50" },
  skip: { label: "Skip", color: "text-gray-600", bg: "bg-gray-100" },
  "not-applicable": { label: "N/A", color: "text-gray-400", bg: "bg-gray-50" },
  blocked: { label: "Blocked", color: "text-orange-700", bg: "bg-orange-50" },
};

export default async function AuditResultsPage({ params }: Props) {
  const { project, date } = await params;
  const results = await getAuditResults(project, date);

  // Group by section
  const bySection: Record<string, typeof results> = {};
  for (const result of results) {
    const section = result.section || "uncategorized";
    if (!bySection[section]) bySection[section] = [];
    bySection[section].push(result);
  }

  const passCount = results.filter(r => r.status === "pass").length;
  const failCount = results.filter(r => r.status === "fail").length;
  const partialCount = results.filter(r => r.status === "partial").length;
  const skipCount = results.filter(r => r.status === "skip").length;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href={`/audits/${project}`}
        className="text-teal-600 hover:text-teal-800 text-sm mb-4 block"
      >
        &larr; Back to history
      </Link>

      <h1 className="text-2xl font-bold mb-2">Audit: {project}</h1>
      <p className="text-gray-500 mb-6">{date}</p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-700">{passCount}</div>
          <div className="text-sm text-green-600">Passed</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-700">{failCount}</div>
          <div className="text-sm text-red-600">Failed</div>
        </div>
        <div className="bg-amber-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-amber-700">{partialCount}</div>
          <div className="text-sm text-amber-600">Partial</div>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">{skipCount}</div>
          <div className="text-sm text-gray-500">Skipped</div>
        </div>
      </div>

      {/* Results by section */}
      {Object.entries(bySection)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([section, items]) => (
          <div key={section} className="mb-8">
            <h2 className="text-lg font-semibold mb-3 capitalize">
              {section.replace(/-/g, " ")}
            </h2>
            <div className="space-y-2">
              {items.map((item) => {
                const config = statusConfig[item.status] || statusConfig.blocked;
                return (
                  <div key={item.itemId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-xs text-gray-400">{item.itemId}</span>
                        <h3 className="font-medium">{item.title}</h3>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${config.color} ${config.bg}`}>
                        {config.label}
                      </span>
                    </div>
                    {item.notes && (
                      <p className="mt-2 text-sm text-gray-600">{item.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
    </div>
  );
}
