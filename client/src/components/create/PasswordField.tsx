'use client';

interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function PasswordField({ value, onChange }: PasswordFieldProps) {
  return (
    <label className="block text-ghost-300 mb-4">
      <span className="mb-2 block text-sm font-medium">Password (optional)</span>
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Enter a password"
        className="w-full rounded-xl border border-void-700 bg-void-800/70 px-4 py-3 text-ghost-200 outline-none transition focus:border-cipher-blue/50 focus:ring-1 focus:ring-cipher-blue/20"
      />
    </label>
  );
}
