
import { prisma } from '../../config/database';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { CreateDeadDropInput } from './dto/deaddrops.dto';

 
export class DeadDropService {
  /**
   * Create a new dead drop
   *
   * Steps:
   * 1. Generate a unique 12-character hex token for the URL
   * 2. Hash the password with bcrypt if provided
   * 3. Calculate the expiry timestamp
   * 4. Store ONLY encrypted data in the database
   * 5. Return the token and expiry time
   *
   * The server NEVER receives plaintext or the AES key.
   */
  async create(data: CreateDeadDropInput) {
    // Generate unique token for the shareable URL
    const token = randomBytes(6).toString('hex');

    // Hash password if protection is enabled
    let passwordHash: string | null = null;
    if (data.hasPassword && data.password) {
      passwordHash = await bcrypt.hash(data.password, 12);
    }

    // Calculate when this drop should auto-expire
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
   * Get dead drop metadata (without ciphertext)
   *
   * This is used by the frontend to check if a drop exists
   * and whether it requires a password, WITHOUT revealing
   * any encrypted content.
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
      return { error: 'Dead drop not found', statusCode: 404 };
    }

    if (drop.isRead) {
      return { error: 'This dead drop has been burned', statusCode: 410 };
    }

    if (drop.expiresAt < new Date()) {
      // Clean up the expired drop from database
      await prisma.deadDrop.delete({ where: { token } });
      return { error: 'This dead drop has expired', statusCode: 410 };
    }

    return {
      hasPassword: drop.hasPassword,
      expiresAt: drop.expiresAt.toISOString(),
      createdAt: drop.createdAt.toISOString(),
    };
  }

  /**
   * Read and IMMEDIATELY destroy a dead drop
   *
   * This is the most critical operation:
   * 1. Verify the password (if required)
   * 2. Extract the encrypted data
   * 3. PERMANENTLY DELETE from database
   * 4. Return encrypted data for client-side decryption
   *
   * After this operation, the dead drop is GONE forever.
   * There is NO undo, NO recovery.
   */
  async readAndDestroy(token: string, password?: string) {
    const drop = await prisma.deadDrop.findUnique({
      where: { token },
    });

    if (!drop) {
      return { error: 'Dead drop not found', statusCode: 404 };
    }

    if (drop.isRead || drop.expiresAt < new Date()) {
      await prisma.deadDrop.delete({ where: { token } });
      return {
        error: 'This dead drop no longer exists',
        statusCode: 410,
      };
    }

    // Verify password if the drop is protected
    if (drop.hasPassword && drop.passwordHash) {
      if (!password) {
        return { error: 'Password required', statusCode: 401 };
      }

      const isValid = await bcrypt.compare(password, drop.passwordHash);
      if (!isValid) {
        return { error: 'Invalid password', statusCode: 403 };
      }
    }

    // Extract encrypted data BEFORE deletion
    const { ciphertext, iv, salt } = drop;

    // PERMANENTLY DELETE from database
    // This happens immediately - no undo possible
    await prisma.deadDrop.delete({ where: { token } });

    return { ciphertext, iv, salt };
  }

  /**
   * Cleanup expired dead drops (called by CRON job)
   *
   * Runs every 5 minutes to remove dead drops that
   * were never read and have passed their expiry time.
   * This prevents stale data from accumulating.
   */
  async cleanupExpired() {
    const result = await prisma.deadDrop.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
        isRead: false,
      },
    });

    return { deleted: result.count };
  }
}

// Export a singleton instance
export const deadDropService = new DeadDropService();