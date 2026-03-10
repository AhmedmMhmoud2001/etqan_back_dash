const express = require('express');
const mealController = require('../modules/meals/meal.controller');
const mealValidator = require('../modules/meals/meal.validator');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// كل المسارات تتطلب تسجيل دخول
router.use(authenticate);

// قائمة الوجبات (وفق الصنف: فطار، غداء، عشاء) + تفاصيل وجبة
router.get('/', mealValidator.listRules(), mealValidator.validate, asyncHandler(mealController.list));
// فلتر AI Meal Swap: مكونات متاحة + اقتراح وجبات مع نسبة التوافق
router.get('/ingredients/available', asyncHandler(mealController.getAvailableIngredients));
router.get('/suggest', mealValidator.suggestRules(), mealValidator.validate, asyncHandler(mealController.suggest));
router.post('/suggest', mealValidator.suggestRules(), mealValidator.validate, asyncHandler(mealController.suggest));

// تسجيل الوجبة المأكولة (الوجبة اللي اختارها = اللي اكلها) + إحصائيات السعرات
router.post('/eaten', mealValidator.markAsEatenRules(), mealValidator.validate, asyncHandler(mealController.markAsEaten));
router.get('/my/logs', mealValidator.dateRangeRules(), mealValidator.validate, asyncHandler(mealController.getMyLogs));
router.get('/my/stats', mealValidator.dateRangeRules(), mealValidator.validate, asyncHandler(mealController.getMyStats));
router.get('/my/stats/daily', mealValidator.dateRangeRules(), mealValidator.validate, asyncHandler(mealController.getMyDailyStats));

router.get('/:id', mealValidator.idParam(), mealValidator.validate, asyncHandler(mealController.getById));

// إضافة وجبة: للأدمن أو الدكتور فقط
router.post(
  '/',
  authorize('ADMIN', 'DOCTOR'),
  mealValidator.createMealRules(),
  mealValidator.validate,
  asyncHandler(mealController.create)
);

// تعديل / حذف: الأدمن أو الدكتور الذي أضاف الوجبة فقط
router.patch(
  '/:id',
  authorize('ADMIN', 'DOCTOR'),
  mealValidator.updateMealRules(),
  mealValidator.validate,
  asyncHandler(mealController.update)
);
router.delete(
  '/:id',
  authorize('ADMIN', 'DOCTOR'),
  mealValidator.idParam(),
  mealValidator.validate,
  asyncHandler(mealController.remove)
);

module.exports = router;
