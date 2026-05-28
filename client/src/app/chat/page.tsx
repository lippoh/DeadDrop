"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Plus, LogOut, Users, Copy, Check, Flame, Loader2,
  MessageSquare, Shield, Eye, EyeOff, X, Settings,
} from "lucide-react";
import socketClient from "@/lib/socket";
import {
  encryptChatMessage,
  decryptChatMessage,
  deriveRoomKey,
} from "@/lib/e2ee";
import { BurnAnimation } from "@/components/chat/BurnAnimation";
import ImageUploadButton from "@/components/chat/ImageUploadButton";
import { extractImageAndCaption } from "@/lib/image-utils";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { RoomSettingsPanel } from "@/components/chat/RoomSettingsPanel";
import { ThemeToggle } from "@/components/ThemeToggle";

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
  creatorId?: string;
  createdAt: string;
}

interface RoomMember {
  userId: string;
  user: { id: string; username: string };
}

// ── Message Content Renderer ──

function MessageContent({ content }: { content: string }) {
  const parsed = extractImageAndCaption(content);

  if (parsed) {
    return (
      <>
        <img
          src={parsed.image}
          alt={parsed.caption || "Shared image"}
          className="max-w-full rounded-lg mb-1 cursor-pointer"
          style={{ maxHeight: 300 }}
          onClick={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.style.maxHeight === "none") {
              target.style.maxHeight = "300px";
            } else {
              target.style.maxHeight = "none";
            }
          }}
        />
        {parsed.caption && (
          <p className="text-sm whitespace-pre-wrap break-words">
            {parsed.caption}
          </p>
        )}
      </>
    );
  }

  return (
    <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
  );
}

// ── Decrypted Message Bubble ──

function DecryptedMessage({
  msg,
  sharedKey,
}: {
  msg: Message;
  sharedKey: CryptoKey | null;
}) {
  const [decrypted, setDecrypted] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!msg.encrypted || !sharedKey || !msg.iv) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDecrypted(msg.content);
      return;
    }

    let cancelled = false;
    decryptChatMessage(sharedKey, msg.content, msg.iv)
      .then((text) => {
        if (!cancelled) setDecrypted(text);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [msg, sharedKey]);

  if (failed) return <p className="text-sm text-red-400 italic">[Failed to decrypt]</p>;
  if (!decrypted) return <p className="text-sm text-zinc-500">Decrypting...</p>;

  return <MessageContent content={decrypted} />;
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
    <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
      {showInput ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Room name..."
            className="flex-1 min-w-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500/50 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
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
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm text-zinc-700 dark:text-zinc-300 transition-colors"
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
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [sharedKey, setSharedKey] = useState<CryptoKey | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [burningMessages, setBurningMessages] = useState<Set<string>>(new Set());

  // Room settings state
  const [showSettings, setShowSettings] = useState(false);
  const [roomMembers, setRoomMembers] = useState<{ id: string; username: string }[]>([]);

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

  async function fetchRoomMembers(roomId: string) {
    try {
      const res = await fetch(`${API_BASE}/api/rooms/${roomId}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: RoomMember[] = await res.json();
        setRoomMembers(data.map((m) => ({ id: m.user.id, username: m.user.username })));
      }
    } catch (err) {
      console.error("Failed to fetch room members:", err);
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

    socketClient.on("message:self-destruct", (data) => {
      const d = data as { messageId: string };
      setBurningMessages((prev) => new Set(prev).add(d.messageId));
    });

    socketClient.on("member:kicked", (data) => {
      const d = data as { roomId: string; kickedUserId: string };

      if (user && d.kickedUserId === user.id) {
        socketClient.emit("room:leave", { roomId: d.roomId });
        setActiveRoom(null);
        setMessages([]);
        setRoomMembers([]);
        setRooms((prev) => prev.filter((r) => r.id !== d.roomId));
      }

      if (d.roomId === activeRoom) {
        fetchRoomMembers(d.roomId);
      }
    });

    socketClient.on("room:deleted", (data) => {
      const d = data as { roomId: string };

      if (d.roomId === activeRoom) {
        socketClient.emit("room:leave", { roomId: d.roomId });
        setActiveRoom(null);
        setMessages([]);
        setRoomMembers([]);
        setShowSettings(false);
      }

      setRooms((prev) => prev.filter((r) => r.id !== d.roomId));
    });
  }

  async function handleJoinRoom(roomId: string) {
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/api/rooms/${roomId}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await res.json();
      }
      fetchRooms(token);
    } catch (err) {
      console.error("Failed to join room:", err);
    }

    socketClient.emit("room:join", { roomId, token });
    setActiveRoom(roomId);
    setMessages([]);
    setShowSettings(false);

    fetchRoomMembers(roomId);

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
    if ((!newMessage.trim() && !pendingImage) || !activeRoom || !token) return;

    let content = newMessage.trim();

    if (pendingImage) {
      content = pendingImage + (content ? "\n" + content : "");
      setPendingImage(null);
    }

    if (!content) return;

    let encrypted = false;
    let iv: string | undefined;
    let finalContent = content;

    if (sharedKey) {
      try {
        const result = await encryptChatMessage(sharedKey, content);
        finalContent = result.ciphertext;
        iv = result.iv;
        encrypted = true;
      } catch (err) {
        console.error("Encryption failed, sending plaintext:", err);
      }
    }

    socketClient.emit("message:send", {
      roomId: activeRoom,
      content: finalContent,
      encrypted,
      iv,
      selfDestruct: null,
      token,
    });

    setNewMessage("");
    socketClient.emit("typing:stop", { roomId: activeRoom, token });
  }

  function handleImageSelected(base64: string, _fileName: string) {
    if (base64) {
      setPendingImage(base64);
    } else {
      setPendingImage(null);
    }
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

  // ── Room Settings Handlers ──

  async function handleRenameRoom(newName: string) {
    if (!activeRoom || !token) return;
    const res = await fetch(`${API_BASE}/api/rooms/${activeRoom}/name`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: newName }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRooms((prev) =>
        prev.map((r) => (r.id === activeRoom ? { ...r, name: updated.name } : r))
      );
    }
  }

  async function handleDeleteRoom() {
    if (!activeRoom || !token) return;
    const res = await fetch(`${API_BASE}/api/rooms/${activeRoom}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      socketClient.emit("room:leave", { roomId: activeRoom });
      setActiveRoom(null);
      setMessages([]);
      setRoomMembers([]);
      setRooms((prev) => prev.filter((r) => r.id !== activeRoom));
      setShowSettings(false);
    }
  }

  async function handleKickMember(userId: string) {
    if (!activeRoom || !token) return;
    const res = await fetch(`${API_BASE}/api/rooms/${activeRoom}/members/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setRoomMembers((prev) => prev.filter((m) => m.id !== userId));
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
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  const activeRoomData = rooms.find((r) => r.id === activeRoom);
  const isCreator = !activeRoomData?.creatorId || activeRoomData?.creatorId === user.id;

  // ── Render ──

  return (
    <div className="fixed inset-0 flex bg-gray-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden">
      {/* ── Sidebar ── */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col md:relative md:z-auto transition-transform duration-300 ${
          showSidebar ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <Shield className="h-5 w-5" style={{ color: '#ef4670' }} />
            <h1 className="font-bold text-lg">DeadDrop</h1>
          </button>
          <button
            onClick={() => setShowSidebar(false)}
            className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 md:hidden"
            aria-label="Collapse sidebar"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          Logged in as{" "}
          <span className="text-zinc-900 dark:text-zinc-100 font-medium">{user.username}</span>
        </span>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

        <CreateRoomButton onCreate={handleCreateRoom} />

        <div className="flex-1 overflow-y-auto p-2">
          {rooms.length === 0 && (
            <p className="text-zinc-400 dark:text-zinc-500 text-sm text-center mt-4">
              No rooms yet
            </p>
          )}
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => handleJoinRoom(room.id)}
              className={`w-full text-left px-3 py-2 rounded-md mb-1 transition-colors ${
                activeRoom === room.id
                  ? "bg-red-500/20 text-red-500 dark:text-red-400"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
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
          <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
              <Users className="h-3 w-3" />
              <span>{onlineUsers.length} online</span>
            </div>
          </div>
        )}
      </aside>

      {/* ── Main chat area ── */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0">
        {activeRoom ? (
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 md:hidden"
                aria-label="Toggle sidebar"
              >
                <MessageSquare className="h-5 w-5" />
              </button>
              <Eye className="h-5 w-5" style={{ color: '#ef4670' }} />
              <h2 className="font-semibold truncate">
                {activeRoomData?.name || "Chat"}
              </h2>
              {sharedKey && (
                <span title="E2E Encrypted">
                  <EyeOff className="h-4 w-4 text-green-500 shrink-0" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyInvite}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs text-zinc-600 dark:text-zinc-400 transition-colors"
                title="Copy invite link"
              >
                {copiedInvite ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Invite
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  if (showSettings) {
                    setShowSettings(false);
                  } else {
                    fetchRoomMembers(activeRoom);
                    setShowSettings(true);
                  }
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs text-zinc-600 dark:text-zinc-400 transition-colors"
                title="Room settings"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 md:hidden"
              aria-label="Toggle sidebar"
            >
              <MessageSquare className="h-5 w-5" />
            </button>
            <span className="text-zinc-400 dark:text-zinc-500">
              Select or create a room to begin
            </span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
          {!activeRoom && (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-500">
              <Flame className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-lg font-medium">Welcome to DeadDrop</p>
              <p className="text-sm">Create or join a room to begin</p>
            </div>
          )}

          <AnimatePresence>
            {messages.map((msg) => {
              const isBurning = burningMessages.has(msg.id);

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`flex ${
                    msg.senderId === user.id ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className="relative">
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        msg.senderId === "system"
                          ? "bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-500 text-xs italic self-center"
                          : msg.senderId === user.id
                          ? "bg-red-500/20 text-red-700 dark:text-red-100"
                          : "bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100"
                      }`}
                    >
                      {msg.senderId === "system" ? (
                        <p className="text-xs italic">{msg.content}</p>
                      ) : (
                        <DecryptedMessage msg={msg} sharedKey={sharedKey} />
                      )}
                      <p className="text-xs opacity-50 mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                        {msg.selfDestruct && (
                          <span className="ml-2 text-orange-400">
                            🔥 {msg.selfDestruct}s
                          </span>
                        )}
                      </p>
                    </div>

                    <BurnAnimation
                      isActive={isBurning}
                      onComplete={() => {
                        setBurningMessages((prev) => {
                          const next = new Set(prev);
                          next.delete(msg.id);
                          return next;
                        });
                        setMessages((prev) =>
                          prev.filter((m) => m.id !== msg.id)
                        );
                      }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        <TypingIndicator
          socket={socketClient}
          currentRoomId={activeRoom || ""}
          currentUsername={user?.username || ""}
        />

        {activeRoom && (
          <form
            onSubmit={handleSendMessage}
            className="flex flex-col gap-2 p-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0"
          >
            {pendingImage && (
              <div className="relative inline-block self-start">
                <img
                  src={pendingImage}
                  alt="Pending image"
                  className="max-h-32 rounded-lg border border-zinc-300 dark:border-zinc-700"
                />
                <button
                  type="button"
                  onClick={() => setPendingImage(null)}
                  className="absolute -top-2 -right-2 p-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-red-400 transition-colors"
                  aria-label="Remove image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <ImageUploadButton onImageSelected={handleImageSelected} />
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                placeholder={
                  sharedKey
                    ? "Send encrypted message..."
                    : "Send message..."
                }
                className="flex-1 min-w-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500/50 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() && !pendingImage}
                className="p-2 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                aria-label="Send message"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </form>
        )}

        {/* ── Room Settings Slide-out ── */}
        {showSettings && activeRoom && activeRoomData && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => setShowSettings(false)}
            />
            <div className="fixed top-0 right-0 bottom-0 z-50 flex items-start justify-end p-4">
              <div className="mt-16">
                <RoomSettingsPanel
                  room={{
                    id: activeRoomData.id,
                    name: activeRoomData.name,
                    creatorId: activeRoomData.creatorId || user.id,
                  }}
                  members={roomMembers}
                  currentUserId={user.id}
                  isCreator={isCreator}
                  onRename={handleRenameRoom}
                  onDelete={handleDeleteRoom}
                  onKick={handleKickMember}
                  onClose={() => setShowSettings(false)}
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}