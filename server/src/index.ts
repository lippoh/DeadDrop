import "dotenv/config";

import { createServer } from 'http';
import { Server } from 'socket.io';
import { app } from './app';
import { env } from './config/env';
import { startCleanupJob } from './jobs/cleanup.job';
import { authMiddleware } from './middleware/auth.middleware';
import { prisma } from './lib/prisma';
import jwt from 'jsonwebtoken';
import { setIO } from './lib/socket';

const PORT = env.PORT;

// ─── HTTP + Socket.io ───

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
setIO(io);

// ─── Socket Auth ───

io.use((socket, next) => {
  const token = socket.handshake.auth.token || 
    socket.handshake.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return next(new Error('No token provided'));
  }
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string };
    (socket as any).userId = payload.sub;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

// ─── Socket Events ───

io.on('connection', (socket) => {
  const userId = (socket as any).userId;
  const username = (socket as any).username || 'Anonymous';
  console.log(`[socket] user ${username} (${userId}) connected`);

  socket.on('room:join', async (data: { roomId: string; token: string }) => {
    socket.join(data.roomId);
    socket.to(data.roomId).emit('user:joined', { userId, username: socket.data.username || 'User' });
  });

  socket.on('room:leave', async (data: { roomId: string }) => {
    socket.leave(data.roomId);
    socket.to(data.roomId).emit('user:left', { userId, username: socket.data.username || 'User' });
  });

  socket.on('message:send', async (data: { roomId: string; content: string; encrypted: boolean; iv?: string; selfDestruct?: number | null }) => {
    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      roomId: data.roomId,
      senderId: userId,
      content: data.content,
      encrypted: data.encrypted,
      iv: data.iv,
      selfDestruct: data.selfDestruct,
      createdAt: new Date().toISOString(),
    };
    io.to(data.roomId).emit('message:new', message);

    // Self-destruct timer
    if (data.selfDestruct && data.selfDestruct > 0) {
      setTimeout(() => {
        io.to(data.roomId).emit('message:self-destruct', { messageId: message.id });
      }, data.selfDestruct * 1000);
    }
  });

  socket.on('typing:start', (data: { roomId: string }) => {
    socket.to(data.roomId).emit('typing:start', { userId, username, isTyping: true, roomId: data.roomId });
  });

  socket.on('typing:stop', (data: { roomId: string }) => {
    socket.to(data.roomId).emit('typing:stop', { userId, username, isTyping: false, roomId: data.roomId });
  });

  // ─── Message Read Receipts ───

  socket.on('message:read', async (data: { messageIds: string[] }) => {
    if (!userId) return;

    for (const messageId of data.messageIds) {
      await prisma.messageReadReceipt.upsert({
        where: {
          messageId_userId: { messageId, userId },
        },
        create: {
          messageId,
          userId,
        },
        update: {
          readAt: new Date(),
        },
      });
    }

    // Notify the room that these messages were read
    io.to(socket.rooms.size > 0 ? Array.from(socket.rooms)[1] : '').emit('message:read:confirmed', {
      messageIds: data.messageIds,
      readBy: userId,
    });
  });

  socket.on('disconnect', (reason: string) => {
    // Stop typing indicator in all rooms
    const rooms = Array.from(socket.rooms);
    rooms.forEach((roomId) => {
      socket.to(roomId).emit('typing:stop', { userId, username, isTyping: false });
    });
    console.log(`[socket] user ${username} (${userId}) disconnected: ${reason}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`\n  DeadDrop Server\n`);
  console.log(`  Environment: ${env.NODE_ENV}`);
  console.log(`  Port: ${PORT}`);
  console.log(`  CORS: ${env.CORS_ORIGIN}\n`);

  startCleanupJob();
});