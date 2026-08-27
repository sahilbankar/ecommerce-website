/**
 * Centralized JWT and Refresh Token configuration settings
 */
module.exports = {
  access: {
    secret: process.env.JWT_SECRET || 'default_access_secret_key',
    expiresIn: process.env.JWT_EXPIRE || '15m'
  },
  refresh: {
    secret: process.env.REFRESH_TOKEN_SECRET || 'default_refresh_secret_key',
    expiresIn: process.env.REFRESH_TOKEN_EXPIRE || '7d'
  },
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  }
};
