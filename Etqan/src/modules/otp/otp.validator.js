const { body, validationResult } = require('express-validator');

const verifyRules = () => [
  body('userId').trim().notEmpty().withMessage('userId is required'),
  body('code').trim().notEmpty().withMessage('OTP code is required').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('type').optional().trim(),
];

const resendRules = () => [
  body('userId').optional().trim(),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const extracted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  return res.status(400).json({ success: false, message: 'Validation failed', errors: extracted });
};

module.exports = { verifyRules, resendRules, validate };
