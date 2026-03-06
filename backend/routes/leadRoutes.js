const express = require("express");
const router = express.Router();
const { DB_ENABLED } = require("../db/connection");

// In-memory lead store fallback
const memoryLeads = new Map();

function getModels() {
  if (!DB_ENABLED) return {};
  try {
    const { Lead, ChatLog, Customer } = require("../db/models");
    return { Lead, ChatLog, Customer };
  } catch {
    return {};
  }
}

/**
 * GET /api/leads?shopId=&status=&limit=50&offset=0
 * Lấy danh sách leads (kèm thông tin comment + customer)
 */
router.get("/", async (req, res) => {
  try {
    const { shopId, status, limit = 50, offset = 0 } = req.query;
    const { Lead, ChatLog, Customer } = getModels();

    if (Lead && ChatLog) {
      const where = {};
      if (status) where.status = status;

      const include = [
        {
          model: ChatLog,
          attributes: ["id", "comment_text", "ai_label", "nickname", "unique_id", "platform", "profile_link", "profile_picture_url", "shop_id", "session_id", "created_at"],
          ...(shopId ? { where: { shop_id: shopId } } : {}),
          required: true,
        },
      ];

      const { count, rows } = await Lead.findAndCountAll({
        where,
        include,
        order: [["created_at", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      return res.json({ total: count, leads: rows });
    }

    // In-memory fallback
    let leads = [...memoryLeads.values()];
    if (status) leads = leads.filter((l) => l.status === status);
    if (shopId) leads = leads.filter((l) => l.shopId === shopId);
    leads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({
      total: leads.length,
      leads: leads.slice(parseInt(offset), parseInt(offset) + parseInt(limit)),
    });
  } catch (err) {
    console.error("❌ GET /api/leads error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/leads/stats?shopId=
 * Thống kê leads theo trạng thái (pipeline counts)
 */
router.get("/stats", async (req, res) => {
  try {
    const { shopId } = req.query;
    const { Lead, ChatLog } = getModels();

    if (Lead && ChatLog) {
      const { Sequelize } = require("sequelize");

      const include = shopId
        ? [{ model: ChatLog, where: { shop_id: shopId }, attributes: [], required: true }]
        : [];

      const stats = await Lead.findAll({
        attributes: [
          "status",
          [Sequelize.fn("COUNT", Sequelize.col("Lead.id")), "count"],
        ],
        include,
        group: ["status"],
        raw: true,
      });

      const result = { New: 0, Contacting: 0, Closed: 0, Ignored: 0 };
      for (const s of stats) {
        result[s.status] = parseInt(s.count);
      }
      result.total = Object.values(result).reduce((a, b) => a + b, 0);
      return res.json(result);
    }

    // In-memory fallback
    const leads = [...memoryLeads.values()];
    const result = { New: 0, Contacting: 0, Closed: 0, Ignored: 0, total: leads.length };
    for (const l of leads) {
      result[l.status] = (result[l.status] || 0) + 1;
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/leads/:id
 * Update lead status, notes, product_intent
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, staff_notes, product_intent } = req.body;
    const { Lead } = getModels();

    if (Lead) {
      const lead = await Lead.findByPk(id);
      if (!lead) return res.status(404).json({ error: "Lead không tồn tại" });

      const updates = {};
      if (status) updates.status = status;
      if (staff_notes !== undefined) updates.staff_notes = staff_notes;
      if (product_intent !== undefined) updates.product_intent = product_intent;

      await lead.update(updates);
      return res.json(lead);
    }

    // In-memory
    const lead = memoryLeads.get(id);
    if (!lead) return res.status(404).json({ error: "Lead không tồn tại" });
    if (status) lead.status = status;
    if (staff_notes !== undefined) lead.staff_notes = staff_notes;
    if (product_intent !== undefined) lead.product_intent = product_intent;
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/leads/:id
 * Chi tiết lead + lịch sử customer
 */
router.get("/:id", async (req, res) => {
  try {
    const { Lead, ChatLog, Customer } = getModels();

    if (Lead && ChatLog) {
      const lead = await Lead.findByPk(req.params.id, {
        include: [
          {
            model: ChatLog,
            include: Customer ? [{ model: Customer }] : [],
          },
        ],
      });
      if (!lead) return res.status(404).json({ error: "Lead không tồn tại" });
      return res.json(lead);
    }

    const lead = memoryLeads.get(req.params.id);
    if (!lead) return res.status(404).json({ error: "Lead không tồn tại" });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
