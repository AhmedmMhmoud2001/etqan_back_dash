const mealRepository = require('./meal.repository');
const mealLogRepository = require('./mealLog.repository');

const MEAL_TYPES = ['BREAKFAST', 'SNACK', 'LUNCH', 'DINNER'];

/** يمكن للأدمن أو الدكتور الذي أضاف الوجبة فقط (أو الأدمن) التعديل/الحذف */
const canModifyMeal = (meal, user) => {
  if (user.role === 'ADMIN') return true;
  if (user.role === 'DOCTOR' && meal.addedByUserId === user.id) return true;
  return false;
};

const listMeals = async (mealType, page, limit) => {
  if (mealType && !MEAL_TYPES.includes(mealType)) {
    const err = new Error('Invalid mealType. Use BREAKFAST, SNACK, LUNCH, or DINNER.');
    err.statusCode = 400;
    throw err;
  }
  return mealRepository.list({ mealType, page, limit });
};

const getMealById = async (id) => {
  const meal = await mealRepository.findById(id);
  if (!meal) {
    const err = new Error('Meal not found');
    err.statusCode = 404;
    throw err;
  }
  return meal;
};

const createMeal = async (data, userId) => {
  return mealRepository.create({
    ...data,
    addedByUserId: userId,
  });
};

const updateMeal = async (id, data, user) => {
  const meal = await mealRepository.findById(id);
  if (!meal) {
    const err = new Error('Meal not found');
    err.statusCode = 404;
    throw err;
  }
  if (!canModifyMeal(meal, user)) {
    const err = new Error('You can only edit meals you added, or you must be admin.');
    err.statusCode = 403;
    throw err;
  }
  return mealRepository.update(id, data);
};

const deleteMeal = async (id, user) => {
  const meal = await mealRepository.findById(id);
  if (!meal) {
    const err = new Error('Meal not found');
    err.statusCode = 404;
    throw err;
  }
  if (!canModifyMeal(meal, user)) {
    const err = new Error('You can only delete meals you added, or you must be admin.');
    err.statusCode = 403;
    throw err;
  }
  await mealRepository.remove(id);
  return { deleted: true };
};

/** قائمة المكونات المتاحة للفلتر (من كل الوجبات) */
const getAvailableIngredients = async () => {
  return mealRepository.getDistinctIngredientNames();
};

const normalize = (s) => (s || '').toLowerCase().trim();

/** يقترح وجبات حسب المكونات المختارة مع نسبة التوافق (match %) */
const suggestMealsByIngredients = async (ingredientNames = [], mealType = null) => {
  const userSet = ingredientNames.map(normalize).filter(Boolean);
  const meals = await mealRepository.findAllWithIngredients(mealType);

  const result = meals.map((meal) => {
    const ingredients = meal.ingredients || [];
    if (ingredients.length === 0) {
      return { ...meal, matchPercentage: 0, keyIngredientNames: [] };
    }
    const matched = ingredients.filter((ing) => {
      const name = normalize(ing.name);
      return userSet.some((u) => name.includes(u) || name === u);
    });
    const matchPercentage = Math.round((matched.length / ingredients.length) * 100);
    const keyIngredientNames = [...new Set(ingredients.map((i) => i.name.trim()).filter(Boolean))];
    return {
      id: meal.id,
      name: meal.name,
      imageUrl: meal.imageUrl,
      prepTimeMinutes: meal.prepTimeMinutes,
      calories: meal.calories,
      proteinG: meal.proteinG,
      carbsG: meal.carbsG,
      fatsG: meal.fatsG,
      dietaryTags: meal.dietaryTags,
      mealType: meal.mealType,
      ingredients: meal.ingredients,
      keyIngredientNames,
      matchPercentage,
      addedByUser: meal.addedByUser,
    };
  });

  // نرجع فقط الوجبات التي فيها توافق على الأقل، مرتبة من الأعلى للأقل
  return result
    .filter((m) => m.matchPercentage > 0)
    .sort((a, b) => b.matchPercentage - a.matchPercentage);
};

// ——— تسجيل الوجبة المأكولة (الوجبة اللي اختارها = اللي اكلها) ———

const markMealAsEaten = async (userId, mealId, eatenAt = null, planSlotId = null) => {
  const meal = await mealRepository.findById(mealId);
  if (!meal) {
    const err = new Error('Meal not found');
    err.statusCode = 404;
    throw err;
  }
  const at = eatenAt ? new Date(eatenAt) : new Date();
  return mealLogRepository.create(userId, mealId, at, planSlotId);
};

const getMyMealLogs = async (userId, startDate, endDate) => {
  const start = startDate ? new Date(startDate) : new Date(new Date().setHours(0, 0, 0, 0));
  const end = endDate ? new Date(endDate) : new Date();
  return mealLogRepository.findByUserAndDateRange(userId, start, end);
};

/** إحصائيات السعرات والماكرو لفترة (حسب الكالوري والوجبات المسجلة) */
const getMyNutritionStats = async (userId, startDate, endDate) => {
  const start = startDate ? new Date(startDate) : new Date(new Date().setHours(0, 0, 0, 0));
  const end = endDate ? new Date(endDate) : new Date();
  return mealLogRepository.getAggregatedByUserAndDateRange(userId, start, end);
};

/** إحصائيات يومية (كل يوم لوحده) */
const getMyDailyStats = async (userId, startDate, endDate) => {
  const start = startDate ? new Date(startDate) : new Date(new Date().setHours(0, 0, 0, 0));
  const end = endDate ? new Date(endDate) : new Date();
  return mealLogRepository.getDailyStats(userId, start, end);
};

module.exports = {
  listMeals,
  getMealById,
  createMeal,
  updateMeal,
  deleteMeal,
  getAvailableIngredients,
  suggestMealsByIngredients,
  markMealAsEaten,
  getMyMealLogs,
  getMyNutritionStats,
  getMyDailyStats,
  MEAL_TYPES,
};
