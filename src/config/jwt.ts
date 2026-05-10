const accessTokenSecret = process.env.JWT_ACCESS_SECRET;
const refreshTokenSecret = process.env.JWT_REFRESH_SECRET;

if (!accessTokenSecret || !refreshTokenSecret) {
  throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET environment variables must be set');
}

export const jwtConfig = {
  accessTokenSecret,
  refreshTokenSecret,
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  issuer: process.env.JWT_ISSUER || 'kact-api',
  audience: process.env.JWT_AUDIENCE || 'kact-users',
};

export const bcryptConfig = {
  saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
};
