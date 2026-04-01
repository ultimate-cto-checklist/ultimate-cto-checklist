export interface Item {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'recommended';
  category: string;
}

export interface Section {
  slug: string;
  id: string;
  name: string;
  description: string;
  defaultScope: string;
  items: Item[];
  guideContent: string;
  domain: string;
}

export interface SiteStats {
  sectionCount: number;
  itemCount: number;
  criticalCount: number;
}
