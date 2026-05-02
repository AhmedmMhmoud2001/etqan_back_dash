const { body, param, validationResult, query } = require('express-validator');

const listRules = () => [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be int >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1..100'),
  query('search').optional().isString(),
  query('plan').optional().isIn(['FREE', 'PREMIUM']).withMessage('plan must be FREE or PREMIUM'),
];

const userIdParamRules = () => [
  param('userId').trim().notEmpty().withMessage('userId is required'),
];

const updateRules = () => [
  ...userIdParamRules(),
  body('plan').optional().isIn(['FREE', 'PREMIUM']).withMessage('plan must be FREE or PREMIUM'),
  body('endsAt').optional({ values: 'null' }).isString().withMessage('endsAt must be ISO string or null'),
];

const assignPackageRules = () => [
  ...userIdParamRules(),
  body('packageId').trim().notEmpty().withMessage('packageId is required'),
  body('listPrice').optional(),
  body('payPrice').optional(),
  body('currency').optional().isString(),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const extracted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  return res.status(400).json({ success: false, message: 'Validation failed', errors: extracted });
};

module.exports = {
  listRules,
  userIdParamRules,
  updateRules,
  assignPackageRules,
  validate,
};

