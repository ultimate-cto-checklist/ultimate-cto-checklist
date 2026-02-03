import fs from 'fs/promises';
import path from 'path';
import YAML from 'yaml';

// Types
export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'recommended';
  category: string;
}

export interface SectionSummary {
  slug: string;
  id: string;
  name: string;
  description: string;
  itemCount: number;
  criticalCount: number;
}

export interface Section {
  slug: string;
  id: string;
  name: string;
  description: string;
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
  items: Array<{
    id: string;
    title: string;
    description?: string;
    summary?: string; // Some items use 'summary' instead of 'description'
    severity: 'critical' | 'recommended';
    category?: string;
    type?: string;
  }>;
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
function isCacheValid<T>(entry: CacheEntry<T> | null): entry is CacheEntry<T> {
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

        const items = parsed.items || [];
        const itemCount = items.length;
        const criticalCount = items.filter(item => item.severity === 'critical').length;

        summaries.push({
          slug,
          id,
          name,
          description,
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

  // Normalize items - handle both description and summary fields
  const items: ChecklistItem[] = (parsed.items || []).map(item => ({
    id: item.id,
    title: item.title,
    description: item.description || item.summary || '',
    severity: item.severity,
    category: item.category || 'uncategorized',
  }));

  const section: Section = {
    slug,
    id,
    name,
    description,
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
