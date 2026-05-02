const { body, param, query, validationResult } = require('express-validator');

const WORKOUT_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

const idParam = (name = 'id') => [param(name).trim().notEmpty().withMessage(`${name} is required`)];

const createExerciseRules = () => [
  body('name').trim().notEmpty().withMessage('Exercise name is required').isLength({ max: 200 }),
  body('nameAr').optional().trim().isLength({ max: 200 }),
  body('nameIt').optional().trim().isLength({ max: 200 }),
  body('imageUrl').optional().trim().custom((v) => !v || v.startsWith('/') || /^https?:\/\//i.test(v)).withMessage('imageUrl must be URL or path'),
  body('description').optional().trim(),
  body('descriptionAr').optional().trim(),
  body('descriptionIt').optional().trim(),
  body('targetMuscles').optional().isArray().withMessage('targetMuscles must be an array'),
  body('targetMuscles.*').optional().isString().trim(),
  body('equipmentNeeded').optional().isArray().withMessage('equipmentNeeded must be an array'),
  body('equipmentNeeded.*.name').optional().trim().isLength({ max: 100 }),
  body('equipmentNeeded.*.nameAr').optional().trim().isLength({ max: 100 }),
  body('equipmentNeeded.*.nameIt').optional().trim().isLength({ max: 100 }),
];

const updateExerciseRules = () => [
  param('id').trim().notEmpty().withMessage('Exercise id is required'),
  body('name').optional().trim().notEmpty().isLength({ max: 200 }),
  body('nameAr').optional().trim().isLength({ max: 200 }),
  body('nameIt').optional().trim().isLength({ max: 200 }),
  body('imageUrl').optional().trim().custom((v) => !v || v.startsWith('/') || /^https?:\/\//i.test(v)).withMessage('imageUrl must be URL or path'),
  body('description').optional().trim(),
  body('descriptionAr').optional().trim(),
  body('descriptionIt').optional().trim(),
  body('targetMuscles').optional().isArray(),
  body('targetMuscles.*').optional().isString().trim(),
  body('equipmentNeeded').optional().isArray(),
  body('equipmentNeeded.*.name').optional().trim().isLength({ max: 100 }),
  body('equipmentNeeded.*.nameAr').optional().trim().isLength({ max: 100 }),
  body('equipmentNeeded.*.nameIt').optional().trim().isLength({ max: 100 }),
];

const listRules = () => [
  query('search').optional().trim(),
  query('limit').optional().isInt({ min: 1, max: 500 }).toInt(),
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
  createExerciseRules,
  updateExerciseRules,
  listRules,
  validate,
  WORKOUT_LEVELS,
};
