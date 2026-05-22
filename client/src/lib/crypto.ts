/**
 * DeadDrop Crypto Module
 * Client-side AES-256-GCM encryption using the Web Crypto API.
 * The server NEVER receives the plaintext or the key.
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Derive an AES-256-GCM key from a password using PBKDF2.
 */
async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,   // TS 5.7+ Uint8Array fix
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Convert a Uint8Array to a base64 string (chunked to avoid stack overflow).
 */
function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < buffer.length; i += chunkSize) {
    const chunk = buffer.subarray(i, Math.min(i + chunkSize, buffer.length));
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }
  return btoa(binary);
}

/**
 * Convert a base64 string to a Uint8Array.
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ─── Encrypt (separate fields — matches backend schema) ─────────────────────

/**
 * Encrypt plaintext. Returns ciphertext, iv, salt, and key as separate base64 strings.
 * This is the PRIMARY encrypt function used by the create page.
 */
export async function encryptMessage(
  plaintext: string,
  password?: string
): Promise<{ ciphertext: string; key: string; iv: string; salt: string }> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const actualPassword = password || crypto.randomUUID();
  const key = await deriveKey(actualPassword, salt);

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: iv as unknown as BufferSource },
    key,
    encoder.encode(plaintext)
  );

  return {
    ciphertext: arrayBufferToBase64(new Uint8Array(encrypted)),
    iv: arrayBufferToBase64(iv),
    salt: arrayBufferToBase64(salt),
    key: actualPassword,
  };
}

// ─── Decrypt (separate fields) ──────────────────────────────────────────────

/**
 * Decrypt a message using separate ciphertext, iv, and salt base64 strings.
 * This is the PRIMARY decrypt function used by the read page.
 */
export async function decryptMessage(
  ciphertextBase64: string,
  password: string,
  ivBase64: string,
  saltBase64: string
): Promise<string> {
  const iv = base64ToUint8Array(ivBase64);
  const salt = base64ToUint8Array(saltBase64);
  const ciphertext = base64ToUint8Array(ciphertextBase64);

  const key = await deriveKey(password, salt);

  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: iv as unknown as BufferSource },
    key,
    ciphertext as unknown as BufferSource
  );

  return new TextDecoder().decode(plaintextBuffer);
}

// ─── Utility ────────────────────────────────────────────────────────────────

export function generateToken(length: number = 24): string {
  const array = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}