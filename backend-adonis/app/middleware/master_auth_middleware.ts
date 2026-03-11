import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import db from '@adonisjs/lucid/services/db'

/**
 * MasterAuthMiddleware — Protects master panel API routes.
 * Verifies Bearer token against master_access_tokens table.
 */
export default class MasterAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const authHeader = ctx.request.header('authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return ctx.response.unauthorized({ error: 'Authentication required' })
    }

    const token = authHeader.slice(7)

    const tokenRecord = await db.connection('master')
      .from('master_access_tokens')
      .where('token', token)
      .where('expires_at', '>', new Date())
      .first()

    if (!tokenRecord) {
      return ctx.response.unauthorized({ error: 'Invalid or expired token' })
    }

    const user = await db.connection('master')
      .from('master_users')
      .where('id', tokenRecord.user_id)
      .select('id', 'email', 'name', 'role')
      .first()

    if (!user) {
      return ctx.response.unauthorized({ error: 'User not found' })
    }

    // Attach user to context
    ;(ctx as any).masterUser = user

    return next()
  }
}
