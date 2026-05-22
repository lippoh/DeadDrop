"use client";

import { motion } from "framer-motion";

export default function BurningEmber({ active = true }: { active?: boolean }) {
  if (!active) return null;
  return (
    <div className="relative w-3 h-3 flex items-center justify-center">
      <motion.div
        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-full h-full bg-accent rounded-full blur-[3px]"
      />
      <div className="relative w-1 h-1 bg-white rounded-full" />
    </div>
  );
}