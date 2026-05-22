"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useRef, useState } from "react";

function ParticleSwarm() {
  const ref = useRef<THREE.Points>(null);
  
  const [sphere] = useState(() => {
    const positions = new Float32Array(1500 * 3);
    for (let i = 0; i < 1500; i++) {
      const r = 10 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    return positions;
  });

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 25; 
      ref.current.rotation.y -= delta / 30;
      
      const targetX = (state.pointer.x * 1.5);
      const targetY = (state.pointer.y * 1.5);
      
      ref.current.position.x += (targetX - ref.current.position.x) * 0.02;
      ref.current.position.y += (targetY - ref.current.position.y) * 0.02;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        {/* Additive Blending causes overlapping particles to multiply light, glowing intensely */}
        <PointMaterial 
          transparent 
          color="#E879F9" /* Brighter lighter fuchsia base */
          size={0.025} /* Increased base size for stronger presence */
          sizeAttenuation={true} 
          depthWrite={false} 
          opacity={1} /* Full base opacity */
          blending={THREE.AdditiveBlending} 
        />
      </Points>
    </group>
  );
}

export default function Background3D() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none opacity-50">
      <Canvas camera={{ position: [0, 0, 8] }}>
        <ParticleSwarm />
      </Canvas>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#030303_100%)]" />
    </div>
  );
}
