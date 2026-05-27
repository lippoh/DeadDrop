import crypto from 'crypto';

// --- Inline the same algorithm as client/src/lib/e2ee.ts ---
function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(passphrase, salt, 100000, 32, 'sha256');
}

function encryptMessage(plaintext: string, passphrase: string): { iv: string; salt: string; ciphertext: string } {
  const salt = crypto.randomBytes(16);
  const key = deriveKey(passphrase, salt);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    iv: iv.toString('base64'),
    salt: salt.toString('base64'),
    ciphertext: Buffer.concat([encrypted, authTag]).toString('base64'),
  };
}

function decryptMessage(payload: { iv: string; salt: string; ciphertext: string }, passphrase: string): string {
  const iv = Buffer.from(payload.iv, 'base64');
  const salt = Buffer.from(payload.salt, 'base64');
  const key = deriveKey(passphrase, salt);
  const raw = Buffer.from(payload.ciphertext, 'base64');
  const authTag = raw.subarray(raw.length - 16);
  const encrypted = raw.subarray(0, raw.length - 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString('utf8');
}

// --- Tests ---
describe('E2E Encryption', () => {
  it('should derive the same key from the same passphrase and salt', () => {
    const passphrase = 'room-secret-key';
    const salt = crypto.randomBytes(16);
    const key1 = deriveKey(passphrase, salt);
    const key2 = deriveKey(passphrase, salt);
    expect(key1).toEqual(key2);
    expect(key1.length).toBe(32); // 256-bit key
  });

  it('should derive different keys for different passphrases', () => {
    const salt = crypto.randomBytes(16);
    const key1 = deriveKey('passphrase-a', salt);
    const key2 = deriveKey('passphrase-b', salt);
    expect(key1).not.toEqual(key2);
  });

  it('should encrypt and decrypt a message correctly', () => {
    const passphrase = 'test-room-key';
    const message = 'Hello, this is a secret message!';
    const encrypted = encryptMessage(message, passphrase);
    const decrypted = decryptMessage(encrypted, passphrase);
    expect(decrypted).toBe(message);
  });

  it('should fail to decrypt with wrong passphrase', () => {
    const passphrase = 'correct-key';
    const message = 'Top secret data';
    const encrypted = encryptMessage(message, passphrase);
    expect(() => decryptMessage(encrypted, 'wrong-key')).toThrow();
  });

  it('should produce different ciphertexts for the same message (random IV/salt)', () => {
    const passphrase = 'same-key';
    const message = 'Deterministic test';
    const enc1 = encryptMessage(message, passphrase);
    const enc2 = encryptMessage(message, passphrase);
    expect(enc1.ciphertext).not.toBe(enc2.ciphertext);
    // But both decrypt to the same message
    expect(decryptMessage(enc1, passphrase)).toBe(message);
    expect(decryptMessage(enc2, passphrase)).toBe(message);
  });
});