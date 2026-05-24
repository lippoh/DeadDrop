"use client";

import { useState, useEffect, useRef } from "react";
import { Flame } from "lucide-react";

interface SelfDestructMessageProps {
  ttl: number;
  createdAt: string;
  children: React.ReactNode;
  onDestroy: () => void;
}

export default function SelfDestructMessage({
  ttl,
  createdAt,
  children,
  onDestroy,
}: SelfDestructMessageProps) {
  // Compute initial remaining at mount time — no setState in effect needed
  const [remaining, setRemaining] = useState(() => {
    const created = new Date(createdAt).getTime();
    const destroyAt = created + ttl * 1000;
    return Math.max(0, Math.ceil((destroyAt - Date.now()) / 1000));
  });

  const destroyedRef = useRef(false);

  useEffect(() => {
    if (remaining <= 0 && !destroyedRef.current) {
      destroyedRef.current = true;
      onDestroy();
      return;
    }

    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!destroyedRef.current) {
            destroyedRef.current = true;
            onDestroy();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative">
      {remaining > 0 && remaining <= 10 && (
        <div className="absolute -top-2 -right-2 flex items-center gap-1 bg-red-500/20 border border-red-500/30 rounded-full px-2 py-0.5">
          <Flame size={10} className="text-red-400" />
          <span className="text-[10px] font-mono text-red-400">{remaining}s</span>
        </div>
      )}
      {children}
    </div>
  );
}