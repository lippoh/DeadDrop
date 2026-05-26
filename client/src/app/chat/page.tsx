"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Plus, LogOut, Users, Copy, Check, Flame, Loader2,
  MessageSquare, Shield, Eye, EyeOff,
} from "lucide-react";
import socketClient from "@/lib/socket";
import {
  encryptChatMessage,
  decryptChatMessage,
  deriveRoomKey,
} from "@/lib/e2ee";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// ── Types ──

interface User {
  id: string;
  username: string;
}

interface Message {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  encrypted: boolean;
  iv?: string;
  selfDestruct?: number | null;
  createdAt: string;
}

interface Room {
  id: string;
  name: string;
  createdAt: string;
}

// ── Decrypted Text Component ──

function DecryptedText({
  msg,
  sharedKey,
}: {
  msg: Message;
  sharedKey: CryptoKey | null;
}) {
  const [text, setText] = useState(msg.content);

  useEffect(() => {
    if (!msg.encrypted || !sharedKey || !msg.iv) {
      return;
    }
    let cancelled = false;
    decryptChatMessage(sharedKey, msg.content, msg.iv)
      .then((decrypted) => {
        if (!cancelled) setText(decrypted);
      })
      .catch(() => {
        if (!cancelled) setText("[Failed to decrypt]");
      });
    return () => {
      cancelled = true;
    };
  }, [msg, sharedKey]);

  // Show original content if not encrypted, otherwise decrypted text
  const displayText = (!msg.encrypted || !sharedKey || !msg.iv) 
    ? msg.content 
    : text;

  return <>{displayText}</>;
}

// ── Create Room Sub-component ──

function CreateRoomButton({
  onCreate,
}: {
  onCreate: (name: string) => void;
}) {
  const [showInput, setShowInput] = useState(false);
  const [roomName, setRoomName] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (roomName.trim()) {
      onCreate(roomName.trim());
      setRoomName("");
      setShowInput(false);
    }
  }

  return (
    <div className="p-3 border-b border-zinc-800">
      {showInput ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Room name..."
            className="flex-1 min-w-0 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-red-500/50 placeholder:text-zinc-600"
            autoFocus
          />
          <button
            type="submit"
            className="p-1.5 rounded-lg bg-red-500 hover:bg-red-600 transition-colors shrink-0"
            aria-label="Create room"
          >
            <Check className="h-4 w-4" />
          </button>
        </form>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-300 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Room
        </button>
      )}
    </div>
  );
}

// ── Page Component ──

export default function ChatPage() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [user] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("deaddrop_user");
    return raw ? JSON.parse(raw) : null;
  });

  const [token] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("deaddrop_token") || "";
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [sharedKey, setSharedKey] = useState<CryptoKey | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);  // ← false by default on mobile
  const [copiedInvite, setCopiedInvite] = useState(false);

  // ── Handlers ──

  async function fetchRooms(tkn: string) {
    try {
      const res = await fetch(`${API_BASE}/api/rooms`, {
        headers: { Authorization: `Bearer ${tkn}` },
      });
      if (res.ok) {
        const data: Room[] = await res.json();
        setRooms(data);
      }
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    }
  }

  function setupSocketListeners() {
    socketClient.on("message:new", (msg) => {
      setMessages((prev) => [...prev, msg as Message]);
    });

    socketClient.on("user:joined", (data) => {
      const d = data as { userId: string; username: string };
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          roomId: activeRoom || "",
          senderId: "system",
          content: `${d.username} joined the room`,
          encrypted: false,
          createdAt: new Date().toISOString(),
        },
      ]);
    });

    socketClient.on("user:left", (data) => {
      const d = data as { userId: string; username: string };
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          roomId: activeRoom || "",
          senderId: "system",
          content: `${d.username} left the room`,
          encrypted: false,
          createdAt: new Date().toISOString(),
        },
      ]);
    });

    socketClient.on("user:online", (data) => {
      const d = data as { userIds: string[] };
      setOnlineUsers(d.userIds);
    });

    socketClient.on("typing:start", (data) => {
      const d = data as { userId: string; isTyping: boolean };
      if (d.isTyping) {
        setTypingUsers((prev) =>
          prev.includes(d.userId) ? prev : [...prev, d.userId]
        );
      } else {
        setTypingUsers((prev) => prev.filter((id) => id !== d.userId));
      }
    });

    socketClient.on("message:self-destruct", (data) => {
      const d = data as { messageId: string };
      setMessages((prev) => prev.filter((m) => m.id !== d.messageId));
    });
  }

async function handleJoinRoom(roomId: string) {
  if (!token) return;

  // 1. Join via backend API (adds to members + returns room info)
  try {
    const res = await fetch(`${API_BASE}/api/rooms/${roomId}/join`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const member = await res.json();
      // If we got room info back, add to sidebar
      // Otherwise fetch all rooms
    }
    // Refresh room list to show joined room
    fetchRooms(token);
  } catch (err) {
    console.error("Failed to join room:", err);
  }

  // 2. Join socket room
  socketClient.emit("room:join", { roomId, token });
  setActiveRoom(roomId);
  setMessages([]);

  // 3. Derive shared key
  if (user) {
    try {
      const key = await deriveRoomKey(roomId, user.id);
      setSharedKey(key);
    } catch (err) {
      console.error("Failed to derive room key:", err);
      setSharedKey(null);
    }
  }
}

  async function handleCreateRoom(roomName: string) {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: roomName }),
      });
      if (res.ok) {
        const room: Room = await res.json();
        setRooms((prev) => [...prev, room]);
        handleJoinRoom(room.id);
      }
    } catch (err) {
      console.error("Failed to create room:", err);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoom || !token) return;

    let content = newMessage;
    let encrypted = false;
    let iv: string | undefined;

    if (sharedKey) {
      try {
        const result = await encryptChatMessage(sharedKey, newMessage);
        content = result.ciphertext;
        iv = result.iv;
        encrypted = true;
      } catch (err) {
        console.error("Encryption failed, sending plaintext:", err);
      }
    }

    socketClient.emit("message:send", {
      roomId: activeRoom,
      content,
      encrypted,
      iv,
      selfDestruct: null,
      token,
    });

    setNewMessage("");
    socketClient.emit("typing:stop", { roomId: activeRoom, token });
  }

  function handleTyping() {
    if (!activeRoom || !token) return;
    socketClient.emit("typing:start", { roomId: activeRoom, token });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketClient.emit("typing:stop", { roomId: activeRoom, token });
    }, 2000);
  }

  function handleLogout() {
    localStorage.removeItem("deaddrop_token");
    localStorage.removeItem("deaddrop_user");
    socketClient.disconnect();
    router.replace("/login");
  }

  async function handleCopyInvite() {
    if (!activeRoom) return;
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/chat?join=${activeRoom}`
      );
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    } catch {
      console.error("Failed to copy invite link");
    }
  }

 // ── Init effect ──

  useEffect(() => {
    if (!token || !user) {
      router.replace("/login");
      return;
    }

    socketClient.connect(token);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRooms(token);
    setupSocketListeners();

    return () => {
      socketClient.disconnect();
    };
  }, []);

  // ── Handle ?join=roomId URL param ──

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinRoomId = params.get("join");
    if (joinRoomId && token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleJoinRoom(joinRoomId);
      window.history.replaceState({}, "", "/chat");
    }
  }, []);

  // ── Auto-scroll ──

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Redirect guard ──

  if (!user || !token) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  // ── Render ──

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      {/* ── Sidebar ── */}
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 md:hidden"
        onClick={() => setShowSidebar(false)}
      />
      <aside
      className={`fixed inset-y-0 left-0 z-50 w-72 bg-zinc-950 border-r border-zinc-800 flex flex-col md:relative md:z-auto transition-transform duration-300 ${
        showSidebar ? "translate-x-0" : "-translate-x-full"
      }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <Shield className="h-5 w-5 text-red-500" />
            <h1 className="font-bold text-lg">DeadDrop</h1>
          </button>
          <button
            onClick={() => setShowSidebar(false)}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400"
            aria-label="Collapse sidebar"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">
              Logged in as{" "}
              <span className="text-zinc-100 font-medium">{user.username}</span>
            </span>
            <button
              onClick={handleLogout}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        <CreateRoomButton onCreate={handleCreateRoom} />

        <div className="flex-1 overflow-y-auto p-2">
          {rooms.length === 0 && (
            <p className="text-zinc-500 text-sm text-center mt-4">
              No rooms yet
            </p>
          )}
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => handleJoinRoom(room.id)}
              className={`w-full text-left px-3 py-2 rounded-md mb-1 transition-colors ${
                activeRoom === room.id
                  ? "bg-red-500/20 text-red-400"
                  : "hover:bg-zinc-800 text-zinc-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 shrink-0" />
                <span className="text-sm truncate">{room.name}</span>
              </div>
            </button>
          ))}
        </div>

        {onlineUsers.length > 0 && (
          <div className="p-3 border-t border-zinc-800">
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <Users className="h-3 w-3" />
              <span>{onlineUsers.length} online</span>
            </div>
          </div>
        )}
      </aside>

      {/* ── Main chat area ── */}
      <main className="flex-1 flex flex-col min-w-0">
            {activeRoom ? (
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          {/* Hamburger for mobile */}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 md:hidden"
            aria-label="Toggle sidebar"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
          <Eye className="h-5 w-5 text-red-500" />
          <h2 className="font-semibold truncate">
            {rooms.find((r) => r.id === activeRoom)?.name || "Chat"}
          </h2>
          {sharedKey && (
            <span title="E2E Encrypted">
              <EyeOff className="h-4 w-4 text-green-500 shrink-0" />
            </span>
          )}
        </div>
        {/* ... Invite button stays ... */}
      </div>
    ) : (
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="p-1 rounded hover:bg-zinc-800 text-zinc-400 md:hidden"
          aria-label="Toggle sidebar"
        >
          <MessageSquare className="h-5 w-5" />
        </button>
        <span className="text-zinc-500">
          Select or create a room to begin
        </span>
      </div>
    )}

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!activeRoom && (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500">
              <Flame className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-lg font-medium">Welcome to DeadDrop</p>
              <p className="text-sm">Create or join a room to begin</p>
            </div>
          )}

          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`flex ${
                  msg.senderId === user.id ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    msg.senderId === "system"
                      ? "bg-zinc-800/50 text-zinc-500 text-xs italic self-center"
                      : msg.senderId === user.id
                      ? "bg-red-500/20 text-red-100"
                      : "bg-zinc-800 text-zinc-100"
                  }`}
                >
                  <p className="text-sm wrap-break-word whitespace-pre-wrap">
                    <DecryptedText msg={msg} sharedKey={sharedKey} />
                  </p>
                  <p className="text-xs opacity-50 mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {typingUsers.length > 0 && activeRoom && (
          <div className="px-4 py-1 text-xs text-zinc-500 animate-pulse shrink-0">
            Someone is typing...
          </div>
        )}

        {activeRoom && (
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2 p-4 border-t border-zinc-800 shrink-0"
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder={
                sharedKey ? "Send encrypted message..." : "Send message..."
              }
              className="flex-1 min-w-0 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-red-500/50 placeholder:text-zinc-600"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="p-2 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        )}
      </main>
    </div>
  );
}