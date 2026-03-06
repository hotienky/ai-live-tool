const express = require("express");
const router = express.Router();
const { DB_ENABLED } = require("../db/connection");

// In-memory product store (fallback when DB disabled)
const memoryProducts = new Map();

function getProductModel() {
  if (!DB_ENABLED) return null;
  try {
    const { Product } = require("../db/models");
    return Product;
  } catch {
    return null;
  }
}

/**
 * GET /api/products?shopId=xxx
 */
router.get("/", async (req, res) => {
  const { shopId } = req.query;
  const Product = getProductModel();

  if (Product) {
    const products = await Product.findAll({
      where: shopId ? { shop_id: shopId } : {},
      order: [["is_live", "DESC"]],
    });
    return res.json(products);
  }

  // In-memory fallback
  const products = [...memoryProducts.values()].filter(
    (p) => !shopId || p.shop_id === shopId
  );
  res.json(products);
});

/**
 * POST /api/products
 * Body: { shop_id, name, price, image_url, keywords, is_live }
 */
router.post("/", async (req, res) => {
  const { shop_id, name, price, image_url, keywords, is_live } = req.body;
  const Product = getProductModel();

  if (Product) {
    const product = await Product.create({
      shop_id,
      name,
      price,
      image_url,
      keywords: keywords || [],
      is_live: is_live || false,
    });
    return res.json(product);
  }

  // In-memory fallback
  const id = `prod_${Date.now()}`;
  const product = {
    id,
    shop_id,
    name,
    price,
    image_url,
    keywords: keywords || [],
    is_live: is_live || false,
  };
  memoryProducts.set(id, product);
  res.json(product);
});

/**
 * PUT /api/products/:id
 */
router.put("/:id", async (req, res) => {
  const Product = getProductModel();

  if (Product) {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: "Not found" });
    await product.update(req.body);
    return res.json(product);
  }

  // In-memory
  const product = memoryProducts.get(req.params.id);
  if (!product) return res.status(404).json({ error: "Not found" });
  Object.assign(product, req.body);
  res.json(product);
});

/**
 * DELETE /api/products/:id
 */
router.delete("/:id", async (req, res) => {
  const Product = getProductModel();

  if (Product) {
    await Product.destroy({ where: { id: req.params.id } });
    return res.json({ success: true });
  }

  memoryProducts.delete(req.params.id);
  res.json({ success: true });
});

/**
 * PUT /api/products/:id/toggle-live
 * Bật/tắt trạng thái "đang live" cho sản phẩm
 */
router.put("/:id/toggle-live", async (req, res) => {
  const Product = getProductModel();

  if (Product) {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: "Not found" });
    product.is_live = !product.is_live;
    await product.save();
    return res.json(product);
  }

  const product = memoryProducts.get(req.params.id);
  if (!product) return res.status(404).json({ error: "Not found" });
  product.is_live = !product.is_live;
  res.json(product);
});

module.exports = router;
