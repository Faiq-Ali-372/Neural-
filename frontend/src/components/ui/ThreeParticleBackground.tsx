'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Particles({ count = 1000 }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 10;
      const y = (Math.random() - 0.5) * 10;
      const z = (Math.random() - 0.5) * 10;
      const speed = Math.random() * 0.02 + 0.01;
      const factor = Math.random() * 100;
      temp.push({ x, y, z, speed, factor });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    particles.forEach((particle, i) => {
      let { x, y, z, speed, factor } = particle;
      const t = state.clock.elapsedTime * speed;
      
      // Fluid-like subtle movement
      dummy.position.set(
        x + Math.sin(t + factor) * 0.5,
        y + Math.cos(t + factor) * 0.5,
        z + Math.sin(t * 0.5 + factor) * 0.5
      );
      
      // Cursor reaction
      const mouseX = (state.pointer.x * state.viewport.width) / 2;
      const mouseY = (state.pointer.y * state.viewport.height) / 2;
      
      const dx = dummy.position.x - mouseX;
      const dy = dummy.position.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 2) {
        dummy.position.x += dx * 0.02;
        dummy.position.y += dy * 0.02;
      }
      
      dummy.scale.setScalar(Math.max(0.1, 1 - dist * 0.1));
      dummy.updateMatrix();
      if (mesh.current) {
        mesh.current.setMatrixAt(i, dummy.matrix);
      }
    });
    if (mesh.current) {
      mesh.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <circleGeometry args={[0.02, 8]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.15} />
    </instancedMesh>
  );
}

export default function ThreeParticleBackground() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none" style={{ opacity: 0.6 }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <Particles count={350} />
      </Canvas>
    </div>
  );
}
