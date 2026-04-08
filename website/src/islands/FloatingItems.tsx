import { useEffect, useRef } from 'react';
import type { FloatingQuestion } from '../lib/types';

const MAX_VISIBLE = 5;

export default function FloatingItems({ questions }: { questions: FloatingQuestion[] }) {
  const areaRef = useRef<HTMLDivElement>(null);
  const activeCount = useRef(0);

  useEffect(() => {
    const area = areaRef.current;
    if (!area || questions.length === 0) return;

    function spawn() {
      if (!area || activeCount.current >= MAX_VISIBLE) return;
      const data = questions[Math.floor(Math.random() * questions.length)];
      const el = document.createElement('div');
      el.style.position = 'absolute';
      el.style.borderRadius = '8px';
      el.style.padding = '0.5rem 0.9rem';
      el.style.fontSize = '0.78rem';
      el.style.maxWidth = '340px';
      el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
      el.style.opacity = '0';
      el.style.transition = 'opacity 1.2s ease';
      el.style.background = data.bg;
      el.style.border = `1px solid ${data.border}`;
      el.style.color = data.text;
      el.style.fontStyle = 'italic';
      el.textContent = data.question;
      const rect = area.getBoundingClientRect();
      // Bias positions toward edges, away from centered hero text
      const edgeZones = [
        // Left edge
        () => ({ x: 10 + Math.random() * (rect.width * 0.18), y: 30 + Math.random() * (rect.height - 60) }),
        // Right edge
        () => ({ x: rect.width * 0.68 + Math.random() * (rect.width * 0.18), y: 30 + Math.random() * (rect.height - 60) }),
        // Top edge (full width but above hero text)
        () => ({ x: 30 + Math.random() * (rect.width - 350), y: 10 + Math.random() * (rect.height * 0.12) }),
        // Bottom edge (full width but below hero text)
        () => ({ x: 30 + Math.random() * (rect.width - 350), y: rect.height * 0.78 + Math.random() * (rect.height * 0.18) }),
      ];
      const zone = edgeZones[Math.floor(Math.random() * edgeZones.length)];
      const pos = zone();
      el.style.left = `${Math.max(10, Math.min(pos.x, rect.width - 350))}px`;
      el.style.top = `${Math.max(10, Math.min(pos.y, rect.height - 50))}px`;
      area.appendChild(el);
      activeCount.current++;
      requestAnimationFrame(() => { requestAnimationFrame(() => { el.style.opacity = '1'; }); });
      const lifetime = 3000 + Math.random() * 4000;
      setTimeout(() => {
        el.style.opacity = '0';
        setTimeout(() => { el.remove(); activeCount.current--; }, 1200);
      }, lifetime);
    }
    const initTimers = Array.from({ length: 3 }, (_, i) => setTimeout(spawn, i * 800));
    const interval = setInterval(spawn, 2500);
    return () => { initTimers.forEach(clearTimeout); clearInterval(interval); };
  }, [questions]);

  return (
    <div ref={areaRef} className="w-full h-full pointer-events-none" />
  );
}
