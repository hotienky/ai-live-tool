import type { HttpContext } from '@adonisjs/core/http'
import Role from '#models/role'
import User from '#models/user'

export default class RolesController {
  /**
   * List all roles
   */
  async index({ response }: HttpContext) {
    const roles = await Role.query().orderBy('id', 'asc')
    return response.json(roles)
  }

  /**
   * Get available permissions list
   */
  async permissions({ response }: HttpContext) {
    return response.json(Role.availablePermissions())
  }

  /**
   * Create a new role
   */
  async store({ request, response }: HttpContext) {
    const { name, displayName, description, permissions } = request.only([
      'name', 'displayName', 'description', 'permissions',
    ])

    if (!name) return response.badRequest({ error: 'Tên role không được trống' })

    const existing = await Role.findBy('name', name)
    if (existing) return response.conflict({ error: 'Role đã tồn tại' })

    const role = await Role.create({
      name,
      displayName: displayName || name,
      description: description || '',
      permissions: permissions || [],
      isSystem: false,
    })

    return response.created(role)
  }

  /**
   * Show a single role
   */
  async show({ params, response }: HttpContext) {
    const role = await Role.find(params.id)
    if (!role) return response.notFound({ error: 'Role không tồn tại' })
    return response.json(role)
  }

  /**
   * Update a role
   */
  async update({ params, request, response }: HttpContext) {
    const role = await Role.find(params.id)
    if (!role) return response.notFound({ error: 'Role không tồn tại' })

    const { displayName, description, permissions } = request.only([
      'displayName', 'description', 'permissions',
    ])

    if (displayName !== undefined) role.displayName = displayName
    if (description !== undefined) role.description = description
    if (permissions !== undefined) role.permissions = permissions

    await role.save()
    return response.json(role)
  }

  /**
   * Delete a role (non-system only)
   */
  async destroy({ params, response }: HttpContext) {
    const role = await Role.find(params.id)
    if (!role) return response.notFound({ error: 'Role không tồn tại' })
    if (role.isSystem) return response.forbidden({ error: 'Không thể xóa role hệ thống' })

    // Unset role_id for users with this role
    await User.query().where('roleId', role.id).update({ roleId: null })
    await role.delete()

    return response.json({ success: true })
  }

  /**
   * List all users with their roles
   */
  async users({ response }: HttpContext) {
    const users = await User.query()
      .select('id', 'name', 'fullName', 'email', 'role', 'roleId', 'isActive', 'lastLoginAt', 'createdAt')
      .orderBy('id', 'asc')
    return response.json(users)
  }

  /**
   * Assign a role to a user
   */
  async assignRole({ params, request, response }: HttpContext) {
    const user = await User.find(params.id)
    if (!user) return response.notFound({ error: 'User không tồn tại' })

    const { roleId } = request.only(['roleId'])
    if (roleId) {
      const role = await Role.find(roleId)
      if (!role) return response.notFound({ error: 'Role không tồn tại' })
      user.roleId = roleId
      user.role = role.name
    } else {
      user.roleId = null as any
      user.role = 'user'
    }

    await user.save()
    return response.json({ id: user.id, email: user.email, role: user.role, roleId: user.roleId })
  }
}
