"use client";

import { Check, CheckCheck } from "lucide-react";

export interface MessageBubbleProps {
  msg: {
    id: string;
    senderId: string;
    createdAt: string;
  };
  isOwn: boolean;
  readBy: Set<string>;
}

export function MessageBubble({ msg, isOwn, readBy }: MessageBubbleProps) {
  const isRead = readBy.has(msg.id);

  return (
    <>
      {isOwn && (
        <div className="flex items-center gap-1 mt-0.5 mr-1">
          {isRead ? (
            <CheckCheck className="h-3 w-3 text-green-500" />
          ) : (
            <Check className="h-3 w-3 text-zinc-500" />
          )}
          <span className="text-[10px] text-zinc-500">
            {isRead ? "Read" : "Sent"}
          </span>
        </div>
      )}
    </>
  );
}