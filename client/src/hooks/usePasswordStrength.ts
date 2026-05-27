// hooks/usePasswordStrength.ts
export type StrengthLevel = 0 | 1 | 2 | 3 | 4;

interface StrengthResult {
  score: StrengthLevel;
  label: string;
  color: string;
  suggestions: string[];
}

export function usePasswordStrength(password: string): StrengthResult {
  if (!password) {
    return { score: 0, label: "", color: "", suggestions: [] };
  }

  let score: StrengthLevel = 0;
  const suggestions: string[] = [];

  // Length checks
  if (password.length >= 8) score = 1 as StrengthLevel;
  else {
    suggestions.push("Use at least 8 characters");
    return { score: 0, label: "Too Short", color: "#EF4444", suggestions };
  }

  if (password.length >= 12) score = 2 as StrengthLevel;

  // Character variety
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigits = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (hasUppercase && hasLowercase) score = Math.min(score + 1, 4) as StrengthLevel;
  else suggestions.push("Mix uppercase and lowercase letters");

  if (hasDigits) score = Math.min(score + 1, 4) as StrengthLevel;
  else suggestions.push("Add numbers");

  if (hasSpecial) score = Math.min(score + 1, 4) as StrengthLevel;
  else suggestions.push("Add special characters (!@#$%^&*)");

  // Penalties
  if (/^[a-zA-Z]+$/.test(password)) {
    score = Math.max(score - 1, 1) as StrengthLevel;
  }
  if (/^[0-9]+$/.test(password)) {
    score = Math.max(score - 1, 1) as StrengthLevel;
  }
  if (/(.)\1{2,}/.test(password)) {
    suggestions.push("Avoid repeated characters");
    score = Math.max(score - 1, 1) as StrengthLevel;
  }

  const levels: Record<StrengthLevel, { label: string; color: string }> = {
    0: { label: "Too Short", color: "#EF4444" },
    1: { label: "Weak", color: "#EF4444" },
    2: { label: "Fair", color: "#F59E0B" },
    3: { label: "Good", color: "#22C55E" },
    4: { label: "Strong", color: "#16A34A" },
  };

  return {
    score,
    label: levels[score].label,
    color: levels[score].color,
    suggestions: suggestions.slice(0, 3),
  };
}