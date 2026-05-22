// components/motion/PageTransition.tsx
'use client';
import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
 
const pageEase = [0, 0, 0.2, 1] as const;
const pageExitEase = [0.4, 0, 1, 1] as const;

const pageVariants = {
  initial: { opacity: 0, y: 10, filter: 'blur(4px)' },
  enter: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.5, ease: pageEase },
  },
  exit: {
    opacity: 0, y: -10, filter: 'blur(4px)',
    transition: { duration: 0.3, ease: pageExitEase },
  },
};
 
interface PageTransitionProps {
  children: ReactNode;
}
 
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
 
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
