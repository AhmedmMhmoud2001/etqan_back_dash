const { prisma } = require('../../prisma/client');
const measurementService = require('../measurements/measurement.service');
const nutritionPlanService = require('../nutritionPlan/nutritionPlan.service');
const userWeeklyPlanService = require('../userWeeklyPlan/userWeeklyPlan.service');
const mealLogRepository = require('../meals/mealLog.repository');
const doctorNoteRepository = require('../doctorNote/doctorNote.repository');
const measurementRepository = require('../measurements/measurement.repository');

/** YYYY-MM-DD for the machine-local calendar day (toISOString() is UTC and shifts the day). */
const formatLocalDateString = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * Optional ?date= — calendar day in local TZ. Prefer YYYY-MM-DD to avoid UTC-only quirks.
 */
const parseDashboardCalendarDay = (raw) => {
  const startOfLocalDay = (dt) => {
    const cal = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    cal.setHours(0, 0, 0, 0);
    return cal;
  };
  if (raw == null || raw === '') return startOfLocalDay(new Date());
  const s = String(raw).trim();
  const ymd = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s]|$)/.exec(s);
  if (ymd) {
    const y = Number(ymd[1]);
    const mo = Number(ymd[2]);
    const d = Number(ymd[3]);
    const dt = new Date(y, mo - 1, d);
    if (!Number.isNaN(dt.getTime()) && dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d) {
      dt.setHours(0, 0, 0, 0);
      return dt;
    }
  }
  const parsed = new Date(s);
  if (Number.isNaN(parsed.getTime())) return startOfLocalDay(new Date());
  return startOfLocalDay(parsed);
};

/** آخر رسالة من الدكتور في الشات (fallback لو مفيش DoctorNote) */
const getLastDoctorChatMessage = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { doctorId: true },
  });
  if (!user?.doctorId) return null;
  const doc = await prisma.doctor.findUnique({
    where: { id: user.doctorId },
    select: { userId: true },
  });
  if (!doc) return null;
  const conv = await prisma.conversation.findUnique({
    where: { patientId_doctorId: { patientId: userId, doctorId: user.doctorId } },
    select: { id: true },
  });
  if (!conv) return null;
  const msg = await prisma.chatMessage.findFirst({
    where: { conversationId: conv.id, senderId: doc.userId },
    orderBy: { createdAt: 'desc' },
    include: { sender: { select: { id: true, name: true } } },
  });
  return msg;
};

const getEstimatedReachDate = async (userId) => {
  const profile = await prisma.profile.findUnique({ where: { userId }, select: { targetWeight: true } });
  const targetWeight = profile?.targetWeight;
  if (targetWeight == null) return null;
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 56);
  const list = await measurementRepository.findByUserId(userId, { startDate: start, endDate: now, limit: 100 });
  const items = (list.items || []).filter((m) => m.weight != null).sort((a, b) => new Date(a.measuredAt) - new Date(b.measuredAt));
  if (items.length < 2) return null;
  const latest = items[items.length - 1];
  const currentWeight = latest.weight;
  const remaining = currentWeight - targetWeight;
  if (Math.abs(remaining) < 0.1) return { estimatedReachDate: new Date(), remainingKg: 0, onTrack: true };
  const first = items[0];
  const weeks = (new Date(latest.measuredAt) - new Date(first.measuredAt)) / (7 * 24 * 60 * 60 * 1000);
  if (weeks < 0.5) return null;
  const weeklyChange = (latest.weight - first.weight) / weeks;
  if (Math.abs(weeklyChange) < 0.01) return null;
  const weeksToGo = remaining / weeklyChange;
  if (weeksToGo < 0) return null;
  const estimated = new Date();
  estimated.setDate(estimated.getDate() + Math.round(weeksToGo * 7));
  return {
    estimatedReachDate: estimated,
    remainingKg: Math.round(remaining * 10) / 10,
    weeklyTrendKg: Math.round(weeklyChange * 100) / 100,
    onTrack: true,
  };
};

const getDashboard = async (userId, date = null) => {
  const today = parseDashboardCalendarDay(date);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const [
    progress,
    nutritionAdherence,
    workoutPlan,
    todayNutrition,
    todayWorkouts,
    doctorNote,
    lastDoctorMessage,
    profile,
  ] = await Promise.all([
    measurementService.getProgress(userId, '1M'),
    nutritionPlanService.getWeeklyAdherence(userId),
    userWeeklyPlanService.getMyCurrentWeek(userId, today),
    nutritionPlanService.getTodayProgress(userId, today),
    prisma.workoutSession.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        endedAt: { gte: today, lte: todayEnd },
      },
      select: { startedAt: true, endedAt: true },
    }),
    doctorNoteRepository.getLatestForPatient(userId),
    getLastDoctorChatMessage(userId),
    prisma.profile.findUnique({ where: { userId }, select: { targetWeight: true } }),
    null,
  ]);

  let workoutAdherence = null;
  if (workoutPlan) {
    const wp = await userWeeklyPlanService.getWeeklyProgress(userId, workoutPlan.id);
    const workoutDays = (wp.days || []).map((d) => ({
      id: d.id,
      date: formatLocalDateString(new Date(d.date)),
      exercise: d.exercise
        ? {
            id: d.exercise.id,
            name: d.exercise.name,
            nameAr: d.exercise.nameAr,
            nameIt: d.exercise.nameIt,
            imageUrl: d.exercise.imageUrl,
          }
        : null,
      sets: d.sets,
      repMin: d.repMin,
      repMax: d.repMax,
      order: d.order,
      completed: d.completed,
    }));
    workoutAdherence = {
      completedDays: wp.completedCount,
      totalDays: wp.totalDays,
      percent: wp.totalDays ? Math.round((wp.completedCount / wp.totalDays) * 100) : 0,
      plan: {
        id: workoutPlan.id,
        weekStart: workoutPlan.weekStart,
        weekEnd: workoutPlan.weekEnd,
        doctor: workoutPlan.doctor,
      },
      days: workoutDays,
    };
  }

  let nutritionAdherencePercent = null;
  if (nutritionAdherence?.days?.length) {
    const withTarget = nutritionAdherence.days.filter((d) => d.adherencePercent != null);
    nutritionAdherencePercent = withTarget.length
      ? Math.round(withTarget.reduce((a, d) => a + d.adherencePercent, 0) / withTarget.length)
      : null;
  }

  const estimatedGoalData = await getEstimatedReachDate(userId);

  let todayWorkoutsCount = 0;
  let todayWorkoutsDurationMinutes = 0;
  if (todayWorkouts && todayWorkouts.length > 0) {
    todayWorkoutsCount = todayWorkouts.length;
    for (const s of todayWorkouts) {
      if (s.endedAt && s.startedAt) {
        todayWorkoutsDurationMinutes += Math.round((new Date(s.endedAt) - new Date(s.startedAt)) / 60000);
      }
    }
  }

  const noteFromDoctor = doctorNote
    ? {
        content: doctorNote.content,
        createdAt: doctorNote.createdAt,
        doctor: doctorNote.doctor?.user ? { id: doctorNote.doctor.user.id, name: doctorNote.doctor.user.name } : null,
        source: 'note',
      }
    : lastDoctorMessage
      ? {
          content: lastDoctorMessage.content,
          createdAt: lastDoctorMessage.createdAt,
          doctor: lastDoctorMessage.sender ? { id: lastDoctorMessage.sender.id, name: lastDoctorMessage.sender.name } : null,
          source: 'chat',
        }
      : null;

  const currentWeight = progress?.current?.weight ?? null;
  const targetWeight = profile?.targetWeight ?? progress?.targetWeight ?? null;
  const remainingKg = currentWeight != null && targetWeight != null ? Math.round((currentWeight - targetWeight) * 10) / 10 : null;

  return {
    bodyComposition: {
      current: progress?.current ?? null,
      changes: progress?.changes ?? null,
    },
    weeklyAdherence: {
      nutrition: {
        percent: nutritionAdherencePercent,
        plan: nutritionAdherence?.plan ?? null,
        days: nutritionAdherence?.days ?? [],
      },
      workouts: workoutAdherence,
      overallPercent:
        nutritionAdherencePercent != null && workoutAdherence?.percent != null
          ? Math.round((nutritionAdherencePercent + workoutAdherence.percent) / 2)
          : nutritionAdherencePercent ?? workoutAdherence?.percent ?? null,
    },
    goalProgress: {
      currentWeightKg: currentWeight,
      targetWeightKg: targetWeight,
      remainingKg,
      estimatedReachDate: estimatedGoalData?.estimatedReachDate ?? null,
      weeklyTrendKg: estimatedGoalData?.weeklyTrendKg ?? null,
      onTrack: estimatedGoalData?.onTrack ?? null,
    },
    todaySummary: {
      date: formatLocalDateString(today),
      calories: {
        consumed: todayNutrition?.consumed?.totalCalories ?? 0,
        goal: todayNutrition?.targets?.dailyCalorieTarget ?? null,
      },
      workouts: {
        completedCount: todayWorkoutsCount,
        durationMinutes: todayWorkoutsDurationMinutes,
      },
    },
    doctorNote: noteFromDoctor,
  };
};

module.exports = {
  getDashboard,
  getEstimatedReachDate,
};
