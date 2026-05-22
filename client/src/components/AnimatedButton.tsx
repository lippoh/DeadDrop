"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import React from "react";

interface Props extends Omit<HTMLMotionProps<"button">, "children"> {
  children?: React.ReactNode;
}

export default function AnimatedButton({ children, className, ...props }: Props) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative px-10 py-4 border border-white/10 text-white font-display uppercase tracking-[0.3em] text-sm transition-all duration-500 font-light overflow-hidden group hover:border-accent/50 hover:shadow-[0_0_30px_rgba(217,70,239,0.15)]",
        className
      )}
      {...props}
    >
      <span className="relative z-10 group-hover:text-accent transition-colors duration-500">
        {children}
      </span>
      <div className="absolute inset-0 bg-accent/5 transition-transform duration-500 ease-in-out translate-y-full-custom" />
    </motion.button>
  );
}
