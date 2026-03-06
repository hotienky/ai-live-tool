import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class AuthController {
  async register({ request, response }: HttpContext) {
    const { email, password, fullName } = request.only(['email', 'password', 'fullName'])

    if (!email || !password) {
      return response.badRequest({ error: 'Email và mật khẩu là bắt buộc' })
    }
    if (password.length < 6) {
      return response.badRequest({ error: 'Mật khẩu tối thiểu 6 ký tự' })
    }

    const existing = await User.findBy('email', email)
    if (existing) {
      return response.conflict({ error: 'Email đã được đăng ký' })
    }

    const user = await User.create({
      email,
      password,
      fullName: fullName || email.split('@')[0],
      role: 'user',
    })

    const token = await User.accessTokens.create(user)

    return response.json({
      token: token.value!.release(),
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    })
  }

  async login({ request, response }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])

    if (!email || !password) {
      return response.badRequest({ error: 'Email và mật khẩu là bắt buộc' })
    }

    const user = await User.verifyCredentials(email, password).catch(() => null)
    if (!user) {
      return response.unauthorized({ error: 'Sai email hoặc mật khẩu' })
    }

    const token = await User.accessTokens.create(user)

    return response.json({
      token: token.value!.release(),
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    })
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
