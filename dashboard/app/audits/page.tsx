import { listProjects, hasWorkspace } from "@/lib/checklist";
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

  const projects = await listProjects();

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Audit Results</h1>

      {projects.length === 0 ? (
        <p className="text-gray-500">No projects configured yet. Run <code>/audit-add-project</code> in your workspace.</p>
      ) : (
        <div className="grid gap-4">
          <Link
            href="/audits/_org"
            className="block border border-gray-200 rounded-lg p-4 hover:border-teal-500 transition-colors"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">Organization-Level</h2>
                <p className="text-sm text-gray-500">Org-wide policies and standards</p>
              </div>
              <span className="text-gray-400">→</span>
            </div>
          </Link>

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
        </div>
      )}
    </div>
  );
}
