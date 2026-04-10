#!/usr/bin/env npx tsx
/**
 * Audit result file validator — zero external dependencies.
 *
 * Usage:
 *   npx tsx checklist/schema/validate.ts <path-to-audit-dir-or-file>
 *   npx tsx checklist/schema/validate.ts --fix <path>
 *
 * Validates audit result markdown files against the schema defined in
 * checklist/schema/audit-result.schema.yaml.
 */

import fs from "fs";
import path from "path";

// --- Schema constants ---

const VALID_STATUSES = [
  "pass",
  "fail",
  "partial",
  "blocked",
  "waived",
] as const;
type Status = (typeof VALID_STATUSES)[number];

const ITEM_ID_PATTERN = /^[A-Z][A-Z0-9]+-\d{3}$/;
const SECTION_PATTERN = /^\d{2}-[a-z-]+$/;

const REQUIRED_HEADINGS_BY_STATUS: Record<string, string[]> = {
  pass: ["## Summary", "## Evidence"],
  fail: ["## Summary", "## Evidence", "## Reason for Failure"],
  partial: ["## Summary", "## Evidence", "## Reason for Partial"],
  blocked: ["## Summary"],
  waived: ["## Summary"],
};

const STATUS_ALIASES: Record<string, string> = {};

// --- Types ---

interface ValidationResult {
  file: string;
  errors: string[];
  warnings: string[];
  fixed: string[];
}

// --- Simple YAML frontmatter parser (key: value only, no nesting) ---

function parseSimpleYaml(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const match = line.match(/^(\w[\w_]*):\s*(.*)$/);
    if (match) {
      let value = match[2].trim();
      // Strip surrounding quotes
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      result[match[1]] = value;
    }
  }
  return result;
}

function serializeSimpleYaml(data: Record<string, string>): string {
  return Object.entries(data)
    .map(([key, value]) => {
      // Quote values that contain colons or special chars
      if (value.includes(":") || value.includes("#")) {
        return `${key}: "${value}"`;
      }
      return `${key}: ${value}`;
    })
    .join("\n");
}

// --- Frontmatter parser ---

function parseFrontmatter(content: string): {
  data: Record<string, string>;
  body: string;
  hasFrontmatter: boolean;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { data: {}, body: content, hasFrontmatter: false };
  return {
    data: parseSimpleYaml(match[1]),
    body: match[2],
    hasFrontmatter: true,
  };
}

function serializeFrontmatter(
  data: Record<string, string>,
  body: string
): string {
  const yamlStr = serializeSimpleYaml(data);
  return `---\n${yamlStr}\n---\n${body}`;
}

// --- Validation ---

function validateFile(
  filePath: string,
  fix: boolean
): ValidationResult {
  const result: ValidationResult = {
    file: filePath,
    errors: [],
    warnings: [],
    fixed: [],
  };

  const filename = path.basename(filePath);

  // Skip non-md, hidden, and underscore-prefixed files
  if (
    !filename.endsWith(".md") ||
    filename.startsWith("_") ||
    filename.startsWith(".")
  ) {
    return result;
  }

  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    result.errors.push("Could not read file");
    return result;
  }

  const parsed = parseFrontmatter(content);
  if (!parsed.hasFrontmatter) {
    result.errors.push("No YAML frontmatter found");
    return result;
  }

  const data = { ...parsed.data };
  let body = parsed.body;
  let modified = false;

  // --- Field: item_id (may be stored as `id`) ---
  if (!data.item_id && data.id) {
    if (fix) {
      data.item_id = data.id;
      delete data.id;
      result.fixed.push(`Renamed 'id' → 'item_id' (${data.item_id})`);
      modified = true;
    } else {
      result.errors.push(
        `Uses 'id' instead of 'item_id'. Run with --fix to rename.`
      );
    }
  }

  if (!data.item_id) {
    result.errors.push("Missing required field: item_id");
  } else if (!ITEM_ID_PATTERN.test(data.item_id)) {
    result.errors.push(
      `item_id '${data.item_id}' does not match pattern ^[A-Z]+-\\d{3}$`
    );
  }

  // --- Field: title ---
  if (!data.title) {
    result.errors.push("Missing required field: title");
  }

  // --- Field: status ---
  if (!data.status) {
    result.errors.push("Missing required field: status");
  } else {
    const rawStatus = String(data.status);
    const lower = rawStatus.toLowerCase().trim();
    const normalized = STATUS_ALIASES[lower] || lower;

    if (!VALID_STATUSES.includes(normalized as Status)) {
      result.errors.push(
        `Invalid status '${rawStatus}'. Must be one of: ${VALID_STATUSES.join(", ")}`
      );
    } else if (rawStatus !== normalized) {
      if (fix) {
        data.status = normalized;
        result.fixed.push(
          `Normalized status '${rawStatus}' → '${normalized}'`
        );
        modified = true;
      } else {
        result.errors.push(
          `Status '${rawStatus}' should be '${normalized}'. Run with --fix.`
        );
      }
    }
  }

  // --- Field: severity ---
  if (!data.severity) {
    result.errors.push("Missing required field: severity");
  } else if (!["critical", "recommended"].includes(data.severity)) {
    result.errors.push(
      `Invalid severity '${data.severity}'. Must be 'critical' or 'recommended'.`
    );
  }

  // --- Field: section ---
  if (!data.section) {
    result.errors.push("Missing required field: section");
  } else if (!SECTION_PATTERN.test(data.section)) {
    result.errors.push(
      `section '${data.section}' does not match pattern ^\\d{2}-[a-z-]+$`
    );
  }

  // --- Field: audited_at ---
  if (!data.audited_at) {
    result.errors.push("Missing required field: audited_at");
  }

  // --- Filename matches item_id ---
  const expectedFilename = data.item_id ? `${data.item_id}.md` : null;
  if (expectedFilename && filename !== expectedFilename) {
    result.errors.push(
      `Filename '${filename}' does not match item_id '${data.item_id}' (expected '${expectedFilename}')`
    );
  }

  // --- Body headings ---
  const status = fix
    ? data.status
    : STATUS_ALIASES[String(data.status || "").toLowerCase().trim()] ||
      String(data.status || "").toLowerCase().trim();

  if (status && REQUIRED_HEADINGS_BY_STATUS[status]) {
    const requiredHeadings = REQUIRED_HEADINGS_BY_STATUS[status];
    for (const heading of requiredHeadings) {
      if (!body.includes(heading)) {
        if (heading === "## Summary") {
          result.errors.push(
            `Missing '${heading}' (required for status '${status}'). ` +
              `Add a 1-3 sentence summary manually.`
          );
        } else {
          result.errors.push(
            `Missing '${heading}' (required for status '${status}')`
          );
        }
      }
    }
  }

  // --- Remove redundant `# ITEM-ID: Title` and `## Result: STATUS` lines ---
  if (fix) {
    const titleLineRegex = /^# [A-Z]+-\d{3}:.*\n+/m;
    if (titleLineRegex.test(body)) {
      body = body.replace(titleLineRegex, "");
      result.fixed.push("Removed redundant '# ITEM-ID: Title' line");
      modified = true;
    }

    const resultLineRegex = /^## Result:.*\n+/m;
    if (resultLineRegex.test(body)) {
      body = body.replace(resultLineRegex, "");
      result.fixed.push("Removed redundant '## Result: STATUS' line");
      modified = true;
    }
  }

  // --- Write fixes ---
  if (fix && modified) {
    // Reorder frontmatter fields for consistency
    const ordered: Record<string, string> = {};
    const fieldOrder = [
      "item_id",
      "title",
      "status",
      "severity",
      "section",
      "audited_at",
      "auditor",
      "category",
      "waiver_ref",
    ];
    for (const key of fieldOrder) {
      if (data[key] !== undefined) ordered[key] = data[key];
    }
    for (const key of Object.keys(data)) {
      if (!(key in ordered)) ordered[key] = data[key];
    }

    const newContent = serializeFrontmatter(ordered, body);
    fs.writeFileSync(filePath, newContent, "utf-8");
  }

  return result;
}

// --- CLI ---

function main() {
  const args = process.argv.slice(2);
  let fix = false;
  const paths: string[] = [];

  for (const arg of args) {
    if (arg === "--fix") {
      fix = true;
    } else if (arg === "--help" || arg === "-h") {
      console.log(
        `Usage: npx tsx validate.ts [--fix] <path-to-audit-dir-or-file>`
      );
      console.log();
      console.log(
        "Validates audit result files against the canonical schema."
      );
      console.log();
      console.log("Options:");
      console.log(
        "  --fix    Auto-fix mechanical issues (field names, status casing)"
      );
      console.log("           Missing ## Summary is NOT auto-fixable.");
      process.exit(0);
    } else {
      paths.push(arg);
    }
  }

  if (paths.length === 0) {
    console.error("Error: Provide a path to an audit directory or file.");
    console.error("Usage: npx tsx validate.ts [--fix] <path>");
    process.exit(1);
  }

  // Collect files to validate
  const files: string[] = [];
  for (const p of paths) {
    const resolved = path.resolve(p);
    const stat = fs.statSync(resolved);
    if (stat.isDirectory()) {
      const entries = fs.readdirSync(resolved);
      for (const entry of entries) {
        if (
          entry.endsWith(".md") &&
          !entry.startsWith("_") &&
          !entry.startsWith(".")
        ) {
          files.push(path.join(resolved, entry));
        }
      }
    } else {
      files.push(resolved);
    }
  }

  if (files.length === 0) {
    console.log("No audit result files found.");
    process.exit(0);
  }

  // Validate
  let totalErrors = 0;
  let totalFixed = 0;
  let totalOk = 0;

  for (const file of files) {
    const result = validateFile(file, fix);
    const short = path.basename(file);

    if (result.errors.length === 0 && result.fixed.length === 0) {
      totalOk++;
      if (!fix) {
        console.log(`  OK  ${short}`);
      }
    }

    if (result.fixed.length > 0) {
      totalFixed += result.fixed.length;
      console.log(`  FIX ${short}`);
      for (const f of result.fixed) {
        console.log(`      ↳ ${f}`);
      }
    }

    if (result.errors.length > 0) {
      totalErrors += result.errors.length;
      console.log(`  ERR ${short}`);
      for (const e of result.errors) {
        console.log(`      ✗ ${e}`);
      }
    }
  }

  // Summary
  console.log();
  console.log(`--- Summary ---`);
  console.log(`Files:  ${files.length}`);
  console.log(`OK:     ${totalOk}`);
  if (fix) {
    console.log(`Fixed:  ${totalFixed} issues`);
  }
  console.log(`Errors: ${totalErrors}`);

  process.exit(totalErrors > 0 ? 1 : 0);
}

main();
