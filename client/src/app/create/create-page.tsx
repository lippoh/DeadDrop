"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Lock, Flame, ArrowRight, Copy, Check,
  ExternalLink, AlertTriangle,
} from "lucide-react";
import { encryptMessage } from "@/lib/crypto";
import { createDrop } from "@/lib/api";
import AnimatedButton from "@/components/AnimatedButton";

// ─── Steps ───────────────────────────────────────────────────────────────────

const STEPS = {
  WRITE: "write",
  ENCRYPTING: "encrypting",
  SUCCESS: "success",
} as const;

type Step = (typeof STEPS)[keyof typeof STEPS];

const EXPIRY_OPTIONS = [
  { label: "1 Hour", value: 3600 },
  { label: "6 Hours", value: 21600 },
  { label: "24 Hours", value: 86400 },
  { label: "3 Days", value: 259200 },
  { label: "7 Days", value: 604800 },
];

// ─── Pre-computed particle positions (module-level = no render) ─────────────

const PARTICLES = Array.from({ length: 15 }, () => ({
  left: Math.random() * 100,
  top: Math.random() * 100,
  duration: 3 + Math.random() * 4,
  delay: Math.random() * 3,
}));

// ─── Component ───────────────────────────────────────────────────────────────

export default function CreatePage() {
  const [step, setStep] = useState<Step>(STEPS.WRITE);
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [expiresIn, setExpiresIn] = useState(86400);
  const [shareLink, setShareLink] = useState("");
  const [encryptionKey, setEncryptionKey] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [error, setError] = useState<string | null>(null);


  // ── Encrypt + Upload ──

  const handleCreate = useCallback(async () => {
    if (!message.trim()) return;
    setError(null);
    setStep(STEPS.ENCRYPTING);

    try {
      const { ciphertext, iv, salt, key } = await encryptMessage(
        message.trim(),
        password || undefined
      );

      const drop = await createDrop({
        ciphertext,
        iv,
        salt,
        password: key,
        expiresIn,
      });

      const origin = typeof window !== "undefined" ? window.location.origin : "";
      setShareLink(`${origin}/d/${drop.token}`);
      setEncryptionKey(key);
      setStep(STEPS.SUCCESS);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to create drop. Please try again.";
      setError(msg);
      setStep(STEPS.WRITE);
    }
  }, [message, password, expiresIn]);

  // ── Clipboard ──

  const copyText = useCallback(async (text: string, type: "link" | "key") => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    if (type === "link") {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  }, []);

  const charCount = message.length;
  const maxChars = 10000;

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-void-950">
      {/* Background particles — stable positions from useMemo */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-30">
          {PARTICLES.map((p, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-accent"
            style={{ left: `${p.left}%`, top: `${p.top}%` }}
            animate={{ opacity: [0.1, 0.5, 0.1], y: [0, -30, 0] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 flex items-center gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm"
            >
              <AlertTriangle size={18} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">

          {/* ── STEP 1: Write ── */}
          {step === STEPS.WRITE && (
            <motion.div
              key="write"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              <div className="text-center space-y-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                  className="w-12 h-12 mx-auto rounded-full border border-accent/30 bg-accent/5 flex items-center justify-center"
                >
                  <Shield size={20} className="text-accent" />
                </motion.div>
                <h1 className="text-3xl md:text-4xl font-display font-light tracking-widest uppercase text-white">
                  Create Drop
                </h1>
                <p className="text-sm text-white/40 font-light max-w-md mx-auto">
                  Write your message. It will be encrypted in your browser before leaving your device.
                </p>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-white/30 tracking-widest uppercase">Message</label>
                <div className="relative">
                  <textarea
                    value={message}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                    placeholder="Type your secret message here..."
                    maxLength={maxChars}
                    rows={8}
                    className="w-full bg-white/3 border border-white/8 rounded-xl px-5 py-4 text-sm text-white/90 placeholder:text-white/15 focus:outline-none focus:border-accent/40 transition-colors resize-none font-mono leading-relaxed"
                    autoFocus
                  />
                  <div className="absolute bottom-3 right-3 text-[10px] font-mono text-white/20">
                    {charCount.toLocaleString()}/{maxChars.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Password (optional) */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-white/30 tracking-widest uppercase">
                  Password <span className="text-white/15">(optional)</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  placeholder="Leave blank for auto-generated key"
                  className="w-full bg-white/3 border border-white/8 rounded-xl px-5 py-3 text-sm text-white/90 placeholder:text-white/15 focus:outline-none focus:border-accent/40 transition-colors font-mono"
                />
              </div>

              {/* Expiry */}
              <div className="space-y-3">
                <label className="text-xs font-mono text-white/30 tracking-widest uppercase">
                  Self-destruct after
                </label>
                <div className="flex flex-wrap gap-2">
                  {EXPIRY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setExpiresIn(opt.value)}
                      className={`px-4 py-2 rounded-lg text-xs font-mono tracking-wider border transition-all duration-300 ${
                        expiresIn === opt.value
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-white/8 text-white/30 hover:border-white/20 hover:text-white/50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-center pt-4">
                <AnimatedButton onClick={handleCreate} disabled={!message.trim()}>
                  <Lock size={16} />
                  <span>Encrypt & Create</span>
                  <ArrowRight size={16} />
                </AnimatedButton>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Encrypting ── */}
          {step === STEPS.ENCRYPTING && (
            <motion.div
              key="encrypting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-32 space-y-6"
            >
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                <Lock size={32} className="text-accent" />
              </motion.div>
              <div className="text-center space-y-2">
                <p className="text-sm font-display tracking-[0.2em] uppercase text-white/60">
                  Encrypting in browser
                </p>
                <p className="text-xs text-white/20 font-mono">
                  AES-256-GCM · Zero knowledge · Your data never leaves encrypted
                </p>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Success ── */}
          {step === STEPS.SUCCESS && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="text-center space-y-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                  className="w-14 h-14 mx-auto rounded-full border border-green-500/30 bg-green-500/10 flex items-center justify-center"
                >
                  <Check size={24} className="text-green-400" />
                </motion.div>
                <h1 className="text-3xl md:text-4xl font-display font-light tracking-widest uppercase text-white">
                  Drop Created
                </h1>
                <p className="text-sm text-white/40 font-light max-w-md mx-auto">
                  Send the <strong className="text-white/60">link</strong> to the recipient.
                  Send the <strong className="text-white/60">key</strong> through a different channel.
                </p>
              </div>

              {/* Share Link */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-white/30 tracking-widest uppercase flex items-center gap-2">
                  <ExternalLink size={12} /> Share Link
                </label>
                <div className="flex items-center gap-2 bg-white/3 border border-white/8 rounded-xl p-3">
                  <code className="flex-1 text-sm text-accent/80 font-mono truncate">
                    {shareLink}
                  </code>
                  <button
                    onClick={() => copyText(shareLink, "link")}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white/80"
                  >
                    {copiedLink ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* Encryption Key */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-white/30 tracking-widest uppercase flex items-center gap-2">
                  <Lock size={12} /> Encryption Key
                </label>
                <div className="flex items-center gap-2 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                  <code className="flex-1 text-sm text-amber-300/90 font-mono break-all leading-relaxed">
                    {encryptionKey}
                  </code>
                  <button
                    onClick={() => copyText(encryptionKey, "key")}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors text-amber-400/60 hover:text-amber-400"
                  >
                    {copiedKey ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                  </button>
                </div>
                <p className="text-xs text-amber-400/50 font-light px-1">
                  Send this key through a SEPARATE channel (SMS, Signal, etc.).
                  Without it, the message is permanently unreadable.
                </p>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-400/80 text-xs">
                <Flame size={16} className="mt-0.5 shrink-0" />
                <p>
                  This key <strong>cannot be recovered</strong> once you leave this page.
                  Copy it now. The message will be permanently destroyed after it is read
                  or when it expires.
                </p>
              </div>

              {/* New Drop */}
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep(STEPS.WRITE);
                    setMessage("");
                    setPassword("");
                    setShareLink("");
                    setEncryptionKey("");
                    setError(null);
                  }}
                  className="px-8 py-3.5 rounded-xl font-display text-sm tracking-[0.15em] uppercase border border-white/10 text-white/60 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all duration-300"
                >
                  Create Another Drop
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}