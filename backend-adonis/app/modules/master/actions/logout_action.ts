import db from '@adonisjs/lucid/services/db'

/**
 * Action: Invalidate a master access token (logout).
 */
export default class LogoutAction {
  async execute(token: string) {
    await db.connection('master')
      .from('master_access_tokens')
      .where('token', token)
      .delete()

    return { success: true, message: 'Logged out' }
  }
}
