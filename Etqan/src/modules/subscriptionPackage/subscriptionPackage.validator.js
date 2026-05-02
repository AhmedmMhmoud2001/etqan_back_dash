const { body, param, query, validationResult } = require('express-validator');

const idParamRules = () => [param('id').trim().notEmpty().withMessage('id is required')];

const listRules = () => [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('activeOnly').optional().isBoolean().toBoolean(),
];

const createRules = () => [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('durationMonths').notEmpty().isInt({ min: 1 }).withMessage('durationMonths must be >= 1'),
  body('listPrice').notEmpty().withMessage('listPrice required'),
  body('payPrice').notEmpty().withMessage('payPrice required'),
  body('currency').optional().isString(),
  body('isActive').optional().isBoolean(),
];

const updateRules = () => [
  ...idParamRules(),
  body('name').optional().isString(),
  body('durationMonths').optional().isInt({ min: 1 }),
  body('listPrice').optional(),
  body('payPrice').optional(),
  body('currency').optional().isString(),
  body('isActive').optional().isBoolean(),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const extracted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  return res.status(400).json({ success: false, message: 'Validation failed', errors: extracted });
};

module.exports = { idParamRules, listRules, createRules, updateRules, validate };

