'use client'

import { useState, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'

/**
 * Represents a table of contents entry with heading text, level, and anchor
 */
interface TocEntry {
  text: string
  level: 2 | 3
  id: string
}

/**
 * Props for the GuidePanel component
 */
interface GuidePanelProps {
  /** Markdown content to render */
  markdown: string
  /** Optional initial collapsed state for mobile */
  collapsed?: boolean
}

/**
 * Converts heading text to a valid HTML anchor ID
 * Converts to lowercase and replaces spaces with hyphens, preserving other characters
 */
function headingToId(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
}

/**
 * Parses markdown content and extracts h2 and h3 headings for TOC generation
 */
function extractTocEntries(markdown: string): TocEntry[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm
  const entries: TocEntry[] = []
  let match: RegExpExecArray | null

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length as 2 | 3
    const text = match[2].trim()
    const id = headingToId(text)

    entries.push({ text, level, id })
  }

  return entries
}

/**
 * GuidePanel component displays markdown content with an auto-generated table of contents
 *
 * Features:
 * - Renders markdown using react-markdown
 * - Auto-generates TOC from h2/h3 headings
 * - Collapsible on mobile via toggle button
 * - Clean typography with Tailwind CSS
 */
export default function GuidePanel({ markdown, collapsed: initialCollapsed = false }: GuidePanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed)

  // Memoize TOC extraction to avoid re-parsing on every render
  const tocEntries = useMemo(() => extractTocEntries(markdown), [markdown])

  // Custom components for react-markdown - add IDs for TOC anchor links
  const components: Components = {
    h1: ({ children, ...props }) => {
      const text = String(children)
      const id = headingToId(text)
      return <h1 id={id} {...props}>{children}</h1>
    },
    h2: ({ children, ...props }) => {
      const text = String(children)
      const id = headingToId(text)
      return <h2 id={id} className="scroll-mt-4" {...props}>{children}</h2>
    },
    h3: ({ children, ...props }) => {
      const text = String(children)
      const id = headingToId(text)
      return <h3 id={id} className="scroll-mt-4" {...props}>{children}</h3>
    },
    // Let prose handle all other styling
  }

  return (
    <div data-testid="guide-panel" className="overflow-hidden">
      {/* Table of Contents - collapsible */}
      {tocEntries.length > 0 && (
        <nav className="mb-4" aria-label="Table of contents">
          {/* Toggle button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-between py-2 text-left hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            aria-expanded={!isCollapsed}
            aria-controls="toc-content"
          >
            <span className="font-medium text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Table of Contents
            </span>
            <span className="text-zinc-400 text-xs">{isCollapsed ? '▼' : '▲'}</span>
          </button>

          {/* TOC Content */}
          <ul
            id="toc-content"
            className={`${isCollapsed ? 'hidden' : 'block'} space-y-1 text-sm border-l border-zinc-200 dark:border-zinc-700 pl-3 mt-2`}
          >
            {tocEntries.map((entry, index) => (
              <li
                key={`${entry.id}-${index}`}
                className={entry.level === 3 ? 'ml-3' : ''}
              >
                <a
                  href={`#${entry.id}`}
                  className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 block py-0.5 text-sm leading-snug"
                >
                  {entry.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* Markdown Content */}
      <article className="prose prose-sm prose-zinc dark:prose-invert max-w-none
        prose-headings:font-semibold prose-headings:text-zinc-900 dark:prose-headings:text-zinc-100
        prose-p:text-zinc-600 dark:prose-p:text-zinc-400 prose-p:leading-relaxed
        prose-code:bg-zinc-100 dark:prose-code:bg-zinc-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-zinc-100 dark:prose-pre:bg-zinc-800 prose-pre:border prose-pre:border-zinc-200 dark:prose-pre:border-zinc-700
        prose-a:text-zinc-700 dark:prose-a:text-zinc-300 prose-a:underline prose-a:underline-offset-2
        prose-li:text-zinc-600 dark:prose-li:text-zinc-400
        prose-strong:text-zinc-900 dark:prose-strong:text-zinc-100
        prose-blockquote:border-zinc-300 dark:prose-blockquote:border-zinc-600 prose-blockquote:text-zinc-600 dark:prose-blockquote:text-zinc-400
        overflow-x-auto
      ">
        <ReactMarkdown components={components}>
          {markdown}
        </ReactMarkdown>
      </article>
    </div>
  )
}
