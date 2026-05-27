"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface Particle {
  id: number;
  x: number;
  drift: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
}

interface Spark {
  id: number;
  left: number;
  drift: number;
  height: number;
  delay: number;
  duration: number;
}

export function FlameParticles() {
  // All random values computed once via useMemo — no Math.random() during render
  const particles = useMemo<Particle[]>(() => {
    const r = Math.random.bind(Math);
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: r() * 100,
      drift: (r() - 0.5) * 40,
      delay: r() * 0.5,
      duration: 0.8 + r() * 0.7,
      size: 4 + r() * 8,
      opacity: 0.4 + r() * 0.6,
    }));
  }, []);

  const sparks = useMemo<Spark[]>(() => {
    const r = Math.random.bind(Math);
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      left: 30 + r() * 40,
      drift: (r() - 0.5) * 60,
      height: 150 + r() * 100,
      delay: r() * 0.3,
      duration: 0.6 + r() * 0.5,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Main flame particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            bottom: "20%",
            width: p.size,
            height: p.size,
            background: `rgba(239, 70, 112, ${p.opacity})`,
            boxShadow: `0 0 ${p.size * 2}px rgba(239, 70, 112, ${p.opacity * 0.5})`,
          }}
          animate={{
            y: [0, -120, -200],
            x: [0, p.drift],
            opacity: [p.opacity, p.opacity * 0.8, 0],
            scale: [1, 1.2, 0.3],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Ember sparks */}
      {sparks.map((s) => (
        <motion.div
          key={`spark-${s.id}`}
          className="absolute rounded-full bg-orange-400"
          style={{
            left: `${s.left}%`,
            bottom: "10%",
            width: 2,
            height: 2,
          }}
          animate={{
            y: [0, -s.height],
            x: [0, s.drift],
            opacity: [1, 0.6, 0],
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}