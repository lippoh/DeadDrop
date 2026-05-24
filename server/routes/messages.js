const express = require("express");
const { createClient } = require("@supabase/supabase-js");
 
const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
 
// GET /api/messages/:roomId — Fetch message history
router.get("/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;
 
    // Verify user is a member of the room
    const { data: membership } = await supabase
      .from("room_members")
      .select("id")
      .eq("room_id", roomId)
      .eq("user_id", userId)
      .single();
 
    if (!membership) {
      return res.status(403).json({ error: "Not a room member" });
    }
 
    // Fetch messages (limited to last 100)
    const { data: messages, error } = await supabase
      .from("messages")
      .select("id, sender_id, content, iv, ephemeral, ttl, created_at")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
      .limit(100);
 
    if (error) throw error;
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
module.exports = router;
