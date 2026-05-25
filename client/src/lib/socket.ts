import { io, Socket } from 'socket.io-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://deaddrop-qon2.onrender.com";

class SocketClient {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(API_BASE, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('[socket] connected:', this.socket?.id);
    });

    this.socket.on('connect_error', (err: Error) => {
      console.error('[socket] connect_error:', err.message);
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('[socket] disconnected:', reason);
    });
  }

  emit(event: string, data: unknown) {
    this.socket?.emit(event, data);
  }

  on(event: string, callback: (...args: unknown[]) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: unknown[]) => void) {
    this.socket?.off(event, callback);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export default new SocketClient();