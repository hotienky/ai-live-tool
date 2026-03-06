const express = require("express");
const router = express.Router();
const connectionManager = require("../connectionManager");

/**
 * Export leads as CSV or JSON
 * GET /api/export/leads?shopId=xxx&format=csv&filter=HOT
 */
router.get("/leads", (req, res) => {
  try {
    const { shopId, format = "csv", filter } = req.query;

    if (!shopId) {
      return res.status(400).json({ error: "shopId is required" });
    }

    // Lấy leads từ connectionManager
    let leads = connectionManager.leads.get(shopId) || [];

    // Filter by label
    if (filter) {
      const filterLabel = `[${filter.toUpperCase()}]`;
      leads = leads.filter((l) => l.label === filterLabel);
    }

    if (format === "csv") {
      const headers = [
        "Thời gian",
        "Tên",
        "Username",
        "Bình luận",
        "Phân loại",
        "Profile Link",
        "Platform",
      ];
      const rows = leads.map((l) => [
        l.timestamp,
        `"${(l.nickname || "").replace(/"/g, '""')}"`,
        l.uniqueId,
        `"${(l.comment || "").replace(/"/g, '""')}"`,
        l.label,
        l.profileLink,
        l.platform || "tiktok",
      ]);

      const csv =
        "\uFEFF" + // BOM for UTF-8 Excel support
        headers.join(",") +
        "\n" +
        rows.map((r) => r.join(",")).join("\n");

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="leads_${Date.now()}.csv"`
      );
      return res.send(csv);
    }

    // JSON format
    res.json({ total: leads.length, leads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
