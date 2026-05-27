"use client";
 
import { motion, AnimatePresence } from "framer-motion";
import { FlameParticles } from "./FlameParticles";
 
interface BurnAnimationProps {
  isActive: boolean;
  onComplete: () => void;
  children?: React.ReactNode;
}
 
export function BurnAnimation({ isActive, onComplete }: BurnAnimationProps) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 1 }}
          animate={{
            opacity: [1, 1, 0.8, 0.4, 0],
            scale: [1, 1.02, 0.98, 1.01, 0.9],
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          onAnimationComplete={onComplete}
          style={{ filter: "blur(0px)" }}
        >
          {/* Overlay darkening effect */}
          <motion.div
            className="absolute inset-0 rounded-lg"
            animate={{
              backgroundColor: [
                "rgba(239, 70, 112, 0)",
                "rgba(239, 70, 112, 0.05)",
                "rgba(239, 70, 112, 0.15)",
                "rgba(239, 70, 112, 0.25)",
                "rgba(11, 18, 32, 0.8)",
              ],
              filter: [
                "blur(0px)",
                "blur(0px)",
                "blur(1px)",
                "blur(3px)",
                "blur(6px)",
              ],
            }}
            transition={{ duration: 1.5, ease: "easeIn" }}
          />
 
          {/* Flame particle effect */}
          <FlameParticles />
 
          {/* Burn text indicator */}
          <motion.div
            className="relative z-10 text-accent font-bold text-lg tracking-wider"
            animate={{
              opacity: [0, 1, 1, 0],
              y: [10, 0, 0, -20],
            }}
            transition={{ duration: 1.2, times: [0, 0.2, 0.7, 1] }}
          >
            BURNING...
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
