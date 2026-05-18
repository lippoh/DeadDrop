
import { Request, Response, NextFunction } from 'express';
import { deadDropService } from './deaddrops.service';
import {
  createDeadDropSchema,
  readDeadDropSchema,
} from './dto/deaddrops.dto';

/**
 * POST /api/drops
 * Create a new dead drop
 *
 * The encryption happens CLIENT-SIDE before this request.
 * The server receives only ciphertext, iv, and salt.
 * It never sees the plaintext message or the AES key.
 */
export async function createDeadDrop(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Validate request body with Zod
    const parsed = createDeadDropSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await deadDropService.create(parsed.data);

    res.status(201).json({
      token: result.token,
      expiresAt: result.expiresAt,
      url: `${process.env.CORS_ORIGIN || ''}/d/${result.token}`,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/drops/:token
 * Check if a dead drop exists
 *
 * Returns ONLY metadata (hasPassword, expiresAt, isRead).
 * Does NOT return the ciphertext - the message stays secret.
 */
export async function getDeadDrop(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = Array.isArray(req.params.token)
      ? req.params.token[0]
      : req.params.token;

    if (!token) {
      res.status(400).json({ error: 'Invalid token' });
      return;
    }

    const result = await deadDropService.getByToken(token);

    if (result.error) {
      res.status(result.statusCode).json({ error: result.error });
      return;
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
}


/**
 * POST /api/drops/:token/read
 * Read and destroy a dead drop
 *
 * This is the CRITICAL endpoint:
 * 1. Verifies password (if required)
 * 2. Returns encrypted data for client-side decryption
 * 3. IMMEDIATELY and PERMANENTLY deletes the dead drop
 *
 * After this, the message is GONE. Forever. No recovery.
 */
export async function readDeadDrop(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = Array.isArray(req.params.token)
      ? req.params.token[0]
      : req.params.token;

    if (!token) {
      res.status(400).json({ error: 'Invalid token' });
      return;
    }

    // Validate request body
    const parsed = readDeadDropSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await deadDropService.readAndDestroy(
      token,
      parsed.data.password
    );

    if (result.error) {
      res.status(result.statusCode).json({ error: result.error });
      return;
    }

    // Return encrypted data for CLIENT-SIDE decryption
    res.json({
      ciphertext: result.ciphertext,
      iv: result.iv,
      salt: result.salt,
    });
  } catch (error) {
    next(error);
  }
}
