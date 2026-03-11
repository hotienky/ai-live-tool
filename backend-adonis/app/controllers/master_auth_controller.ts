import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import hash from '@adonisjs/core/services/hash'
import { randomBytes } from 'node:crypto'

/**
 * MasterAuthController — Authentication for master panel superadmins.
 * Uses the master DB connection.
 */
export default class MasterAuthController {
  /**
   * POST /api/master/auth/login
   */
  async login({ request, response }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])

    if (!email || !password) {
      return response.badRequest({ error: 'Email and password required' })
    }

    const user = await db.connection('master')
      .from('master_users')
      .where('email', email)
      .first()

    if (!user) {
      return response.unauthorized({ error: 'Invalid credentials' })
    }

    const isValid = await hash.verify(user.password, password)
    if (!isValid) {
      return response.unauthorized({ error: 'Invalid credentials' })
    }

    // Generate simple token
    const token = randomBytes(32).toString('hex')
    await db.connection('master')
      .table('master_access_tokens')
      .insert({
        user_id: user.id,
        token,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      })

    return response.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    })
  }

  /**
   * GET /api/master/auth/me
   */
  async me({ request, response }: HttpContext) {
    const authHeader = request.header('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return response.unauthorized({ error: 'Token required' })
    }

    const token = authHeader.slice(7)
    const tokenRecord = await db.connection('master')
      .from('master_access_tokens')
      .where('token', token)
      .where('expires_at', '>', new Date())
      .first()

    if (!tokenRecord) {
      return response.unauthorized({ error: 'Invalid or expired token' })
    }

    const user = await db.connection('master')
      .from('master_users')
      .where('id', tokenRecord.user_id)
      .select('id', 'email', 'name', 'role')
      .first()

    return response.json(user)
  }

  /**
   * POST /api/master/auth/logout
   */
  async logout({ request, response }: HttpContext) {
    const authHeader = request.header('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      await db.connection('master')
        .from('master_access_tokens')
        .where('token', token)
        .delete()
    }
    return response.json({ message: 'Logged out' })
  }
}
