import { listProjects, hasWorkspace, getOrgInfo, getOrgAuditSummary } from "@/lib/checklist";
import Link from "next/link";

export default async function AuditsPage() {
  if (!hasWorkspace()) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-4">Audit Results</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-800">
            No audit workspace configured. Set the{" "}
            <code className="bg-amber-100 px-1 rounded font-mono text-sm">AUDIT_WORKSPACE</code>{" "}
            environment variable to view audit results.
          </p>
        </div>
      </div>
    );
  }

  const [projects, orgInfo, orgAudit] = await Promise.all([
    listProjects(),
    getOrgInfo(),
    getOrgAuditSummary(),
  ]);

  const hasOrgAudit = orgAudit !== null;
  const hasProjects = projects.length > 0;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Audit Results</h1>

      <div className="grid gap-4">
        {hasOrgAudit && (
          <Link
            href="/audits/_org"
            className="block border border-gray-200 rounded-lg p-4 hover:border-teal-500 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold">{orgInfo?.name ?? "Organization"}</h2>
                <p className="text-sm text-gray-500">Org-wide policies and standards</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{orgAudit.lastAuditScore}%</div>
                <div className="text-sm text-gray-500">{orgAudit.lastAudit}</div>
              </div>
            </div>
          </Link>
        )}

        {projects.map((project) => (
          <Link
            key={project.name}
            href={`/audits/${project.name}`}
            className="block border border-gray-200 rounded-lg p-4 hover:border-teal-500 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold">{project.name}</h2>
                <p className="text-sm text-gray-500">{project.type}</p>
              </div>
              {project.lastAudit && (
                <div className="text-right">
                  <div className="text-2xl font-bold">{project.lastAuditScore}%</div>
                  <div className="text-sm text-gray-500">{project.lastAudit}</div>
                </div>
              )}
            </div>
          </Link>
        ))}

        {!hasOrgAudit && !hasProjects && (
          <p className="text-gray-500">No audits yet. Run <code>/audit-org</code> or <code>/audit-add-project</code> in your workspace.</p>
        )}
      </div>
    </div>
  );
}
