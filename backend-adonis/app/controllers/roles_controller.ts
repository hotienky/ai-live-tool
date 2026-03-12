import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class RolesController {
  async index({ response }: HttpContext) {
    const roles = await db.from('roles').orderBy('id', 'asc')
    return response.json(roles)
  }

  async permissions({ response }: HttpContext) {
    return response.json([
      'dashboard', 'crm.*', 'leads.*', 'orders.*', 'products.*',
      'content.*', 'settings.*', 'analytics.*', 'users.*', '*',
    ])
  }

  async store({ request, response }: HttpContext) {
    const { name, display_name, description, permissions } = request.only([
      'name', 'display_name', 'description', 'permissions',
    ])
    if (!name) return response.badRequest({ error: 'Tên role không được trống' })

    const existing = await db.from('roles').where('name', name).first()
    if (existing) return response.conflict({ error: 'Role đã tồn tại' })

    const [role] = await db.table('roles').insert({
      name,
      display_name: display_name || name,
      description: description || '',
      permissions: JSON.stringify(permissions || []),
      is_system: false,
    }).returning('*')

    return response.status(201).json(role)
  }

  async show({ params, response }: HttpContext) {
    const role = await db.from('roles').where('id', params.id).first()
    if (!role) return response.notFound({ error: 'Role không tồn tại' })
    return response.json(role)
  }

  async update({ params, request, response }: HttpContext) {
    const role = await db.from('roles').where('id', params.id).first()
    if (!role) return response.notFound({ error: 'Role không tồn tại' })

    const data = request.only(['display_name', 'description', 'permissions'])
    const updateData: any = {}
    if (data.display_name !== undefined) updateData.display_name = data.display_name
    if (data.description !== undefined) updateData.description = data.description
    if (data.permissions !== undefined) updateData.permissions = JSON.stringify(data.permissions)
    updateData.updated_at = new Date()

    await db.from('roles').where('id', params.id).update(updateData)
    const updated = await db.from('roles').where('id', params.id).first()
    return response.json(updated)
  }

  async destroy({ params, response }: HttpContext) {
    const role = await db.from('roles').where('id', params.id).first()
    if (!role) return response.notFound({ error: 'Role không tồn tại' })
    if (role.is_system) return response.forbidden({ error: 'Không thể xóa role hệ thống' })

    await db.from('users').where('role_id', role.id).update({ role_id: null })
    await db.from('roles').where('id', params.id).delete()
    return response.json({ success: true })
  }

  async users({ response }: HttpContext) {
    const users = await db.from('users')
      .select('id', 'full_name', 'email', 'role', 'role_id', 'is_active', 'last_login_at', 'created_at')
      .orderBy('id', 'asc')
    return response.json(users)
  }

  async assignRole({ params, request, response }: HttpContext) {
    const user = await db.from('users').where('id', params.id).first()
    if (!user) return response.notFound({ error: 'User không tồn tại' })

    const { roleId } = request.only(['roleId'])
    if (roleId) {
      const role = await db.from('roles').where('id', roleId).first()
      if (!role) return response.notFound({ error: 'Role không tồn tại' })
      await db.from('users').where('id', params.id).update({ role_id: roleId, role: role.name })
    } else {
      await db.from('users').where('id', params.id).update({ role_id: null, role: 'user' })
    }

    const updated = await db.from('users').where('id', params.id).first()
    return response.json({ id: updated.id, email: updated.email, role: updated.role, role_id: updated.role_id })
  }
}
