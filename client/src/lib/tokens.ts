// lib/tokens.ts
export const typography = {
  displayXL: 'text-[4.5rem] font-extrabold leading-none tracking-tighter',
  displayLG: 'text-[3.75rem] font-bold leading-tight tracking-tight',
  displayMD: 'text-5xl font-bold leading-tight tracking-tighter',
  headingLG: 'text-4xl font-semibold leading-snug tracking-tight',
  headingMD: 'text-2xl font-semibold leading-snug',
  headingSM: 'text-xl font-semibold leading-normal tracking-wide',
  bodyLG: 'text-lg leading-relaxed',
  bodyMD: 'text-base leading-relaxed',
  bodySM: 'text-sm leading-normal tracking-wide',
  caption: 'text-xs font-medium leading-snug tracking-wider',
  cipher: 'text-sm font-normal leading-loose tracking-widest font-mono',
} as const;
 
export type TypographyToken = keyof typeof typography;
