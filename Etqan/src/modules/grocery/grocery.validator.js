const { body, param, validationResult } = require('express-validator');

const idParam = (name = 'id') => [param(name).trim().notEmpty().withMessage(`${name} is required`)];

const createRules = () => [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 200 }),
  body('quantity').optional().trim().isLength({ max: 50 }),
  body('checked').optional().isBoolean().toBoolean(),
  body('order').optional().isInt({ min: 0 }).toInt(),
];

const updateRules = () => [
  param('id').trim().notEmpty().withMessage('id is required'),
  body('name').optional().trim().notEmpty().isLength({ max: 200 }),
  body('quantity').optional().trim().isLength({ max: 50 }),
  body('checked').optional().isBoolean().toBoolean(),
  body('order').optional().isInt({ min: 0 }).toInt(),
];

const toggleRules = () => [
  param('id').trim().notEmpty().withMessage('id is required'),
  body('checked').isBoolean().withMessage('checked is required').toBoolean(),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const extracted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  return res.status(400).json({ success: false, message: 'Validation failed', errors: extracted });
};

module.exports = {
  idParam,
  createRules,
  updateRules,
  toggleRules,
  validate,
};
