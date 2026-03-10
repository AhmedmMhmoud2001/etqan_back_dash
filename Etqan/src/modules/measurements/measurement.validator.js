const { body, param, query, validationResult } = require('express-validator');

const idParam = (name = 'id') => [param(name).trim().notEmpty().withMessage(`${name} is required`)];

const createMeasurementRules = () => [
  body('weight').isFloat({ min: 0, max: 500 }).withMessage('weight is required (0-500 kg)').toFloat(),
  body('bodyFat').optional().isFloat({ min: 0, max: 100 }).toFloat(),
  body('muscleMass').optional().isFloat({ min: 0, max: 500 }).toFloat(),
  body('water').optional().isFloat({ min: 0, max: 100 }).toFloat(),
  body('waist').optional().isFloat({ min: 0, max: 300 }).toFloat(),
  body('source').optional().isIn(['MANUAL', 'BIA_SCALE']).withMessage('source must be MANUAL or BIA_SCALE'),
  body('measuredAt').optional().isISO8601().withMessage('measuredAt must be valid date'),
];

const listRules = () => [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 500 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
];

const progressQueryRules = () => [
  query('period').optional().isIn(['1M', '3M', '6M', '1Y']).withMessage('period must be 1M, 3M, 6M, or 1Y'),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const extracted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  return res.status(400).json({ success: false, message: 'Validation failed', errors: extracted });
};

module.exports = {
  idParam,
  createMeasurementRules,
  listRules,
  progressQueryRules,
  validate,
};
