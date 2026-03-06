const express = require("express");
const router = express.Router();
const { DB_ENABLED } = require("../db/connection");

// In-memory keywords fallback
const memoryKeywords = new Map(); // shopId -> keywords[]

function getKeywordModel() {
  if (!DB_ENABLED) return null;
  try {
    const { ShopKeyword } = require("../db/models");
    return ShopKeyword;
  } catch {
    return null;
  }
}

/**
 * GET /api/shops/:shopId/keywords
 * Lấy danh sách keywords của shop
 */
router.get("/:shopId/keywords", async (req, res) => {
  try {
    const { shopId } = req.params;
    const SK = getKeywordModel();

    if (SK) {
      const keywords = await SK.findAll({
        where: { shop_id: shopId },
        order: [["created_at", "DESC"]],
      });
      return res.json(keywords);
    }

    // In-memory
    res.json(memoryKeywords.get(shopId) || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/shops/:shopId/keywords
 * Thêm keyword mới cho shop
 * Body: { keyword, alert_type, color, auto_reply_text }
 */
router.post("/:shopId/keywords", async (req, res) => {
  try {
    const { shopId } = req.params;
    const { keyword, alert_type = "highlight", color = "#ff3b5c", auto_reply_text } = req.body;

    if (!keyword) {
      return res.status(400).json({ error: "keyword là bắt buộc" });
    }

    const SK = getKeywordModel();
    if (SK) {
      const kw = await SK.create({
        shop_id: shopId,
        keyword,
        alert_type,
        color,
        auto_reply_text: auto_reply_text || null,
      });
      return res.json(kw);
    }

    // In-memory
    const kw = {
      id: `kw_${Date.now()}`,
      shop_id: shopId,
      keyword,
      alert_type,
      color,
      auto_reply_text,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    if (!memoryKeywords.has(shopId)) memoryKeywords.set(shopId, []);
    memoryKeywords.get(shopId).push(kw);
    res.json(kw);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/shops/:shopId/keywords/:kwId
 */
router.delete("/:shopId/keywords/:kwId", async (req, res) => {
  try {
    const { shopId, kwId } = req.params;
    const SK = getKeywordModel();

    if (SK) {
      await SK.destroy({ where: { id: kwId, shop_id: shopId } });
      return res.json({ success: true });
    }

    // In-memory
    const kws = memoryKeywords.get(shopId) || [];
    memoryKeywords.set(shopId, kws.filter((k) => k.id !== kwId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/shops/:shopId/keywords/:kwId
 * Toggle active/inactive
 */
router.put("/:shopId/keywords/:kwId", async (req, res) => {
  try {
    const { shopId, kwId } = req.params;
    const updates = req.body;
    const SK = getKeywordModel();

    if (SK) {
      const kw = await SK.findByPk(kwId);
      if (!kw) return res.status(404).json({ error: "Keyword không tồn tại" });
      await kw.update(updates);
      return res.json(kw);
    }

    // In-memory
    const kws = memoryKeywords.get(shopId) || [];
    const kw = kws.find((k) => k.id === kwId);
    if (kw) Object.assign(kw, updates);
    res.json(kw);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
