export interface Item {
  id: string;
  slug: string;
  title: string;
  description: string;
  severity: 'critical' | 'recommended';
  category: string;
  question?: string | string[];
  checks?: string[];
  passCriteria?: string[];
  failCriteria?: string[];
  crossReferences?: string[];
}

export interface FloatingQuestion {
  question: string;
  bg: string;
  border: string;
  text: string;
}

export interface Section {
  slug: string;
  id: string;
  name: string;
  description: string;
  defaultScope: string[];
  items: Item[];
  guideContent: string;
  domain: string;
}

export interface Command {
  slug: string;
  name: string;
  description: string;
  content: string;
  phase: 'setup' | 'running' | 'reporting' | 'findings';
}

export interface SiteStats {
  sectionCount: number;
  itemCount: number;
  criticalCount: number;
}
