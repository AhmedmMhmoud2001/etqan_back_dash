const { body, validationResult } = require('express-validator');

const upsertRules = () => [
  body('weight').notEmpty().withMessage('weight is required').isFloat({ min: 0 }).withMessage('weight must be a number'),
  body('bodyFat').optional({ values: 'null' }).isFloat({ min: 0 }).withMessage('bodyFat must be a number'),
  body('muscleMass').optional({ values: 'null' }).isFloat({ min: 0 }).withMessage('muscleMass must be a number'),
  body('water').optional({ values: 'null' }).isFloat({ min: 0 }).withMessage('water must be a number'),
  body('waist').optional({ values: 'null' }).isFloat({ min: 0 }).withMessage('waist must be a number'),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const extracted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  return res.status(400).json({ success: false, message: 'Validation failed', errors: extracted });
};

module.exports = {
  upsertRules,
  validate,
};

