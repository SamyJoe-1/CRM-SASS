const router   = require('express').Router();
const ctrl     = require('./auth.controller');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const { authLimiter } = require('../../middleware/rateLimiter');
const {
  loginSchema, refreshSchema, forgotSchema, resetSchema,
  updateMeSchema, changePasswordSchema,
} = require('./auth.validator');

router.post('/login',           authLimiter, validate(loginSchema),          ctrl.login);
router.post('/refresh',         authLimiter, validate(refreshSchema),         ctrl.refresh);
router.post('/logout',          validate(refreshSchema),                      ctrl.logout);
router.post('/forgot-password', authLimiter, validate(forgotSchema),          ctrl.forgotPassword);
router.post('/reset-password',  authLimiter, validate(resetSchema),           ctrl.resetPassword);
router.get ('/me',              authenticate,                                 ctrl.getMe);
router.put ('/me',              authenticate, validate(updateMeSchema),       ctrl.updateMe);
router.put ('/me/password',     authenticate, validate(changePasswordSchema), ctrl.changePassword);

module.exports = router;
