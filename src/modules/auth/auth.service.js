const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db       = require('../../config/database');
const env      = require('../../config/env');
const { UnauthorizedError, NotFoundError, BusinessError } = require('../../utils/AppError');

const ACCESS_TTL  = '15m';
const REFRESH_TTL = '7d';
const REFRESH_MS  = 7 * 24 * 3600 * 1000;

const signAccess = (userId, tenantId, roleName) =>
  jwt.sign({ userId, tenantId, roleName }, env.JWT_SECRET, { expiresIn: ACCESS_TTL });

const signRefresh = (userId) =>
  jwt.sign({ userId }, env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TTL });

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const login = async ({ email, password }) => {
  const user = await db('users').whereRaw('LOWER(email) = ?', [email.toLowerCase()]).andWhere('deleted_at', null).first();
  if (!user || !user.is_active) throw new UnauthorizedError('Invalid credentials');

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw new UnauthorizedError('Invalid credentials');

  const accessToken  = signAccess(user.id, user.tenant_id, user.role_name);
  const refreshToken = signRefresh(user.id);

  await db('refresh_tokens').insert({
    id:          uuidv4(),
    user_id:     user.id,
    token_hash:  hashToken(refreshToken),
    expires_at:  new Date(Date.now() + REFRESH_MS).toISOString(),
    revoked:     false,
    created_at:  new Date().toISOString(),
    updated_at:  new Date().toISOString(),
  });

  await db('users').where({ id: user.id }).update({ last_login_at: new Date().toISOString(), updated_at: new Date().toISOString() });

  const { password_hash, ...safeUser } = user;
  return { access_token: accessToken, refresh_token: refreshToken, user: safeUser };
};

const refresh = async ({ refresh_token }) => {
  let decoded;
  try { decoded = jwt.verify(refresh_token, env.JWT_REFRESH_SECRET); }
  catch { throw new UnauthorizedError('Invalid or expired refresh token'); }

  const stored = await db('refresh_tokens')
    .where({ token_hash: hashToken(refresh_token), revoked: false })
    .andWhere('expires_at', '>', new Date().toISOString())
    .first();
  if (!stored) throw new UnauthorizedError('Refresh token revoked or expired');

  const user = await db('users').where({ id: decoded.userId, deleted_at: null }).first();
  if (!user || !user.is_active) throw new UnauthorizedError('User not found');

  const accessToken = signAccess(user.id, user.tenant_id, user.role_name);
  return { access_token: accessToken };
};

const logout = async ({ refresh_token }) => {
  await db('refresh_tokens').where({ token_hash: hashToken(refresh_token) }).update({ revoked: true, updated_at: new Date().toISOString() });
};

const forgotPassword = async ({ email }) => {
  const user = await db('users').whereRaw('LOWER(email) = ?', [email.toLowerCase()]).first();
  if (!user) return; // silent – don't leak existence

  const token   = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600 * 1000).toISOString();

  await db('users').where({ id: user.id }).update({
    password_reset_token:   token,
    password_reset_expires: expires,
    updated_at: new Date().toISOString(),
  });

  // In production, send email. Here we return token for testing.
  return { reset_token: token };
};

const resetPassword = async ({ token, password }) => {
  const user = await db('users')
    .where({ password_reset_token: token })
    .andWhere('password_reset_expires', '>', new Date().toISOString())
    .first();
  if (!user) throw new BusinessError('Invalid or expired reset token');

  const password_hash = await bcrypt.hash(password, 12);
  await db('users').where({ id: user.id }).update({
    password_hash,
    password_reset_token:   null,
    password_reset_expires: null,
    updated_at: new Date().toISOString(),
  });

  // revoke all refresh tokens
  await db('refresh_tokens').where({ user_id: user.id }).update({ revoked: true, updated_at: new Date().toISOString() });
};

const getMe = async (userId) => {
  const user = await db('users').where({ id: userId, deleted_at: null }).first();
  if (!user) throw new NotFoundError('User not found');
  const { password_hash, ...safe } = user;
  return safe;
};

const updateMe = async (userId, data) => {
  await db('users').where({ id: userId }).update({ ...data, updated_at: new Date().toISOString() });
  return getMe(userId);
};

const changePassword = async (userId, { current_password, new_password }) => {
  const user = await db('users').where({ id: userId }).first();
  const ok   = await bcrypt.compare(current_password, user.password_hash);
  if (!ok) throw new BusinessError('Current password is incorrect');

  const password_hash = await bcrypt.hash(new_password, 12);
  await db('users').where({ id: userId }).update({ password_hash, updated_at: new Date().toISOString() });

  await db('refresh_tokens').where({ user_id: userId }).update({ revoked: true, updated_at: new Date().toISOString() });
};

module.exports = { login, refresh, logout, forgotPassword, resetPassword, getMe, updateMe, changePassword };
