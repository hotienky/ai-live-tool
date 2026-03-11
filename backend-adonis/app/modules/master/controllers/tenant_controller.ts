import type { HttpContext } from '@adonisjs/core/http'
import ListTenantsAction from '../actions/list_tenants_action.js'
import GetTenantAction from '../actions/get_tenant_action.js'
import CreateTenantAction from '../actions/create_tenant_action.js'
import UpdateTenantAction from '../actions/update_tenant_action.js'
import CreateTenantValidator from '../validators/create_tenant_validator.js'
import UpdateTenantValidator from '../validators/update_tenant_validator.js'
import TenantService from '../services/tenant_service.js'

/**
 * Controller: Tenant CRUD + lifecycle management.
 * Thin controller — validates input, delegates to actions/services.
 */
export default class TenantController {
  /**
   * GET /api/master/tenants
   */
  async index({ request, response }: HttpContext) {
    const page = Number(request.qs().page || 1)
    const limit = Number(request.qs().limit || 20)
    const search = request.qs().search

    const action = new ListTenantsAction()
    const result = await action.execute(page, limit, search)
    return response.json(result)
  }

  /**
   * GET /api/master/tenants/:id
   */
  async show({ params, response }: HttpContext) {
    const action = new GetTenantAction()
    const tenant = await action.execute(Number(params.id))

    if (!tenant) {
      return response.notFound({ error: 'Tenant not found' })
    }

    return response.json(tenant)
  }

  /**
   * POST /api/master/tenants
   */
  async store({ request, response }: HttpContext) {
    const data = request.only(['name', 'slug', 'ownerEmail', 'ownerName', 'plan'])

    // Validate
    const validation = CreateTenantValidator.validate(data)
    if (!validation.isValid) {
      return response.badRequest({ errors: validation.errors })
    }

    // Execute
    const action = new CreateTenantAction()
    try {
      const result = await action.execute(data)
      if (!result.success) {
        return response.status(result.status!).json({ error: result.error })
      }
      return response.created(result.data)
    } catch (error: any) {
      return response.internalServerError({ error: 'Failed to create tenant', details: error.message })
    }
  }

  /**
   * PUT /api/master/tenants/:id
   */
  async update({ params, request, response }: HttpContext) {
    const updates = request.only(['name', 'status', 'plan', 'custom_domain', 'logo', 'settings'])

    // Validate
    const validation = UpdateTenantValidator.validate(updates)
    if (!validation.isValid) {
      return response.badRequest({ errors: validation.errors })
    }

    // Execute
    const action = new UpdateTenantAction()
    const tenant = await action.execute(Number(params.id), updates)

    if (!tenant) {
      return response.notFound({ error: 'Tenant not found' })
    }

    return response.json(tenant)
  }

  /**
   * POST /api/master/tenants/:id/suspend
   */
  async suspend({ params, response }: HttpContext) {
    const action = new GetTenantAction()
    const tenant = await action.execute(Number(params.id))
    if (!tenant) return response.notFound({ error: 'Tenant not found' })

    await TenantService.suspendTenant(tenant.slug)
    return response.json({ message: `Tenant ${tenant.slug} suspended` })
  }

  /**
   * POST /api/master/tenants/:id/activate
   */
  async activate({ params, response }: HttpContext) {
    const action = new GetTenantAction()
    const tenant = await action.execute(Number(params.id))
    if (!tenant) return response.notFound({ error: 'Tenant not found' })

    await TenantService.activateTenant(tenant.slug)
    return response.json({ message: `Tenant ${tenant.slug} activated` })
  }

  /**
   * DELETE /api/master/tenants/:id
   */
  async destroy({ params, response }: HttpContext) {
    const action = new GetTenantAction()
    const tenant = await action.execute(Number(params.id))
    if (!tenant) return response.notFound({ error: 'Tenant not found' })

    try {
      await TenantService.deleteTenant(tenant.slug)
      return response.json({ message: `Tenant ${tenant.slug} deleted` })
    } catch (error: any) {
      return response.internalServerError({ error: 'Delete failed', details: error.message })
    }
  }

  /**
   * POST /api/master/tenants/:id/migrate
   */
  async migrate({ params, response }: HttpContext) {
    const action = new GetTenantAction()
    const tenant = await action.execute(Number(params.id))
    if (!tenant) return response.notFound({ error: 'Tenant not found' })

    try {
      await TenantService.migrateTenant(tenant.slug, tenant.db_name)
      return response.json({ message: `Migrations run for ${tenant.slug}` })
    } catch (error: any) {
      return response.internalServerError({ error: 'Migration failed', details: error.message })
    }
  }

  /**
   * POST /api/master/tenants/:id/seed
   */
  async seed({ params, response }: HttpContext) {
    const action = new GetTenantAction()
    const tenant = await action.execute(Number(params.id))
    if (!tenant) return response.notFound({ error: 'Tenant not found' })

    try {
      await TenantService.seedTenant(tenant.slug)
      return response.json({ message: `Sample data seeded for ${tenant.slug}` })
    } catch (error: any) {
      return response.internalServerError({ error: 'Seed failed', details: error.message })
    }
  }
}
