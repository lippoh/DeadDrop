import { prisma } from '../../lib/prisma';

export async function createRoom(data: { name: string; userId: string }) {
  return prisma.room.create({
    data: {
      name: data.name,
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