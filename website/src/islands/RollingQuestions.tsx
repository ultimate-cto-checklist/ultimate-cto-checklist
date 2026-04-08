import { useEffect, useRef } from 'react';
import type { FloatingQuestion } from '../lib/types';

const VISIBLE_COUNT = 5;
const SCROLL_INTERVAL = 3500;
const TRANSITION_MS = 800;

export default function RollingQuestions({ questions }: { questions: FloatingQuestion[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || questions.length === 0) return;

    // Shuffle a copy so we don't repeat in order
    const shuffled = [...questions].sort(() => Math.random() - 0.5);

    function nextIndex() {
      indexRef.current = (indexRef.current + 1) % shuffled.length;
      return indexRef.current;
    }

    // Seed initial items
    for (let i = 0; i < VISIBLE_COUNT; i++) {
      const q = shuffled[i % shuffled.length];
      indexRef.current = i;
      const el = makeElement(q);
      el.style.opacity = '1';
      container.appendChild(el);
    }

    const interval = setInterval(() => {
      const children = Array.from(container.children) as HTMLElement[];
      if (children.length === 0) return;

      // Fade out + slide up the top element
      const top = children[0];
      top.style.opacity = '0';
      top.style.marginTop = `-${top.offsetHeight + 8}px`;

      // Add new element at the bottom
      const q = shuffled[nextIndex()];
      const el = makeElement(q);
      container.appendChild(el);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => { el.style.opacity = '1'; });
      });

      // Remove the old top after transition
      setTimeout(() => top.remove(), TRANSITION_MS);
    }, SCROLL_INTERVAL);

    return () => clearInterval(interval);
  }, [questions]);

  return (
    <div className="relative" style={{ height: `${VISIBLE_COUNT * 44}px` }}>
      <div
        ref={containerRef}
        className="flex flex-col items-center gap-2 overflow-hidden h-full"
      />
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />
    </div>
  );
}

function makeElement(data: FloatingQuestion): HTMLDivElement {
  const el = document.createElement('div');
  el.style.borderRadius = '8px';
  el.style.padding = '0.45rem 0.8rem';
  el.style.fontSize = '0.75rem';
  el.style.fontStyle = 'italic';
  el.style.textAlign = 'center';
  el.style.width = '100%';
  el.style.boxSizing = 'border-box';
  el.style.opacity = '0';
  el.style.transition = `opacity ${TRANSITION_MS}ms ease, margin-top ${TRANSITION_MS}ms ease`;
  el.style.background = data.bg;
  el.style.border = `1px solid ${data.border}`;
  el.style.color = data.text;
  el.style.flexShrink = '0';
  el.textContent = data.question;
  return el;
}
