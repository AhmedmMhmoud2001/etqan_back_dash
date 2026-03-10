const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const mealService = require('./meal.service');

const list = asyncHandler(async (req, res) => {
  const mealType = req.query.mealType || null;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const result = await mealService.listMeals(mealType, page, limit);
  success(res, result, 'Meals list');
});

const getById = asyncHandler(async (req, res) => {
  const meal = await mealService.getMealById(req.params.id);
  success(res, meal, 'Meal details');
});

const create = asyncHandler(async (req, res) => {
  const meal = await mealService.createMeal(req.body, req.user.id);
  success(res, meal, 'Meal created', 201);
});

const update = asyncHandler(async (req, res) => {
  const meal = await mealService.updateMeal(req.params.id, req.body, req.user);
  success(res, meal, 'Meal updated');
});

const remove = asyncHandler(async (req, res) => {
  await mealService.deleteMeal(req.params.id, req.user);
  success(res, { id: req.params.id }, 'Meal deleted');
});

/** قائمة المكونات المتاحة للفلتر (AI Meal Swap) */
const getAvailableIngredients = asyncHandler(async (req, res) => {
  const list = await mealService.getAvailableIngredients();
  success(res, { ingredients: list }, 'Available ingredients');
});

/** اقتراح وجبات حسب المكونات المختارة مع نسبة التوافق */
const suggest = asyncHandler(async (req, res) => {
  const fromBody = Array.isArray(req.body?.ingredientNames) ? req.body.ingredientNames : [];
  const fromQuery = typeof req.query.ingredients === 'string'
    ? req.query.ingredients.split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  const ingredientNames = fromBody.length ? fromBody : fromQuery;
  const mealType = req.query.mealType || req.body?.mealType || null;
  const suggestions = await mealService.suggestMealsByIngredients(ingredientNames, mealType);
  success(res, { suggestions }, 'Suggested meals');
});

// ——— تسجيل الوجبة المأكولة + إحصائيات ———

/** تسجيل أن المستخدم أكل هذه الوجبة (الوجبة اللي اختارها = اللي اكلها). planSlotId اختياري لربط السلوت في الخطة. */
const markAsEaten = asyncHandler(async (req, res) => {
  const mealId = req.body.mealId ?? req.params.mealId;
  const eatenAt = req.body.eatenAt || null;
  const planSlotId = req.body.planSlotId || null;
  const log = await mealService.markMealAsEaten(req.user.id, mealId, eatenAt, planSlotId);
  success(res, log, 'Meal marked as eaten', 201);
});

/** قائمة الوجبات اللي المستخدم أكلها في فترة */
const getMyLogs = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const logs = await mealService.getMyMealLogs(req.user.id, startDate, endDate);
  success(res, { logs }, 'My meal logs');
});

/** إحصائيات السعرات والماكرو (مجموع الفترة) */
const getMyStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const stats = await mealService.getMyNutritionStats(req.user.id, startDate, endDate);
  success(res, stats, 'Nutrition statistics');
});

/** إحصائيات يومية (كل يوم لوحده) */
const getMyDailyStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const daily = await mealService.getMyDailyStats(req.user.id, startDate, endDate);
  success(res, { daily }, 'Daily nutrition stats');
});

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  getAvailableIngredients,
  suggest,
  markAsEaten,
  getMyLogs,
  getMyStats,
  getMyDailyStats,
};
