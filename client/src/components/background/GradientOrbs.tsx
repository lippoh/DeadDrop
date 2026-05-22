'use client';

import { useSyncExternalStore, useEffect, useRef } from 'react';

const ORBS = [
  {
    x: 15, y: 20, size: 500,
    color: 'rgba(255, 45, 120, 0.04)',
    duration: 25, delay: 0,
  },
  {
    x: 80, y: 60, size: 600,
    color: 'rgba(194, 24, 91, 0.035)',
    duration: 30, delay: -8,
  },
  {
    x: 50, y: 80, size: 450,
    color: 'rgba(245, 0, 87, 0.03)',
    duration: 22, delay: -15,
  },
  {
    x: 25, y: 50, size: 350,
    color: 'rgba(255, 107, 157, 0.025)',
    duration: 28, delay: -5,
  },
];

function useIsMobile(breakpoint = 768) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches,
    () => false
  );
}

export default function GradientOrbs() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (containerRef.current) {
        containerRef.current.style.animation = 'none';
        for (const child of containerRef.current.children) {
          (child as HTMLElement).style.animation = 'none';
        }
      }
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {ORBS.map((orb, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: isMobile ? orb.size * 0.5 : orb.size,
            height: isMobile ? orb.size * 0.5 : orb.size,
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            transform: 'translate(-50%, -50%)',
            animation: `orbFloat${i} ${orb.duration}s ease-in-out infinite`,
            animationDelay: `${orb.delay}s`,
            willChange: 'transform',
          }}
        />
      ))}

      <style jsx>{`
        @keyframes orbFloat0 {
          0%, 100% { transform: translate(-50%, -50%) translate(0, 0); }
          25% { transform: translate(-50%, -50%) translate(40px, -30px); }
          50% { transform: translate(-50%, -50%) translate(-20px, 50px); }
          75% { transform: translate(-50%, -50%) translate(30px, 20px); }
        }
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(-50%, -50%) translate(0, 0); }
          25% { transform: translate(-50%, -50%) translate(-50px, 30px); }
          50% { transform: translate(-50%, -50%) translate(30px, -40px); }
          75% { transform: translate(-50%, -50%) translate(-20px, -20px); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(-50%, -50%) translate(0, 0); }
          25% { transform: translate(-50%, -50%) translate(30px, 40px); }
          50% { transform: translate(-50%, -50%) translate(-40px, -20px); }
          75% { transform: translate(-50%, -50%) translate(20px, -30px); }
        }
        @keyframes orbFloat3 {
          0%, 100% { transform: translate(-50%, -50%) translate(0, 0); }
          25% { transform: translate(-50%, -50%) translate(-30px, -40px); }
          50% { transform: translate(-50%, -50%) translate(40px, 30px); }
          75% { transform: translate(-50%, -50%) translate(-10px, 40px); }
        }
      `}</style>
    </div>
  );
}