import User from '#models/user'
import Shop from '#models/shop'

interface Params {
  email: string
  password: string
  fullName?: string
}

interface Result {
  error?: string
  token?: string
  user?: { id: number; email: string; fullName: string; role: string }
  shop?: { id: number; shopName: string }
}

export default class RegisterUserAction {
  static async handle({ email, password, fullName }: Params): Promise<Result> {
    if (!email || !password) {
      return { error: 'Email và mật khẩu là bắt buộc' }
    }
    if (password.length < 6) {
      return { error: 'Mật khẩu tối thiểu 6 ký tự' }
    }

    const existing = await User.findBy('email', email)
    if (existing) {
      return { error: 'Email đã được đăng ký' }
    }

    const displayName = fullName || email.split('@')[0]

    const user = await User.create({
      email,
      password,
      name: displayName,
      fullName: displayName,
      role: 'user',
    })

    // Auto-create default shop for the new user (1 user = 1 shop)
    const shop = await Shop.create({
      userId: user.id,
      shopName: `${displayName}'s Shop`,
      platform: 'tiktok',
      isActive: true,
    })

    const token = await User.accessTokens.create(user)
    const tokenValue = token.value!.release()

    return {
      token: tokenValue,
      user: { id: user.id, email: user.email, fullName: user.fullName || '', role: user.role },
      shop: { id: shop.id, shopName: shop.shopName },
    }
  }
}
