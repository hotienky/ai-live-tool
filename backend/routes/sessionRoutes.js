const express = require("express");
const router = express.Router();

/**
 * Session History Routes
 * Quản lý lịch sử các phiên live
 */

function getSessionModel() {
  try {
    const { LivestreamSession, DB_ENABLED } = require("../db/models");
    const { DB_ENABLED: dbFlag } = require("../db/connection");
    if (dbFlag && LivestreamSession) return LivestreamSession;
  } catch (e) {}
  return null;
}

function getShopModel() {
  try {
    const { Shop, DB_ENABLED } = require("../db/models");
    const { DB_ENABLED: dbFlag } = require("../db/connection");
    if (dbFlag && Shop) return Shop;
  } catch (e) {}
  return null;
}

// In-memory fallback
let inMemorySessions = [];

// ──── GET /api/sessions ─────────────────────────────────
// Lấy danh sách tất cả sessions (hoặc filter theo shopId)
router.get("/", async (req, res) => {
  try {
    const { shopId, status, limit = 50 } = req.query;
    const Session = getSessionModel();

    if (Session) {
      const where = {};
      if (shopId) where.shop_id = shopId;
      if (status) where.status = status;

      const sessions = await Session.findAll({
        where,
        order: [["started_at", "DESC"]],
        limit: parseInt(limit),
      });
      return res.json(sessions);
    }

    // In-memory fallback
    let results = [...inMemorySessions];
    if (shopId) results = results.filter((s) => s.shop_id === shopId);
    if (status) results = results.filter((s) => s.status === status);
    results.sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
    res.json(results.slice(0, parseInt(limit)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──── GET /api/sessions/:id ─────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const Session = getSessionModel();
    if (Session) {
      const session = await Session.findByPk(req.params.id);
      if (!session) return res.status(404).json({ error: "Session không tồn tại" });
      return res.json(session);
    }

    const session = inMemorySessions.find((s) => s.id === req.params.id);
    if (!session) return res.status(404).json({ error: "Session không tồn tại" });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──── GET /api/sessions/:id/comments ────────────────────
// Lấy tất cả comments của 1 session
router.get("/:id/comments", async (req, res) => {
  try {
    const { ChatLog } = require("../db/models");
    const { DB_ENABLED } = require("../db/connection");

    if (DB_ENABLED && ChatLog) {
      const comments = await ChatLog.findAll({
        where: { session_id: req.params.id },
        order: [["created_at", "ASC"]],
      });
      return res.json(comments);
    }

    res.json([]); // No DB fallback for comments
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──── DELETE /api/sessions/:id ──────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const Session = getSessionModel();
    if (Session) {
      const session = await Session.findByPk(req.params.id);
      if (!session) return res.status(404).json({ error: "Session không tồn tại" });
      await session.destroy();
      return res.json({ success: true });
    }

    inMemorySessions = inMemorySessions.filter((s) => s.id !== req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──── Helper: Tạo session mới (gọi từ connectionManager) ──
async function createSession(data) {
  const Session = getSessionModel();
  if (Session) {
    return await Session.create(data);
  }
  // In-memory
  const session = {
    id: `session-${Date.now()}`,
    ...data,
    started_at: data.started_at || new Date().toISOString(),
  };
  inMemorySessions.push(session);
  return session;
}

// ──── Helper: Kết thúc session ──────────────────────────
async function endSession(sessionId, stats) {
  const Session = getSessionModel();
  if (Session) {
    const session = await Session.findByPk(sessionId);
    if (session) {
      const startedAt = new Date(session.started_at);
      const now = new Date();
      const durationMinutes = Math.round((now - startedAt) / 60000);

      await session.update({
        status: "Ended",
        ended_at: now,
        total_comments: stats.total || 0,
        hot_count: stats.hot || 0,
        warm_count: stats.warm || 0,
        cold_count: stats.cold || 0,
        peak_viewers: stats.peakViewers || 0,
        duration_minutes: durationMinutes,
      });
      return session;
    }
  }

  // In-memory
  const idx = inMemorySessions.findIndex((s) => s.id === sessionId);
  if (idx !== -1) {
    const startedAt = new Date(inMemorySessions[idx].started_at);
    const now = new Date();
    inMemorySessions[idx] = {
      ...inMemorySessions[idx],
      status: "Ended",
      ended_at: now.toISOString(),
      total_comments: stats.total || 0,
      hot_count: stats.hot || 0,
      warm_count: stats.warm || 0,
      cold_count: stats.cold || 0,
      peak_viewers: stats.peakViewers || 0,
      duration_minutes: Math.round((now - startedAt) / 60000),
    };
    return inMemorySessions[idx];
  }
  return null;
}

module.exports = router;
module.exports.createSession = createSession;
module.exports.endSession = endSession;
