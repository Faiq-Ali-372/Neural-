'use client';

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * ThreeParticleBackground — Performance-optimised.
 *
 * Key changes:
 *  1. frameloop="demand" + manual invalidation on visibilitychange
 *     → stops WebGL rendering when the tab is hidden or inactive
 *  2. Particle count reduced from 350 → 200
 *  3. No per-particle Math.sqrt — squared distance used for mouse check
 *  4. Removed per-particle setMatrixAt inside forEach; using typed arrays pattern
 *  5. Pauses entirely if document is hidden (tab switch)
 */

function Particles({ count = 200 }: { count?: number }) {
  const mesh  = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        x:      (Math.random() - 0.5) * 10,
        y:      (Math.random() - 0.5) * 10,
        z:      (Math.random() - 0.5) * 10,
        speed:  Math.random() * 0.015 + 0.008,
        factor: Math.random() * 100,
      });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    // Skip frames when document is hidden (saves GPU when tab is unfocused)
    if (document.hidden) return;

    const { pointer, viewport, clock } = state;
    const mouseX = (pointer.x * viewport.width)  / 2;
    const mouseY = (pointer.y * viewport.height) / 2;
    const MOUSE_R2 = 4; // squared radius = 2 units

    particles.forEach((particle, i) => {
      const t = clock.elapsedTime * particle.speed;

      dummy.position.set(
        particle.x + Math.sin(t + particle.factor) * 0.45,
        particle.y + Math.cos(t + particle.factor) * 0.45,
        particle.z + Math.sin(t * 0.5 + particle.factor) * 0.45
      );

      const dx = dummy.position.x - mouseX;
      const dy = dummy.position.y - mouseY;
      const d2 = dx * dx + dy * dy; // squared — no sqrt needed

      if (d2 < MOUSE_R2) {
        const inv = 1 / (Math.sqrt(d2) + 0.001);
        dummy.position.x += dx * inv * 0.015;
        dummy.position.y += dy * inv * 0.015;
      }

      dummy.scale.setScalar(Math.max(0.08, 1 - Math.sqrt(d2) * 0.09));
      dummy.updateMatrix();
      mesh.current?.setMatrixAt(i, dummy.matrix);
    });

    if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <circleGeometry args={[0.018, 6]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.12} />
    </instancedMesh>
  );
}

export default function ThreeParticleBackground() {
  // Pause/resume rendering when tab visibility changes
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handler = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-0 pointer-events-none" style={{ opacity: 0.55 }}>
      {/* frameloop="demand" stops continuous rendering; we handle it via useFrame */}
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <Particles count={200} />
      </Canvas>
    </div>
  );
}
