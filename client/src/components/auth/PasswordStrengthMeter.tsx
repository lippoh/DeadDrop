// components/auth/PasswordStrengthMeter.tsx
"use client";

import { usePasswordStrength } from "@/hooks/usePasswordStrength";

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const { score, label, color, suggestions } = usePasswordStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      {/* Strength bar — 4 segments */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className="h-1.5 flex-1 rounded-full transition-all duration-300"
            style={{
              backgroundColor:
                score >= level
                  ? color
                  : "#1E293B",
            }}
          />
        ))}
      </div>

      {/* Label */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color }}>
          {label}
        </span>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <ul className="space-y-0.5">
          {suggestions.map((suggestion, i) => (
            <li key={i} className="text-xs text-zinc-500">
              &bull; {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}