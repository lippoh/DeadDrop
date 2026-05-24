// lib/motion/gpu-safe.ts
import { type Transition, type TargetAndTransition } from 'framer-motion';
 
/**
 * GPU-safe transition preset.
 * Only allows compositor-friendly properties.
 */
export function gpuTransition(
  durationMs: number,
  easing: [number, number, number, number] = [0.4, 0, 0.2, 1]
): Transition {
  return {
    duration: durationMs / 1000,
    ease: easing,
  };
}
 
/**
 * Creates a GPU-safe animation target.
 * Type-checked to prevent layout-triggering properties.
 */
export function gpuTarget(
  props: {
    opacity?: number;
    x?: number | string;
    y?: number | string;
    scale?: number;
    scaleX?: number;
    scaleY?: number;
    rotate?: number;
    filter?: string;
  }
): TargetAndTransition {
  return { ...props } as TargetAndTransition;
}
