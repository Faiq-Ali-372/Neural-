'use client';
import { useEffect, useRef } from 'react';

/**
 * CursorGlow — Fixed RAF memory leak.
 * Stores the current animation frame ID in a ref so cancelAnimationFrame
 * always cancels the *latest* scheduled frame, not just the first one.
 */
export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const rafRef  = useRef<number>(0);

  useEffect(() => {
    const el = glowRef.current;
    if (!el) return;

    let x = 0, y = 0;
    let targetX = 0, targetY = 0;

    const handleMouse = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const animate = () => {
      x += (targetX - x) * 0.1;
      y += (targetY - y) * 0.1;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      // Store the latest frame ID so cleanup always cancels the right one
      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouse, { passive: true });
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouse);
      cancelAnimationFrame(rafRef.current); // always cancels the latest frame
    };
  }, []);

  return (
    <div
      ref={glowRef}
      style={{
        position: 'fixed',
        top: -400,
        left: -400,
        width: 800,
        height: 800,
        pointerEvents: 'none',
        zIndex: 1,
        background: 'radial-gradient(circle at center, rgba(129,140,248,0.05) 0%, transparent 70%)',
        willChange: 'transform',
      }}
    />
  );
}
