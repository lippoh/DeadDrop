// components/message/BurnAnimation.tsx
'use client';
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
 
interface BurnAnimationProps {
  text: string;
  onComplete: () => void;
}
 
interface EmberParticle {
  x: number;
  y: number;
  delay: number;
  opacity: number;
}
 
const EMBER_PARTICLES: EmberParticle[] = Array.from({ length: 12 }, (_, index) => ({
  x: -18 + (index % 4) * 12,
  y: 24 + Math.floor(index / 4) * 6,
  delay: index * 0.04,
  opacity: 0.25 + (index % 3) * 0.15,
}));
 
function EmberField({ active }: { active: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {EMBER_PARTICLES.map((particle, index) => (
        <motion.span
          key={index}
          className="absolute h-1 w-1 rounded-full bg-orange-300"
          initial={{ opacity: 0, y: 0, scale: 0.8 }}
          animate={
            active
              ? { opacity: particle.opacity, y: -18, scale: 1.2 }
              : { opacity: 0, y: 0, scale: 0.8 }
          }
          transition={{
            duration: 0.8,
            delay: particle.delay,
            ease: 'easeOut',
          }}
          style={{
            left: `${particle.x}%`,
            bottom: `${particle.y}%`,
          }}
        />
      ))}
    </div>
  );
}
 
export function BurnAnimation({ text, onComplete }: BurnAnimationProps) {
  const [phase, setPhase] = useState<'idle' | 'ignite' | 'burn' | 'ash'>('idle');
 
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('ignite'), 0),
      setTimeout(() => setPhase('burn'), 500),
      setTimeout(() => setPhase('ash'), 2000),
      setTimeout(onComplete, 2500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);
 
  const characters = useMemo(() => text.split(''), [text]);
  const motionOffsets = useMemo(
    () => characters.map((_, i) => ({
      y: -20 - ((i % 5) * 5),
      rotate: ((i % 7) - 3) * 9,
    })),
    [characters]
  );
 
  return (
    <div className="relative min-h-[200px] flex items-center justify-center overflow-hidden">
      <AnimatePresence>
        {phase === 'burn' && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-burn-amber/10 to-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 1.5 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
 
      <div className="relative">
        {characters.map((char, i) => {
          const delay = phase === 'burn' ? (i / characters.length) * 1.0 : 0;
          const offset = motionOffsets[i];
 
          return (
            <motion.span
              key={i}
              className="inline-block"
              initial={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              animate={{
                opacity: phase === 'ash' ? 0 : 1,
                y: phase === 'burn' ? offset.y : 0,
                scale: phase === 'burn' ? 0 : 1,
                rotate: phase === 'burn' ? offset.rotate : 0,
                filter:
                  phase === 'ignite'
                    ? 'blur(0px)'
                    : phase === 'burn'
                    ? 'blur(2px)'
                    : 'blur(0px)',
                color: phase === 'ignite' ? '#F59E0B' : phase === 'burn' ? '#DC2626' : '#E8E8EC',
              }}
              transition={{
                duration: 0.3,
                delay,
                ease: 'easeInOut',
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          );
        })}
      </div>
 
      <EmberField active={phase === 'burn' || phase === 'ignite'} />
 
      <AnimatePresence>
        {phase === 'ash' && (
          <motion.div
            className="absolute w-40 h-40 rounded-full bg-white/5"
            initial={{ scale: 0, opacity: 0.3 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
