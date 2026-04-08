import { useState } from 'react';

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

export default function ChecklistSearch({ items }: Props) {
  const [query, setQuery] = useState('');
  const results = query.length < 2 ? [] : items.filter(item =>
    item.id.toLowerCase().includes(query.toLowerCase()) ||
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 20);

  return (
    <div className="mb-6">
      <input
        type="text"
        placeholder="Search items... (e.g. 'secrets', 'GIT-001')"
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/10"
      />
      {results.length > 0 && (
        <div className="mt-2 border border-gray-200 rounded-lg bg-white divide-y divide-gray-100 max-h-80 overflow-y-auto">
          {results.map(item => (
            <a key={item.id} href={`/checklist/${item.sectionSlug}/${item.itemSlug}/`} className="block px-4 py-2.5 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#16a34a] font-semibold">{item.id}</span>
                <span className="text-sm text-gray-900">{item.title}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${item.severity === 'critical' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>{item.severity}</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{item.sectionName}</p>
            </a>
          ))}
        </div>
      )}
      {query.length >= 2 && results.length === 0 && (
        <p className="mt-2 text-sm text-gray-400 px-1">No items match "{query}"</p>
      )}
    </div>
  );
}
