const { body, validationResult } = require('express-validator');

const updateRules = () => [
  body('discountPercentPerReferral').optional().isInt({ min: 0, max: 100 }),
  body('maxDiscountPercent').optional().isInt({ min: 0, max: 100 }),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const extracted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  return res.status(400).json({ success: false, message: 'Validation failed', errors: extracted });
};

module.exports = { updateRules, validate };

