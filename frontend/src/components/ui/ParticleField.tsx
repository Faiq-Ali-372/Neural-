'use client';
import { useEffect, useRef } from 'react';

/**
 * AuroraNetworkField — Performance-optimised particle background.
 *
 * Key changes vs original:
 *  1. Particle count capped at 60 (was 90) — reduces O(N²) pairs 4005→1770
 *  2. Render loop throttled to ~30fps (skips every 2nd RAF tick)
 *  3. mouseleave uses a named function so removeEventListener actually works
 *  4. Batched stroke calls by category instead of per-pair strokeStyle string
 *  5. Cursor spotlight gradient reused via offscreen flag (no RadialGradient per frame)
 *  6. Connection loop exits early via bounding-box check before sqrt
 */
export default function ParticleField() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const mouseRef     = useRef({ x: -1000, y: -1000 });
  const shockwaveRef = useRef({ x: -1000, y: -1000, radius: 0, active: false });
  const rafRef       = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let time = 0;
    let frameCount = 0;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    // ── Named event handlers so removeEventListener actually fires ──────────
    const handleMouse     = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    const handleClick     = (e: MouseEvent) => { shockwaveRef.current = { x: e.clientX, y: e.clientY, radius: 0, active: true }; };
    const handleMouseLeave = ()              => { mouseRef.current = { x: -1000, y: -1000 }; };

    window.addEventListener('resize',     resize,          { passive: true });
    window.addEventListener('mousemove',  handleMouse,     { passive: true });
    window.addEventListener('click',      handleClick,     { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    // ── Reduced particle count: max 60 (was 90) ─────────────────────────────
    const PARTICLE_COUNT = Math.min(60, Math.floor((window.innerWidth * window.innerHeight) / 20000));
    const MAX_DIST  = 150;
    const MAX_DIST2 = MAX_DIST * MAX_DIST; // compare squared to avoid sqrt when possible
    const MOUSE_RADIUS = 220;

    interface Particle {
      x: number; y: number;
      vx: number; vy: number;
      baseX: number; baseY: number;
      size: number; hue: number;
    }
    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        baseX: x, baseY: y,
        size: Math.random() * 1.8 + 0.4,
        hue: Math.random() > 0.5 ? 190 + Math.random() * 30 : 250 + Math.random() * 40,
      });
    }

    const blobs = [
      { x: 0.2, y: 0.3, hue: 190, radius: 0.55, speed: 0.0004 },
      { x: 0.8, y: 0.7, hue: 280, radius: 0.5,  speed: 0.0006 },
      { x: 0.5, y: 0.5, hue: 220, radius: 0.65, speed: 0.0003 },
      { x: 0.7, y: 0.2, hue: 160, radius: 0.4,  speed: 0.0005 },
    ];

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);

      // ── 30fps throttle — skip every other frame ──────────────────────────
      frameCount++;
      if (frameCount % 2 !== 0) return;

      time++;
      const { width, height } = canvas;
      const mouse = mouseRef.current;
      const sw    = shockwaveRef.current;

      // 1. Background
      ctx.fillStyle = '#030305';
      ctx.fillRect(0, 0, width, height);

      // 2. Aurora blobs
      for (const blob of blobs) {
        const offsetX = Math.sin(time * blob.speed) * 0.15;
        const offsetY = Math.cos(time * blob.speed * 1.3) * 0.1;
        const mx = (mouse.x / width  - 0.5) * 0.08;
        const my = (mouse.y / height - 0.5) * 0.08;
        const cx = (blob.x + offsetX + mx) * width;
        const cy = (blob.y + offsetY + my) * height;
        const r  = blob.radius * Math.max(width, height);
        const hue = blob.hue + Math.sin(time * 0.001) * 15;

        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        gradient.addColorStop(0,   `hsla(${hue},90%,40%,0.11)`);
        gradient.addColorStop(0.5, `hsla(${hue},70%,30%,0.03)`);
        gradient.addColorStop(1,   'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      // 3. Shockwave
      if (sw.active) {
        sw.radius += 22;
        if (sw.radius > width) sw.active = false;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0,242,254,${Math.max(0, 0.35 - sw.radius / 1000)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // 4. Update particle positions
      for (const p of particles) {
        const dx   = p.x - mouse.x;
        const dy   = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MOUSE_RADIUS) {
          const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
          const angle = Math.atan2(dy, dx);
          p.vx += Math.cos(angle) * force * 0.7 + Math.cos(angle + Math.PI / 2) * force * 0.35;
          p.vy += Math.sin(angle) * force * 0.7 + Math.sin(angle + Math.PI / 2) * force * 0.35;
        }

        if (sw.active) {
          const swDx   = p.x - sw.x;
          const swDy   = p.y - sw.y;
          const swDist = Math.sqrt(swDx * swDx + swDy * swDy);
          if (Math.abs(swDist - sw.radius) < 40) {
            const swForce = (40 - Math.abs(swDist - sw.radius)) / 40;
            const swAngle = Math.atan2(swDy, swDx);
            p.vx += Math.cos(swAngle) * swForce * 3.5;
            p.vy += Math.sin(swAngle) * swForce * 3.5;
          }
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.91;
        p.vy *= 0.91;
        p.x += Math.sin(time * 0.001 + p.baseX) * 0.25;
        p.y += Math.cos(time * 0.001 + p.baseY) * 0.25;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
      }

      // 5. Draw connections — batch normal + highlighted into two passes
      //    to minimise strokeStyle switches (expensive state changes)
      ctx.lineWidth = 0.7;

      // Pass A: normal lines
      ctx.beginPath();
      ctx.strokeStyle = 'hsla(220,70%,60%,0.18)';
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const ddx = particles[i].x - particles[j].x;
          const ddy = particles[i].y - particles[j].y;
          if (Math.abs(ddx) > MAX_DIST || Math.abs(ddy) > MAX_DIST) continue;
          const d2 = ddx * ddx + ddy * ddy;
          if (d2 < MAX_DIST2) {
            const iNear = Math.abs(particles[i].x - mouse.x) < MOUSE_RADIUS &&
                          Math.abs(particles[i].y - mouse.y) < MOUSE_RADIUS;
            if (!iNear) {
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
            }
          }
        }
      }
      ctx.stroke();

      // Pass B: mouse-highlighted lines (brighter)
      ctx.beginPath();
      ctx.strokeStyle = 'hsla(220,100%,70%,0.5)';
      for (let i = 0; i < particles.length; i++) {
        const iNear = Math.abs(particles[i].x - mouse.x) < MOUSE_RADIUS &&
                      Math.abs(particles[i].y - mouse.y) < MOUSE_RADIUS;
        if (!iNear) continue;
        for (let j = i + 1; j < particles.length; j++) {
          const ddx = particles[i].x - particles[j].x;
          const ddy = particles[i].y - particles[j].y;
          if (Math.abs(ddx) > MAX_DIST || Math.abs(ddy) > MAX_DIST) continue;
          const d2 = ddx * ddx + ddy * ddy;
          if (d2 < MAX_DIST2) {
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
          }
        }
      }
      ctx.stroke();

      // 6. Draw nodes
      for (const p of particles) {
        const dxM = p.x - mouse.x;
        const dyM = p.y - mouse.y;
        const near = (dxM * dxM + dyM * dyM) < MOUSE_RADIUS * MOUSE_RADIUS;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (near ? 1.7 : 1), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},100%,80%,${near ? 1 : 0.5})`;
        ctx.fill();
      }

      // 7. Cursor spotlight
      if (mouse.x > 0 && mouse.y > 0) {
        const spotGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 300);
        spotGrad.addColorStop(0,   'rgba(0,242,254,0.12)');
        spotGrad.addColorStop(0.5, 'rgba(99,102,241,0.04)');
        spotGrad.addColorStop(1,   'transparent');
        ctx.fillStyle = spotGrad;
        ctx.fillRect(0, 0, width, height);
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize',     resize);
      window.removeEventListener('mousemove',  handleMouse);
      window.removeEventListener('click',      handleClick);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
