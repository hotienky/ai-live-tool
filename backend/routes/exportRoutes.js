const express = require("express");
const router = express.Router();
const { DB_ENABLED } = require("../db/connection");

// GET /api/export/leads?shopId=&format=csv
router.get("/leads", async (req, res) => {
  try {
    const { shopId, format = "csv" } = req.query;

    let leads = [];
    if (DB_ENABLED) {
      const { Lead } = require("../db/models");
      const where = {};
      if (shopId) where.shop_id = shopId;
      leads = await Lead.findAll({ where, order: [["created_at", "DESC"]], raw: true });
    }

    if (format === "csv") {
      const headers = ["id", "uniqueId", "nickname", "comment", "label", "status", "notes", "productIntent", "createdAt"];
      let csv = headers.join(",") + "\n";
      for (const l of leads) {
        csv += headers.map(h => {
          const val = String(l[h] || l[toSnake(h)] || "").replace(/"/g, '""');
          return `"${val}"`;
        }).join(",") + "\n";
      }
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=leads_${Date.now()}.csv`);
      return res.send(csv);
    }

    // JSON export
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/export/comments?shopId=&sessionId=&format=csv
router.get("/comments", async (req, res) => {
  try {
    const { shopId, sessionId, format = "csv" } = req.query;

    let comments = [];
    if (DB_ENABLED) {
      const { ChatLog } = require("../db/models");
      const where = {};
      if (shopId) where.shop_id = shopId;
      if (sessionId) where.session_id = sessionId;
      comments = await ChatLog.findAll({ where, order: [["created_at", "DESC"]], limit: 10000, raw: true });
    }

    if (format === "csv") {
      const headers = ["id", "uniqueId", "nickname", "commentText", "aiLabel", "aiSummary", "productIntent", "platform", "createdAt"];
      let csv = headers.join(",") + "\n";
      for (const c of comments) {
        csv += headers.map(h => {
          const val = String(c[h] || c[toSnake(h)] || "").replace(/"/g, '""');
          return `"${val}"`;
        }).join(",") + "\n";
      }
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=comments_${Date.now()}.csv`);
      return res.send(csv);
    }

    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/export/customers?shopId=&format=csv
router.get("/customers", async (req, res) => {
  try {
    const { shopId, format = "csv" } = req.query;

    let customers = [];
    if (DB_ENABLED) {
      const { Customer } = require("../db/models");
      const where = {};
      if (shopId) where.shop_id = shopId;
      customers = await Customer.findAll({ where, order: [["updated_at", "DESC"]], raw: true });
    }

    if (format === "csv") {
      const headers = ["id", "uniqueId", "nickname", "totalComments", "hotCount", "lastLabel", "platform", "createdAt"];
      let csv = headers.join(",") + "\n";
      for (const c of customers) {
        csv += headers.map(h => {
          const val = String(c[h] || c[toSnake(h)] || "").replace(/"/g, '""');
          return `"${val}"`;
        }).join(",") + "\n";
      }
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=customers_${Date.now()}.csv`);
      return res.send(csv);
    }

    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/export/report?shopId=&days=7
router.get("/report", async (req, res) => {
  try {
    const { shopId, days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    let reportData = { totalComments: 0, totalHot: 0, totalWarm: 0, totalCold: 0, totalLeads: 0, conversionRate: 0 };

    if (DB_ENABLED) {
      const { ChatLog, Lead } = require("../db/models");
      const { Op } = require("sequelize");
      const where = { created_at: { [Op.gte]: startDate } };
      if (shopId) where.shop_id = shopId;

      const comments = await ChatLog.findAll({ where, raw: true });
      reportData.totalComments = comments.length;
      reportData.totalHot = comments.filter(c => c.ai_label === "HOT").length;
      reportData.totalWarm = comments.filter(c => c.ai_label === "WARM").length;
      reportData.totalCold = comments.filter(c => c.ai_label === "COLD").length;

      const leads = await Lead.findAll({ where: { created_at: { [Op.gte]: startDate } }, raw: true });
      reportData.totalLeads = leads.length;
      const closed = leads.filter(l => l.status === "Closed").length;
      reportData.conversionRate = leads.length > 0 ? Math.round((closed / leads.length) * 100) : 0;
    }

    // Return HTML report for printing/PDF
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Report</title>
<style>
  body{font-family:system-ui;padding:40px;max-width:800px;margin:0 auto;color:#1a1a1a}
  h1{color:#ff3b5c;border-bottom:2px solid #ff3b5c;padding-bottom:8px}
  .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:20px 0}
  .stat{background:#f8f9fa;border-radius:8px;padding:16px;text-align:center}
  .stat-value{font-size:28px;font-weight:800}
  .stat-label{font-size:12px;color:#666;margin-top:4px}
  .hot{color:#ef4444}.warm{color:#f59e0b}.cold{color:#6b7280}
  table{width:100%;border-collapse:collapse;margin-top:20px}
  th,td{padding:8px 12px;text-align:left;border-bottom:1px solid #eee}
  th{background:#f1f5f9;font-size:12px;text-transform:uppercase}
  .footer{margin-top:40px;font-size:11px;color:#999;text-align:center}
</style></head><body>
  <h1>📊 AI Live-Commerce Report</h1>
  <p>Khoảng thời gian: ${days} ngày gần nhất</p>
  <div class="stats">
    <div class="stat"><div class="stat-value">${reportData.totalComments}</div><div class="stat-label">Tổng Comments</div></div>
    <div class="stat"><div class="stat-value hot">${reportData.totalHot}</div><div class="stat-label">HOT Leads</div></div>
    <div class="stat"><div class="stat-value warm">${reportData.totalWarm}</div><div class="stat-label">WARM</div></div>
    <div class="stat"><div class="stat-value cold">${reportData.totalCold}</div><div class="stat-label">COLD</div></div>
    <div class="stat"><div class="stat-value">${reportData.totalLeads}</div><div class="stat-label">Tổng Leads</div></div>
    <div class="stat"><div class="stat-value" style="color:#10b981">${reportData.conversionRate}%</div><div class="stat-label">Conversion Rate</div></div>
  </div>
  <div class="footer">Generated by AI Live-Commerce Tool • ${new Date().toLocaleString("vi-VN")}</div>
</body></html>`;

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function toSnake(str) {
  return str.replace(/([A-Z])/g, "_$1").toLowerCase();
}

module.exports = router;
