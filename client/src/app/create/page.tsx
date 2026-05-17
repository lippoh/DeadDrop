// client/src/app/create/page.tsx

'use client';


import { useState } from 'react';
import { encryptMessage } from '@/lib/crypto';
import { useRouter } from 'next/navigation';

 

export default function CreatePage() {
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [expiryHours, setExpiryHours] = useState(48);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ url: string } | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setError('');

    try {
      // Use password or generate a random fallback
      const encryptionPassword = password || crypto.randomUUID();

      // ENCRYPT CLIENT-SIDE before sending
      const { ciphertext, iv, salt } = await encryptMessage(
        message,
        encryptionPassword
      );

      // Send encrypted data to server
      const res = await fetch('/api/drops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ciphertext,
          iv,
          salt,
          hasPassword: password.length > 0,
          password: password || undefined,
          expiryHours,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult({
        url: `${window.location.origin}/d/${data.token}`,
      });

      // If no password was set, warn user to save the auto-generated one
      if (!password) {
        console.warn(
          'Auto-generated password (share with recipient):',
          encryptionPassword
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || 'Failed to create dead drop');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Create Dead Drop</h1>

      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="message" className="block mb-2 font-medium">
              Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full h-40 p-3 border rounded-lg"
              placeholder="Type your message here..."
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-2 font-medium">
              Password (optional)
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-lg"
              placeholder="Leave empty for no password"
            />
          </div>

          <div>
            <label htmlFor="expiryHours" className="block mb-2 font-medium">
              Expires in: {expiryHours} hours
            </label>
            <select
              id="expiryHours"
              value={expiryHours}
              onChange={(e) => setExpiryHours(Number(e.target.value))}
              className="w-full p-3 border rounded-lg"
            >
              <option value={1}>1 hour</option>
              <option value={6}>6 hours</option>
              <option value={24}>24 hours</option>
              <option value={48}>48 hours (default)</option>
              <option value={168}>7 days</option>
            </select>
          </div>

          {error && (
            <p className="text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg
                       hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Encrypting...' : 'Create Dead Drop'}
          </button>
        </form>
      ) : (
        <div className="text-center space-y-4 p-8 bg-green-50 rounded-lg">
          <p className="text-green-700 font-medium">
            Dead drop created successfully!
          </p>
          <p className="text-sm text-gray-600">
            Share this link. It can only be read ONCE.
          </p>
          <label htmlFor="resultUrl" className="sr-only">
            Dead drop URL
          </label>
          <input
            id="resultUrl"
            readOnly
            value={result.url}
            className="w-full p-3 border rounded-lg text-center"
          />
          <button
            onClick={() => navigator.clipboard.writeText(result.url)}
            className="px-6 py-2 bg-gray-800 text-white rounded-lg"
          >
            Copy Link
          </button>
        </div>
      )}
    </div>
  );
}