"use client";

import { useState, useEffect, useCallback, ChangeEvent, KeyboardEvent } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, Flame, Loader2, AlertTriangle, Shield, ArrowLeft } from "lucide-react";
import { decryptMessage } from "@/lib/crypto";
import { getDrop, readAndBurnDrop } from "@/lib/api";
import type { GetDropResponse } from "@/lib/api";
import AnimatedButton from "@/components/AnimatedButton";

// ─── States ──────────────────────────────────────────────────────────────────

type ViewState =
  | "loading"       // Fetching drop from server
  | "enter_key"     // Waiting for user to enter decryption key
  | "decrypting"    // Decrypting in browser
  | "revealed"      // Message decrypted and visible
  | "burning"       // Burn animation playing
  | "burned"        // Message destroyed
  | "not_found"     // Drop doesn't exist or expired
  | "error"        // Something went wrong

const createBackgroundParticles = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    duration: 3 + Math.random() * 4,
    delay: Math.random() * 3,
  }));

const createEmberParticles = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${30 + Math.random() * 40}%`,
    bottom: `${15 + Math.random() * 20}%`,
    width: 2 + Math.random() * 5,
    height: 2 + Math.random() * 5,
    backgroundColor: ["#FF2D78", "#FF6B9D", "#F50057", "#C2185B"][i % 4],
    boxShadow: `0 0 ${6 + Math.random() * 10}px #FF2D78`,
    y: -250 - Math.random() * 300,
    x: (Math.random() - 0.5) * 120,
    duration: 2 + Math.random() * 2,
    delay: Math.random() * 1.5,
  }));

export default function ReadDropPage({ params }: { params: { token: string } }) {
  const token = params.token;
  const [viewState, setViewState] = useState<ViewState>("loading");
  const [drop, setDrop] = useState<GetDropResponse | null>(null);
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [decryptedMessage, setDecryptedMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [backgroundParticles] = useState(() => createBackgroundParticles(12));
  const [emberParticles] = useState(() => createEmberParticles(40));

  // ── Fetch the drop on mount ──

  useEffect(() => {
    async function fetch() {
      try {
        const data = await getDrop(token);
        setDrop(data);
        setViewState("enter_key");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load drop.";
        setError(message);
        setViewState("not_found");
      }
    }
    fetch();
  }, [token]);

  // ── Decrypt ──

  const handleDecrypt = useCallback(async () => {
    if (!drop || !key.trim()) return;
    setViewState("decrypting");
    setError(null);

    try {
      const response = await readAndBurnDrop(token, key.trim());
      const plaintext = await decryptMessage(response.ciphertext, key.trim(), response.iv, response.salt);
      setDecryptedMessage(plaintext);
      setViewState("revealed");

      // Auto-burn after a short delay so user can see the message
      setTimeout(() => {
        setViewState("burning");
        setTimeout(() => setViewState("burned"), 2500);
      }, 3000);
    } catch {
      setError("Wrong key. The decryption failed — please check and try again.");
      setViewState("enter_key");
    }
  }, [drop, key, token]);

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-void-950 overflow-hidden">
      {/* Background particles */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-20">
        {backgroundParticles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 rounded-full bg-accent"
            style={{ left: particle.left, top: particle.top }}
            animate={{ opacity: [0.1, 0.4, 0.1], y: [0, -25, 0] }}
            transition={{ duration: particle.duration, repeat: Infinity, delay: particle.delay }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        <AnimatePresence mode="wait">

          {/* ── Loading ── */}
          {viewState === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center py-32 space-y-6"
            >
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                <Loader2 size={32} className="text-accent" />
              </motion.div>
              <p className="text-sm font-mono text-white/30 tracking-widest uppercase">Retrieving drop...</p>
            </motion.div>
          )}

          {/* ── Enter Key ── */}
          {viewState === "enter_key" && (
            <motion.div
              key="enter_key"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              <div className="text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full border border-accent/30 bg-accent/5 flex items-center justify-center">
                  <Lock size={20} className="text-accent" />
                </div>
                <h1 className="text-3xl md:text-4xl font-display font-light tracking-widest uppercase text-white">
                  Encrypted Drop
                </h1>
                <p className="text-sm text-white/40 font-light">
                  This message is encrypted. Enter the key to decrypt it.
                </p>
              </div>

              {error && viewState === "enter_key" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm"
                >
                  <AlertTriangle size={18} />
                  {error}
                </motion.div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-mono text-white/30 tracking-widest uppercase">
                  Decryption Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={key}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => { setKey(e.target.value); setError(null); }}
                    onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleDecrypt()}
                    placeholder="Paste the encryption key here..."
                    className="w-full bg-white/3 border border-white/8 rounded-xl px-5 py-4 pr-12 text-sm text-white/90 placeholder:text-white/15 focus:outline-none focus:border-accent/40 transition-colors font-mono"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                  >
                    {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-center">
                <AnimatedButton onClick={handleDecrypt} disabled={!key.trim()}>
                  <Shield size={16} />
                  Decrypt Message
                </AnimatedButton>
              </div>
            </motion.div>
          )}

          {/* ── Decrypting ── */}
          {viewState === "decrypting" && (
            <motion.div
              key="decrypting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center py-32 space-y-6"
            >
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                <Lock size={32} className="text-accent" />
              </motion.div>
              <p className="text-sm font-mono text-white/30 tracking-widest uppercase">Decrypting...</p>
            </motion.div>
          )}

          {/* ── Message Revealed ── */}
          {viewState === "revealed" && (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full border border-green-500/30 bg-green-500/10 flex items-center justify-center">
                  <Eye size={20} className="text-green-400" />
                </div>
                <h1 className="text-2xl font-display font-light tracking-widest uppercase text-white">
                  Decrypted
                </h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 1, 0.5] }}
                  transition={{ duration: 4 }}
                  className="text-xs font-mono text-amber-400/60 tracking-widest"
                >
                  BURNING IN 3 SECONDS — READ NOW
                </motion.p>
              </div>

              <div className="bg-white/3 border border-white/8 rounded-xl p-6 md:p-8">
                <pre className="whitespace-pre-wrap text-sm md:text-base text-white/90 font-mono leading-relaxed">
                  {decryptedMessage}
                </pre>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs font-mono text-white/20">
                <Flame size={14} className="text-accent/50" />
                This message will be permanently destroyed...
              </div>
            </motion.div>
          )}

          {/* ── Burning Animation ── */}
          {viewState === "burning" && (
            <motion.div
              key="burning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-void-950"
            >
              {/* Ember particles rising */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {emberParticles.map((ember) => (
                  <motion.div
                    key={ember.id}
                    className="absolute rounded-full"
                    style={{
                      left: ember.left,
                      bottom: ember.bottom,
                      width: ember.width,
                      height: ember.height,
                      backgroundColor: ember.backgroundColor,
                      boxShadow: ember.boxShadow,
                    }}
                    initial={{ opacity: 0, y: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0.8, 0],
                      y: [0, ember.y],
                      x: [0, ember.x],
                      scale: [0, 1.2, 0.5, 0],
                    }}
                    transition={{
                      duration: ember.duration,
                      delay: ember.delay,
                      ease: "easeOut",
                    }}
                  />
                ))}
              </div>

              {/* Central text */}
              <div className="text-center relative z-10">
                <motion.h2
                  className="text-5xl md:text-7xl font-display font-light tracking-[0.3em] uppercase text-accent"
                  initial={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                  animate={{ y: -30, opacity: 0, filter: "blur(20px)", scale: 1.1 }}
                  transition={{ duration: 2, ease: "easeIn" }}
                >
                  Burned
                </motion.h2>
                <motion.p
                  className="mt-4 text-sm text-white/30 tracking-[0.3em] uppercase font-mono"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Message destroyed. No recovery possible.
                </motion.p>
              </div>

              {/* Vignette */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at center, transparent 30%, rgba(255, 45, 120, 0.06) 60%, rgba(10, 10, 15, 0.95) 100%)",
                }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 2.5, times: [0, 0.3, 1] }}
              />
            </motion.div>
          )}

          {/* ── Burned ── */}
          {viewState === "burned" && (
            <motion.div
              key="burned"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-32 space-y-6"
            >
              <div className="w-14 h-14 mx-auto rounded-full border border-white/10 bg-white/3 flex items-center justify-center">
                <Flame size={24} className="text-white/20" />
              </div>
              <h1 className="text-2xl font-display font-light tracking-widest uppercase text-white/40">
                This Drop is Gone
              </h1>
              <p className="text-sm text-white/20 font-light max-w-sm mx-auto">
                The message was read once and permanently destroyed. No copies exist anywhere.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-accent/60 hover:text-accent transition-colors font-mono tracking-wider"
              >
                <ArrowLeft size={16} />
                Create a new drop
              </Link>
            </motion.div>
          )}

          {/* ── Not Found / Expired ── */}
          {viewState === "not_found" && (
            <motion.div
              key="not_found"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-32 space-y-6"
            >
              <div className="w-14 h-14 mx-auto rounded-full border border-white/10 bg-white/3 flex items-center justify-center">
                <AlertTriangle size={24} className="text-white/20" />
              </div>
              <h1 className="text-2xl font-display font-light tracking-widest uppercase text-white/40">
                Drop Not Found
              </h1>
              <p className="text-sm text-white/20 font-light max-w-sm mx-auto">
                {error || "This drop doesn't exist, has expired, or has already been burned."}
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-accent/60 hover:text-accent transition-colors font-mono tracking-wider"
              >
                <ArrowLeft size={16} />
                Create a new drop
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
