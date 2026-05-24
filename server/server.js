require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const roomRoutes = require("./routes/rooms");
const messageRoutes = require("./routes/messages");
const { setupSocket } = require("./socket");
const { verifyToken } = require("./middleware/auth");
 
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN || "*" },
});
 
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());
 
// Public routes
app.use("/api/auth", authRoutes);
 
// Protected routes
app.use("/api/rooms", verifyToken, roomRoutes);
app.use("/api/messages", verifyToken, messageRoutes);
 
// Phase 1 drop routes (unchanged)
// app.use("/api/drops", dropRoutes);
 
// Socket.io setup
setupSocket(io);
 
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
