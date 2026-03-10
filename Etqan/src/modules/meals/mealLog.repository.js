const { prisma } = require('../../prisma/client');

const create = async (userId, mealId, eatenAt = new Date(), planSlotId = null) => {
  return prisma.userMealLog.create({
    data: { userId, mealId, eatenAt, planSlotId: planSlotId || undefined },
    include: {
      meal: {
        include: { ingredients: { orderBy: { order: 'asc' } } },
      },
      planSlot: true,
    },
  });
};

const findByUserAndDateRange = async (userId, startDate, endDate) => {
  return prisma.userMealLog.findMany({
    where: {
      userId,
      eatenAt: { gte: startDate, lte: endDate },
    },
    include: {
      meal: true,
    },
    orderBy: { eatenAt: 'desc' },
  });
};

const getAggregatedByUserAndDateRange = async (userId, startDate, endDate) => {
  const logs = await prisma.userMealLog.findMany({
    where: {
      userId,
      eatenAt: { gte: startDate, lte: endDate },
    },
    include: { meal: true },
  });
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFats = 0;
  for (const log of logs) {
    totalCalories += log.meal.calories ?? 0;
    totalProtein += log.meal.proteinG ?? 0;
    totalCarbs += log.meal.carbsG ?? 0;
    totalFats += log.meal.fatsG ?? 0;
  }
  return {
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFats,
    mealsCount: logs.length,
  };
};

/** إحصائيات يومية: مجموعة حسب التاريخ */
const getDailyStats = async (userId, startDate, endDate) => {
  const logs = await prisma.userMealLog.findMany({
    where: {
      userId,
      eatenAt: { gte: startDate, lte: endDate },
    },
    include: { meal: true },
  });
  const byDay = {};
  for (const log of logs) {
    const day = new Date(log.eatenAt);
    day.setHours(0, 0, 0, 0);
    const key = day.toISOString().slice(0, 10);
    if (!byDay[key]) {
      byDay[key] = { date: key, calories: 0, protein: 0, carbs: 0, fats: 0, mealsCount: 0 };
    }
    byDay[key].calories += log.meal.calories ?? 0;
    byDay[key].protein += log.meal.proteinG ?? 0;
    byDay[key].carbs += log.meal.carbsG ?? 0;
    byDay[key].fats += log.meal.fatsG ?? 0;
    byDay[key].mealsCount += 1;
  }
  return Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));
};

module.exports = { create, findByUserAndDateRange, getAggregatedByUserAndDateRange, getDailyStats };
