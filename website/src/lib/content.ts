import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { getDomain } from './domains';
import type { Section, Item, SiteStats, FloatingQuestion, Command } from './types';

const REPO_ROOT = path.resolve(process.cwd(), '..');
const CHECKLIST_DIR = path.join(REPO_ROOT, 'checklist');

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function stringifyValue(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') {
    // YAML parsed "key: value in sentence" as an object — reconstruct it
    return Object.entries(v as Record<string, unknown>)
      .map(([k, val]) => `${k}: ${val}`)
      .join(', ');
  }
  return String(v);
}

function toStringArray(val: unknown): string[] | undefined {
  if (!val) return undefined;
  if (Array.isArray(val)) return val.map(stringifyValue);
  return undefined;
}

function parseItem(raw: Record<string, unknown>): Item {
  const id = String(raw.id ?? '');
  const title = String(raw.title ?? '');
  return {
    id,
    slug: slugify(`${id}-${title}`),
    title,
    description: String(raw.description ?? raw.summary ?? ''),
    severity: raw.severity === 'critical' ? 'critical' : 'recommended',
    category: String(raw.category ?? 'general'),
    question: raw.question as string | string[] | undefined,
    checks: toStringArray(raw.checks),
    passCriteria: toStringArray(raw.pass_criteria),
    failCriteria: toStringArray(raw.fail_criteria),
    crossReferences: toStringArray(raw.cross_references),
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

  const rawScope = data.default_scope ?? 'project';
  const defaultScope = Array.isArray(rawScope) ? rawScope.map(String) : [String(rawScope)];
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

/** Extract the intro portion of guide.md (everything before the first --- or first item heading) */
export function extractGuideIntro(guideContent: string): string {
  if (!guideContent) return '';
  // Find the first horizontal rule (---) which separates intro from item sections
  const hrIndex = guideContent.search(/^---\s*$/m);
  // Also find the first item-id heading (## ITEM-ID or ### ITEM-ID)
  const itemHeadingIndex = guideContent.search(/^#{2,3}\s+[A-Z]+-\d+/m);

  let endIndex: number;
  if (hrIndex >= 0 && itemHeadingIndex >= 0) {
    endIndex = Math.min(hrIndex, itemHeadingIndex);
  } else if (hrIndex >= 0) {
    endIndex = hrIndex;
  } else if (itemHeadingIndex >= 0) {
    endIndex = itemHeadingIndex;
  } else {
    return '';
  }

  // Strip the top-level H1 (it duplicates the section header)
  let intro = guideContent.slice(0, endIndex).trim();
  intro = intro.replace(/^#\s+.+\n*/m, '').trim();
  // Also strip the "## Audit Process" boilerplate section if present
  intro = intro.replace(/## Audit Process[\s\S]*$/m, '').trim();
  return intro;
}

/** Extract the guide.md section for a specific item ID (e.g. "GIT-001") */
export function extractItemGuide(guideContent: string, itemId: string): string {
  if (!guideContent) return '';
  // Match ### ITEM-ID: or ## ITEM-ID: headers
  const escapedId = itemId.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const pattern = new RegExp(`^(#{2,3})\\s+${escapedId}[:\\s].*$`, 'm');
  const match = pattern.exec(guideContent);
  if (!match) return '';

  const startIndex = match.index + match[0].length;
  const headerLevel = match[1].length; // 2 or 3

  // Find the next header of same or higher level
  const rest = guideContent.slice(startIndex);
  const nextHeader = new RegExp(`^#{2,${headerLevel}}\\s`, 'm');
  const nextMatch = nextHeader.exec(rest);
  const section = nextMatch ? rest.slice(0, nextMatch.index) : rest;

  return section.trim();
}

export function computeStats(sections: Section[]): SiteStats {
  const itemCount = sections.reduce((sum, s) => sum + s.items.length, 0);
  const criticalCount = sections.reduce((sum, s) => sum + s.items.filter(i => i.severity === 'critical').length, 0);
  return { sectionCount: sections.length, itemCount, criticalCount };
}

const SKILLS_DIR = path.join(REPO_ROOT, 'skills');

const COMMAND_PHASES: Record<string, Command['phase']> = {
  'audit-tutorial': 'setup',
  'audit-init': 'setup',
  'audit-add-project': 'setup',
  'audit-start': 'running',
  'audit-continue': 'running',
  'audit-status': 'running',
  'audit-section': 'running',
  'audit-item': 'running',
  'audit-summary': 'reporting',
  'audit-diff': 'reporting',
  'audit-history': 'reporting',
  'audit-fix': 'findings',
  'audit-skip': 'findings',
  'audit-waiver': 'findings',
};

const PHASE_ORDER: Command['phase'][] = ['setup', 'running', 'reporting', 'findings'];

export function loadAllCommands(): Command[] {
  if (!fs.existsSync(SKILLS_DIR)) return [];
  const dirs = fs.readdirSync(SKILLS_DIR).filter(d => d.startsWith('audit-'));
  const commands = dirs.map(dir => {
    const skillPath = path.join(SKILLS_DIR, dir, 'SKILL.md');
    if (!fs.existsSync(skillPath)) return null;
    const raw = fs.readFileSync(skillPath, 'utf-8');

    // Parse frontmatter
    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!fmMatch) return null;
    const fm = YAML.parse(fmMatch[1]) as Record<string, string>;
    const content = fmMatch[2].trim();

    return {
      slug: dir,
      name: fm.name ?? dir,
      description: fm.description ?? '',
      content,
      phase: COMMAND_PHASES[dir] ?? 'running',
    } satisfies Command;
  }).filter((c): c is Command => c !== null);

  // Explicit ordering within each phase
  const COMMAND_ORDER: string[] = [
    // setup
    'audit-tutorial', 'audit-init', 'audit-add-project',
    // running
    'audit-start', 'audit-continue', 'audit-status', 'audit-section', 'audit-item',
    // reporting
    'audit-summary', 'audit-diff', 'audit-history',
    // findings
    'audit-waiver', 'audit-skip', 'audit-fix',
  ];
  commands.sort((a, b) => {
    const ai = COMMAND_ORDER.indexOf(a.slug);
    const bi = COMMAND_ORDER.indexOf(b.slug);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  return commands;
}

export function getPhaseLabel(phase: Command['phase']): string {
  const labels: Record<Command['phase'], string> = {
    setup: 'Setup',
    running: 'Running Audits',
    reporting: 'Results & Reporting',
    findings: 'Managing Findings',
  };
  return labels[phase];
}

const CLUSTER_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  infrastructure: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
  data: { bg: '#f5f3ff', border: '#ddd6fe', text: '#5b21b6' },
  observability: { bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
  security: { bg: '#fff1f2', border: '#fecdd3', text: '#9f1239' },
  operations: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' },
};

function getCluster(sectionId: string): string {
  const num = parseInt(sectionId, 10);
  if (num >= 1 && num <= 4) return 'infrastructure';
  if (num === 5 || num === 6 || num === 24 || num === 25) return 'data';
  if ((num >= 7 && num <= 9) || (num >= 12 && num <= 14) || num === 19 || num === 20) return 'observability';
  if ((num >= 30 && num <= 35) || num === 38 || num === 39) return 'security';
  return 'operations';
}

export function loadAllQuestions(): FloatingQuestion[] {
  const sections = loadAllSections();
  const questions: FloatingQuestion[] = [];
  for (const section of sections) {
    const colors = CLUSTER_COLORS[getCluster(section.id)];
    for (const item of section.items) {
      if (!item.question) continue;
      const qs = Array.isArray(item.question) ? item.question : [item.question];
      for (const q of qs) {
        questions.push({ question: q, ...colors });
      }
    }
  }
  return questions;
}
