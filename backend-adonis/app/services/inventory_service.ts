/**
 * Inventory Service — Stock management for products
 * Upgraded: stock history logging, bulk ops, socket alerts
 */
import { ProductSchema, StockHistorySchema, NotificationSchema } from '../../database/schema.js'

/**
 * Log a stock change to the stock_history table
 */
async function logStockHistory(params: {
  productId: number
  shopId: number
  userId?: number | null
  action: 'add' | 'deduct' | 'adjust' | 'order_confirmed' | 'order_cancelled'
  quantityChange: number
  stockBefore: number
  stockAfter: number
  reason?: string | null
  referenceType?: 'order' | 'manual' | 'import' | null
  referenceId?: number | null
}) {
  try {
    await StockHistorySchema.create({
      productId: params.productId,
      shopId: params.shopId,
      userId: params.userId || null,
      action: params.action,
      quantityChange: params.quantityChange,
      stockBefore: params.stockBefore,
      stockAfter: params.stockAfter,
      reason: params.reason || null,
      referenceType: params.referenceType || null,
      referenceId: params.referenceId || null,
    })
  } catch (err: any) {
    console.error('Stock history log error:', err.message)
  }
}

/**
 * Deduct stock from a product — with history logging + low stock alert
 */
export async function deductStock(
  productId: number,
  quantity: number = 1,
  options?: { userId?: number; reason?: string; referenceType?: 'order' | 'manual' | 'import'; referenceId?: number }
) {
  const product = await ProductSchema.findOrFail(productId)
  if (product.stock < quantity) {
    throw new Error(`Sản phẩm "${product.name}" chỉ còn ${product.stock} trong kho`)
  }

  const stockBefore = product.stock
  product.stock -= quantity
  await product.save()

  await logStockHistory({
    productId: product.id,
    shopId: product.shopId,
    userId: options?.userId,
    action: 'deduct',
    quantityChange: -quantity,
    stockBefore,
    stockAfter: product.stock,
    reason: options?.reason,
    referenceType: options?.referenceType,
    referenceId: options?.referenceId,
  })

  // Check low stock threshold and create notification
  if (product.stock <= product.lowStockThreshold) {
    await createLowStockNotification(product)
    await emitLowStockAlert(product)
  }

  return product
}

/**
 * Add stock to a product — with history logging
 */
export async function addStock(
  productId: number,
  quantity: number,
  options?: { userId?: number; reason?: string; referenceType?: 'order' | 'manual' | 'import'; referenceId?: number }
) {
  const product = await ProductSchema.findOrFail(productId)
  const stockBefore = product.stock
  product.stock += quantity
  await product.save()

  await logStockHistory({
    productId: product.id,
    shopId: product.shopId,
    userId: options?.userId,
    action: 'add',
    quantityChange: quantity,
    stockBefore,
    stockAfter: product.stock,
    reason: options?.reason || 'Nhập hàng',
    referenceType: options?.referenceType || 'manual',
    referenceId: options?.referenceId,
  })

  return product
}

/**
 * Adjust stock directly (for inventory count / correction)
 */
export async function adjustStock(
  productId: number,
  newStock: number,
  options?: { userId?: number; reason?: string }
) {
  const product = await ProductSchema.findOrFail(productId)
  const stockBefore = product.stock
  const quantityChange = newStock - stockBefore
  product.stock = newStock
  await product.save()

  await logStockHistory({
    productId: product.id,
    shopId: product.shopId,
    userId: options?.userId,
    action: 'adjust',
    quantityChange,
    stockBefore,
    stockAfter: newStock,
    reason: options?.reason || 'Điều chỉnh kiểm kê',
    referenceType: 'manual',
  })

  if (product.stock <= product.lowStockThreshold) {
    await emitLowStockAlert(product)
  }

  return product
}

/**
 * Bulk deduct stock for an order (only items with productId)
 */
export async function bulkDeductForOrder(
  items: Array<{ productId?: number; qty: number; name?: string }>,
  orderId: number,
  userId?: number
) {
  const results: any[] = []
  for (const item of items) {
    if (!item.productId) continue
    try {
      const product = await deductStock(item.productId, item.qty, {
        userId,
        reason: `Đơn #${orderId} xác nhận`,
        referenceType: 'order',
        referenceId: orderId,
      })
      results.push({ productId: item.productId, success: true, stock: product.stock })
    } catch (err: any) {
      results.push({ productId: item.productId, success: false, error: err.message })
    }
  }
  return results
}

/**
 * Bulk restore stock when an order is cancelled
 */
export async function bulkRestoreForOrder(
  items: Array<{ productId?: number; qty: number; name?: string }>,
  orderId: number,
  userId?: number
) {
  const results: any[] = []
  for (const item of items) {
    if (!item.productId) continue
    try {
      const product = await addStock(item.productId, item.qty, {
        userId,
        reason: `Đơn #${orderId} hủy - hoàn kho`,
        referenceType: 'order',
        referenceId: orderId,
      })
      results.push({ productId: item.productId, success: true, stock: product.stock })
    } catch (err: any) {
      results.push({ productId: item.productId, success: false, error: err.message })
    }
  }
  return results
}

/**
 * Get inventory statistics for a shop
 */
export async function getInventoryStats(shopId: number) {
  const products = await ProductSchema.query()
    .where('shopId', shopId)
    .where('isActive', true)

  const totalProducts = products.length
  const totalStockValue = products.reduce((sum, p) => sum + (p.stock * (p.price || 0)), 0)
  const totalCostValue = products.reduce((sum, p) => sum + (p.stock * (p.costPrice || p.price || 0)), 0)
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= p.lowStockThreshold).length
  const outOfStockCount = products.filter(p => p.stock <= 0).length
  const inStockCount = products.filter(p => p.stock > p.lowStockThreshold).length

  return {
    totalProducts,
    totalStockValue,
    totalCostValue,
    lowStockCount,
    outOfStockCount,
    inStockCount,
  }
}

export async function checkLowStock(shopId: number) {
  const products = await ProductSchema.query()
    .where('shopId', shopId)
    .where('isActive', true)
    .whereRaw('stock <= low_stock_threshold')
  return products
}

/**
 * Emit low stock alert via Socket.IO
 */
export async function emitLowStockAlert(product: any) {
  try {
    const { getIO } = await import('../../start/socket.js')
    const io = getIO()
    if (io) {
      io.to(`shop_${product.shopId}`).emit('low_stock_alert', {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        stock: product.stock,
        threshold: product.lowStockThreshold,
      })
    }
  } catch (err: any) {
    console.error('Low stock alert emit error:', err.message)
  }
}

async function createLowStockNotification(product: any) {
  try {
    const Shop = (await import('../../database/schema.js')).ShopSchema
    const shop = await Shop.find(product.shopId)
    if (!shop) return

    await NotificationSchema.create({
      userId: shop.userId,
      shopId: String(product.shopId),
      type: 'low_stock',
      title: `⚠️ Sắp hết hàng: ${product.name}`,
      message: `Sản phẩm "${product.name}" chỉ còn ${product.stock} sản phẩm (ngưỡng: ${product.lowStockThreshold})`,
      link: '/inventory',
      isRead: false,
    })
  } catch (err: any) {
    console.error('Low stock notification error:', err.message)
  }
}
