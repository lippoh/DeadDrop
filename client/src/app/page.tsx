"use client";

import { useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import AnimatedButton from "@/components/AnimatedButton";
import Tilt from "react-parallax-tilt";

// ─── Mobile detection via useSyncExternalStore (React 19 safe) ─────────────
function useIsMobile(breakpoint = 768) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches,
    () => false
  );
}

// ─── Particle Background ──────────────────────────────────────────────────
const AmbientBackground = dynamic(
  () => import("@/components/background/AmbientBackground"),
  { ssr: false }
);
const GradientOrbs = dynamic(
  () => import("@/components/background/GradientOrbs"),
  { ssr: false }
);

const InfiniteMarquee = () => {
  const marqueeText = "ZERO KNOWLEDGE • EPHEMERAL • ZERO KNOWLEDGE • EPHEMERAL • ZERO KNOWLEDGE • EPHEMERAL • ";

  return (
    <div className="absolute top-1/2 left-0 w-full overflow-hidden opacity-[0.02] pointer-events-none -translate-y-1/2 flex z-0">
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, ease: "linear", duration: 100 }}
        className="flex w-max whitespace-nowrap font-display font-black text-[200px] leading-none uppercase tracking-tighter"
      >
        <span>{marqueeText.repeat(2)}</span>
        <span>{marqueeText.repeat(2)}</span>
      </motion.div>
    </div>
  );
};

export default function LandingPage() {
  const router = useRouter();
  const isMobile = useIsMobile();

  const steps = [
    { title: "01. Write", desc: "Draft your payload in memory. No drafts saved. No cache. No database logs." },
    { title: "02. Encrypt", desc: "AES-256-GCM locks it in your browser. The server remains permanently blind." },
    { title: "03. Burn", desc: "Read once. Destroyed cryptographically and physically from existence." },
  ];

  const titleText = "DeadDrop".split("");

  return (
    <main className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-void-950">

      {/* ── Animated Background Layers ── */}
      <GradientOrbs />
      <AmbientBackground />
      <InfiniteMarquee />

      {/* Header */}
      <header className="relative z-10 p-6 md:p-8 flex justify-between items-center">
        <div className="font-display font-light tracking-[0.4em] text-white/40 text-xs">
          SYS.DEADDROP
        </div>
        <div className="flex gap-3 items-center text-xs font-mono text-white/40 tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" /> E2E ACTIVE
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 mt-12">
        <div className="text-center flex flex-col items-center">

          <div className="relative mb-8 flex justify-center overflow-hidden">
            <h1 className="text-5xl md:text-[9rem] font-display font-light tracking-widest uppercase relative z-10 text-white mix-blend-screen flex">
              {titleText.map((letter, index) => (
                <motion.span
                  key={index}
                  initial={{ y: 150, opacity: 0, rotate: 10 }}
                  animate={{ y: 0, opacity: 1, rotate: 0 }}
                  transition={{
                    duration: 1,
                    ease: [0.16, 1, 0.3, 1],
                    delay: index * 0.08
                  }}
                  className="inline-block"
                >
                  {letter}
                </motion.span>
              ))}
            </h1>
            <h1 className="text-5xl md:text-[9rem] font-display font-light tracking-widest uppercase absolute inset-0 text-accent blur-[25px] opacity-30 flex justify-center pointer-events-none">
              {titleText.map((letter, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 2, delay: 1 + index * 0.05 }}
                  className="inline-block"
                >
                  {letter}
                </motion.span>
              ))}
            </h1>
          </div>

          <div className="overflow-hidden mb-16">
            <motion.p
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
              className="text-sm md:text-lg text-white/50 font-sans font-light tracking-[0.4em] uppercase"
            >
              Speak. <span className="text-white mx-2">Once.</span> <span className="text-accent text-glow">Burn.</span>
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
          >
            <AnimatedButton onClick={() => router.push("/create")}>
              Initiate Drop
            </AnimatedButton>
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section className="relative z-10 w-full max-w-6xl mx-auto mt-16 md:mt-0 pb-32 px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: i * 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="group"
          >
            {isMobile ? (
              <div className="glass-panel p-8 h-full flex flex-col gap-6 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-accent/50 to-transparent" />
                <h3 className="font-display text-sm text-accent tracking-[0.2em]">{step.title}</h3>
                <p className="font-sans text-white/40 leading-relaxed text-sm font-light">{step.desc}</p>
              </div>
            ) : (
              <Tilt tiltMaxAngleX={8} tiltMaxAngleY={8} scale={1.02} transitionSpeed={2500} glareEnable glareMaxOpacity={0.15}>
                <div className="glass-panel p-10 h-full flex flex-col gap-6 border border-white/5 hover:border-accent/30 transition-colors duration-700 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-accent/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <h3 className="font-display text-sm text-accent tracking-[0.2em]">{step.title}</h3>
                  <p className="font-sans text-white/40 leading-relaxed text-sm font-light">{step.desc}</p>
                </div>
              </Tilt>
            )}
          </motion.div>
        ))}
      </section>

      {/* Footer */}
      <footer className="relative z-10 p-8 text-center text-[10px] font-mono text-white/20 tracking-[0.3em] uppercase">
        No logs. No recovery. Zero-knowledge.
      </footer>
    </main>
  );
}