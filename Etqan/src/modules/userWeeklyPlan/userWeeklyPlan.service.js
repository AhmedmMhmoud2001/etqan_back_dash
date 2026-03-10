const { prisma } = require('../../prisma/client');
const userWeeklyPlanRepository = require('./userWeeklyPlan.repository');

const getDoctorIdForUser = async (user) => {
  if (user.role !== 'DOCTOR') return null;
  const doc = await prisma.doctor.findUnique({ where: { userId: user.id } });
  return doc?.id ?? null;
};

const create = async (data, user) => {
  const doctorId = await getDoctorIdForUser(user);
  if (!doctorId && user.role !== 'ADMIN') {
    const err = new Error('Only doctors or admin can create weekly workout plans');
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
    const err = new Error('Doctor is required');
    err.statusCode = 400;
    throw err;
  }
  return userWeeklyPlanRepository.create({
    ...data,
    doctorId: finalDoctorId,
  });
};

const getById = async (id) => {
  const plan = await userWeeklyPlanRepository.findById(id);
  if (!plan) {
    const err = new Error('Weekly plan not found');
    err.statusCode = 404;
    throw err;
  }
  return plan;
};

/** خطة الأسبوع الحالية للمستخدم (لصفحة This Week) */
const getMyCurrentWeek = async (userId, date = null) => {
  const at = date ? new Date(date) : new Date();
  return userWeeklyPlanRepository.findCurrentByUserId(userId, at);
};

/** تفاصيل يوم معين من الخطة (اليوم + التمارين + sets/reps) */
const getMyDayDetail = async (userId, date = null) => {
  const day = date ? new Date(date) : new Date();
  day.setHours(0, 0, 0, 0);
  const plan = await userWeeklyPlanRepository.findCurrentByUserId(userId, day);
  if (!plan) return { plan: null, day: null };
  const planDay = await userWeeklyPlanRepository.getDayByPlanAndDate(plan.id, day);
  if (!planDay) return { plan: { id: plan.id, doctor: plan.doctor }, day: null };
  return { plan: { id: plan.id, doctor: plan.doctor }, day: planDay };
};

const listMyPlans = async (userId) => {
  return userWeeklyPlanRepository.findByUserId(userId);
};

const listByDoctor = async (doctorId) => {
  return userWeeklyPlanRepository.findByDoctorId(doctorId);
};

const update = async (id, data, user) => {
  const plan = await userWeeklyPlanRepository.findById(id);
  if (!plan) {
    const err = new Error('Weekly plan not found');
    err.statusCode = 404;
    throw err;
  }
  const doctorId = await getDoctorIdForUser(user);
  if (user.role !== 'ADMIN' && (user.role !== 'DOCTOR' || plan.doctorId !== doctorId)) {
    const err = new Error('Not allowed to update this plan');
    err.statusCode = 403;
    throw err;
  }
  return userWeeklyPlanRepository.update(id, data);
};

const remove = async (id, user) => {
  const plan = await userWeeklyPlanRepository.findById(id);
  if (!plan) {
    const err = new Error('Weekly plan not found');
    err.statusCode = 404;
    throw err;
  }
  const doctorId = await getDoctorIdForUser(user);
  if (user.role !== 'ADMIN' && (user.role !== 'DOCTOR' || plan.doctorId !== doctorId)) {
    const err = new Error('Not allowed to delete this plan');
    err.statusCode = 403;
    throw err;
  }
  await userWeeklyPlanRepository.remove(id);
  return { deleted: true };
};

/** عدد أيام الأسبوع المكتملة (جلسات مكتملة لهذا اليوم من الخطة) */
const getWeeklyProgress = async (userId, planId) => {
  const plan = await userWeeklyPlanRepository.findById(planId);
  if (!plan) return { completedCount: 0, totalDays: 0, days: [] };
  const days = plan.days || [];
  const completedSessions = await prisma.workoutSession.findMany({
    where: {
      userId,
      userWeeklyPlanDayId: { in: days.map((d) => d.id) },
      status: 'COMPLETED',
    },
    select: { userWeeklyPlanDayId: true },
  });
  const completedSet = new Set(completedSessions.map((s) => s.userWeeklyPlanDayId).filter(Boolean));
  const daysWithStatus = days.map((d) => ({
    ...d,
    completed: completedSet.has(d.id),
  }));
  return {
    completedCount: completedSet.size,
    totalDays: days.length,
    days: daysWithStatus,
  };
};

module.exports = {
  create,
  getById,
  getMyCurrentWeek,
  getMyDayDetail,
  getWeeklyProgress,
  listMyPlans,
  listByDoctor,
  update,
  remove,
  getDoctorIdForUser,
};
