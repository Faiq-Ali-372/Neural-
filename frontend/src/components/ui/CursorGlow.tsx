'use client';
import { useEffect, useRef } from 'react';

/**
 * CursorGlow - Optimized
 * Uses transform-based animation instead of full-screen repaints for better performance.
 */
export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

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
      // Smooth interpolation
      x += (targetX - x) * 0.1;
      y += (targetY - y) * 0.1;
      
      // Use translate3d for GPU acceleration
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouse);
    const raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouse);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      style={{
        position: 'fixed',
        top: -400, // Offset for the 800px size
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
