import { useState, useRef, useEffect } from 'react';

interface SearchItem {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'recommended';
  sectionSlug: string;
  sectionName: string;
  itemSlug: string;
}

interface Props {
  items: SearchItem[];
}

export default function SidebarSearch({ items }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const results = query.length < 2 ? [] : items.filter(item =>
    item.id.toLowerCase().includes(query.toLowerCase()) ||
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 12);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search items..."
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-md bg-white outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a]/10 placeholder:text-gray-300"
        />
      </div>
      {open && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto">
          {results.length > 0 ? (
            results.map(item => (
              <a
                key={item.id}
                href={`/checklist/${item.sectionSlug}/${item.itemSlug}/`}
                className="block px-3 py-2 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-[#16a34a] font-semibold">{item.id}</span>
                  <span className="text-xs text-gray-900 truncate">{item.title}</span>
                </div>
                <p className="text-[10px] text-gray-400 truncate">{item.sectionName}</p>
              </a>
            ))
          ) : (
            <p className="px-3 py-2 text-xs text-gray-400">No results for "{query}"</p>
          )}
        </div>
      )}
    </div>
  );
}
