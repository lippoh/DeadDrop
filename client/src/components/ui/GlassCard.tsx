// components/ui/GlassCard.tsx
'use client';
import { type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
 
 interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  intensity?: 'subtle' | 'medium' | 'strong';
}
 
export function GlassCard({
  children, intensity = 'medium', className, ...props
}: GlassCardProps) {
  const blurMap = { subtle: '8px', medium: '16px', strong: '24px' };
  const bgMap = {
    subtle: 'bg-white/[0.02]',
    medium: 'bg-white/[0.04]',
    strong: 'bg-white/[0.06]',
  };
 
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
      className={cn(
        'rounded-2xl border border-white/[0.08]',
        bgMap[intensity],
        'backdrop-blur-[--card-blur]',
        'shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
        className
      )}
      style={{ '--card-blur': blurMap[intensity] } as React.CSSProperties}
      {...props}
    >
      {children}
    </motion.div>
  );
}
