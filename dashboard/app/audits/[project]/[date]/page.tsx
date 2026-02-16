import { getAuditResults, listSections } from "@/lib/checklist";
import AuditDashboard from "@/components/audit/AuditDashboard";

interface Props {
  params: Promise<{ project: string; date: string }>;
}

export default async function AuditResultsPage({ params }: Props) {
  const { project, date } = await params;
  const results = await getAuditResults(project, date);

  // Build section descriptions map
  const sections = await listSections();
  const sectionDescriptions: Record<string, string> = {};
  for (const section of sections) {
    sectionDescriptions[section.slug] = section.goal || section.description;
  }

  return <AuditDashboard results={results} project={project} date={date} sectionDescriptions={sectionDescriptions} />;
}
