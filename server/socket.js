const jwt = require("jsonwebtoken");
 
function setupSocket(io) {
  // Authentication middleware for Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication required"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });
 
  io.on("connection", (socket) => {
    const { userId, username } = socket.user;
    console.log(`${username} connected (socket: ${socket.id})`);
 
    // Track online users
    socket.join(`user:${userId}`);
    io.emit("user:online", { userId, username });
 
    // ── Join Room ──
    socket.on("room:join", ({ roomId }) => {
      socket.join(`room:${roomId}`);
      socket.to(`room:${roomId}`).emit("room:user_joined", {
        userId,
        username,
      });
      console.log(`${username} joined room ${roomId}`);
    });
 
    // ── Leave Room ──
    socket.on("room:leave", ({ roomId }) => {
      socket.leave(`room:${roomId}`);
      socket.to(`room:${roomId}`).emit("room:user_left", {
        userId,
        username,
      });
    });
 
    // ── Send Message ──
    socket.on("message:send", async ({ roomId, content, iv, ephemeral, ttl }) => {
      const messageData = {
        id: require("uuid").v4(),
        room_id: roomId,
        sender_id: userId,
        sender_name: username,
        content,      // encrypted ciphertext
        iv,           // encryption IV
        ephemeral: ephemeral || false,
        ttl: ttl || null,
        created_at: new Date().toISOString(),
      };
 
      // Broadcast to room (excluding sender)
      socket.to(`room:${roomId}`).emit("message:new", messageData);
      // Also send back to sender for local display
      socket.emit("message:new", messageData);
 
      // Store in Supabase if persistent
      if (!ephemeral) {
        const { createClient } = require("@supabase/supabase-js");
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_KEY
        );
        await supabase.from("messages").insert({
          room_id: roomId,
          sender_id: userId,
          content,
          iv,
          ephemeral: false,
          ttl,
        });
      }
    });
 
    // ── Typing Indicators ──
    socket.on("typing:start", ({ roomId }) => {
      socket.to(`room:${roomId}`).emit("typing:update", {
        userId,
        username,
        isTyping: true,
      });
    });
 
    socket.on("typing:stop", ({ roomId }) => {
      socket.to(`room:${roomId}`).emit("typing:update", {
        userId,
        username,
        isTyping: false,
      });
    });
 
    // ── Disconnect ──
    socket.on("disconnect", () => {
      io.emit("user:offline", { userId, username });
      console.log(`${username} disconnected`);
    });
  });

  // ── Key Exchange ──
  // Store public keys per room
  const roomKeys = new Map(); // roomId -> Map<userId, publicKey>

    socket.on("key:exchange", ({ roomId, publicKey }) => {
    if (!roomKeys.has(roomId)) roomKeys.set(roomId, new Map());
    roomKeys.get(roomId).set(userId, publicKey);
 
    // Broadcast key to all room members
    socket.to(`room:${roomId}`).emit("key:received", {
      roomId,
      userId,
      publicKey,
    });
  });
 
  socket.on("key:request", ({ roomId }) => {
    // Respond with the first available public key (room creator)
    const keys = roomKeys.get(roomId);
    if (keys && keys.size > 0) {
      const [_, creatorKey] = keys.entries().next().value;
      socket.emit("key:response", {
        roomId,
        publicKey: creatorKey,
      });
    }
  });




}
 
module.exports = { setupSocket };
