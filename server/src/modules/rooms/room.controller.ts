import { Request, Response } from 'express';
import * as roomService from './room.service';

export async function createRoom(req: Request, res: Response) {
  try {
    // @ts-expect-error — userId set by auth middleware
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { name } = req.body;
    if (!name || name.trim().length < 1) {
      res.status(400).json({ error: 'Room name is required' });
      return;
    }

    const room = await roomService.createRoom({ name: name.trim(), userId });
    res.status(201).json(room);
  } catch (err) {
    console.error('[createRoom]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getRooms(req: Request, res: Response) {
  try {
    // @ts-expect-error — userId set by auth middleware
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const rooms = await roomService.getRoomsForUser(userId);
    res.json(rooms);
  } catch (err) {
    console.error('[getRooms]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function joinRoom(req: Request, res: Response) {
  try {
    // @ts-expect-error — userId set by auth middleware
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const roomId = req.params.roomId as string;
    const member = await roomService.joinRoom(roomId, userId);
    res.json(member);
  } catch (err) {
    console.error('[joinRoom]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function leaveRoom(req: Request, res: Response) {
  try {
    // @ts-expect-error — userId set by auth middleware
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const roomId = req.params.roomId as string;
    await roomService.leaveRoom(roomId, userId);
    res.json({ success: true });
  } catch (err) {
    console.error('[leaveRoom]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}