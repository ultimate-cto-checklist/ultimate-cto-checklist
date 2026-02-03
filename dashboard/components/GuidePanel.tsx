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

  // Custom components for react-markdown with Tailwind styling
  const components: Components = {
    h1: ({ children, ...props }) => {
      const text = String(children)
      const id = headingToId(text)
      return (
        <h1 id={id} className="text-3xl font-bold mt-8 mb-4 first:mt-0" {...props}>
          {children}
        </h1>
      )
    },
    h2: ({ children, ...props }) => {
      const text = String(children)
      const id = headingToId(text)
      return (
        <h2 id={id} className="text-2xl font-bold mt-6 mb-3 scroll-mt-4" {...props}>
          {children}
        </h2>
      )
    },
    h3: ({ children, ...props }) => {
      const text = String(children)
      const id = headingToId(text)
      return (
        <h3 id={id} className="text-xl font-semibold mt-5 mb-2 scroll-mt-4" {...props}>
          {children}
        </h3>
      )
    },
    h4: ({ children, ...props }) => (
      <h4 className="text-lg font-semibold mt-4 mb-2" {...props}>
        {children}
      </h4>
    ),
    h5: ({ children, ...props }) => (
      <h5 className="text-base font-semibold mt-3 mb-2" {...props}>
        {children}
      </h5>
    ),
    h6: ({ children, ...props }) => (
      <h6 className="text-sm font-semibold mt-3 mb-2" {...props}>
        {children}
      </h6>
    ),
    p: ({ children, ...props }) => (
      <p className="mb-4 leading-relaxed" {...props}>
        {children}
      </p>
    ),
    code: ({ className, children, ...props }) => {
      // Check if this is a code block (has a language class) or inline code
      const isCodeBlock = className?.startsWith('language-')

      if (isCodeBlock) {
        return (
          <code
            className="block bg-gray-100 text-gray-900 p-4 rounded font-mono text-sm overflow-x-auto"
            {...props}
          >
            {children}
          </code>
        )
      }

      return (
        <code
          className="bg-gray-100 text-gray-900 px-1.5 py-0.5 rounded font-mono text-sm"
          {...props}
        >
          {children}
        </code>
      )
    },
    pre: ({ children, ...props }) => (
      <pre className="mb-4 rounded overflow-hidden" {...props}>
        {children}
      </pre>
    ),
    ul: ({ children, ...props }) => (
      <ul className="list-disc list-inside mb-4 space-y-1" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className="list-decimal list-inside mb-4 space-y-1" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="leading-relaxed" {...props}>
        {children}
      </li>
    ),
    a: ({ children, href, ...props }) => (
      <a
        href={href}
        className="text-blue-600 hover:text-blue-800 underline"
        {...props}
      >
        {children}
      </a>
    ),
    strong: ({ children, ...props }) => (
      <strong className="font-bold" {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }) => (
      <em className="italic" {...props}>
        {children}
      </em>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote
        className="border-l-4 border-gray-300 pl-4 italic my-4 text-gray-700"
        {...props}
      >
        {children}
      </blockquote>
    ),
    hr: ({ ...props }) => <hr className="my-8 border-gray-300" {...props} />,
    table: ({ children, ...props }) => (
      <div className="overflow-x-auto mb-4">
        <table className="min-w-full border-collapse border border-gray-300" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead className="bg-gray-50" {...props}>
        {children}
      </thead>
    ),
    th: ({ children, ...props }) => (
      <th className="border border-gray-300 px-4 py-2 text-left font-semibold" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td className="border border-gray-300 px-4 py-2" {...props}>
        {children}
      </td>
    ),
  }

  return (
    <div data-testid="guide-panel" className="flex flex-col lg:flex-row gap-6">
      {/* Table of Contents */}
      {tocEntries.length > 0 && (
        <aside className="lg:w-64 flex-shrink-0">
          <div className="lg:sticky lg:top-4">
            {/* Mobile toggle button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="lg:hidden w-full flex items-center justify-between px-4 py-2 bg-gray-100 rounded mb-2 hover:bg-gray-200"
              aria-expanded={!isCollapsed}
              aria-controls="toc-content"
            >
              <span className="font-semibold text-sm">Table of Contents</span>
              <span className="text-gray-600">{isCollapsed ? '▼' : '▲'}</span>
            </button>

            {/* TOC Content */}
            <nav
              id="toc-content"
              className={`${isCollapsed ? 'hidden' : 'block'} lg:block`}
              aria-label="Table of contents"
            >
              <h2 className="hidden lg:block font-semibold text-sm uppercase text-gray-600 mb-3">
                Table of Contents
              </h2>
              <ul className="space-y-2 text-sm">
                {tocEntries.map((entry, index) => (
                  <li
                    key={`${entry.id}-${index}`}
                    className={entry.level === 3 ? 'ml-4' : ''}
                  >
                    <a
                      href={`#${entry.id}`}
                      className="text-gray-700 hover:text-blue-600 hover:underline block py-1"
                    >
                      {entry.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </aside>
      )}

      {/* Markdown Content */}
      <article className="flex-1 min-w-0 prose prose-sm max-w-none">
        <ReactMarkdown components={components}>
          {markdown}
        </ReactMarkdown>
      </article>
    </div>
  )
}
