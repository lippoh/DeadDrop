import { Request, Response } from 'express';
import * as deadDropService from './deaddrops.service';

export async function createDrop(req: Request, res: Response) {
  try {
    const { ciphertext, iv, salt, password, expiryHours } = req.body;

    if (!ciphertext || !iv || !salt) {
      res.status(400).json({ error: 'Missing encryption data (ciphertext, iv, salt)' });
      return;
    }

    const drop = await deadDropService.createDrop({
      ciphertext,
      iv,
      salt,
      password: password || null,
      expiryHours: expiryHours || 48,
    });

    res.status(201).json({
      token: drop.token,
      expiresAt: drop.expiresAt,
    });
  } catch (err) {
    console.error('[createDrop]', err);
    res.status(500).json({ error: 'Failed to create drop' });
  }
}

export async function getDrop(req: Request, res: Response) {
  try {
    const { token } = req.params;

    const drop = await deadDropService.getDropByToken(token as string);
    if (!drop) {
      res.status(404).json({ error: 'Drop not found' });
      return;
    }

    if (drop.isRead) {
      res.status(410).json({ error: 'This drop has already been read' });
      return;
    }

    if (new Date() > new Date(drop.expiresAt)) {
      res.status(410).json({ error: 'This drop has expired' });
      return;
    }

    res.json({
      hasPassword: drop.hasPassword,
      expiresAt: drop.expiresAt,
      createdAt: drop.createdAt,
    });
  } catch (err) {
    console.error('[getDrop]', err);
    res.status(500).json({ error: 'Failed to fetch drop' });
  }
}

export async function readDrop(req: Request, res: Response) {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const result = await deadDropService.readDrop(token as string, password || null);
    

    if (!result) {
      res.status(404).json({ error: 'Drop not found' });
      
      return;
    }
    

    if (result.alreadyRead) {
      res.status(410).json({ error: 'This drop has already been read' });
      return;
    }

    if (result.expired) {
      res.status(410).json({ error: 'This drop has expired' });
      return;
    }

    if (result.wrongPassword) {
      res.status(403).json({ error: 'Invalid password' });
      return;
    }

    res.json({
      ciphertext: result.drop.ciphertext,
      iv: result.drop.iv,
      salt: result.drop.salt,
    });
  } catch (err) {
    console.error('[readDrop]', err);
    res.status(500).json({ error: 'Failed to read drop' });
  }
}