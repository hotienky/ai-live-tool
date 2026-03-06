const express = require("express");
const router = express.Router();
const connectionManager = require("../connectionManager");

/**
 * Shop CRUD + Connection Management Routes
 * Sử dụng in-memory store khi DB_ENABLED=false
 */

// In-memory shop store (fallback khi không có DB)
let inMemoryShops = [
  {
    id: "default-shop-001",
    shop_name: "Mẹ Bin Store",
    tiktok_username: "me_bin_official",
    shopee_id: null,
    owner_email: null,
    is_active: true,
    subscription_plan: "Free",
    created_at: new Date().toISOString(),
  },
];
let shopIdCounter = 1;

function getShopModel() {
  try {
    const { Shop, DB_ENABLED } = require("../db/models");
    const { DB_ENABLED: dbFlag } = require("../db/connection");
    if (dbFlag && Shop) return Shop;
  } catch (e) {}
  return null;
}

// ──── GET /api/shops ─────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const Shop = getShopModel();
    if (Shop) {
      const shops = await Shop.findAll({
        order: [["created_at", "DESC"]],
      });
      // Thêm connection status
      const result = shops.map((s) => ({
        ...s.toJSON(),
        connectionStatus: connectionManager.isConnected(s.id),
      }));
      return res.json(result);
    }

    // In-memory fallback
    const result = inMemoryShops.map((s) => ({
      ...s,
      connectionStatus: connectionManager.isConnected(s.id),
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──── POST /api/shops ────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { shop_name, tiktok_username, shopee_id, owner_email, subscription_plan } = req.body;

    if (!shop_name) {
      return res.status(400).json({ error: "shop_name là bắt buộc" });
    }

    const Shop = getShopModel();
    if (Shop) {
      const shop = await Shop.create({
        shop_name,
        tiktok_username: tiktok_username || null,
        shopee_id: shopee_id || null,
        owner_email: owner_email || null,
        subscription_plan: subscription_plan || "Free",
      });
      return res.status(201).json(shop);
    }

    // In-memory fallback
    const newShop = {
      id: `shop-${Date.now()}-${++shopIdCounter}`,
      shop_name,
      tiktok_username: tiktok_username || null,
      shopee_id: shopee_id || null,
      owner_email: owner_email || null,
      is_active: true,
      subscription_plan: subscription_plan || "Free",
      created_at: new Date().toISOString(),
    };
    inMemoryShops.push(newShop);
    res.status(201).json(newShop);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──── PUT /api/shops/:id ─────────────────────────────────
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const Shop = getShopModel();
    if (Shop) {
      const shop = await Shop.findByPk(id);
      if (!shop) return res.status(404).json({ error: "Shop không tồn tại" });
      await shop.update(updates);
      return res.json(shop);
    }

    // In-memory
    const idx = inMemoryShops.findIndex((s) => s.id === id);
    if (idx === -1) return res.status(404).json({ error: "Shop không tồn tại" });
    inMemoryShops[idx] = { ...inMemoryShops[idx], ...updates };
    res.json(inMemoryShops[idx]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──── DELETE /api/shops/:id ──────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Ngắt kết nối nếu đang chạy
    connectionManager.stopConnection(id);

    const Shop = getShopModel();
    if (Shop) {
      const shop = await Shop.findByPk(id);
      if (!shop) return res.status(404).json({ error: "Shop không tồn tại" });
      await shop.destroy();
      return res.json({ success: true });
    }

    // In-memory
    inMemoryShops = inMemoryShops.filter((s) => s.id !== id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──── POST /api/shops/:id/connect ────────────────────────
router.post("/:id/connect", async (req, res) => {
  try {
    const { id } = req.params;
    const { mock } = req.body; // { mock: true } để chạy mock mode

    // Tìm shop
    let shop;
    const Shop = getShopModel();
    if (Shop) {
      shop = await Shop.findByPk(id);
      if (!shop) return res.status(404).json({ error: "Shop không tồn tại" });
      shop = shop.toJSON();
    } else {
      shop = inMemoryShops.find((s) => s.id === id);
      if (!shop) return res.status(404).json({ error: "Shop không tồn tại" });
    }

    const io = req.app.get("io");

    if (mock) {
      const result = connectionManager.startMockConnection(shop, io);
      return res.json(result);
    }

    if (!shop.tiktok_username) {
      return res.status(400).json({ error: "Shop chưa cấu hình TikTok username" });
    }

    const result = await connectionManager.startConnection(shop, io);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──── POST /api/shops/:id/disconnect ─────────────────────
router.post("/:id/disconnect", async (req, res) => {
  try {
    const { id } = req.params;
    connectionManager.stopConnection(id);
    const io = req.app.get("io");
    io.to(`shop_${id}`).emit("crawler_status", { status: "disconnected" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──── GET /api/shops/:id/stats ───────────────────────────
router.get("/:id/stats", (req, res) => {
  const stats = connectionManager.getStats(req.params.id);
  res.json(stats);
});

// ──── GET /api/connections ───────────────────────────────
router.get("/connections/status", (req, res) => {
  res.json(connectionManager.getAllStatus());
});

module.exports = router;
