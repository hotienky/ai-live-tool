const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const { DB_ENABLED } = require("../db/connection");
const { generateToken } = require("../middleware/authMiddleware");

// In-memory user store (fallback when DB disabled)
const memoryUsers = [];

function getUserModel() {
  if (!DB_ENABLED) return null;
  try {
    const { User } = require("../db/models");
    return User;
  } catch {
    return null;
  }
}

/**
 * POST /api/auth/register
 * Đăng ký tài khoản mới
 */
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email và mật khẩu là bắt buộc" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Mật khẩu tối thiểu 6 ký tự" });
    }

    const UserModel = getUserModel();
    const password_hash = await bcrypt.hash(password, 10);

    if (UserModel) {
      // Check existing
      const existing = await UserModel.findOne({ where: { email } });
      if (existing) {
        return res.status(409).json({ error: "Email đã được đăng ký" });
      }

      const user = await UserModel.create({
        email,
        password_hash,
        name: name || email.split("@")[0],
        role: "user",
      });

      const token = generateToken(user);
      return res.json({
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      });
    }

    // In-memory fallback
    if (memoryUsers.find((u) => u.email === email)) {
      return res.status(409).json({ error: "Email đã được đăng ký" });
    }

    const user = {
      id: `user_${Date.now()}`,
      email,
      password_hash,
      name: name || email.split("@")[0],
      role: "user",
      created_at: new Date().toISOString(),
    };
    memoryUsers.push(user);
    const token = generateToken(user);
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/auth/login
 * Đăng nhập
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email và mật khẩu là bắt buộc" });
    }

    const UserModel = getUserModel();
    let user;

    if (UserModel) {
      user = await UserModel.findOne({ where: { email } });
    } else {
      user = memoryUsers.find((u) => u.email === email);
    }

    if (!user) {
      return res.status(401).json({ error: "Sai email hoặc mật khẩu" });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: "Sai email hoặc mật khẩu" });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/auth/me
 * Thông tin user hiện tại (requires auth)
 */
router.get("/me", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Chưa đăng nhập" });
    }

    const UserModel = getUserModel();
    if (UserModel) {
      const user = await UserModel.findByPk(req.user.id, {
        attributes: ["id", "email", "name", "role", "created_at"],
      });
      if (!user) return res.status(404).json({ error: "User không tồn tại" });
      return res.json(user);
    }

    // In-memory
    const user = memoryUsers.find((u) => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: "User không tồn tại" });
    const { password_hash, ...safe } = user;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
