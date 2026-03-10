const { body, param, query, validationResult } = require('express-validator');
const { SLOT_TYPES } = require('./nutritionPlan.service');

const idParam = (name = 'id') => [param(name).trim().notEmpty().withMessage(`${name} is required`)];

const slotRules = () => [
  body('slots').optional().isArray(),
  body('slots.*.date').optional().isISO8601(),
  body('slots.*.slotType').optional().isIn(SLOT_TYPES),
  body('slots.*.time').optional().trim(),
  body('slots.*.mealId').optional().trim(),
];

const createPlanRules = () => [
  body('userId').trim().notEmpty().withMessage('userId (patient) is required'),
  body('startDate').isISO8601().withMessage('startDate is required'),
  body('endDate').optional().isISO8601(),
  body('dailyCalorieTarget').isInt({ min: 0 }).withMessage('dailyCalorieTarget is required'),
  body('dailyProteinTarget').isInt({ min: 0 }).withMessage('dailyProteinTarget is required'),
  body('dailyCarbsTarget').isInt({ min: 0 }).withMessage('dailyCarbsTarget is required'),
  body('dailyFatsTarget').isInt({ min: 0 }).withMessage('dailyFatsTarget is required'),
  body('doctorId').optional().trim(),
  ...slotRules(),
];

const updatePlanRules = () => [
  param('id').trim().notEmpty().withMessage('Plan id is required'),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('dailyCalorieTarget').optional().isInt({ min: 0 }),
  body('dailyProteinTarget').optional().isInt({ min: 0 }),
  body('dailyCarbsTarget').optional().isInt({ min: 0 }),
  body('dailyFatsTarget').optional().isInt({ min: 0 }),
  ...slotRules(),
];

const dateQuery = () => [
  query('date').optional().isISO8601(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const extracted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  return res.status(400).json({ success: false, message: 'Validation failed', errors: extracted });
};

module.exports = { idParam, createPlanRules, updatePlanRules, dateQuery, validate };
