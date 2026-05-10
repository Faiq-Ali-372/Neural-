'use client';
import { useEffect, useRef } from 'react';

/**
 * AuroraNetworkField — A highly interactive, professional AI background.
 * Combines a subtle aurora gradient with a reactive neural network particle mesh.
 */
export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const shockwaveRef = useRef({ x: -1000, y: -1000, radius: 0, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); // Optimize for solid background
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleClick = (e: MouseEvent) => {
      shockwaveRef.current = { x: e.clientX, y: e.clientY, radius: 0, active: true };
    };
    window.addEventListener('mousemove', handleMouse);
    window.addEventListener('click', handleClick);
    window.addEventListener('mouseleave', () => {
      mouseRef.current = { x: -1000, y: -1000 };
    });

    // --- Particle Network Setup ---
    // Capped at 90 to prevent O(N^2) calculation lag on high-res screens
    const PARTICLE_COUNT = Math.min(90, Math.floor((window.innerWidth * window.innerHeight) / 15000)); 
    const MAX_DIST = 160; // Max distance for lines
    const MOUSE_RADIUS = 250; // Increased mouse interaction radius

    interface Particle {
      x: number; y: number;
      vx: number; vy: number;
      baseX: number; baseY: number;
      size: number;
      hue: number;
    }
    const particles: Particle[] = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        baseX: x, baseY: y,
        size: Math.random() * 2 + 0.5,
        // Mix of Cyan (190), Blue (220), and Violet (270)
        hue: Math.random() > 0.5 ? 190 + Math.random() * 30 : 250 + Math.random() * 40,
      });
    }

    // --- Aurora Blobs Setup (Mixed Colors) ---
    const blobs = [
      { x: 0.2, y: 0.3, hue: 190, radius: 0.55, speed: 0.0004 }, // Cyan
      { x: 0.8, y: 0.7, hue: 280, radius: 0.5, speed: 0.0006 },  // Violet
      { x: 0.5, y: 0.5, hue: 220, radius: 0.65, speed: 0.0003 }, // Blue
      { x: 0.7, y: 0.2, hue: 160, radius: 0.4, speed: 0.0005 },  // Emerald
    ];

    const draw = () => {
      time++;
      const { width, height } = canvas;
      const mouse = mouseRef.current;
      const sw = shockwaveRef.current;

      // 1. Draw Deep Space Background
      ctx.fillStyle = '#030305';
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Aurora Gradients (Optimized - No Screen composite)
      for (const blob of blobs) {
        const offsetX = Math.sin(time * blob.speed) * 0.15;
        const offsetY = Math.cos(time * blob.speed * 1.3) * 0.1;

        // Subtle mouse parallax for aurora
        const mx = (mouse.x / width - 0.5) * 0.08;
        const my = (mouse.y / height - 0.5) * 0.08;

        const cx = (blob.x + offsetX + mx) * width;
        const cy = (blob.y + offsetY + my) * height;
        const r = blob.radius * Math.max(width, height);

        const hue = blob.hue + Math.sin(time * 0.001) * 15;
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        // Reduced opacity to account for 'source-over' blending
        gradient.addColorStop(0, `hsla(${hue}, 90%, 40%, 0.12)`);
        gradient.addColorStop(0.5, `hsla(${hue}, 70%, 30%, 0.04)`);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      // --- Handle Shockwave ---
      if (sw.active) {
        sw.radius += 25;
        if (sw.radius > width) sw.active = false;
        
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 242, 254, ${Math.max(0, 0.4 - sw.radius / 1000)})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 3. Update & Draw Particles (Neural Network)
      ctx.lineWidth = 0.8;
      
      // Update positions
      for (const p of particles) {
        // Mouse interaction (repel and swirl)
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < MOUSE_RADIUS) {
          const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
          const angle = Math.atan2(dy, dx);
          // Stronger push away + swirl
          p.vx += Math.cos(angle) * force * 0.8 + Math.cos(angle + Math.PI/2) * force * 0.4;
          p.vy += Math.sin(angle) * force * 0.8 + Math.sin(angle + Math.PI/2) * force * 0.4;
        }

        // Shockwave interaction
        if (sw.active) {
          const swDx = p.x - sw.x;
          const swDy = p.y - sw.y;
          const swDist = Math.sqrt(swDx * swDx + swDy * swDy);
          if (Math.abs(swDist - sw.radius) < 40) {
            const swForce = (40 - Math.abs(swDist - sw.radius)) / 40;
            const swAngle = Math.atan2(swDy, swDx);
            p.vx += Math.cos(swAngle) * swForce * 4;
            p.vy += Math.sin(swAngle) * swForce * 4;
          }
        }

        p.x += p.vx;
        p.y += p.vy;
        
        // Damping/Friction
        p.vx *= 0.90;
        p.vy *= 0.90;

        // Gentle constant drift
        p.x += Math.sin(time * 0.001 + p.baseX) * 0.3;
        p.y += Math.cos(time * 0.001 + p.baseY) * 0.3;

        // Wrap around screen
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
      }

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          
          // Fast bounding box check BEFORE expensive Math.sqrt
          if (Math.abs(dx) > MAX_DIST || Math.abs(dy) > MAX_DIST) continue;

          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < MAX_DIST) {
            const opacity = (1 - dist / MAX_DIST) * 0.4;
            const isNearMouse = Math.abs(particles[i].x - mouse.x) < MOUSE_RADIUS && 
                                Math.abs(particles[i].y - mouse.y) < MOUSE_RADIUS &&
                                Math.sqrt(Math.pow(particles[i].x - mouse.x, 2) + Math.pow(particles[i].y - mouse.y, 2)) < MOUSE_RADIUS;
            
            // Dynamic color mixing based on particle hues
            const avgHue = (particles[i].hue + particles[j].hue) / 2;
            
            if (isNearMouse) {
              ctx.strokeStyle = `hsla(${avgHue}, 100%, 70%, ${opacity * 2.5})`; // Bright glow
            } else {
              ctx.strokeStyle = `hsla(${avgHue}, 80%, 60%, ${opacity})`; // Normal color mix
            }
            
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (const p of particles) {
        const distToMouse = Math.sqrt(Math.pow(p.x - mouse.x, 2) + Math.pow(p.y - mouse.y, 2));
        const glow = distToMouse < MOUSE_RADIUS ? 1 : 0.5;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (distToMouse < MOUSE_RADIUS ? 1.8 : 1), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 80%, ${glow})`;
        ctx.fill();
      }

      // 4. Draw Cursor Spotlight (Cyan)
      if (mouse.x > 0 && mouse.y > 0) {
        const spotGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 350);
        spotGrad.addColorStop(0, 'rgba(0, 242, 254, 0.15)');
        spotGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.05)');
        spotGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = spotGrad;
        ctx.fillRect(0, 0, width, height);
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouse);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('mouseleave', () => {});
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
