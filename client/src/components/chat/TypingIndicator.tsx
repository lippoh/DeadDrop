"use client";

import { useState, useEffect } from "react";

interface TypingEvent {
  username: string;
  roomId: string;
}

interface TypingUser {
  username: string;
  timeout: ReturnType<typeof setTimeout>;
}

interface TypingIndicatorProps {
  socket: {
    on: (event: string, handler: (data: unknown) => void) => void;
    off: (event: string, handler: (data: unknown) => void) => void;
  };
  currentRoomId: string;
  currentUsername: string;
}

export function TypingIndicator({ socket, currentRoomId, currentUsername }: TypingIndicatorProps) {
  const [typingNames, setTypingNames] = useState<string[]>([]);

  useEffect(() => {
    if (!socket) return;

    const typingUsers = new Map<string, TypingUser>();

    const handleTypingStart = (data: unknown) => {
      const d = data as TypingEvent;
      if (d.roomId !== currentRoomId) return;
      if (d.username === currentUsername) return;

      const existing = typingUsers.get(d.username);
      if (existing) clearTimeout(existing.timeout);

      const timeout = setTimeout(() => {
        typingUsers.delete(d.username);
        setTypingNames(Array.from(typingUsers.keys()));
      }, 3000);

      typingUsers.set(d.username, { username: d.username, timeout });
      setTypingNames(Array.from(typingUsers.keys()));
    };

    const handleTypingStop = (data: unknown) => {
      const d = data as TypingEvent;
      if (d.roomId !== currentRoomId) return;
      const user = typingUsers.get(d.username);
      if (user) {
        clearTimeout(user.timeout);
        typingUsers.delete(d.username);
        setTypingNames(Array.from(typingUsers.keys()));
      }
    };

    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);

    return () => {
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      typingUsers.forEach((u) => clearTimeout(u.timeout));
      typingUsers.clear();
      setTypingNames([]);
    };
  }, [socket, currentRoomId, currentUsername]);

  const getDisplayText = (): string | null => {
    if (typingNames.length === 0) return null;
    if (typingNames.length === 1) return `${typingNames[0]} is typing...`;
    if (typingNames.length === 2) return `${typingNames[0]} and ${typingNames[1]} are typing...`;
    return `${typingNames[0]} and ${typingNames.length - 1} others are typing...`;
  };

  const text = getDisplayText();
  if (!text) return null;

  return (
    <div className="px-4 py-2">
      <p className="text-xs text-zinc-500 italic animate-pulse">
        {text}
      </p>
    </div>
  );
}