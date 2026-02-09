import { getAuditHistory } from "@/lib/checklist";
import Link from "next/link";

export default async function OrgAuditsPage() {
  const history = await getAuditHistory("_org");

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/audits" className="text-teal-600 hover:text-teal-800 text-sm mb-4 block">
        &larr; Back to projects
      </Link>

      <h1 className="text-2xl font-bold mb-2">Organization-Level Audits</h1>
      <p className="text-gray-500 mb-6">
        Items that apply to your entire organization, not individual projects.
      </p>

      {history.length === 0 ? (
        <p className="text-gray-500">No org-level audits yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-3 text-sm font-medium text-gray-500">Date</th>
                <th className="text-right p-3 text-sm font-medium text-gray-500">Items</th>
                <th className="text-right p-3 text-sm font-medium text-gray-500">Pass</th>
                <th className="text-right p-3 text-sm font-medium text-gray-500">Fail</th>
                <th className="text-right p-3 text-sm font-medium text-gray-500">Score</th>
              </tr>
            </thead>
            <tbody>
              {history.map((audit) => (
                <tr key={audit.date} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3">
                    <Link
                      href={`/audits/_org/${audit.date}`}
                      className="text-teal-600 hover:text-teal-800 font-medium"
                    >
                      {audit.date}
                    </Link>
                  </td>
                  <td className="text-right p-3">{audit.total}</td>
                  <td className="text-right p-3 text-green-600">{audit.pass}</td>
                  <td className="text-right p-3 text-red-600">{audit.fail}</td>
                  <td className="text-right p-3 font-bold">{audit.score}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
