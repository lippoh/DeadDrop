// components/layout/AmbientBackground.tsx
'use client';
import dynamic from 'next/dynamic';
 
const ParticleField = dynamic(
  () => import('./ParticleField').then(mod => ({ default: mod.ParticleField })),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-gradient-to-br from-void-950 via-void-900 to-void-950" />
    ),
  }
);
 
export function AmbientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* CSS gradient always visible */}
      <div className="absolute inset-0 bg-ambient-dark" />
      {/* WebGL particles loaded on demand */}
      <ParticleField count={50} />
    </div>
  );
}
