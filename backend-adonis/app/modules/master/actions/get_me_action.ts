import db from '@adonisjs/lucid/services/db'

/**
 * Action: Resolve master user from Bearer token.
 * Single Responsibility: Token → User lookup.
 */
export default class GetMeAction {
  async execute(token: string) {
    const tokenRecord = await db.connection('master')
      .from('master_access_tokens')
      .where('token', token)
      .where('expires_at', '>', new Date())
      .first()

    if (!tokenRecord) {
      return { success: false, error: 'Invalid or expired token', status: 401 }
    }

    const user = await db.connection('master')
      .from('master_users')
      .where('id', tokenRecord.user_id)
      .select('id', 'email', 'name', 'role')
      .first()

    if (!user) {
      return { success: false, error: 'User not found', status: 401 }
    }

    return { success: true, data: user }
  }
}
