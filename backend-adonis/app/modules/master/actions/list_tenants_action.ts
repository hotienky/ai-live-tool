import db from '@adonisjs/lucid/services/db'

/**
 * Action: List tenants with pagination and optional search.
 * Single Responsibility: Query + pagination only.
 */
export default class ListTenantsAction {
  async execute(page: number = 1, limit: number = 20, search?: string) {
    const query = db.connection('master')
      .from('tenants')
      .select('*')
      .orderBy('created_at', 'desc')

    if (search) {
      query.where((q: any) => {
        q.whereILike('name', `%${search}%`)
          .orWhereILike('slug', `%${search}%`)
          .orWhereILike('owner_email', `%${search}%`)
      })
    }

    return query.paginate(page, limit)
  }
}
