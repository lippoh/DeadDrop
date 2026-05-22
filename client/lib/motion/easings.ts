// lib/motion/easings.ts
export const easings = {
  anticipate: [0.36, 0, 0.66, -0.56] as const,
  emphasize:  [0.2, 0, 0, 1] as const,
  decelerate: [0, 0, 0.2, 1] as const,
  smooth:    [0.4, 0, 0.2, 1] as const,
  snappy:    [0.25, 0.1, 0.25, 1] as const,
  dissolve:  [0.4, 0, 1, 1] as const,
  bounce:    [0.34, 1.56, 0.64, 1] as const,
} as const;
 
// Duration tokens in seconds
export const duration = {
  instant: 0.1,
  fast:    0.2,
  normal:  0.35,
  slow:    0.6,
  cinematic: 1.2,
  burn:    2.5,
} as const;
 
export type EasingToken = keyof typeof easings;
export type DurationToken = keyof typeof duration;
