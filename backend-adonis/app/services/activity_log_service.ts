/**
 * Activity Log Service — Track important user actions
 */
import { ActivityLogSchema } from '../../database/schema.js'

interface LogParams {
  shopId: number
  userId?: number | null
  action: string
  entityType?: string
  entityId?: number
  details?: Record<string, any>
  ip?: string
}

export async function logActivity(params: LogParams) {
  try {
    await ActivityLogSchema.create({
      shopId: params.shopId,
      userId: params.userId || null,
      action: params.action,
      entityType: params.entityType || null,
      entityId: params.entityId || null,
      details: params.details ? JSON.stringify(params.details) : null,
      ip: params.ip || null,
    })
  } catch (err: any) {
    console.error('Activity log error:', err.message)
  }
}

export async function getActivityLogs(shopId: number, options: { page?: number; limit?: number; action?: string } = {}) {
  const { page = 1, limit = 50, action } = options

  const query = ActivityLogSchema.query()
    .where('shopId', shopId)
    .orderBy('createdAt', 'desc')

  if (action) query.where('action', action)

  const offset = (page - 1) * limit
  const [logs, countResult] = await Promise.all([
    query.clone().offset(offset).limit(limit),
    query.clone().count('* as total'),
  ])

  return {
    data: logs,
    meta: {
      total: Number((countResult[0] as any).$extras?.total || countResult[0]?.$extras?.total || 0),
      page,
      limit,
      lastPage: Math.ceil(Number((countResult[0] as any).$extras?.total || 0) / limit),
    },
  }
}

// Common action types for consistency
export const Actions = {
  // Session
  SESSION_STARTED: 'session.started',
  SESSION_ENDED: 'session.ended',
  // Lead
  LEAD_STATUS_CHANGED: 'lead.status_changed',
  LEAD_CREATED: 'lead.created',
  // Order
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated',
  ORDER_DELETED: 'order.deleted',
  // Product
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  STOCK_LOW: 'product.stock_low',
  STOCK_DEDUCTED: 'product.stock_deducted',
  // Webhook
  WEBHOOK_CREATED: 'webhook.created',
  WEBHOOK_DELETED: 'webhook.deleted',
  // Settings
  SETTINGS_UPDATED: 'settings.updated',
}
