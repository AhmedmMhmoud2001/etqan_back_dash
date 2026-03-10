const { body, param, query, validationResult } = require('express-validator');

const idParam = (name = 'id') => [param(name).trim().notEmpty().withMessage(`${name} is required`)];

const createPlanRules = () => [
  body('userId').trim().notEmpty().withMessage('userId (patient) is required'),
  body('weekStart').isISO8601().withMessage('weekStart is required'),
  body('weekEnd').isISO8601().withMessage('weekEnd is required'),
  body('doctorId').optional().trim(),
  body('days').optional().isArray(),
  body('days.*.date').optional().isISO8601(),
  body('days.*.workoutTemplateId').optional().trim().notEmpty(),
  body('days.*.order').optional().isInt({ min: 0 }).toInt(),
];

const updatePlanRules = () => [
  param('id').trim().notEmpty().withMessage('Plan id is required'),
  body('weekStart').optional().isISO8601(),
  body('weekEnd').optional().isISO8601(),
  body('days').optional().isArray(),
  body('days.*.date').optional().isISO8601(),
  body('days.*.workoutTemplateId').optional().trim().notEmpty(),
  body('days.*.order').optional().isInt({ min: 0 }).toInt(),
];

const dateQuery = () => [
  query('date').optional().isISO8601(),
  query('weekStart').optional().isISO8601(),
  query('weekEnd').optional().isISO8601(),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const extracted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  return res.status(400).json({ success: false, message: 'Validation failed', errors: extracted });
};

module.exports = {
  idParam,
  createPlanRules,
  updatePlanRules,
  dateQuery,
  validate,
};
