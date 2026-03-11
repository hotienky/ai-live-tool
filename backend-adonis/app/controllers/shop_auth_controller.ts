import type { HttpContext } from '@adonisjs/core/http'
import ShopCustomer from '#models/shop_customer'
import hash from '@adonisjs/core/services/hash'
import db from '@adonisjs/lucid/services/db'
import { randomUUID } from 'node:crypto'

/**
 * ShopAuthController — S-Cart: Shop\Auth\LoginController + RegisterController pattern
 * Public storefront authentication for e-commerce customers
 */
export default class ShopAuthController {
  /**
   * POST /shop/auth/register — Customer registration
   */
  async register({ request, response }: HttpContext) {
    const data = request.only(['firstName', 'lastName', 'email', 'phone', 'password', 'storeId'])

    if (!data.email || !data.password || !data.storeId) {
      return response.badRequest({ error: 'Email, password, and storeId are required' })
    }

    // Check existing
    const existing = await ShopCustomer.query()
      .where('email', data.email)
      .where('storeId', data.storeId)
      .first()
    if (existing) {
      return response.conflict({ error: 'Email already registered for this store' })
    }

    const customer = await ShopCustomer.create({
      ...data,
      password: await hash.make(data.password),
      status: 1,
    })

    // Generate token
    const token = randomUUID()
    return response.status(201).json({
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        storeId: customer.storeId,
      },
      token,
    })
  }

  /**
   * POST /shop/auth/login — Customer login
   */
  async login({ request, response }: HttpContext) {
    const { email, password, storeId } = request.only(['email', 'password', 'storeId'])

    if (!email || !password || !storeId) {
      return response.badRequest({ error: 'Email, password, and storeId are required' })
    }

    const customer = await ShopCustomer.query()
      .where('email', email)
      .where('storeId', storeId)
      .first()
    if (!customer || !customer.password) {
      return response.unauthorized({ error: 'Invalid credentials' })
    }

    const valid = await hash.verify(customer.password, password)
    if (!valid) {
      return response.unauthorized({ error: 'Invalid credentials' })
    }

    if (customer.status !== 1) {
      return response.forbidden({ error: 'Account is inactive' })
    }

    const token = randomUUID()
    return response.json({
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        storeId: customer.storeId,
      },
      token,
    })
  }

  /**
   * GET /shop/auth/me — Get current customer profile
   * (In a real app, would use customer auth middleware; simplified for now)
   */
  async me({ request, response }: HttpContext) {
    const customerId = request.header('X-Customer-Id')
    if (!customerId) {
      return response.unauthorized({ error: 'Customer ID required' })
    }

    const customer = await ShopCustomer.query()
      .where('id', customerId)
      .preload('addresses')
      .first()
    if (!customer) return response.notFound({ error: 'Customer not found' })

    return response.json({
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      storeId: customer.storeId,
      status: customer.status,
      addresses: customer.addresses,
      createdAt: customer.createdAt,
    })
  }

  /**
   * PUT /shop/auth/profile — Update customer profile
   */
  async updateProfile({ request, response }: HttpContext) {
    const customerId = request.header('X-Customer-Id')
    if (!customerId) {
      return response.unauthorized({ error: 'Customer ID required' })
    }

    const customer = await ShopCustomer.find(customerId)
    if (!customer) return response.notFound({ error: 'Customer not found' })

    const data = request.only(['firstName', 'lastName', 'phone'])
    customer.merge(data)
    await customer.save()

    return response.json({
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
    })
  }

  /**
   * PUT /shop/auth/password — Change customer password
   */
  async changePassword({ request, response }: HttpContext) {
    const customerId = request.header('X-Customer-Id')
    if (!customerId) {
      return response.unauthorized({ error: 'Customer ID required' })
    }

    const customer = await ShopCustomer.find(customerId)
    if (!customer) return response.notFound({ error: 'Customer not found' })

    const { currentPassword, newPassword } = request.only(['currentPassword', 'newPassword'])
    if (!currentPassword || !newPassword) {
      return response.badRequest({ error: 'Current and new password required' })
    }

    if (customer.password) {
      const valid = await hash.verify(customer.password, currentPassword)
      if (!valid) {
        return response.unauthorized({ error: 'Current password is incorrect' })
      }
    }

    customer.password = await hash.make(newPassword)
    await customer.save()

    return response.json({ message: 'Password updated successfully' })
  }

  /**
   * POST /shop/auth/forgot-password — Request password reset
   * Generates a token and stores it. In production, would email the link.
   */
  async forgotPassword({ request, response }: HttpContext) {
    const { email, storeId } = request.only(['email', 'storeId'])
    if (!email || !storeId) {
      return response.badRequest({ error: 'Email and storeId are required' })
    }

    const customer = await ShopCustomer.query()
      .where('email', email)
      .where('storeId', storeId)
      .first()

    // Always return success to prevent email enumeration
    if (!customer) {
      return response.json({ message: 'If the email exists, a reset link has been sent' })
    }

    const token = randomUUID()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Store reset token in DB (upsert)
    const existing = await db.from('password_resets')
      .where('email', email)
      .where('store_id', storeId)
      .first()

    if (existing) {
      await db.from('password_resets')
        .where('id', existing.id)
        .update({ token, expires_at: expiresAt, created_at: new Date() })
    } else {
      await db.table('password_resets').insert({
        email,
        store_id: storeId,
        token,
        expires_at: expiresAt,
        created_at: new Date(),
      })
    }

    // In production: send email with reset link containing token
    // For now, return token directly for testing
    return response.json({
      message: 'If the email exists, a reset link has been sent',
      // DEV ONLY: remove in production
      _dev_token: token,
    })
  }

  /**
   * POST /shop/auth/reset-password — Reset password with token
   */
  async resetPassword({ request, response }: HttpContext) {
    const { token, newPassword, storeId } = request.only(['token', 'newPassword', 'storeId'])
    if (!token || !newPassword || !storeId) {
      return response.badRequest({ error: 'Token, newPassword, and storeId are required' })
    }

    if (newPassword.length < 6) {
      return response.badRequest({ error: 'Password must be at least 6 characters' })
    }

    const resetRecord = await db.from('password_resets')
      .where('token', token)
      .where('store_id', storeId)
      .first()

    if (!resetRecord) {
      return response.badRequest({ error: 'Invalid or expired reset token' })
    }

    if (new Date(resetRecord.expires_at) < new Date()) {
      await db.from('password_resets').where('id', resetRecord.id).delete()
      return response.badRequest({ error: 'Reset token has expired' })
    }

    const customer = await ShopCustomer.query()
      .where('email', resetRecord.email)
      .where('storeId', storeId)
      .first()

    if (!customer) {
      return response.badRequest({ error: 'Customer not found' })
    }

    customer.password = await hash.make(newPassword)
    await customer.save()

    // Delete used token
    await db.from('password_resets').where('id', resetRecord.id).delete()

    return response.json({ message: 'Password has been reset successfully' })
  }
}
