// server/src/lib/socket.ts
import { Server } from "socket.io";

let io: Server;

export function setIO(socketIO: Server) {
  io = socketIO;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}