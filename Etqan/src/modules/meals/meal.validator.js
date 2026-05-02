const { body, param, query, validationResult } = require('express-validator');
const { MEAL_TYPES } = require('./meal.service');

const idParam = () => [param('id').trim().notEmpty().withMessage('Meal id is required')];

const listRules = () => [
  query('mealType').optional().isIn(MEAL_TYPES).withMessage('mealType must be BREAKFAST, SNACK, LUNCH, or DINNER'),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 500 }).toInt(),
];

const ingredientRules = () => [
  body('ingredients').optional().isArray().withMessage('ingredients must be an array'),
  body('ingredients.*.name').optional().trim(),
  body('ingredients.*.quantity').optional().trim(),
  body('ingredients.*.unit').optional().trim(),
  body('ingredients.*.order').optional().isInt({ min: 0 }).toInt(),
];

const createMealRules = () => [
  body('name').trim().notEmpty().withMessage('Meal name is required').isLength({ max: 200 }),
  body('nameAr').optional().trim().isLength({ max: 200 }),
  body('nameIt').optional().trim().isLength({ max: 200 }),
  body('imageUrl').optional().trim().custom((v) => !v || v.startsWith('/') || /^https?:\/\//i.test(v)).withMessage('imageUrl must be a URL or path starting with /'),
  body('prepTimeMinutes').isInt({ min: 0 }).withMessage('prepTimeMinutes must be a non-negative integer'),
  body('calories').isInt({ min: 0 }).withMessage('calories must be a non-negative integer'),
  body('proteinG').isInt({ min: 0 }).withMessage('proteinG must be a non-negative integer'),
  body('carbsG').isInt({ min: 0 }).withMessage('carbsG must be a non-negative integer'),
  body('fatsG').isInt({ min: 0 }).withMessage('fatsG must be a non-negative integer'),
  body('dietaryTags').optional().isArray().withMessage('dietaryTags must be an array'),
  body('dietaryTags.*').optional().isString().trim(),
  body('mealType').isIn(MEAL_TYPES).withMessage('mealType must be BREAKFAST, SNACK, LUNCH, or DINNER'),
  ...ingredientRules(),
];

const updateMealRules = () => [
  param('id').trim().notEmpty().withMessage('Meal id is required'),
  body('name').optional().trim().notEmpty().isLength({ max: 200 }),
  body('nameAr').optional().trim().isLength({ max: 200 }),
  body('nameIt').optional().trim().isLength({ max: 200 }),
  body('imageUrl').optional().trim().custom((v) => !v || v.startsWith('/') || /^https?:\/\//i.test(v)).withMessage('imageUrl must be a URL or path starting with /'),
  body('prepTimeMinutes').optional().isInt({ min: 0 }),
  body('calories').optional().isInt({ min: 0 }),
  body('proteinG').optional().isInt({ min: 0 }),
  body('carbsG').optional().isInt({ min: 0 }),
  body('fatsG').optional().isInt({ min: 0 }),
  body('dietaryTags').optional().isArray(),
  body('dietaryTags.*').optional().isString().trim(),
  body('mealType').optional().isIn(MEAL_TYPES),
  ...ingredientRules(),
];

/** فلتر / اقتراح وجبات حسب المكونات (AI Meal Swap) */
const suggestRules = () => [
  query('ingredients').optional().trim(),
  query('mealType').optional().isIn(MEAL_TYPES).withMessage('mealType must be BREAKFAST, SNACK, LUNCH, or DINNER'),
  body('ingredientNames').optional().isArray().withMessage('ingredientNames must be an array'),
  body('ingredientNames.*').optional().isString().trim(),
  body('mealType').optional().isIn(MEAL_TYPES),
];

/** تسجيل وجبة كمأكولة */
const markAsEatenRules = () => [
  body('mealId').trim().notEmpty().withMessage('mealId is required'),
  body('eatenAt').optional().isISO8601().withMessage('eatenAt must be valid date'),
  body('planSlotId').optional().trim(),
];

/** فترة للإحصائيات والسجل */
const dateRangeRules = () => [
  query('startDate').optional().isISO8601().withMessage('startDate must be valid date'),
  query('endDate').optional().isISO8601().withMessage('endDate must be valid date'),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const extracted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  return res.status(400).json({ success: false, message: 'Validation failed', errors: extracted });
};

module.exports = {
  idParam,
  listRules,
  createMealRules,
  updateMealRules,
  suggestRules,
  markAsEatenRules,
  dateRangeRules,
  validate,
};
