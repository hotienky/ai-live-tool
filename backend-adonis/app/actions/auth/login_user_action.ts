import User from '#models/user'
import Shop from '#models/shop'

interface Params {
  email: string
  password: string
}

interface Result {
  error?: string
  token?: string
  user?: { id: number; email: string; fullName: string; role: string }
  shop?: { id: number; shopName: string } | null
}

export default class LoginUserAction {
  static async handle({ email, password }: Params): Promise<Result> {
    if (!email || !password) {
      return { error: 'Email và mật khẩu là bắt buộc' }
    }

    const user = await User.verifyCredentials(email, password).catch(() => null)
    if (!user) {
      return { error: 'Sai email hoặc mật khẩu' }
    }

    // Find or create user's shop (skip gracefully for tenant DBs without shops table)
    let shop: any = null
    try {
      shop = await Shop.query().where('userId', user.id).first()
      if (!shop) {
        shop = await Shop.create({
          userId: user.id,
          shopName: `${user.fullName || user.email.split('@')[0]}'s Shop`,
          platform: 'tiktok',
          isActive: true,
        })
      }
    } catch {
      // shops table doesn't exist in tenant DB — skip
    }

    const token = await User.accessTokens.create(user)
    const tokenValue = token.value!.release()

    return {
      token: tokenValue,
      user: { id: user.id, email: user.email, fullName: user.fullName || '', role: user.role },
      shop: shop ? { id: shop.id, shopName: shop.shopName } : null,
    }
  }
}
