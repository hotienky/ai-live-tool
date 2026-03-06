const express = require("express");
const router = express.Router();
const { DB_ENABLED } = require("../db/connection");

/**
 * GET /api/customers?shopId=xxx
 * Danh sách khách hàng từ DB, sort by interactions
 */
router.get("/", async (req, res) => {
  if (!DB_ENABLED) {
    return res.json([]);
  }

  try {
    const { Customer } = require("../db/models");
    if (!Customer) return res.json([]);

    const customers = await Customer.findAll({
      order: [["total_interactions", "DESC"]],
      limit: 100,
    });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/customers/:id/history
 * Lịch sử comments của 1 khách hàng
 */
router.get("/:id/history", async (req, res) => {
  if (!DB_ENABLED) {
    return res.json({ customer: null, history: [] });
  }

  try {
    const { Customer, ChatLog } = require("../db/models");
    if (!Customer || !ChatLog) {
      return res.json({ customer: null, history: [] });
    }

    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const history = await ChatLog.findAll({
      where: { customer_id: req.params.id },
      order: [["created_at", "DESC"]],
      limit: 50,
    });

    res.json({
      customer,
      history,
      stats: {
        totalComments: history.length,
        hotCount: history.filter((h) => h.ai_label === "HOT").length,
        warmCount: history.filter((h) => h.ai_label === "WARM").length,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
