const { body, param, query, validationResult } = require('express-validator');

const idParam = (name = 'id') => [param(name).trim().notEmpty().withMessage(`${name} is required`)];

const startSessionRules = () => [
  body('workoutTemplateId').trim().notEmpty().withMessage('workoutTemplateId is required'),
  body('userWeeklyPlanDayId').optional().trim(),
];

const completeSetRules = () => [
  param('sessionExerciseId').trim().notEmpty().withMessage('sessionExerciseId is required'),
  body('setNumber').isInt({ min: 1, max: 20 }).withMessage('setNumber is required (1-20)').toInt(),
  body('actualReps').isInt({ min: 0, max: 500 }).withMessage('actualReps is required (0-500)').toInt(),
];

const listRules = () => [
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  query('status').optional().isIn(['IN_PROGRESS', 'COMPLETED', 'ABANDONED']),
];

const endSessionRules = () => [
  param('id').trim().notEmpty().withMessage('Session id is required'),
  body('status').optional().isIn(['COMPLETED', 'ABANDONED']).withMessage('status must be COMPLETED or ABANDONED'),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const extracted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  return res.status(400).json({ success: false, message: 'Validation failed', errors: extracted });
};

module.exports = {
  idParam,
  startSessionRules,
  completeSetRules,
  listRules,
  endSessionRules,
  validate,
};
