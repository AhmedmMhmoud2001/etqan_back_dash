const { body, validationResult } = require('express-validator');
const enums = require('../../config/profileEnums');

const updateProfileRules = () => [
  body('imageUrl').optional({ values: 'falsy' }).trim().custom((v) => !v || v.startsWith('/') || /^https?:\/\//i.test(v)).withMessage('imageUrl must be a URL or path starting with /').bail().isLength({ max: 2048 }).withMessage('URL too long'),
  body('measurementSystem').optional().trim().isIn(enums.measurementSystem).withMessage('Invalid measurement system'),
  body('gender').optional().trim().isIn(enums.gender).withMessage('Invalid gender'),
  body('age').optional().isInt({ min: 1, max: 150 }).withMessage('Age must be between 1 and 150'),
  body('height').optional().isFloat({ min: 0 }).withMessage('Invalid height'),
  body('weight').optional().isFloat({ min: 0 }).withMessage('Invalid weight'),
  body('activityLevel').optional().trim().isIn(enums.activityLevel).withMessage('Invalid activity level'),
  body('goal').optional().trim().isIn(enums.goal).withMessage('Invalid goal'),
  body('targetWeight').optional().isFloat({ min: 0 }).withMessage('Invalid target weight'),
  body('dietaryPreferences').optional().isArray().withMessage('Must be array'),
  body('dietaryPreferences.*').optional().trim().isIn(enums.dietaryPreferences).withMessage('Invalid dietary preference'),
  body('allergies').optional().isArray().withMessage('Allergies must be array (presets or "CUSTOM: name")'),
  body('allergies.*').optional().isString().withMessage('Each allergy must be string'),
  body('healthConditions').optional().isArray().withMessage('Must be array'),
  body('healthConditions.*').optional().trim().isIn(enums.healthConditions).withMessage('Invalid health condition'),
  body('notificationsEnabled').optional().isBoolean().toBoolean(),
  body('darkMode').optional().isBoolean().toBoolean(),
  body('language').optional().trim().isLength({ max: 10 }),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const extracted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  return res.status(400).json({ success: false, message: 'Validation failed', errors: extracted });
};

module.exports = { updateProfileRules, validate };
