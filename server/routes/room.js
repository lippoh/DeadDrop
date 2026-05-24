const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { createClient } = require("@supabase/supabase-js");
 
const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
 
// POST /api/rooms — Create a new chat room
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.userId;
    const inviteCode = uuidv4().slice(0, 8).toUpperCase();
 
    const { data: room, error } = await supabase
      .from("rooms")
      .insert({ name, created_by: userId, invite_code: inviteCode })
      .select("id, name, invite_code, created_at")
      .single();
 
    if (error) throw error;
 
    // Auto-add creator as member
    await supabase.from("room_members").insert({
      room_id: room.id,
      user_id: userId,
      role: "admin",
    });
 
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
// GET /api/rooms — List user's rooms
router.get("/", async (req, res) => {
  try {
    const userId = req.user.userId;
 
    const { data, error } = await supabase
      .from("room_members")
      .select(`
        role,
        rooms:room_id (id, name, invite_code, created_at)
      `)
      .eq("user_id", userId);
 
    if (error) throw error;
    const rooms = data.map(m => ({ ...m.rooms, role: m.role }));
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
// POST /api/rooms/join — Join room via invite code
router.post("/join", async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user.userId;
 
    const { data: room } = await supabase
      .from("rooms")
      .select("id")
      .eq("invite_code", inviteCode)
      .single();
 
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
 
    // Check if already a member
    const { data: existing } = await supabase
      .from("room_members")
      .select("id")
      .eq("room_id", room.id)
      .eq("user_id", userId)
      .single();
 
    if (existing) {
      return res.status(409).json({ error: "Already a member" });
    }
 
    await supabase.from("room_members").insert({
      room_id: room.id,
      user_id: userId,
      role: "member",
    });
 
    res.json({ room_id: room.id, message: "Joined successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
// POST /api/rooms/:roomId/leave — Leave a room
router.post("/:roomId/leave", async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;
 
    await supabase
      .from("room_members")
      .delete()
      .eq("room_id", roomId)
      .eq("user_id", userId);
 
    res.json({ message: "Left room" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
module.exports = router;
