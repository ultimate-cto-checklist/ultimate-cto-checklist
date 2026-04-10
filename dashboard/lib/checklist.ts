import fs from 'fs/promises';
import path from 'path';
import YAML from 'yaml';

// Types
export type Scope = 'org' | 'project';

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'recommended';
  category: string;
  scope: Scope[];
}

export interface SectionSummary {
  slug: string;
  id: string;
  name: string;
  description: string;
  defaultScope: Scope[];
  goal?: string;
  itemCount: number;
  criticalCount: number;
}

export interface Section {
  slug: string;
  id: string;
  name: string;
  description: string;
  defaultScope: Scope[];
  items: ChecklistItem[];
  guide: string;
}

// YAML structure as it appears in items.yaml files
// Note: Some sections use old format with scalar section and separate title/description fields
interface ItemsYAML {
  section: string | {
    id: string;
    name: string;
    description: string;
  };
  title?: string;
  description?: string;
  default_scope?: Scope | Scope[];
  items: Array<{
    id: string;
    title: string;
    description?: string;
    summary?: string; // Some items use 'summary' instead of 'description'
    severity: 'critical' | 'recommended';
    category?: string;
    type?: string;
    scope?: Scope | Scope[];
  }>;
}

/** Normalize a scope value (string or array) into a Scope[] */
function normalizeScope(raw: Scope | Scope[] | undefined, fallback: Scope[]): Scope[] {
  if (!raw) return fallback;
  return Array.isArray(raw) ? raw : [raw];
}

// Cache configuration
const CACHE_TTL = 60 * 1000; // 60 seconds
const shouldCache = () => process.env.NODE_ENV === 'production';

// Cache storage
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

let sectionListCache: CacheEntry<SectionSummary[]> | null = null;
const sectionCache = new Map<string, CacheEntry<Section>>();

// Helper: Get checklist directory path
function getChecklistDir(): string {
  // Dashboard is at /path/to/dashboard, checklist is at /path/to/checklist
  return path.resolve(process.cwd(), '..', 'checklist');
}

// Helper: Check if cache is valid
function isCacheValid<T>(entry: CacheEntry<T> | null | undefined): entry is CacheEntry<T> {
  if (!shouldCache() || !entry) return false;
  return Date.now() - entry.timestamp < CACHE_TTL;
}

/**
 * List all checklist sections with summary metadata.
 * Results are cached for 60s in production.
 */
export async function listSections(): Promise<SectionSummary[]> {
  // Check cache
  if (isCacheValid(sectionListCache)) {
    return sectionListCache.data;
  }

  const checklistDir = getChecklistDir();

  try {
    // Read directory
    const entries = await fs.readdir(checklistDir, { withFileTypes: true });

    // Filter for directories that match pattern: NN-name
    const sectionDirs = entries
      .filter(entry => entry.isDirectory() && /^\d{2}-/.test(entry.name))
      .map(entry => entry.name)
      .sort(); // Sort by name (which sorts by numeric ID)

    // Process each section
    const summaries: SectionSummary[] = [];

    for (const dirName of sectionDirs) {
      const itemsPath = path.join(checklistDir, dirName, 'items.yaml');
      const guidePath = path.join(checklistDir, dirName, 'guide.md');

      try {
        const itemsContent = await fs.readFile(itemsPath, 'utf-8');
        const parsed = YAML.parse(itemsContent) as ItemsYAML;

        // Extract metadata - handle both old and new formats
        const slug = dirName;
        let id: string;
        let name: string;
        let description: string;

        if (typeof parsed.section === 'string') {
          // Old format: section is a string slug, title and description are separate
          id = parsed.section.split('-')[0];
          name = parsed.title || '';
          description = parsed.description || '';
        } else {
          // New format: section is an object with id, name, description
          id = parsed.section.id;
          name = parsed.section.name;
          description = parsed.section.description;
        }

        // Extract default_scope (top-level field in both YAML formats)
        const defaultScope = normalizeScope(parsed.default_scope, ['project']);

        // Extract goal from guide.md (pattern: "## The Goal: Goal Text")
        let goal: string | undefined;
        try {
          const guideContent = await fs.readFile(guidePath, 'utf-8');
          const goalMatch = guideContent.match(/^## The Goal: (.+)$/m);
          if (goalMatch) {
            goal = goalMatch[1].trim();
          }
        } catch {
          // guide.md not found or unreadable - goal remains undefined
        }

        const items = parsed.items || [];
        const itemCount = items.length;
        const criticalCount = items.filter(item => item.severity === 'critical').length;

        summaries.push({
          slug,
          id,
          name,
          description,
          defaultScope,
          goal,
          itemCount,
          criticalCount,
        });
      } catch (error) {
        // Skip sections without items.yaml (work in progress)
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
          console.warn(`Skipping section ${dirName}: items.yaml not found`);
          continue;
        }
        throw new Error(
          `Failed to parse items.yaml for section ${dirName}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // Cache the result
    if (shouldCache()) {
      sectionListCache = {
        data: summaries,
        timestamp: Date.now(),
      };
    }

    return summaries;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error(`Checklist directory not found: ${checklistDir}`);
    }
    throw error;
  }
}

/**
 * Get full details for a specific section including all items and guide.
 * Results are cached for 60s in production.
 */
export async function getSection(slug: string): Promise<Section> {
  // Check cache
  const cached = sectionCache.get(slug);
  if (isCacheValid(cached)) {
    return cached.data;
  }

  const checklistDir = getChecklistDir();
  const sectionDir = path.join(checklistDir, slug);

  // Verify directory exists
  try {
    const stats = await fs.stat(sectionDir);
    if (!stats.isDirectory()) {
      throw new Error(`Section ${slug} is not a directory`);
    }
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error(`Section not found: ${slug}`);
    }
    throw error;
  }

  // Read items.yaml
  const itemsPath = path.join(sectionDir, 'items.yaml');
  let parsed: ItemsYAML;

  try {
    const itemsContent = await fs.readFile(itemsPath, 'utf-8');
    parsed = YAML.parse(itemsContent) as ItemsYAML;

    // Validate based on format
    if (!parsed.section) {
      throw new Error(`Invalid items.yaml structure in ${slug}: missing section field`);
    }

    if (typeof parsed.section === 'object') {
      // New format validation
      if (!parsed.section.id || !parsed.section.name) {
        throw new Error(`Invalid items.yaml structure in ${slug}: missing required section fields`);
      }
    }
    // Old format doesn't need extra validation beyond section being present
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error(`items.yaml not found for section ${slug}`);
    }
    if (error instanceof Error && error.message.includes('Invalid items.yaml')) {
      throw error;
    }
    throw new Error(
      `Failed to parse items.yaml for section ${slug}: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Read guide.md (optional)
  const guidePath = path.join(sectionDir, 'guide.md');
  let guide = '';

  try {
    guide = await fs.readFile(guidePath, 'utf-8');
  } catch (error) {
    // If guide.md doesn't exist, leave guide as empty string
    if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) {
      // Some other error occurred while reading guide
      console.warn(`Warning: Could not read guide.md for ${slug}:`, error);
    }
  }

  // Build Section object - handle both old and new formats
  let id: string;
  let name: string;
  let description: string;

  if (typeof parsed.section === 'string') {
    // Old format
    id = parsed.section.split('-')[0];
    name = parsed.title || '';
    description = parsed.description || '';
  } else {
    // New format
    id = parsed.section.id;
    name = parsed.section.name;
    description = parsed.section.description;
  }

  // Extract default_scope (top-level field in both YAML formats)
  const defaultScope = normalizeScope(parsed.default_scope, ['project']);

  // Normalize items - handle both description and summary fields
  const items: ChecklistItem[] = (parsed.items || []).map(item => ({
    id: item.id,
    title: item.title,
    description: item.description || item.summary || '',
    severity: item.severity,
    category: item.category || 'uncategorized',
    scope: normalizeScope(item.scope, defaultScope),
  }));

  const section: Section = {
    slug,
    id,
    name,
    description,
    defaultScope,
    items,
    guide,
  };

  // Cache the result
  if (shouldCache()) {
    sectionCache.set(slug, {
      data: section,
      timestamp: Date.now(),
    });
  }

  return section;
}

// === Workspace / Audit Support ===

const WORKSPACE_PATH = process.env.AUDIT_WORKSPACE;

export function hasWorkspace(): boolean {
  if (!WORKSPACE_PATH) return false;
  try {
    // Use sync check since this is called in component render
    const fsSync = require('fs');
    return fsSync.existsSync(path.join(WORKSPACE_PATH, 'org.yaml'));
  } catch {
    return false;
  }
}

export interface Project {
  name: string;
  path: string;
  type: string;
  repo?: string;
  lastAudit?: string;
  lastAuditScore?: number;
}

export interface AuditResult {
  itemId: string;
  title: string;
  status: 'pass' | 'fail' | 'partial' | 'blocked' | 'waived';
  severity: 'critical' | 'recommended';
  section: string;
  auditedAt: string;
  summary?: string;
  body?: string;
  hasWaiver?: boolean;
}

export interface AuditHistoryEntry {
  date: string;
  total: number;
  pass: number;
  fail: number;
  score: number;
}

export async function listProjects(): Promise<Project[]> {
  if (!WORKSPACE_PATH) return [];

  const projectsDir = path.join(WORKSPACE_PATH, 'projects');
  try {
    const files = await fs.readdir(projectsDir);
    const yamlFiles = files.filter(f => f.endsWith('.yaml'));

    return Promise.all(yamlFiles.map(async (file) => {
      const content = await fs.readFile(path.join(projectsDir, file), 'utf-8');
      const data = YAML.parse(content);

      // Get last audit info
      const auditDir = path.join(WORKSPACE_PATH!, 'audits', data.name);
      let lastAudit: string | undefined;
      let lastAuditScore: number | undefined;

      try {
        const audits = await fs.readdir(auditDir);
        const dateDirs = audits
          .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))
          .sort()
          .reverse();

        if (dateDirs.length > 0) {
          lastAudit = dateDirs[0];
          lastAuditScore = await calculateAuditScore(data.name, dateDirs[0]);
        }
      } catch {
        // No audits directory yet
      }

      return {
        name: data.name,
        path: data.path,
        type: data.type,
        repo: data.repo,
        lastAudit,
        lastAuditScore,
      };
    }));
  } catch {
    return [];
  }
}

function normalizeStatus(raw: string | undefined): AuditResult['status'] {
  if (!raw) return 'blocked';
  return raw.toLowerCase().trim() as AuditResult['status'];
}

/** List item IDs that have a waiver file (global or project-specific). */
async function listWaiverIds(project: string): Promise<Set<string>> {
  if (!WORKSPACE_PATH) return new Set();
  const ids = new Set<string>();

  // Global waivers: waivers/<ITEM-ID>.md
  const globalDir = path.join(WORKSPACE_PATH, 'waivers');
  try {
    const files = await fs.readdir(globalDir);
    for (const f of files) {
      if (f.endsWith('.md') && !f.startsWith('.') && !f.startsWith('_')) {
        ids.add(f.replace(/\.md$/, ''));
      }
    }
  } catch { /* no waivers dir */ }

  // Project-specific waivers: waivers/<project>/<ITEM-ID>.md
  if (project !== '_org') {
    const projectDir = path.join(WORKSPACE_PATH, 'waivers', project);
    try {
      const files = await fs.readdir(projectDir);
      for (const f of files) {
        if (f.endsWith('.md') && !f.startsWith('.') && !f.startsWith('_')) {
          ids.add(f.replace(/\.md$/, ''));
        }
      }
    } catch { /* no project waivers dir */ }
  }

  return ids;
}

export async function getAuditResults(
  project: string,
  date: string
): Promise<AuditResult[]> {
  if (!WORKSPACE_PATH) return [];

  const auditDir = path.join(WORKSPACE_PATH, 'audits', project, date);
  try {
    const [files, waiverIds] = await Promise.all([
      fs.readdir(auditDir),
      listWaiverIds(project),
    ]);
    const resultFiles = files.filter(f => f.endsWith('.md') && !f.startsWith('_') && !f.startsWith('.'));

    return Promise.all(resultFiles.map(async (file) => {
      const content = await fs.readFile(path.join(auditDir, file), 'utf-8');
      const { data, body } = parseFrontmatter(content);

      // Backward compat: accept both item_id and id
      if (!data.item_id && data.id && process.env.NODE_ENV !== 'production') {
        console.warn(`[audit] ${file}: uses 'id' instead of 'item_id' — run validate.ts --fix`);
      }

      const itemId = data.item_id || data.id || '';
      const status = normalizeStatus(data.status);

      // Extract summary separately; body gets everything after summary
      const summary = extractMarkdownSection(body, 'Summary');
      const bodyWithoutSummary = body.replace(/## Summary\n[\s\S]*?(?=\n## |$)/, '').trim();

      return {
        itemId,
        title: data.title || '',
        status,
        severity: data.severity || 'recommended',
        section: data.section || '',
        auditedAt: data.audited_at || '',
        summary,
        body: bodyWithoutSummary || undefined,
        hasWaiver: status === 'waived' ? waiverIds.has(itemId) : undefined,
      };
    }));
  } catch {
    return [];
  }
}

export async function getAuditHistory(project: string): Promise<AuditHistoryEntry[]> {
  if (!WORKSPACE_PATH) return [];

  const auditDir = path.join(WORKSPACE_PATH, 'audits', project);
  try {
    const entries = await fs.readdir(auditDir);
    const dates = entries
      .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))
      .sort()
      .reverse();

    return Promise.all(dates.map(async (date) => {
      const results = await getAuditResults(project, date);
      const pass = results.filter(r => r.status === 'pass').length;
      const fail = results.filter(r => r.status === 'fail').length;

      return {
        date,
        total: results.length,
        pass,
        fail,
        score: results.length > 0 ? Math.round((pass / results.length) * 100) : 0,
      };
    }));
  } catch {
    return [];
  }
}

async function calculateAuditScore(project: string, date: string): Promise<number> {
  const results = await getAuditResults(project, date);
  if (results.length === 0) return 0;
  const passed = results.filter(r => r.status === 'pass').length;
  return Math.round((passed / results.length) * 100);
}

function parseFrontmatter(content: string): { data: Record<string, any>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { data: {}, body: content };
  return {
    data: YAML.parse(match[1]) || {},
    body: match[2],
  };
}

function extractMarkdownSection(content: string, heading: string): string | undefined {
  const regex = new RegExp(`## ${heading}\\n([\\s\\S]*?)(?=\\n## |$)`);
  const match = content.match(regex);
  return match ? match[1].trim() || undefined : undefined;
}

// === Org-Level Audit Support ===

export interface OrgInfo {
  name: string;
  slug: string;
}

export interface OrgAuditSummary {
  lastAudit: string;
  lastAuditScore: number;
}

export async function getOrgInfo(): Promise<OrgInfo | null> {
  if (!WORKSPACE_PATH) return null;
  try {
    const content = await fs.readFile(path.join(WORKSPACE_PATH, 'org.yaml'), 'utf-8');
    const data = YAML.parse(content);
    return { name: data.name || 'Organization', slug: data.slug || '' };
  } catch {
    return null;
  }
}

export async function getOrgAuditSummary(): Promise<OrgAuditSummary | null> {
  if (!WORKSPACE_PATH) return null;
  const history = await getAuditHistory('_org');
  if (history.length === 0) return null;
  const latest = history[0]; // Already sorted descending
  return { lastAudit: latest.date, lastAuditScore: latest.score };
}

