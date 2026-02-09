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
  /** Whether to show table of contents (default: true) */
  showToc?: boolean
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
export default function GuidePanel({ markdown, collapsed: initialCollapsed = false, showToc = true }: GuidePanelProps) {
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
      {showToc && tocEntries.length > 0 && (
        <nav className="mb-5 pb-4 border-b border-slate-200" aria-label="Table of contents">
          {/* Toggle button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-between py-2 text-left hover:text-slate-900 transition-colors"
            aria-expanded={!isCollapsed}
            aria-controls="toc-content"
          >
            <span className="font-bold text-xs uppercase tracking-wider text-teal-600 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
              Table of Contents
            </span>
            <span className={`text-teal-400 text-sm transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`}>▶</span>
          </button>

          {/* TOC Content */}
          <ul
            id="toc-content"
            className={`${isCollapsed ? 'hidden' : 'block'} space-y-1 text-sm border-l-2 border-teal-200 pl-3 mt-3`}
          >
            {tocEntries.map((entry, index) => (
              <li
                key={`${entry.id}-${index}`}
                className={entry.level === 3 ? 'ml-3' : ''}
              >
                <a
                  href={`#${entry.id}`}
                  className="text-slate-600 hover:text-teal-600 block py-0.5 text-sm leading-snug transition-colors"
                >
                  {entry.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* Markdown Content */}
      <article className="prose prose-slate max-w-none
        prose-headings:font-semibold prose-headings:tracking-tight
        prose-h1:text-xl prose-h1:text-slate-900 prose-h1:border-b prose-h1:border-slate-200 prose-h1:pb-2 prose-h1:mb-4
        prose-h2:text-lg prose-h2:text-slate-800 prose-h2:mt-8 prose-h2:mb-3
        prose-h3:text-base prose-h3:text-slate-700 prose-h3:mt-6 prose-h3:mb-2
        prose-p:text-slate-600 prose-p:leading-relaxed prose-p:my-3 prose-p:text-sm
        prose-code:bg-slate-800 prose-code:text-cyan-400 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:font-medium prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700 prose-pre:rounded-lg prose-pre:my-4
        prose-pre:prose-code:bg-transparent prose-pre:prose-code:text-slate-300 prose-pre:prose-code:p-0
        prose-a:text-teal-600 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
        prose-ul:my-3 prose-ul:list-disc prose-ul:pl-5 prose-ul:text-sm
        prose-ol:my-3 prose-ol:list-decimal prose-ol:pl-5 prose-ol:text-sm
        prose-li:text-slate-600 prose-li:my-1 prose-li:pl-1
        prose-strong:text-slate-800 prose-strong:font-semibold
        prose-blockquote:border-l-3 prose-blockquote:border-teal-400 prose-blockquote:bg-teal-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-slate-600
        prose-hr:border-slate-200 prose-hr:my-6
        overflow-x-auto
      ">
        <ReactMarkdown components={components}>
          {markdown}
        </ReactMarkdown>
      </article>
    </div>
  )
}
