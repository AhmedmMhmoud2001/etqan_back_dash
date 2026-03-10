const { body, param, query, validationResult } = require('express-validator');
const { WORKOUT_LEVELS } = require('../exercises/exercise.validator');

const idParam = (name = 'id') => [param(name).trim().notEmpty().withMessage(`${name} is required`)];

const templateExerciseRules = () => [
  body('exercises').optional().isArray(),
  body('exercises.*.exerciseId').optional().trim().notEmpty().withMessage('exerciseId is required'),
  body('exercises.*.order').optional().isInt({ min: 0 }).toInt(),
  body('exercises.*.sets').optional().isInt({ min: 1, max: 20 }).toInt(),
  body('exercises.*.repMin').optional().isInt({ min: 1, max: 100 }).toInt(),
  body('exercises.*.repMax').optional().isInt({ min: 1, max: 100 }).toInt(),
  body('exercises.*.restSeconds').optional().isInt({ min: 0, max: 600 }).toInt(),
];

const createTemplateRules = () => [
  body('name').trim().notEmpty().withMessage('Template name is required').isLength({ max: 200 }),
  body('nameAr').optional().trim().isLength({ max: 200 }),
  body('description').optional().trim(),
  body('descriptionAr').optional().trim(),
  body('durationMinutes').optional().isInt({ min: 1, max: 300 }).toInt(),
  body('level').optional().isIn(WORKOUT_LEVELS).withMessage('level must be BEGINNER, INTERMEDIATE, or ADVANCED'),
  body('equipmentNeeded').optional().isArray().withMessage('equipmentNeeded must be an array'),
  body('equipmentNeeded.*.name').optional().trim().isLength({ max: 100 }),
  body('equipmentNeeded.*.nameAr').optional().trim().isLength({ max: 100 }),
  body('createdByDoctorId').optional().trim(),
  body('exercises').optional().isArray(),
  body('exercises.*.exerciseId').trim().notEmpty().withMessage('exerciseId is required'),
  body('exercises.*.order').optional().isInt({ min: 0 }).toInt(),
  body('exercises.*.sets').isInt({ min: 1, max: 20 }).withMessage('sets is required (1-20)').toInt(),
  body('exercises.*.repMin').isInt({ min: 1, max: 100 }).withMessage('repMin is required').toInt(),
  body('exercises.*.repMax').isInt({ min: 1, max: 100 }).withMessage('repMax is required').toInt(),
  body('exercises.*.restSeconds').optional().isInt({ min: 0, max: 600 }).toInt(),
  ...templateExerciseRules(),
];

const updateTemplateRules = () => [
  param('id').trim().notEmpty().withMessage('Template id is required'),
  body('name').optional().trim().notEmpty().isLength({ max: 200 }),
  body('nameAr').optional().trim().isLength({ max: 200 }),
  body('description').optional().trim(),
  body('descriptionAr').optional().trim(),
  body('durationMinutes').optional().isInt({ min: 1, max: 300 }).toInt(),
  body('level').optional().isIn(WORKOUT_LEVELS),
  body('equipmentNeeded').optional().isArray(),
  body('equipmentNeeded.*.name').optional().trim().isLength({ max: 100 }),
  body('equipmentNeeded.*.nameAr').optional().trim().isLength({ max: 100 }),
  body('exercises').optional().isArray(),
  body('exercises.*.exerciseId').optional().trim().notEmpty(),
  body('exercises.*.order').optional().isInt({ min: 0 }).toInt(),
  body('exercises.*.sets').optional().isInt({ min: 1, max: 20 }).toInt(),
  body('exercises.*.repMin').optional().isInt({ min: 1, max: 100 }).toInt(),
  body('exercises.*.repMax').optional().isInt({ min: 1, max: 100 }).toInt(),
  body('exercises.*.restSeconds').optional().isInt({ min: 0, max: 600 }).toInt(),
  ...templateExerciseRules(),
];

const listRules = () => [
  query('search').optional().trim(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const extracted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  return res.status(400).json({ success: false, message: 'Validation failed', errors: extracted });
};

module.exports = {
  idParam,
  createTemplateRules,
  updateTemplateRules,
  listRules,
  validate,
};
