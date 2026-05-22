'use client';

interface ExpirySelectorProps {
  value: number;
  onChange: (value: number) => void;
}

const expiryOptions = [1, 6, 12, 24, 48, 72, 168];

export function ExpirySelector({ value, onChange }: ExpirySelectorProps) {
  return (
    <label className="block text-ghost-300 mb-4">
      <span className="mb-2 block text-sm font-medium">Expiry</span>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full rounded-xl border border-void-700 bg-void-800/70 px-4 py-3 text-ghost-200 outline-none transition focus:border-cipher-blue/50 focus:ring-1 focus:ring-cipher-blue/20"
      >
        {expiryOptions.map((hours) => (
          <option key={hours} value={hours}>
            {hours} hour{hours === 1 ? '' : 's'}
          </option>
        ))}
      </select>
    </label>
  );
}
