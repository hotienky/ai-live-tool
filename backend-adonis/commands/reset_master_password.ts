import { BaseCommand } from '@adonisjs/core/ace'
import db from '@adonisjs/lucid/services/db'
import hash from '@adonisjs/core/services/hash'

export default class ResetMasterPassword extends BaseCommand {
  static commandName = 'master:reset-password'
  static description = 'Reset master admin password'

  async run() {
    const email = 'admin@master.com'
    const newPassword = 'Admin@123'

    const hashed = await hash.make(newPassword)
    
    await db.connection('master')
      .from('master_users')
      .where('email', email)
      .update({ password: hashed })

    this.logger.success(`Password reset for ${email}`)
    this.logger.info(`New password: ${newPassword}`)
    this.logger.info(`Hash: ${hashed.substring(0, 30)}...`)
  }
}
