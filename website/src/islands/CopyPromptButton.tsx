import { useState } from 'react';

const AUDIT_PROMPT = `Audit my project against the CTO Checklist. Start a cto-workspace, set up the checklist for audits, and follow the CLAUDE.md instructions.`;

export default function CopyPromptButton() {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(AUDIT_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="bg-[#052e16] text-[#4ade80] px-8 py-3 rounded-lg text-sm font-bold font-mono transition-all hover:bg-[#0a3d1f] hover:shadow-[0_4px_16px_rgba(5,46,22,0.3)] cursor-pointer"
    >
      {copied ? '✓ copied' : '$ copy audit prompt'}
    </button>
  );
}
