// client/src/app/d/[token]/page.tsx

'use client';

 
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { decryptMessage } from '@/lib/crypto';


export default function ReadPage() {
  const { token } = useParams();
  const [status, setStatus] = useState<
    'loading' | 'password' | 'burned' | 'ready' | 'revealed'
  >('loading');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');


  // Step 1: Check if dead drop exists
  useEffect(() => {
    async function checkDrop() {
      try {
        const res = await fetch(`/api/drops/${token}`);
        const data = await res.json();

        if (!res.ok || data.error) {
          setStatus('burned');
          return;
        }

        setStatus(data.hasPassword ? 'password' : 'ready');
      } catch {
        setStatus('burned');
      }
    }
    checkDrop();
  }, [token]);

  // Step 2: Read and decrypt (with or without password)
  const handleRead = async () => {
    try {
      const res = await fetch(`/api/drops/${token}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password || undefined }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to read');
        return;
      }

      // Decrypt client-side using Web Crypto API
      const plaintext = await decryptMessage(
        data.ciphertext,
        data.iv,
        data.salt,
        password
      );
 
      setMessage(plaintext);
      setStatus('revealed');
    } catch (err: unknown) {
      setError('Failed to decrypt message');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 min-h-[60vh] flex flex-col
                    items-center justify-center">
      {status === 'loading' && (
        <p className="text-gray-500">Loading...</p>
      )}

      {status === 'burned' && (
        <div className="text-center space-y-4 p-8">
          <div className="text-6xl">&#128293;</div>
          <h1 className="text-2xl font-bold text-gray-800">
            This Dead Drop Has Been Burned
          </h1>
          <p className="text-gray-500">
            The message was read and permanently destroyed.
            It no longer exists anywhere.
          </p>
        </div>
      )}
 
      {status === 'password' && (
        <div className="w-full max-w-md space-y-4">
          <h1 className="text-2xl font-bold text-center">
            This message is password protected
          </h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded-lg text-center"
            placeholder="Enter password"
            onKeyDown={(e) => e.key === 'Enter' && handleRead()}
          />
          {error && <p className="text-red-500 text-center">{error}</p>}
          <button
            onClick={handleRead}
            className="w-full py-3 bg-blue-600 text-white rounded-lg"
          >
            Decrypt & Read
          </button>
        </div>
      )}

      {status === 'ready' && (
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">
            You are about to read a dead drop
          </h1>
          <p className="text-gray-500">
            This message can only be read ONCE. After reading,
            it will be permanently destroyed.
          </p>
          <button
            onClick={handleRead}
            className="px-8 py-3 bg-red-600 text-white rounded-lg
                       hover:bg-red-700 text-lg font-medium"
          >
            Read Message (This will destroy it)
          </button>
        </div>
      )}

      {status === 'revealed' && (
        <div className="w-full text-center space-y-6 p-8
                      bg-gray-900 text-white rounded-xl">
          <h1 className="text-lg text-gray-400">
            Encrypted Message Revealed:
          </h1>
          <p className="text-2xl whitespace-pre-wrap font-mono">
            {message}
          </p>
          <div className="pt-4 border-t border-gray-700">
            <p className="text-red-400 font-medium">
              &#128293; This message has been permanently destroyed.
              It cannot be recovered.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}