import type { HttpContext } from '@adonisjs/core/http'
import LoginAction from '../actions/login_action.js'
import GetMeAction from '../actions/get_me_action.js'
import LogoutAction from '../actions/logout_action.js'

/**
 * Controller: Master Authentication.
 * Thin controller — delegates to single-responsibility actions.
 */
export default class MasterAuthController {
  /**
   * POST /api/master/auth/login
   */
  async login({ request, response }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])
    const action = new LoginAction()
    const result = await action.execute(email, password)

    if (!result.success) {
      return response.status(result.status!).json({ error: result.error })
    }

    return response.json(result.data)
  }

  /**
   * GET /api/master/auth/me
   */
  async me({ request, response }: HttpContext) {
    const authHeader = request.header('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return response.unauthorized({ error: 'Token required' })
    }

    const action = new GetMeAction()
    const result = await action.execute(authHeader.slice(7))

    if (!result.success) {
      return response.status(result.status!).json({ error: result.error })
    }

    return response.json(result.data)
  }

  /**
   * POST /api/master/auth/logout
   */
  async logout({ request, response }: HttpContext) {
    const authHeader = request.header('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const action = new LogoutAction()
      await action.execute(authHeader.slice(7))
    }
    return response.json({ message: 'Logged out' })
  }
}
