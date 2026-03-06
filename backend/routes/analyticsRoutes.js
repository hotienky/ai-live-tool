const express = require("express");
const router = express.Router();
const { DB_ENABLED } = require("../db/connection");

/**
 * GET /api/analytics/daily?shopId=&days=7
 * Thống kê comment/lead theo ngày
 */
router.get("/daily", async (req, res) => {
  try {
    const { shopId, days = 7 } = req.query;

    if (!DB_ENABLED) {
      return res.json({ daily: [], labels: [] });
    }

    const { ChatLog } = require("../db/models");
    const { Sequelize, Op } = require("sequelize");

    if (!ChatLog) return res.json({ daily: [], labels: [] });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const where = { created_at: { [Op.gte]: startDate } };
    if (shopId) where.shop_id = shopId;

    const rows = await ChatLog.findAll({
      attributes: [
        [Sequelize.fn("DATE", Sequelize.col("created_at")), "date"],
        "ai_label",
        [Sequelize.fn("COUNT", Sequelize.col("ChatLog.id")), "count"],
      ],
      where,
      group: [Sequelize.fn("DATE", Sequelize.col("created_at")), "ai_label"],
      raw: true,
      order: [[Sequelize.fn("DATE", Sequelize.col("created_at")), "ASC"]],
    });

    // Group by date
    const dateMap = {};
    for (const r of rows) {
      if (!dateMap[r.date]) dateMap[r.date] = { date: r.date, HOT: 0, WARM: 0, COLD: 0, total: 0 };
      dateMap[r.date][r.ai_label] = parseInt(r.count);
      dateMap[r.date].total += parseInt(r.count);
    }

    const daily = Object.values(dateMap);
    res.json({ daily });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/analytics/hourly?shopId=&date=
 * Phân bố comment theo giờ (peak hours)
 */
router.get("/hourly", async (req, res) => {
  try {
    const { shopId, date } = req.query;

    if (!DB_ENABLED) return res.json({ hourly: [] });

    const { ChatLog } = require("../db/models");
    const { Sequelize, Op } = require("sequelize");
    if (!ChatLog) return res.json({ hourly: [] });

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const where = { created_at: { [Op.between]: [startOfDay, endOfDay] } };
    if (shopId) where.shop_id = shopId;

    const rows = await ChatLog.findAll({
      attributes: [
        [Sequelize.fn("EXTRACT", Sequelize.literal("HOUR FROM created_at")), "hour"],
        "ai_label",
        [Sequelize.fn("COUNT", Sequelize.col("ChatLog.id")), "count"],
      ],
      where,
      group: [Sequelize.fn("EXTRACT", Sequelize.literal("HOUR FROM created_at")), "ai_label"],
      raw: true,
    });

    // Build 24h matrix
    const hourly = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      HOT: 0,
      WARM: 0,
      COLD: 0,
      total: 0,
    }));

    for (const r of rows) {
      const h = parseInt(r.hour);
      hourly[h][r.ai_label] = parseInt(r.count);
      hourly[h].total += parseInt(r.count);
    }

    res.json({ hourly });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/analytics/conversion?shopId=&days=30
 * Tỷ lệ chuyển đổi HOT lead → Closed
 */
router.get("/conversion", async (req, res) => {
  try {
    const { shopId, days = 30 } = req.query;

    if (!DB_ENABLED) return res.json({ funnel: [] });

    const { Lead, ChatLog } = require("../db/models");
    const { Sequelize, Op } = require("sequelize");
    if (!Lead) return res.json({ funnel: [] });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const include = shopId
      ? [{ model: ChatLog, where: { shop_id: shopId }, attributes: [], required: true }]
      : [];

    const statuses = ["New", "Contacting", "Closed", "Ignored"];
    const funnel = [];

    for (const status of statuses) {
      const count = await Lead.count({
        where: { status, created_at: { [Op.gte]: startDate } },
        include,
      });
      funnel.push({ status, count });
    }

    const totalLeads = funnel.reduce((sum, f) => sum + f.count, 0);
    const closedCount = funnel.find((f) => f.status === "Closed")?.count || 0;
    const conversionRate = totalLeads > 0 ? Math.round((closedCount / totalLeads) * 100) : 0;

    res.json({ funnel, totalLeads, closedCount, conversionRate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/analytics/top-keywords?shopId=&days=7&limit=20
 * Top keywords phổ biến nhất trong comments
 */
router.get("/top-keywords", async (req, res) => {
  try {
    const { shopId, days = 7, limit = 20 } = req.query;

    if (!DB_ENABLED) return res.json({ keywords: [] });

    const { ChatLog } = require("../db/models");
    const { Op } = require("sequelize");
    if (!ChatLog) return res.json({ keywords: [] });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const where = { created_at: { [Op.gte]: startDate } };
    if (shopId) where.shop_id = shopId;

    const comments = await ChatLog.findAll({
      attributes: ["comment_text"],
      where,
      raw: true,
      limit: 5000,
    });

    // Vietnamese stop words
    const STOP = new Set([
      "của", "và", "là", "có", "cho", "với", "được", "các", "từ", "trong",
      "này", "đó", "những", "một", "không", "cũng", "như", "thì", "mà",
      "khi", "ở", "đã", "sẽ", "đang", "bị", "vì", "nên", "hay", "hoặc",
      "nhưng", "nếu", "vậy", "rồi", "lại", "còn", "em", "anh", "chị",
      "mình", "ơi", "nhé", "nha", "ạ", "quá", "rất", "lắm", "gì", "nào",
      "đâu", "sao", "bao", "mấy", "tôi", "bạn", "bé", "con", "cái",
      "đi", "về", "ra", "vào", "lên", "xuống", "ok", "ko", "dc", "đc",
      "the", "and", "a", "an", "of", "to", "in", "is", "it", "for",
    ]);

    const freq = {};
    for (const row of comments) {
      if (!row.comment_text) continue;
      const words = row.comment_text
        .toLowerCase()
        .replace(/[.,!?;:()[\]{}"'`~@#$%^&*+=|\\/><]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 3 && !STOP.has(w) && !/^\d+$/.test(w));

      for (const w of words) {
        freq[w] = (freq[w] || 0) + 1;
      }
    }

    const keywords = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, parseInt(limit))
      .map(([word, count]) => ({ word, count }));

    res.json({ keywords });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/analytics/summary?shopId=&days=7
 * Tóm tắt tổng quan
 */
router.get("/summary", async (req, res) => {
  try {
    const { shopId, days = 7 } = req.query;

    if (!DB_ENABLED) {
      return res.json({
        totalComments: 0,
        totalHot: 0,
        totalWarm: 0,
        totalCold: 0,
        hotRate: 0,
        avgCommentsPerDay: 0,
        peakDay: null,
      });
    }

    const { ChatLog } = require("../db/models");
    const { Sequelize, Op } = require("sequelize");
    if (!ChatLog) return res.json({});

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const where = { created_at: { [Op.gte]: startDate } };
    if (shopId) where.shop_id = shopId;

    const stats = await ChatLog.findAll({
      attributes: [
        "ai_label",
        [Sequelize.fn("COUNT", Sequelize.col("ChatLog.id")), "count"],
      ],
      where,
      group: ["ai_label"],
      raw: true,
    });

    const counts = { HOT: 0, WARM: 0, COLD: 0 };
    for (const s of stats) {
      counts[s.ai_label] = parseInt(s.count);
    }

    const totalComments = counts.HOT + counts.WARM + counts.COLD;
    const hotRate = totalComments > 0 ? Math.round((counts.HOT / totalComments) * 100) : 0;
    const avgCommentsPerDay = Math.round(totalComments / parseInt(days));

    // Peak day
    const dailyStats = await ChatLog.findAll({
      attributes: [
        [Sequelize.fn("DATE", Sequelize.col("created_at")), "date"],
        [Sequelize.fn("COUNT", Sequelize.col("ChatLog.id")), "count"],
      ],
      where,
      group: [Sequelize.fn("DATE", Sequelize.col("created_at"))],
      order: [[Sequelize.fn("COUNT", Sequelize.col("ChatLog.id")), "DESC"]],
      limit: 1,
      raw: true,
    });

    res.json({
      totalComments,
      totalHot: counts.HOT,
      totalWarm: counts.WARM,
      totalCold: counts.COLD,
      hotRate,
      avgCommentsPerDay,
      peakDay: dailyStats[0] || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
