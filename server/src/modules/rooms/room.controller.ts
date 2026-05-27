import { Request, Response } from 'express';
import * as roomService from './room.service';
import { getIO } from "../../lib/socket";

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

export async function renameRoom(req: Request, res: Response) {
  try {
    // @ts-expect-error — userId set by auth middleware
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const roomId = req.params.roomId as string;
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ error: 'Room name is required' });
      return;
    }

    if (name.length > 50) {
      res.status(400).json({ error: 'Room name must be 50 characters or less' });
      return;
    }

    const room = await roomService.renameRoom(roomId, userId, name.trim());
    res.json(room);
  } catch (err) {
    console.error('[renameRoom]', err);
    res.status(500).json({ error: 'Failed to rename room' });
  }
}

export async function deleteRoom(req: Request, res: Response) {
  try {
    // @ts-expect-error — userId set by auth middleware
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const roomId = req.params.roomId as string;
    await roomService.deleteRoom(roomId, userId);

    // Notify the room
    try {
      getIO().to(roomId).emit("room:deleted", { roomId });
    } catch {
      // Socket might not be available in test env
    }

    res.json({ message: 'Room deleted successfully' });
  } catch (err: any) {
    console.error('[deleteRoom]', err);
    const status = err.message.includes('not found') ? 404
      : err.message.includes('creator') ? 403
      : 500;
    res.status(status).json({ error: err.message });
  }
}

export async function kickMember(req: Request, res: Response) {
  try {
    // @ts-expect-error — userId set by auth middleware
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const roomId = req.params.roomId as string;
    const targetUserId = req.params.userId as string;
    await roomService.kickMember(roomId, userId, targetUserId);

    // Notify the room via socket
    try {
      getIO().to(roomId).emit("member:kicked", {
        roomId,
        kickedUserId: targetUserId,
      });
    } catch {
      // Socket might not be available in test env
    }

    res.json({ message: 'Member kicked successfully' });
  } catch (err: any) {
    console.error('[kickMember]', err);
    const status = err.message.includes('not found') ? 404
      : err.message.includes('creator') || err.message.includes('yourself') ? 403
      : 500;
    res.status(status).json({ error: err.message });
  }
}

export async function getRoomMembers(req: Request, res: Response) {
  try {
    // @ts-expect-error — userId set by auth middleware
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const roomId = req.params.roomId as string;
    const members = await roomService.getRoomMembers(roomId);
    res.json(members);
  } catch (err) {
    console.error('[getRoomMembers]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}