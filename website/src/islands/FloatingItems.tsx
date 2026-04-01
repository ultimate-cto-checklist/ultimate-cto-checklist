import { useEffect, useRef } from 'react';

interface FloatData {
  type: 'item' | 'section' | 'question';
  id?: string;
  text: string;
  severity?: 'critical' | 'recommended';
}

const ITEMS: FloatData[] = [
  { type: 'item', id: 'GIT-001', text: 'Clone and run immediately', severity: 'critical' },
  { type: 'item', id: 'GIT-005', text: 'Branch protection on main', severity: 'critical' },
  { type: 'item', id: 'SEC-003', text: 'Secrets rotation policy', severity: 'critical' },
  { type: 'item', id: 'MON-012', text: 'Alert routing defined', severity: 'critical' },
  { type: 'item', id: 'DEP-007', text: 'Zero-downtime deploys', severity: 'critical' },
  { type: 'item', id: 'INC-002', text: 'Incident runbooks exist', severity: 'critical' },
  { type: 'item', id: 'ONB-001', text: 'New dev productive day one', severity: 'critical' },
  { type: 'item', id: 'COST-003', text: 'Budget alerts configured', severity: 'critical' },
  { type: 'item', id: 'PERF-008', text: 'P95 latency targets set', severity: 'recommended' },
  { type: 'item', id: 'GDPR-001', text: 'Data processing agreements', severity: 'critical' },
  { type: 'item', id: 'TEST-004', text: 'Integration tests hit real DB', severity: 'critical' },
  { type: 'item', id: 'ACC-015', text: 'Service account audit trail', severity: 'recommended' },
  { type: 'section', text: 'Monitoring & Observability' },
  { type: 'section', text: 'Incident Response' },
  { type: 'section', text: 'Secrets Management' },
  { type: 'section', text: 'Developer Onboarding' },
  { type: 'section', text: 'Infrastructure Security' },
  { type: 'section', text: 'Code Architecture' },
  { type: 'section', text: 'Cost Monitoring & Budgets' },
  { type: 'question', text: 'Can a new hire clone and run in under 10 minutes?' },
  { type: 'question', text: 'What happens when your primary DB goes down?' },
  { type: 'question', text: 'Who gets paged at 3am?' },
  { type: 'question', text: 'When was your last secret rotation?' },
  { type: 'question', text: 'Do you know your cloud spend right now?' },
  { type: 'question', text: 'Could an intern push to production?' },
  { type: 'question', text: 'Are feature flags cleaning up after themselves?' },
  { type: 'question', text: 'Is your CSP header blocking anything?' },
];

const MAX_VISIBLE = 7;

export default function FloatingItems() {
  const areaRef = useRef<HTMLDivElement>(null);
  const activeCount = useRef(0);

  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;

    function spawn() {
      if (!area || activeCount.current >= MAX_VISIBLE) return;
      const data = ITEMS[Math.floor(Math.random() * ITEMS.length)];
      const el = document.createElement('div');
      el.style.position = 'absolute';
      el.style.borderRadius = '8px';
      el.style.padding = '0.5rem 0.9rem';
      el.style.fontSize = '0.78rem';
      el.style.whiteSpace = 'nowrap';
      el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
      el.style.opacity = '0';
      el.style.transition = 'opacity 1.2s ease';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.gap = '0.5rem';
      if (data.type === 'section') {
        el.style.background = '#f0fdf4';
        el.style.border = '1px solid #bbf7d0';
        el.style.fontWeight = '600';
        el.style.color = '#052e16';
        el.innerHTML = `<span style="color:#16a34a">■</span> ${data.text}`;
      } else if (data.type === 'question') {
        el.style.background = '#fffbeb';
        el.style.border = '1px solid #fde68a';
        el.style.fontStyle = 'italic';
        el.style.color = '#92400e';
        el.innerHTML = `? ${data.text}`;
      } else {
        el.style.background = '#ffffff';
        el.style.border = '1px solid #e5e7eb';
        el.style.color = '#374151';
        const dotColor = data.severity === 'critical' ? '#f59e0b' : '#22c55e';
        el.innerHTML = `<div style="width:7px;height:7px;border-radius:2px;background:${dotColor};flex-shrink:0"></div><span style="color:#16a34a;font-family:monospace;font-size:0.63rem;font-weight:600">${data.id}</span><span>${data.text}</span>`;
      }
      const rect = area.getBoundingClientRect();
      el.style.left = `${30 + Math.random() * (rect.width - 350)}px`;
      el.style.top = `${30 + Math.random() * (rect.height - 60)}px`;
      area.appendChild(el);
      activeCount.current++;
      requestAnimationFrame(() => { requestAnimationFrame(() => { el.style.opacity = '1'; }); });
      const lifetime = 3000 + Math.random() * 4000;
      setTimeout(() => {
        el.style.opacity = '0';
        setTimeout(() => { el.remove(); activeCount.current--; }, 1200);
      }, lifetime);
    }
    const initTimers = Array.from({ length: 5 }, (_, i) => setTimeout(spawn, i * 500));
    const interval = setInterval(spawn, 1400);
    return () => { initTimers.forEach(clearTimeout); clearInterval(interval); };
  }, []);

  return (
    <div ref={areaRef} className="relative overflow-hidden" style={{ minHeight: '340px' }}>
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#f8fffe] to-transparent z-10 pointer-events-none" />
    </div>
  );
}
