const authService = require('./auth.service');
const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');

const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.validated);
  success(res, data);
});

const refresh = asyncHandler(async (req, res) => {
  const data = await authService.refresh(req.validated);
  success(res, data);
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.validated);
  success(res, { message: 'Logged out' });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const data = await authService.forgotPassword(req.validated);
  success(res, { message: 'If the email exists, a reset link has been sent', ...data });
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.validated);
  success(res, { message: 'Password reset successful' });
});

const getMe = asyncHandler(async (req, res) => {
  const data = await authService.getMe(req.user.id);
  success(res, data);
});

const updateMe = asyncHandler(async (req, res) => {
  const data = await authService.updateMe(req.user.id, req.validated);
  success(res, data);
});

const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.validated);
  success(res, { message: 'Password changed' });
});

module.exports = { login, refresh, logout, forgotPassword, resetPassword, getMe, updateMe, changePassword };
