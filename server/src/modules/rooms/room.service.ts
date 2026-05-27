import { prisma } from '../../lib/prisma';

export async function createRoom(data: { name: string; userId: string }) {
  return prisma.room.create({
    data: {
      name: data.name,
      creatorId: data.userId,
      members: {
        create: { userId: data.userId },
      },
    },
  });
}

export async function getRoomsForUser(userId: string) {
  return prisma.room.findMany({
    where: {
      members: { some: { userId } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getRoomById(roomId: string) {
  return prisma.room.findUnique({
    where: { id: roomId },
    include: { members: true },
  });
}

export async function joinRoom(roomId: string, userId: string) {
  return prisma.roomMember.upsert({
    where: { roomId_userId: { roomId, userId } },
    create: { roomId, userId },
    update: {},
  });
}

export async function leaveRoom(roomId: string, userId: string) {
  await prisma.roomMember.deleteMany({
    where: { roomId, userId },
  });

  // Delete room if no members left
  const memberCount = await prisma.roomMember.count({
    where: { roomId },
  });
  if (memberCount === 0) {
    await prisma.room.delete({ where: { id: roomId } });
  }
}

export async function renameRoom(roomId: string, userId: string, name: string) {
  // Verify the user is a member of the room
  const membership = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });

  if (!membership) {
    throw new Error('Not a member of this room');
  }

  return prisma.room.update({
    where: { id: roomId },
    data: { name },
  });
}

export async function deleteRoom(roomId: string, userId: string) {
  const room = await prisma.room.findUnique({ where: { id: roomId } });

  if (!room) {
    throw new Error('Room not found');
  }

  if (room.creatorId !== userId) {
    throw new Error('Only the room creator can delete it');
  }

  await prisma.room.delete({ where: { id: roomId } });
}

export async function kickMember(roomId: string, requesterId: string, targetUserId: string) {
  const room = await prisma.room.findUnique({ where: { id: roomId } });

  if (!room) {
    throw new Error('Room not found');
  }

  if (room.creatorId !== requesterId) {
    throw new Error('Only the room creator can kick members');
  }

  if (targetUserId === requesterId) {
    throw new Error('You cannot kick yourself');
  }

  await prisma.roomMember.delete({
    where: { roomId_userId: { roomId, userId: targetUserId } },
  });
}

export async function getRoomMembers(roomId: string) {
  return prisma.roomMember.findMany({
    where: { roomId },
    include: { user: { select: { id: true, username: true } } },
  });
}