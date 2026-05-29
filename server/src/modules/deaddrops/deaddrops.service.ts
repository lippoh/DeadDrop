import { prisma } from '../../lib/prisma';
import bcrypt from 'bcrypt';

export async function createDrop(data: {
  ciphertext: string;
  iv: string;
  salt: string;
  password: string | null;
  expiryHours: number;
}) {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + data.expiryHours);

  let passwordHash: string | null = null;
  if (data.password) {
    passwordHash = await bcrypt.hash(data.password, 10);
  }

  return prisma.deadDrop.create({
    data: {
      token: Math.random().toString(36).substring(2, 14),
      ciphertext: data.ciphertext,
      iv: data.iv,
      salt: data.salt,
      hasPassword: !!data.password,
      passwordHash,
      expiryHours: data.expiryHours,
      expiresAt,
    },
  });
}

export async function getDropByToken(token: string) {
  return prisma.deadDrop.findUnique({
    where: { token },
  });
}

// NEW: Get encrypted data WITHOUT marking as read
export async function getDropData(
  token: string,
  password: string | null
): Promise<{
  drop: { ciphertext: string; iv: string; salt: string };
  alreadyRead?: boolean;
  expired?: boolean;
  wrongPassword?: boolean;
} | null> {
  const drop = await prisma.deadDrop.findUnique({
    where: { token },
  });

  if (!drop) return null;
  if (drop.isRead) return { drop, alreadyRead: true };
  if (new Date() > new Date(drop.expiresAt)) return { drop, expired: true };

  if (drop.hasPassword) {
    if (!password) return { drop, wrongPassword: true };
    const valid = await bcrypt.compare(password, drop.passwordHash!);
    if (!valid) return { drop, wrongPassword: true };
  }

  return {
    drop: {
      ciphertext: drop.ciphertext,
      iv: drop.iv,
      salt: drop.salt,
    },
  };
}

// CHANGED: Now only burns, does NOT return data
export async function readDrop(token: string): Promise<boolean> {
  const drop = await prisma.deadDrop.findUnique({
    where: { token },
  });

  if (!drop || drop.isRead) return false;

  await prisma.deadDrop.update({
    where: { id: drop.id },
    data: { isRead: true, readAt: new Date() },
  });

  return true;
}

export async function cleanupExpired() {
  const result = await prisma.deadDrop.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
      isRead: false,
    },
  });

  return { deleted: result.count };
}