const AUTH_COOKIE_NAME = 'auth_token'
const AUTH_COOKIE_MAX_AGE_MS = 60 * 60 * 1000 // 1 hour

export const setAuthCookie = (res, token, rememberMe) => {
  const persistSession = Boolean(rememberMe)
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: persistSession ? AUTH_COOKIE_MAX_AGE_MS : undefined,
    path: '/'
  })
}

export const clearAuthCookie = (res) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  })
}

export const getAuthTokenFromCookies = (req) => {
  const cookieHeader = req.headers.cookie
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(';')
  for (const cookie of cookies) {
    const [rawName, ...rest] = cookie.trim().split('=')
    if (rawName === AUTH_COOKIE_NAME) {
      return decodeURIComponent(rest.join('='))
    }
  }

  return null
}