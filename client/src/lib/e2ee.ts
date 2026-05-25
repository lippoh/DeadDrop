// client/src/lib/e2ee.ts — E2E Encryption (ECDH + AES-256-GCM)

// ── Helpers ──

/** Creates a clean ArrayBuffer copy from any TypedArray source. */
function toBuffer(src: Uint8Array): ArrayBuffer {
  const buf = new ArrayBuffer(src.byteLength);
  new Uint8Array(buf).set(src);
  return buf;
}

function fromBase64(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const buf = new ArrayBuffer(bin.length);
  const arr = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) {
    arr[i] = bin.charCodeAt(i);
  }
  return buf;
}

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// ── ECDH Key Generation ──

export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"]
  );
}

export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported: ArrayBuffer = await crypto.subtle.exportKey("spki", key);
  return toBase64(exported);
}

export async function importPublicKey(b64: string): Promise<CryptoKey> {
  const raw: ArrayBuffer = fromBase64(b64);
  return crypto.subtle.importKey(
    "spki",
    raw,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );
}

// ── Shared Key Derivation ──

export async function deriveSharedKey(
  myPrivateKey: CryptoKey,
  theirPublicKey: CryptoKey
): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    { name: "ECDH", public: theirPublicKey },
    myPrivateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function deriveRoomKey(roomId: string, _userId?: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(roomId),  // ← μόνο roomId, όχι userId
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("deaddrop-room-key-v1"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// ── Encrypt / Decrypt Chat Messages ──

export async function encryptChatMessage(
  key: CryptoKey,
  plaintext: string
): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder();
  const ivRaw = new Uint8Array(12);
  crypto.getRandomValues(ivRaw);
  const iv: ArrayBuffer = toBuffer(ivRaw);

  const encrypted: ArrayBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    toBuffer(encoder.encode(plaintext))
  );

  return {
    ciphertext: toBase64(encrypted),
    iv: toBase64(iv),
  };
}

export async function decryptChatMessage(
  key: CryptoKey,
  ciphertextB64: string,
  ivB64: string
): Promise<string> {
  const decoder = new TextDecoder();
  const encrypted: ArrayBuffer = fromBase64(ciphertextB64);
  const iv: ArrayBuffer = fromBase64(ivB64);

  const decrypted: ArrayBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted
  );

  return decoder.decode(decrypted);
}