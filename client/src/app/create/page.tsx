"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { encryptMessage } from "@/lib/crypto";
import { useDeadDropStore } from "@/store/useDeadDropStore";
import AnimatedButton from "@/components/AnimatedButton";
import BurningEmber from "@/components/BurningEmber";
import { Lock, Hourglass, ChevronDown, ArrowLeft, Copy, Check, Flame, AlertTriangle } from "lucide-react";

export default function CreateDropPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [expiry, setExpiry] = useState("48");
  const [isExpiryOpen, setIsExpiryOpen] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState("");

  const { isEncrypting, setEncrypting, resultLink, setResultLink, reset } = useDeadDropStore();

  const expiryOptions = [
    { value: "1", label: "1 Hour" },
    { value: "24", label: "24 Hours" },
    { value: "48", label: "48 Hours (Default)" },
    { value: "168", label: "7 Days" },
  ];

  useEffect(() => {
    return () => reset();
  }, [reset]);

  const handleSealAndBurn = async () => {
    if (!message) return;
    setEncrypting(true);

    await new Promise(r => setTimeout(r, 2000));

    try {
      const securePassword = usePassword && password ? password : crypto.randomUUID();
      const payload = await encryptMessage(message, securePassword);

      const res = await fetch("/api/drops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          hasPassword: usePassword,
          password: usePassword ? password : securePassword,
          expiryHours: parseInt(expiry),
        }),
      });

      const data = await res.json();
      console.log("Backend response:", JSON.stringify(data, null, 2));
      console.log("Status:", res.status);

      const link = `${window.location.origin}/d/${data.token}`;
      setResultLink(link);
      setEncryptionKey(securePassword); // <<< THE FIX: save the encryption key
    } catch (error) {
      console.error("Encryption failed", error);
    } finally {
      setEncrypting(false);
    }
  };

  return (
    <main className="min-h-screen bg-void-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">

      {/* Absolute Return Button */}
      {!isEncrypting && !resultLink && (
        <button
          onClick={() => router.push('/')}
          className="absolute top-8 left-8 text-white/40 hover:text-accent transition-colors flex items-center gap-3 text-[10px] tracking-[0.3em] font-display uppercase group z-50"
        >
          <motion.span
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="group-hover:-translate-x-1"
          >
            <ArrowLeft size={14} />
          </motion.span>
          Abort
        </button>
      )}

      {/* Fullscreen Encrypting Overlay */}
      <AnimatePresence>
        {isEncrypting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1 } }}
            className="fixed inset-0 z-50 bg-void-950 flex flex-col items-center justify-center"
          >
            <motion.div
              animate={{ scale: [1, 2, 1], rotate: [0, 180, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="w-40 h-40 border border-accent/30 rounded-full opacity-50 flex items-center justify-center"
            >
               <motion.div
                 animate={{ scale: [0.8, 1.2, 0.8] }}
                 transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                 className="w-20 h-20 bg-accent/10 rounded-full blur-xl"
               />
            </motion.div>
            <h2 className="absolute text-accent font-display text-sm tracking-[0.8em] animate-pulse font-light">
              ENCRYPTING
            </h2>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="w-full max-w-2xl relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {!resultLink ? (
          <div className="flex flex-col gap-10">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h1 className="font-display text-sm text-white/70 tracking-[0.3em] uppercase flex items-center gap-4">
                <BurningEmber /> Secure Payload
              </h1>
            </div>

            {/* Elegant Textarea */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-accent opacity-0 blur-xl group-focus-within:opacity-15 transition-opacity duration-700" />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter sensitive data..."
                className="relative w-full h-72 bg-void-900 border border-white/5 text-white/80 p-8 font-mono text-sm leading-relaxed resize-none focus:outline-none focus:border-accent/40 transition-colors font-light"
              />
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">

              {/* Custom Expiry Dropdown */}
              <div className="glass-panel p-5 flex flex-col gap-4 border-white/5 relative z-20">
                <label className="text-[10px] font-display text-white/30 tracking-[0.2em] flex items-center gap-2 uppercase">
                  <Hourglass size={12} className="text-accent"/> Lifespan
                </label>
                <div className="relative">
                  <button
                    onClick={() => setIsExpiryOpen(!isExpiryOpen)}
                    className="w-full flex items-center justify-between bg-transparent text-white/80 font-mono text-sm outline-none cursor-pointer font-light border-b border-white/10 pb-2 transition-colors hover:border-accent/40"
                  >
                    {expiryOptions.find(opt => opt.value === expiry)?.label}
                    <motion.span animate={{ rotate: isExpiryOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
                      <ChevronDown size={14} className="text-white/40" />
                    </motion.span>
                  </button>
                  <AnimatePresence>
                    {isExpiryOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-0 right-0 top-full mt-3 bg-void-900/90 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden z-50 rounded-sm"
                      >
                        <ul className="p-0 m-0 list-none">
                          {expiryOptions.map((opt) => (
                            <li
                              key={opt.value}
                              onClick={() => { setExpiry(opt.value); setIsExpiryOpen(false); }}
                              className="px-4 py-3 text-sm font-mono text-white/60 hover:bg-white/5 hover:text-accent cursor-pointer transition-colors"
                            >
                              {opt.label}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Password Toggle */}
              <div className="glass-panel p-5 flex flex-col gap-4 overflow-hidden border-white/5 relative z-10">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-display text-white/30 tracking-[0.2em] flex items-center gap-2 uppercase">
                    <Lock size={12} className="text-accent"/> Encryption Key
                  </label>

                  {/* Elegant Framer Motion Switch */}
                  <div
                    onClick={() => setUsePassword(!usePassword)}
                    className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors duration-500 flex items-center px-1 ${
                      usePassword ? "bg-accent/80" : "bg-void-800 border border-white/10"
                    }`}
                  >
                    <motion.div
                      layout
                      className="w-3 h-3 bg-white rounded-full shadow-sm"
                      animate={{ x: usePassword ? 20 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {usePassword && (
                    <motion.input
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      type="password"
                      placeholder="Custom Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-void-950 border border-white/10 text-white px-4 py-3 text-sm font-mono focus:outline-none focus:border-accent/50 font-light transition-colors"
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>

            <AnimatedButton onClick={handleSealAndBurn} className="w-full text-sm mt-4" disabled={!message}>
              Seal & Burn
            </AnimatedButton>
          </div>
        ) : (
          <ResultView link={resultLink} encryptionKey={encryptionKey} />
        )}
      </motion.div>
    </main>
  );
}

// ─── Result View: Shows BOTH link AND encryption key ───────────────────────

function ResultView({ link, encryptionKey }: { link: string; encryptionKey: string }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const handleCopy = (text: string, type: "link" | "key") => {
    navigator.clipboard.writeText(text);
    if (type === "link") {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="glass-panel p-12 flex flex-col gap-8 text-center border-white/5"
    >
      {/* Icon */}
      <div className="w-16 h-16 mx-auto rounded-full border border-green-500/30 bg-green-500/10 flex items-center justify-center">
        <Check className="text-green-400" size={24} />
      </div>

      <h2 className="font-display text-xl text-white tracking-[0.4em] font-light">PAYLOAD SECURED</h2>
      <p className="text-xs font-mono text-white/40 tracking-wider">
        Share the link. Send the key separately. Message self-destructs after reading.
      </p>

      {/* ── Share Link ── */}
      <div className="space-y-2 text-left">
        <label className="text-[10px] font-display text-white/30 tracking-[0.2em] uppercase flex items-center gap-2">
          Share Link
        </label>
        <div
          onClick={() => handleCopy(link, "link")}
          className="relative bg-void-950 border border-white/10 p-5 cursor-pointer overflow-hidden group hover:border-accent/30 transition-colors duration-500"
        >
          <div className="font-mono text-white/80 break-all text-xs tracking-widest relative z-10 flex items-start gap-3 font-light">
            <code className="flex-1">{link}</code>
            <span className="text-white/30 flex-shrink-0 mt-0.5">
              {copiedLink ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </span>
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-accent/10 text-accent font-display text-[10px] uppercase tracking-[0.3em] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20 backdrop-blur-sm">
            {copiedLink ? "Copied!" : "Copy Link"}
          </div>
        </div>
      </div>

      {/* ── Encryption Key ── */}
      <div className="space-y-2 text-left">
        <label className="text-[10px] font-display text-amber-400/70 tracking-[0.2em] uppercase flex items-center gap-2">
          <Lock size={12} className="text-amber-400" />
          Decryption Key
        </label>
        <div
          onClick={() => handleCopy(encryptionKey, "key")}
          className="relative bg-void-950 border border-amber-500/20 p-5 cursor-pointer overflow-hidden group hover:border-amber-500/40 transition-colors duration-500"
        >
          <div className="font-mono text-amber-300/90 break-all text-xs tracking-widest relative z-10 flex items-start gap-3 font-light">
            <code className="flex-1">{encryptionKey}</code>
            <span className="text-amber-400/50 flex-shrink-0 mt-0.5">
              {copiedKey ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </span>
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-amber-500/10 text-amber-300 font-display text-[10px] uppercase tracking-[0.3em] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20 backdrop-blur-sm">
            {copiedKey ? "Copied!" : "Copy Key"}
          </div>
        </div>
        <p className="text-[10px] text-white/20 font-light px-1 leading-relaxed">
          Send this key to the recipient through a different channel. Without it, the message cannot be decrypted.
        </p>
      </div>

      {/* ── Warning Banner ── */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-400/80 text-xs">
        <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
        <p>
          This key cannot be recovered once you leave this page. Copy it now.
          The message will be permanently destroyed after it is read or when it expires.
        </p>
      </div>
    </motion.div>
  );
}
