"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { AuditResult } from "@/lib/checklist";

const ChevronDown = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);
const ChevronRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

interface AuditItemProps {
  result: AuditResult;
}

const statusIndicator: Record<string, { icon: string; color: string; label: string }> = {
  pass:    { icon: "✓", color: "text-green-600", label: "Pass" },
  fail:    { icon: "✗", color: "text-red-600",   label: "Fail" },
  partial: { icon: "◐", color: "text-amber-600", label: "Partial" },
  blocked: { icon: "⊘", color: "text-orange-500", label: "Blocked" },
  waived:  { icon: "–", color: "text-gray-400",  label: "Waived" },
};

const severityStyle: Record<string, string> = {
  critical:    "text-gray-700 bg-gray-100 ring-1 ring-gray-300",
  recommended: "text-gray-400 bg-gray-50",
  optional:    "text-gray-300 bg-transparent",
};

export default function AuditItem({ result }: AuditItemProps) {
  const [showDetails, setShowDetails] = useState(false);
  const indicator = statusIndicator[result.status] || statusIndicator.blocked;

  return (
    <div className="border-b border-gray-100 py-2.5 px-3 flex gap-3">
      {/* Status indicator — the first thing the eye reads */}
      <span
        className={`flex-shrink-0 w-5 h-5 flex items-center justify-center text-sm font-bold ${indicator.color}`}
        title={indicator.label}
      >
        {indicator.icon}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Top line: ID, title, severity badge */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-gray-400 flex-shrink-0">
            {result.itemId}
          </span>
          <span className="font-medium text-gray-900 truncate">
            {result.title}
          </span>
          <span className={`flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
            severityStyle[result.severity] || severityStyle.recommended
          }`}>
            {result.severity}
          </span>
          {result.status === 'waived' && result.hasWaiver === false && (
            <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 ring-1 ring-amber-300">
              Missing waiver
            </span>
          )}
        </div>

        {/* Summary (always visible) */}
        {result.summary && (
          <div className="mt-1.5 text-sm text-gray-600 prose prose-sm max-w-none">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="my-1">{children}</p>,
                ul: ({ children }) => <ul className="my-1 ml-4">{children}</ul>,
                ol: ({ children }) => <ol className="my-1 ml-4">{children}</ol>,
                li: ({ children }) => <li className="my-0.5">{children}</li>,
                code: ({ children }) => (
                  <code className="px-1 py-0.5 bg-gray-100 rounded text-xs">{children}</code>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold">{children}</strong>
                ),
              }}
            >
              {result.summary}
            </ReactMarkdown>
          </div>
        )}

        {/* Details toggle (everything except summary) */}
        {result.body && (
          <div className="mt-1.5">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              {showDetails ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              {showDetails ? "Hide" : "Show"} details
            </button>

            {showDetails && (
              <div className="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-700 prose prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    h2: ({ children }) => (
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mt-4 mb-1.5 first:mt-0">
                        {children}
                      </h2>
                    ),
                    p: ({ children }) => <p className="my-1">{children}</p>,
                    ul: ({ children }) => (
                      <ul className="my-1 ml-4">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="my-1 ml-4">{children}</ol>
                    ),
                    li: ({ children }) => <li className="my-0.5">{children}</li>,
                    code: ({ children, className }) => {
                      const isBlock = className?.includes('language-');
                      return isBlock ? (
                        <code className={className}>{children}</code>
                      ) : (
                        <code className="px-1 py-0.5 bg-gray-200 rounded text-xs text-gray-900">{children}</code>
                      );
                    },
                    pre: ({ children }) => (
                      <pre className="my-2 p-3 bg-gray-800 text-gray-100 rounded overflow-x-auto text-xs">
                        {children}
                      </pre>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold">{children}</strong>
                    ),
                  }}
                >
                  {result.body}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
