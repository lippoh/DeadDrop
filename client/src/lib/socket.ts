// client/src/lib/socket.ts — Socket.io client wrapper

import { io, Socket } from "socket.io-client";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://deaddrop-qon2.onrender.com";

class SocketClient {
  private socket: Socket | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handlers: Record<string, (...args: any[]) => void> = {};

  connect(token: string) {
    this.socket = io(API_BASE, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on("connect", () => {
      console.log("[socket] connected:", this.socket?.id);
    });

    this.socket.on("connect_error", (err: Error) => {
      console.error("[socket] connect_error:", err.message);
    });

    this.socket.on("disconnect", (reason: string) => {
      console.log("[socket] disconnected:", reason);
    });

    // Re-attach all stored handlers on reconnect
    for (const [event, handler] of Object.entries(this.handlers)) {
      this.socket.on(event, handler);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.handlers = {};
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, handler: (...args: any[]) => void) {
    this.handlers[event] = handler;
    this.socket?.on(event, handler);
  }

  off(event: string) {
    delete this.handlers[event];
    this.socket?.off(event);
  }

  emit(event: string, data?: unknown) {
    this.socket?.emit(event, data);
  }

  get connected(): boolean {
    return this.socket?.connected ?? false;
  }
}

const socketClient = new SocketClient();
export default socketClient;