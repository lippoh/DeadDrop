'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(59,130,246,0.08)_0%,transparent_60%),radial-gradient(ellipse_at_70%_80%,rgba(139,92,246,0.05)_0%,transparent_60%)]" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, ease: [0, 0, 0.2, 1] }}
          className="text-blue-400 text-sm font-medium tracking-[0.2em] uppercase mb-6"
        >
          Encrypted &middot; Ephemeral &middot; Zero Knowledge
        </motion.p>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.95, filter: 'blur(6px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.2, ease: [0.36, 0, 0.66, -0.56], delay: 0.2 }}
          className="text-6xl md:text-8xl font-extrabold text-white leading-[0.9] tracking-tighter mb-8"
        >
          Messages
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-violet-500">
            That Burn
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-lg text-gray-400 max-w-xl mx-auto mb-10"
        >
          Send self-destructing messages secured with AES-256-GCM encryption.
          No accounts. No logs. No traces.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <Link
            href="/create"
            className="inline-block px-8 py-4 bg-blue-500 text-white rounded-lg font-medium
                       hover:bg-blue-400 transition-all duration-200 hover:scale-105
                       hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]"
          >
            Create a Dead Drop
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-600"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
      </motion.div>
    </section>
  );
}