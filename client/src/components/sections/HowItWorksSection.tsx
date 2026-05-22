'use client';
import { motion } from 'framer-motion';
import { StaggerContainer, StaggerItem } from '@/components/motion/StaggerContainer';

const steps = [
  { num: '01', title: 'Create', desc: 'Write your message, set an expiry timer, and optionally protect it with a password. Encrypted client-side before it leaves your browser.' },
  { num: '02', title: 'Share', desc: 'Receive a unique, one-time link. Share it through any channel. The link reveals nothing about the contents.' },
  { num: '03', title: 'Burn', desc: 'Your recipient opens the link, reads the message. The moment it is read, it is permanently destroyed. Gone forever.' },
];

export function HowItWorksSection() {
  return (
    <section className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold text-center text-white mb-4"
        >
          How It Works
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-gray-400 text-center max-w-lg mx-auto mb-16"
        >
          Three steps. Zero traces. Total privacy.
        </motion.p>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <StaggerItem key={step.num}>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 h-full hover:border-white/20 transition-colors duration-300">
                <div className="text-5xl font-bold text-white/5 mb-4">{step.num}</div>
                <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}