import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import hash from '@adonisjs/core/services/hash'
import { randomBytes } from 'node:crypto'

/**
 * Action: Authenticate a master administrator.
 * Single Responsibility: Only handles login logic.
 */
export default class LoginAction {
  async execute(email: string, password: string) {
    if (!email || !password) {
      return { success: false, error: 'Email and password required', status: 400 }
    }

    const user = await db.connection('master')
      .from('master_users')
      .where('email', email)
      .first()

    if (!user) {
      return { success: false, error: 'Invalid credentials', status: 401 }
    }

    const isValid = await hash.verify(user.password, password)
    if (!isValid) {
      return { success: false, error: 'Invalid credentials', status: 401 }
    }

    // Generate token
    const token = randomBytes(32).toString('hex')
    await db.connection('master')
      .table('master_access_tokens')
      .insert({
        user_id: user.id,
        token,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })

    return {
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      },
    }
  }
}
