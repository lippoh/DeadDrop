// components/layout/ParticleField.tsx
'use client';
import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
 
function Particles({ count = 60 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null);
  const bufferAttributeRef = useRef<THREE.BufferAttribute>(null);
  const { pointer } = useThree();
 
  const initialPositions = useMemo(() => new Float32Array(count * 3), [count]);
  const positionsRef = useRef(new Float32Array(count * 3));
  const velocitiesRef = useRef(new Float32Array(count * 3));
 
  useEffect(() => {
    const positions = positionsRef.current;
    const velocities = velocitiesRef.current;

    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5;
      velocities[i * 3]     = (Math.random() - 0.5) * 0.002;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.002;
      velocities[i * 3 + 2] = 0;
    }
 
    if (bufferAttributeRef.current) {
      bufferAttributeRef.current.array = positions;
      bufferAttributeRef.current.needsUpdate = true;
    }
  }, [count]);
 
  useFrame(() => {
    if (!mesh.current) return;
    const pos = mesh.current.geometry.attributes.position;
    const arr = pos.array as Float32Array;
 
    const currentVelocities = velocitiesRef.current;
    for (let i = 0; i < count; i++) {
      arr[i * 3]     += currentVelocities[i * 3];
      arr[i * 3 + 1] += currentVelocities[i * 3 + 1];
 
      // Wrap around boundaries
      if (Math.abs(arr[i * 3]) > 5) currentVelocities[i * 3] *= -1;
      if (Math.abs(arr[i * 3 + 1]) > 5) currentVelocities[i * 3 + 1] *= -1;
 
      // Subtle cursor influence
      arr[i * 3]     += pointer.x * 0.0003;
      arr[i * 3 + 1] += pointer.y * 0.0003;
    }
    pos.needsUpdate = true;
  });
 
  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          ref={bufferAttributeRef}
          attach="attributes-position"
          args={[initialPositions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#3B82F6"
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
 
export function ParticleField({ count = 60 }: { count?: number }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 60 }}
      style={{ position: 'absolute', inset: 0 }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true }}
    >
      <Particles count={count} />
    </Canvas>
  );
}
