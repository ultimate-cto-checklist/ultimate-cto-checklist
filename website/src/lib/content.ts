import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { getDomain } from './domains';
import type { Section, Item, SiteStats } from './types';

const CHECKLIST_DIR = path.resolve(process.cwd(), 'checklist');

function parseItem(raw: Record<string, unknown>): Item {
  return {
    id: String(raw.id ?? ''),
    title: String(raw.title ?? ''),
    description: String(raw.description ?? raw.summary ?? ''),
    severity: raw.severity === 'critical' ? 'critical' : 'recommended',
    category: String(raw.category ?? 'general'),
  };
}

function parseSection(dirName: string, data: Record<string, unknown>, guideContent: string): Section {
  const slug = dirName.replace(/^\d+-/, '');
  let id: string;
  let name: string;
  let description: string;

  if (typeof data.section === 'object' && data.section !== null) {
    const sec = data.section as Record<string, string>;
    id = String(sec.id);
    name = String(sec.name);
    description = String(sec.description ?? '');
  } else {
    const secStr = String(data.section);
    id = secStr.split('-')[0];
    name = String(data.title ?? '');
    description = String(data.description ?? '');
  }

  const defaultScope = String(data.default_scope ?? 'project');
  const rawItems = (data.items as Record<string, unknown>[]) ?? [];
  const items = rawItems.map(parseItem);

  return { slug, id, name, description, defaultScope, items, guideContent, domain: getDomain(id) };
}

export function loadAllSections(): Section[] {
  if (!fs.existsSync(CHECKLIST_DIR)) {
    throw new Error(`Checklist directory not found at ${CHECKLIST_DIR}. Ensure the checklist symlink is initialized.`);
  }
  const dirs = fs.readdirSync(CHECKLIST_DIR).filter(d => /^\d{2}-/.test(d)).sort();
  return dirs.map(dir => {
    const yamlPath = path.join(CHECKLIST_DIR, dir, 'items.yaml');
    const guidePath = path.join(CHECKLIST_DIR, dir, 'guide.md');
    const yamlContent = fs.readFileSync(yamlPath, 'utf-8');
    const data = YAML.parse(yamlContent) as Record<string, unknown>;
    const guideContent = fs.existsSync(guidePath) ? fs.readFileSync(guidePath, 'utf-8') : '';
    return parseSection(dir, data, guideContent);
  });
}

export function computeStats(sections: Section[]): SiteStats {
  const itemCount = sections.reduce((sum, s) => sum + s.items.length, 0);
  const criticalCount = sections.reduce((sum, s) => sum + s.items.filter(i => i.severity === 'critical').length, 0);
  return { sectionCount: sections.length, itemCount, criticalCount };
}
