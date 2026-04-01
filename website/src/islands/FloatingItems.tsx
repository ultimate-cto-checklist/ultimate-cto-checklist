import { useEffect, useRef } from 'react';
import type { FloatingQuestion } from '../lib/types';

const MAX_VISIBLE = 7;

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
      el.textContent = data.question;
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
  }, [questions]);

  return (
    <div ref={areaRef} className="relative overflow-hidden" style={{ minHeight: '340px' }}>
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#f8fffe] to-transparent z-10 pointer-events-none" />
    </div>
  );
}
