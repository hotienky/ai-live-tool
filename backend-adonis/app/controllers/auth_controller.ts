import type { HttpContext } from '@adonisjs/core/http'
import RegisterUserAction from '#actions/auth/register_user_action'
import LoginUserAction from '#actions/auth/login_user_action'

export default class AuthController {
  async register({ request, response }: HttpContext) {
    const { email, password, fullName } = request.only(['email', 'password', 'fullName'])
    const result = await RegisterUserAction.handle({ email, password, fullName })

    if (result.error) {
      if (result.error.includes('đăng ký')) return response.conflict({ error: result.error })
      return response.badRequest({ error: result.error })
    }
    return response.json({ token: result.token, user: result.user })
  }

  async login({ request, response }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])
    const result = await LoginUserAction.handle({ email, password })

    if (result.error) {
      if (result.error.includes('Sai')) return response.unauthorized({ error: result.error })
      return response.badRequest({ error: result.error })
    }
    return response.json({ token: result.token, user: result.user })
  }

  async me({ auth, response }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized({ error: 'Chưa đăng nhập' })
    return response.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    })
  }
}
