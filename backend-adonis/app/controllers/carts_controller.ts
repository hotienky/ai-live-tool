import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Order from '#models/order'
import OrderDetail from '#models/order_detail'
import OrderHistory from '#models/order_history'
import OrderTotal from '#models/order_total'
import { getUserShopIds } from '#services/scope_helper'

/**
 * CartsController — S-Cart: ShopCartController pattern
 * Manages shopping cart and checkout flow
 */
export default class CartsController {
  /**
   * GET /cart — Get cart contents (stored as JSON in shopping_carts table)
   */
  async show({ auth, request, response }: HttpContext) {
    const { shopId } = request.qs()
    const identifier = auth.user!.id
    const row = await db.from('shopping_carts')
      .where('identifier', identifier)
      .where('instance', 'cart')
      .andWhere((q) => {
        if (shopId) q.where('store_id', shopId)
      })
      .first()
    const items = row?.content ? JSON.parse(row.content) : []
    return response.json({ items })
  }

  /**
   * POST /cart/items — Add item to cart
   */
  async addItem({ auth, request, response }: HttpContext) {
    const { shopId, productId, name, sku, qty = 1, price, attribute } = request.only([
      'shopId', 'productId', 'name', 'sku', 'qty', 'price', 'attribute',
    ])
    const identifier = auth.user!.id
    const row = await db.from('shopping_carts')
      .where('identifier', identifier)
      .where('instance', 'cart')
      .first()

    let items: any[] = row?.content ? JSON.parse(row.content) : []

    // Merge if product already exists
    const existing = items.find((i: any) => i.productId === productId)
    if (existing) {
      existing.qty += Number(qty)
    } else {
      items.push({ productId, name, sku, qty: Number(qty), price: Number(price), attribute })
    }

    if (row) {
      await db.from('shopping_carts')
        .where('id', row.id)
        .update({ content: JSON.stringify(items), updated_at: db.fn.now() })
    } else {
      await db.table('shopping_carts').insert({
        identifier,
        instance: 'cart',
        content: JSON.stringify(items),
        store_id: shopId || null,
      })
    }
    return response.json({ items })
  }

  /**
   * PUT /cart/items/:productId — Update item quantity
   */
  async updateItem({ auth, params, request, response }: HttpContext) {
    const { qty } = request.only(['qty'])
    const identifier = auth.user!.id
    const row = await db.from('shopping_carts')
      .where('identifier', identifier)
      .where('instance', 'cart')
      .first()
    if (!row) return response.notFound({ error: 'Cart not found' })

    let items: any[] = JSON.parse(row.content || '[]')
    const item = items.find((i: any) => i.productId === params.productId)
    if (!item) return response.notFound({ error: 'Item not found in cart' })

    item.qty = Number(qty)
    if (item.qty <= 0) {
      items = items.filter((i: any) => i.productId !== params.productId)
    }

    await db.from('shopping_carts')
      .where('id', row.id)
      .update({ content: JSON.stringify(items), updated_at: db.fn.now() })
    return response.json({ items })
  }

  /**
   * DELETE /cart/items/:productId — Remove item from cart
   */
  async removeItem({ auth, params, response }: HttpContext) {
    const identifier = auth.user!.id
    const row = await db.from('shopping_carts')
      .where('identifier', identifier)
      .where('instance', 'cart')
      .first()
    if (!row) return response.notFound({ error: 'Cart not found' })

    let items: any[] = JSON.parse(row.content || '[]')
    items = items.filter((i: any) => i.productId !== params.productId)

    await db.from('shopping_carts')
      .where('id', row.id)
      .update({ content: JSON.stringify(items), updated_at: db.fn.now() })
    return response.json({ items })
  }

  /**
   * POST /cart/checkout — Checkout flow (S-Cart: createOrder pattern)
   * Creates Order + OrderDetail + OrderTotal + OrderHistory in transaction
   */
  async checkout({ auth, request, response }: HttpContext) {
    const userShopIds = await getUserShopIds(auth.user!.id)
    const {
      shopId, customerName, customerPhone, customerAddress,
      paymentMethod, notes, shippingFee = 0, discount = 0,
    } = request.only([
      'shopId', 'customerName', 'customerPhone', 'customerAddress',
      'paymentMethod', 'notes', 'shippingFee', 'discount',
    ])

    if (!shopId || !userShopIds.includes(shopId)) {
      return response.forbidden({ error: 'Invalid shop' })
    }

    // Get cart items
    const identifier = auth.user!.id
    const cartRow = await db.from('shopping_carts')
      .where('identifier', identifier)
      .where('instance', 'cart')
      .first()
    const cartItems: any[] = cartRow?.content ? JSON.parse(cartRow.content) : []
    if (!cartItems.length) {
      return response.badRequest({ error: 'Cart is empty' })
    }

    const trx = await db.transaction()
    try {
      // Calculate totals
      const subtotal = cartItems.reduce((sum: number, item: any) => sum + (item.price * item.qty), 0)
      const totalAmount = subtotal + Number(shippingFee) - Number(discount)

      // 1. Create Order
      const [order] = await trx.insertQuery().table('orders').returning('*').insert({
        shop_id: shopId,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        total_amount: totalAmount,
        status: 'Đơn mới',
        payment_status: 'unpaid',
        payment_method: paymentMethod || null,
        notes: notes || null,
        items: JSON.stringify(cartItems), // Backwards compat JSONB
        currency: 'VND',
        exchange_rate: 1,
      })

      // 2. Create OrderDetails (S-Cart: addOrderDetail)
      for (const item of cartItems) {
        await OrderDetail.create({
          orderId: order.id,
          productId: item.productId || null,
          name: item.name,
          sku: item.sku || null,
          qty: item.qty,
          price: item.price,
          tax: 0,
          totalPrice: item.price * item.qty,
          attribute: item.attribute || null,
          storeId: shopId,
        }, { client: trx })
      }

      // 3. Create OrderTotals (S-Cart: subtotal, shipping, discount, total)
      const totalsData = [
        { orderId: order.id, code: 'subtotal', title: 'Tạm tính', value: subtotal, sort: 1 },
        { orderId: order.id, code: 'shipping', title: 'Phí vận chuyển', value: Number(shippingFee), sort: 2 },
        { orderId: order.id, code: 'discount', title: 'Giảm giá', value: -Number(discount), sort: 3 },
        { orderId: order.id, code: 'total', title: 'Tổng cộng', value: totalAmount, sort: 100 },
      ]
      for (const t of totalsData) {
        await OrderTotal.create(t, { client: trx })
      }

      // 4. Add OrderHistory (S-Cart: addOrderHistory)
      await OrderHistory.create({
        orderId: order.id,
        orderStatusId: 1, // Đơn mới
        content: 'New order created',
        adminId: auth.user!.id,
      }, { client: trx })

      // 5. Clear cart
      if (cartRow) {
        await trx.from('shopping_carts').where('id', cartRow.id).delete()
      }

      await trx.commit()
      return response.status(201).json(order)
    } catch (err: any) {
      await trx.rollback()
      return response.internalServerError({ error: err.message })
    }
  }

  // ━━━━━━━━━━━ WISHLIST (S-Cart: 3 instances — cart, wishlist, compare) ━━━━━━━━━━━

  /**
   * GET /wishlist — Get wishlist items
   */
  async showWishlist({ auth, request, response }: HttpContext) {
    return this._showList(auth.user!.id, 'wishlist', request.qs().shopId, response)
  }

  /**
   * POST /wishlist — Add to wishlist
   */
  async addToWishlist({ auth, request, response }: HttpContext) {
    const { shopId, productId, name, price, image } = request.only(['shopId', 'productId', 'name', 'price', 'image'])
    return this._addToList(auth.user!.id, 'wishlist', shopId, { productId, name, price, image }, response)
  }

  /**
   * DELETE /wishlist/:productId — Remove from wishlist
   */
  async removeFromWishlist({ auth, params, response }: HttpContext) {
    return this._removeFromList(auth.user!.id, 'wishlist', params.productId, response)
  }

  // ━━━━━━━━━━━ COMPARE ━━━━━━━━━━━

  /**
   * GET /compare — Get compare list
   */
  async showCompare({ auth, request, response }: HttpContext) {
    return this._showList(auth.user!.id, 'compare', request.qs().shopId, response)
  }

  /**
   * POST /compare — Add to compare
   */
  async addToCompare({ auth, request, response }: HttpContext) {
    const { shopId, productId, name, price, image } = request.only(['shopId', 'productId', 'name', 'price', 'image'])
    return this._addToList(auth.user!.id, 'compare', shopId, { productId, name, price, image }, response)
  }

  /**
   * DELETE /compare/:productId — Remove from compare
   */
  async removeFromCompare({ auth, params, response }: HttpContext) {
    return this._removeFromList(auth.user!.id, 'compare', params.productId, response)
  }

  // ━━━━━━━━━━━ Shared helpers ━━━━━━━━━━━

  private async _showList(identifier: number, instance: string, shopId: string | undefined, response: any) {
    const row = await db.from('shopping_carts')
      .where('identifier', identifier)
      .where('instance', instance)
      .modify((q: any) => { if (shopId) q.where('store_id', shopId) })
      .first()
    const items = row?.content ? JSON.parse(row.content) : []
    return response.json({ items })
  }

  private async _addToList(identifier: number, instance: string, shopId: string, item: any, response: any) {
    const row = await db.from('shopping_carts')
      .where('identifier', identifier)
      .where('instance', instance)
      .first()

    let items: any[] = row?.content ? JSON.parse(row.content) : []
    const exists = items.find((i: any) => i.productId === item.productId)
    if (!exists) {
      items.push(item)
    }

    if (row) {
      await db.from('shopping_carts').where('id', row.id)
        .update({ content: JSON.stringify(items), updated_at: db.fn.now() })
    } else {
      await db.table('shopping_carts').insert({
        identifier, instance, content: JSON.stringify(items), store_id: shopId || null,
      })
    }
    return response.json({ items })
  }

  private async _removeFromList(identifier: number, instance: string, productId: string, response: any) {
    const row = await db.from('shopping_carts')
      .where('identifier', identifier)
      .where('instance', instance)
      .first()
    if (!row) return response.json({ items: [] })

    let items: any[] = JSON.parse(row.content || '[]')
    items = items.filter((i: any) => i.productId !== productId)

    await db.from('shopping_carts').where('id', row.id)
      .update({ content: JSON.stringify(items), updated_at: db.fn.now() })
    return response.json({ items })
  }
}
