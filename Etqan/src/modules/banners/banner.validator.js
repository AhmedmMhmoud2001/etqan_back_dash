const { body, param, query, validationResult } = require('express-validator');

const idParamRules = () => [param('id').trim().notEmpty().withMessage('id is required')];

const listRules = () => [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

const createRules = () => [
  body('imageUrl').trim().notEmpty().withMessage('imageUrl is required'),
  body('title').optional().isString(),
  body('titleAr').optional().isString(),
  body('titleIt').optional().isString(),
  body('description').optional().isString(),
  body('descriptionAr').optional().isString(),
  body('descriptionIt').optional().isString(),
  body('link').optional().isString(),
  body('order').optional().isInt(),
  body('isActive').optional().isBoolean(),
  body('startsAt').optional({ values: 'null' }).isString(),
  body('endsAt').optional({ values: 'null' }).isString(),
];

const updateRules = () => [
  ...idParamRules(),
  body('imageUrl').optional().isString(),
  body('title').optional().isString(),
  body('titleAr').optional().isString(),
  body('titleIt').optional().isString(),
  body('description').optional().isString(),
  body('descriptionAr').optional().isString(),
  body('descriptionIt').optional().isString(),
  body('link').optional().isString(),
  body('order').optional().isInt(),
  body('isActive').optional().isBoolean(),
  body('startsAt').optional({ values: 'null' }).isString(),
  body('endsAt').optional({ values: 'null' }).isString(),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const extracted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  return res.status(400).json({ success: false, message: 'Validation failed', errors: extracted });
};

module.exports = {
  idParamRules,
  listRules,
  createRules,
  updateRules,
  validate,
};

