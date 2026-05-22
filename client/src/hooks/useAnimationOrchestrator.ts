// hooks/useAnimationOrchestrator.ts
'use client';
import { useCallback, useRef } from 'react';
 
interface AnimationState {
  isAnimating: boolean;
  currentPhase: 'enter' | 'idle' | 'exit' | null;
  queue: Array<{ id: string; execute: () => void }>;
}
 
export function useAnimationOrchestrator() {
  const state = useRef<AnimationState>({
    isAnimating: false,
    currentPhase: null,
    queue: [],
  });
 
  const enqueue = useCallback((id: string, execute: () => void) => {
    const s = state.current;
    if (s.isAnimating) {
      s.queue.push({ id, execute });
    } else {
      s.isAnimating = true;
      execute();
    }
  }, []);
 
  const complete = useCallback((id: string) => {
    const s = state.current;
    const idx = s.queue.findIndex(q => q.id !== id);
    if (idx >= 0) {
      const next = s.queue.shift()!;
      next.execute();
    } else {
      s.isAnimating = false;
      s.currentPhase = 'idle';
    }
  }, []);
 
  return { enqueue, complete };
}
