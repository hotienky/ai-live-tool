const express = require("express");
const router = express.Router();
const { DB_ENABLED } = require("../db/connection");

const memoryTemplates = new Map(); // shopId -> templates[]

function getModel() {
  if (!DB_ENABLED) return null;
  try {
    const { AutoReplyTemplate } = require("../db/models");
    return AutoReplyTemplate;
  } catch { return null; }
}

// GET /api/shops/:shopId/templates
router.get("/:shopId/templates", async (req, res) => {
  try {
    const { shopId } = req.params;
    const M = getModel();
    if (M) {
      const items = await M.findAll({ where: { shop_id: shopId }, order: [["created_at", "DESC"]] });
      return res.json(items);
    }
    res.json(memoryTemplates.get(shopId) || []);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/shops/:shopId/templates
router.post("/:shopId/templates", async (req, res) => {
  try {
    const { shopId } = req.params;
    const { trigger_label, template_text } = req.body;
    if (!trigger_label || !template_text) return res.status(400).json({ error: "Missing fields" });

    const M = getModel();
    if (M) {
      const t = await M.create({ shop_id: shopId, trigger_label, template_text });
      return res.json(t);
    }

    const t = { id: `tpl_${Date.now()}`, shop_id: shopId, trigger_label, template_text, is_active: true, created_at: new Date().toISOString() };
    if (!memoryTemplates.has(shopId)) memoryTemplates.set(shopId, []);
    memoryTemplates.get(shopId).push(t);
    res.json(t);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/shops/:shopId/templates/:id
router.delete("/:shopId/templates/:id", async (req, res) => {
  try {
    const { shopId, id } = req.params;
    const M = getModel();
    if (M) {
      await M.destroy({ where: { id, shop_id: shopId } });
      return res.json({ success: true });
    }
    const list = memoryTemplates.get(shopId) || [];
    memoryTemplates.set(shopId, list.filter((t) => t.id !== id));
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
