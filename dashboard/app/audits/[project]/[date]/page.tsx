import { getAuditResults, listSections, getOrgInfo } from "@/lib/checklist";
import AuditDashboard from "@/components/audit/AuditDashboard";

interface Props {
  params: Promise<{ project: string; date: string }>;
}

export default async function AuditResultsPage({ params }: Props) {
  const { project, date } = await params;
  const isOrg = project === '_org';
  const [results, sections, orgInfo] = await Promise.all([
    getAuditResults(project, date),
    listSections(),
    isOrg ? getOrgInfo() : Promise.resolve(null),
  ]);

  // Build section descriptions map
  const sectionDescriptions: Record<string, string> = {};
  for (const section of sections) {
    sectionDescriptions[section.slug] = section.goal || section.description;
  }

  const displayName = isOrg ? orgInfo?.name ?? 'Organization' : undefined;

  return <AuditDashboard results={results} project={project} date={date} sectionDescriptions={sectionDescriptions} displayName={displayName} />;
}
