import User from '#models/user'

interface Params {
  email: string
  password: string
}

interface Result {
  error?: string
  token?: string
  user?: { id: number; email: string; fullName: string; role: string }
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

    const token = await User.accessTokens.create(user)
    const tokenValue = token.value!.release()

    return {
      token: tokenValue,
      user: { id: user.id, email: user.email, fullName: user.fullName || '', role: user.role },
    }
  }
}
