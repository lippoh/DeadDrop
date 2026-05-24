const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");
 
const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
 
// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }
    if (username.length < 3 || password.length < 6) {
      return res.status(400).json({
        error: "Username min 3 chars, password min 6 chars",
      });
    }
 
    // Check if user exists
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .single();
    if (existing) {
      return res.status(409).json({ error: "Username already taken" });
    }
 
    const hashedPassword = await bcrypt.hash(password, 12);
    const { data: user, error } = await supabase
      .from("users")
      .insert({ username, password: hashedPassword })
      .select("id, username, created_at")
      .single();
 
    if (error) throw error;
 
    const token = jwt.sign(
      { userId: user.id, username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
 
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }
 
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .single();
 
    if (error || !user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
 
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
 
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
 
    res.json({
      user: { id: user.id, username: user.username },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
module.exports = router;
