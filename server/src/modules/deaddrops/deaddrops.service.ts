// server/src/modules/deaddrops/deaddrops.service.ts

import { prisma } from '../../config/database';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

 

export class DeadDropService {
  /**
   * Create a new dead drop
   */
  async create(data: {
    ciphertext: string;
    iv: string;
    salt: string;
    hasPassword: boolean;
    password?: string;
    expiryHours: number;
  }) {
    // Generate unique token for URL
    const token = randomBytes(6).toString('hex'); // 12-char hex string

    // Hash password if provided
    let passwordHash = null;
    if (data.hasPassword && data.password) {
      passwordHash = await bcrypt.hash(data.password, 12);
    }

    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + data.expiryHours);
 
    // Store in database (only encrypted data!)
    const deadDrop = await prisma.deadDrop.create({
      data: {
        token,
        ciphertext: data.ciphertext,
        iv: data.iv,
        salt: data.salt,
        hasPassword: data.hasPassword,
        passwordHash,
        expiryHours: data.expiryHours,
        expiresAt,
      },
    });

    return {
      token: deadDrop.token,
      expiresAt: deadDrop.expiresAt.toISOString(),
    };
  }

 
  /**
   * Get dead drop metadata (no ciphertext)
   */
  async getByToken(token: string) {
    const drop = await prisma.deadDrop.findUnique({
      where: { token },
      select: {
        hasPassword: true,
        expiresAt: true,
        isRead: true,
        createdAt: true,
      },
    });

    if (!drop) {
      return { error: 'Dead drop not found', status: 404 };
    }

    if (drop.isRead) {
      return { error: 'This dead drop has been burned', status: 410 };
    }

    if (drop.expiresAt < new Date()) {
      // Clean up expired drop
      await prisma.deadDrop.delete({ where: { token } });
      return { error: 'This dead drop has expired', status: 410 };
    }

    return drop;
  }

 

  /**
   * Read and immediately destroy the dead drop
   */
  async readAndDestroy(token: string, password?: string) {
    const drop = await prisma.deadDrop.findUnique({
      where: { token },
    });

    if (!drop) {
      return { error: 'Dead drop not found', status: 404 };
    }
    if (drop.isRead || drop.expiresAt < new Date()) {
      await prisma.deadDrop.delete({ where: { token } });
      return { error: 'This dead drop no longer exists', status: 410 };
    }

    // Verify password if required
    if (drop.hasPassword && drop.passwordHash) {
      if (!password) {
        return { error: 'Password required', status: 401 };
      }
      const valid = await bcrypt.compare(password, drop.passwordHash);
      if (!valid) {
        return { error: 'Invalid password', status: 403 };
      }
    }


    // Extract encrypted data
    const { ciphertext, iv, salt } = drop;

    // PERMANENTLY DELETE from database
    await prisma.deadDrop.delete({ where: { token } });

    return { ciphertext, iv, salt };
  }

 
  /**
   * Cleanup expired dead drops (called by CRON job)
   */
  async cleanupExpired() {
    const result = await prisma.deadDrop.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
        isRead: false, // Only unread expired drops
      },
    });
    return { deleted: result.count };
  }
}