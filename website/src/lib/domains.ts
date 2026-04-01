const DOMAIN_RANGES: [string, number, number][] = [
  ['Infrastructure & Setup', 1, 4],
  ['Database & Data', 5, 6],
  ['Monitoring & Health', 7, 9],
  ['Deployment & Operations', 10, 11],
  ['Observability', 12, 14],
  ['Admin & Management', 15, 16],
  ['Performance & Analytics', 17, 18],
  ['Error Tracking & Reliability', 19, 20],
  ['Infrastructure Features', 21, 23],
  ['Data Management', 24, 25],
  ['High Availability & DR', 26, 27],
  ['Code Quality & Architecture', 28, 29],
  ['API & Security', 30, 35],
  ['Operations & Incident Management', 36, 37],
  ['Compliance & Legal', 38, 39],
  ['Team & Development', 40, 42],
];

export function getDomain(sectionId: string): string {
  const num = parseInt(sectionId, 10);
  for (const [domain, start, end] of DOMAIN_RANGES) {
    if (num >= start && num <= end) return domain;
  }
  return 'Other';
}

export function getAllDomains(): string[] {
  return DOMAIN_RANGES.map(([domain]) => domain);
}
