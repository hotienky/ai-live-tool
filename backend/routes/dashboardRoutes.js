const express = require("express");
const router = express.Router();
const { DB_ENABLED } = require("../db/connection");
const connectionManager = require("../connectionManager");

/**
 * GET /api/dashboard/overview
 * Tổng quan toàn bộ hệ thống: shops live, leads, stats
 */
router.get("/overview", async (req, res) => {
  try {
    // Active connections
    const activeConnections = [];
    for (const [shopId, conn] of connectionManager.connections) {
      activeConnections.push({
        shopId,
        shopName: conn.shopName,
        platform: conn.platform || "tiktok",
        status: conn.status,
        stats: { ...conn.stats },
        peakViewers: conn.peakViewers || 0,
      });
    }

    // DB stats
    let dbStats = { totalShops: 0, totalSessions: 0, totalLeads: 0, todayLeads: 0 };

    if (DB_ENABLED) {
      try {
        const { Shop, LivestreamSession, Lead, ChatLog } = require("../db/models");
        const { Sequelize, Op } = require("sequelize");

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (Shop) dbStats.totalShops = await Shop.count();
        if (LivestreamSession) dbStats.totalSessions = await LivestreamSession.count();
        if (Lead) {
          dbStats.totalLeads = await Lead.count();
          dbStats.todayLeads = await Lead.count({
            where: { created_at: { [Op.gte]: today } },
          });
        }
        if (ChatLog) {
          dbStats.todayComments = await ChatLog.count({
            where: { created_at: { [Op.gte]: today } },
          });
        }
      } catch (e) {
        console.error("Dashboard DB error:", e.message);
      }
    }

    // AI Queue stats
    let aiStats = {};
    try {
      const aiQueue = require("../aiQueue");
      aiStats = aiQueue.getStats();
    } catch (e) {}

    res.json({
      activeConnections,
      totalActiveLives: activeConnections.filter((c) => c.status === "connected" || c.status === "mock").length,
      dbStats,
      aiStats,
      serverUptime: process.uptime(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/dashboard/recent-leads?limit=20
 * Leads mới nhất từ tất cả shops
 */
router.get("/recent-leads", async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    if (DB_ENABLED) {
      const { Lead, ChatLog } = require("../db/models");
      if (Lead && ChatLog) {
        const leads = await Lead.findAll({
          include: [
            {
              model: ChatLog,
              attributes: ["comment_text", "ai_label", "nickname", "unique_id", "platform", "profile_link", "shop_id", "created_at"],
            },
          ],
          order: [["created_at", "DESC"]],
          limit: parseInt(limit),
        });
        return res.json(leads);
      }
    }

    // In-memory: aggregate from connectionManager
    const allLeads = [];
    for (const [shopId, leads] of connectionManager.leads) {
      for (const lead of leads) {
        if (lead.label === "[HOT]" || lead.label === "[WARM]") {
          allLeads.push(lead);
        }
      }
    }
    allLeads.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(allLeads.slice(0, parseInt(limit)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/dashboard/analytics?shopId=&days=7
 * Thống kê theo ngày (cho biểu đồ)
 */
router.get("/analytics", async (req, res) => {
  try {
    const { shopId, days = 7 } = req.query;

    if (!DB_ENABLED) {
      return res.json({ daily: [], summary: {} });
    }

    const { ChatLog, Lead } = require("../db/models");
    const { Sequelize, Op } = require("sequelize");
    const { sequelize } = require("../db/connection");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    if (!ChatLog) return res.json({ daily: [], summary: {} });

    const where = { created_at: { [Op.gte]: startDate } };
    if (shopId) where.shop_id = shopId;

    // Daily stats
    const daily = await ChatLog.findAll({
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

    // Conversion rate
    let conversion = { total: 0, closed: 0, rate: 0 };
    if (Lead) {
      const totalLeads = await Lead.count({
        where: { created_at: { [Op.gte]: startDate } },
      });
      const closedLeads = await Lead.count({
        where: {
          status: "Closed",
          created_at: { [Op.gte]: startDate },
        },
      });
      conversion = {
        total: totalLeads,
        closed: closedLeads,
        rate: totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0,
      };
    }

    res.json({ daily, conversion });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
