// hooks/useReducedMotion.ts
'use client';
import { useEffect, useState } from 'react';
 
export type MotionLevel = 'full' | 'essential' | 'minimal';
 
export function useReducedMotion(): MotionLevel {
  const [level, setLevel] = useState<MotionLevel>('full');
 
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setLevel(mq.matches ? 'minimal' : 'full');
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
 
  return level;
}
 
// Usage in components:
// const motionLevel = useReducedMotion();
// const duration = motionLevel === 'minimal' ? 0 : 0.5;
// const stagger = motionLevel === 'minimal' ? 0 : 0.08;
