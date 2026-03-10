const nutritionPlanRepository = require('./nutritionPlan.repository');
const mealLogRepository = require('../meals/mealLog.repository');
const { prisma } = require('../../prisma/client');

const SLOT_TYPES = ['BREAKFAST', 'SNACK', 'LUNCH', 'DINNER'];

const getDoctorIdForUser = async (user) => {
  if (user.role !== 'DOCTOR') return null;
  const doc = await prisma.doctor.findUnique({ where: { userId: user.id } });
  return doc?.id ?? null;
};

const createPlan = async (data, user) => {
  const doctorId = await getDoctorIdForUser(user);
  if (!doctorId && user.role !== 'ADMIN') {
    const err = new Error('Only doctors or admin can create nutrition plans');
    err.statusCode = 403;
    throw err;
  }
  const patient = await prisma.user.findUnique({ where: { id: data.userId } });
  if (!patient) {
    const err = new Error('User (patient) not found');
    err.statusCode = 404;
    throw err;
  }
  const finalDoctorId = user.role === 'ADMIN' && data.doctorId ? data.doctorId : doctorId;
  if (!finalDoctorId) {
    const err = new Error('Doctor is required to create a plan');
    err.statusCode = 400;
    throw err;
  }
  const payload = { ...data, doctorId: finalDoctorId };
  if (!payload.endDate && payload.startDate) {
    const start = new Date(payload.startDate);
    start.setDate(start.getDate() + 6);
    payload.endDate = start.toISOString();
  }
  return nutritionPlanRepository.create(payload);
};

const getPlanById = async (id) => {
  const plan = await nutritionPlanRepository.findById(id);
  if (!plan) {
    const err = new Error('Plan not found');
    err.statusCode = 404;
    throw err;
  }
  return plan;
};

const updatePlan = async (id, data, user) => {
  const plan = await nutritionPlanRepository.findById(id);
  if (!plan) {
    const err = new Error('Plan not found');
    err.statusCode = 404;
    throw err;
  }
  const doctorId = await getDoctorIdForUser(user);
  if (user.role !== 'ADMIN' && (user.role !== 'DOCTOR' || plan.doctorId !== doctorId)) {
    const err = new Error('Not allowed to update this plan');
    err.statusCode = 403;
    throw err;
  }
  return nutritionPlanRepository.update(id, data);
};

const deletePlan = async (id, user) => {
  const plan = await nutritionPlanRepository.findById(id);
  if (!plan) {
    const err = new Error('Plan not found');
    err.statusCode = 404;
    throw err;
  }
  const doctorId = await getDoctorIdForUser(user);
  if (user.role !== 'ADMIN' && (user.role !== 'DOCTOR' || plan.doctorId !== doctorId)) {
    const err = new Error('Not allowed to delete this plan');
    err.statusCode = 403;
    throw err;
  }
  await nutritionPlanRepository.remove(id);
  return { deleted: true };
};

/** الخطة النشطة للعميل (اللي تغطي اليوم الحالي أو التاريخ المعطى) */
const getMyActivePlan = async (userId, date = null) => {
  const at = date ? new Date(date) : new Date();
  return nutritionPlanRepository.findActiveByUserId(userId, at);
};

/** وجبات اليوم (سلوتات) مع حالة الإكمال (علامة الصح) */
const getTodaySlots = async (userId, date = null) => {
  const day = date ? new Date(date) : new Date();
  day.setHours(0, 0, 0, 0);
  const plan = await nutritionPlanRepository.findActiveByUserId(userId, day);
  if (!plan) return { plan: null, slots: [] };

  const slots = await nutritionPlanRepository.getSlotsByPlanAndDate(plan.id, day);
  const completedSlotIds = await prisma.userMealLog.findMany({
    where: { userId, planSlotId: { in: slots.map((s) => s.id) } },
    select: { planSlotId: true },
  });
  const completedSet = new Set(completedSlotIds.map((r) => r.planSlotId).filter(Boolean));

  const slotsWithStatus = slots.map((slot) => ({
    ...slot,
    completed: completedSet.has(slot.id),
  }));

  return {
    plan: {
      id: plan.id,
      startDate: plan.startDate,
      endDate: plan.endDate,
      dailyCalorieTarget: plan.dailyCalorieTarget,
      dailyProteinTarget: plan.dailyProteinTarget,
      dailyCarbsTarget: plan.dailyCarbsTarget,
      dailyFatsTarget: plan.dailyFatsTarget,
      doctor: plan.doctor,
    },
    slots: slotsWithStatus,
  };
};

/** تقدم اليوم: المستهلك مقابل الهدف */
const getTodayProgress = async (userId, date = null) => {
  const day = date ? new Date(date) : new Date();
  day.setHours(0, 0, 0, 0);
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);

  const plan = await nutritionPlanRepository.findActiveByUserId(userId, day);
  const consumed = await mealLogRepository.getAggregatedByUserAndDateRange(userId, day, end);

  if (!plan) {
    return {
      hasPlan: false,
      consumed: {
        totalCalories: consumed.totalCalories,
        totalProtein: consumed.totalProtein,
        totalCarbs: consumed.totalCarbs,
        totalFats: consumed.totalFats,
        mealsCount: consumed.mealsCount,
      },
      targets: null,
    };
  }

  return {
    hasPlan: true,
    consumed: {
      totalCalories: consumed.totalCalories,
      totalProtein: consumed.totalProtein,
      totalCarbs: consumed.totalCarbs,
      totalFats: consumed.totalFats,
      mealsCount: consumed.mealsCount,
    },
    targets: {
      dailyCalorieTarget: plan.dailyCalorieTarget,
      dailyProteinTarget: plan.dailyProteinTarget,
      dailyCarbsTarget: plan.dailyCarbsTarget,
      dailyFatsTarget: plan.dailyFatsTarget,
    },
  };
};

/** نسبة التزام كل يوم في الأسبوع (للكروت) */
const getWeeklyAdherence = async (userId, startDate = null, endDate = null) => {
  const plan = await getMyActivePlan(userId, startDate || new Date());
  if (!plan) return { plan: null, days: [] };

  const start = startDate ? new Date(startDate) : new Date(plan.startDate);
  const end = endDate ? new Date(endDate) : new Date(plan.endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const dailyStats = await mealLogRepository.getDailyStats(userId, start, end);
  const dayMap = {};
  for (const d of dailyStats) {
    dayMap[d.date] = d;
  }

  const days = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const dateKey = cursor.toISOString().slice(0, 10);
    const consumed = dayMap[dateKey];
    const calories = consumed?.calories ?? 0;
    const target = plan.dailyCalorieTarget || 1;
    const adherencePercent = Math.round((calories / target) * 100);
    days.push({
      date: dateKey,
      dayLabel: cursor.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }).replace(', ', ' '),
      adherencePercent: plan.dailyCalorieTarget ? adherencePercent : null,
      consumedCalories: calories,
      targetCalories: plan.dailyCalorieTarget,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return {
    plan: {
      id: plan.id,
      startDate: plan.startDate,
      endDate: plan.endDate,
      doctor: plan.doctor,
    },
    days,
  };
};

const listPlansForPatient = async (userId) => {
  return nutritionPlanRepository.findByUserId(userId);
};

const listPlansByDoctor = async (doctorId) => {
  return nutritionPlanRepository.findByDoctorId(doctorId);
};

module.exports = {
  createPlan,
  getPlanById,
  updatePlan,
  deletePlan,
  getMyActivePlan,
  getTodaySlots,
  getTodayProgress,
  getWeeklyAdherence,
  listPlansForPatient,
  listPlansByDoctor,
  getDoctorIdForUser,
  SLOT_TYPES,
};
