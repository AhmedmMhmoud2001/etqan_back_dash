const { prisma } = require('../../prisma/client');

const create = async (data) => {
  const { days = [], ...rest } = data;
  return prisma.userWeeklyPlan.create({
    data: {
      ...rest,
      weekStart: new Date(rest.weekStart),
      weekEnd: new Date(rest.weekEnd),
      days: {
        create: days.map((d, i) => ({
          date: new Date(d.date),
          workoutTemplateId: d.workoutTemplateId,
          order: d.order ?? i,
        })),
      },
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      doctor: { include: { user: { select: { id: true, name: true } } } },
      days: {
        include: { workoutTemplate: { include: { templateExercises: { include: { exercise: true }, orderBy: { order: 'asc' } } } } },
        orderBy: { date: 'asc' },
      },
    },
  });
};

const findById = async (id) => {
  return prisma.userWeeklyPlan.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      doctor: { include: { user: { select: { id: true, name: true } } } },
      days: {
        include: { workoutTemplate: { include: { templateExercises: { include: { exercise: true }, orderBy: { order: 'asc' } } } } },
        orderBy: { date: 'asc' },
      },
    },
  });
};

const findCurrentByUserId = async (userId, atDate = new Date()) => {
  const day = new Date(atDate);
  day.setHours(0, 0, 0, 0);
  const weekEnd = new Date(day);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return prisma.userWeeklyPlan.findFirst({
    where: {
      userId,
      weekStart: { lte: day },
      weekEnd: { gte: day },
    },
    include: {
      doctor: { include: { user: { select: { id: true, name: true } } } },
      days: {
        include: { workoutTemplate: { include: { templateExercises: { include: { exercise: true }, orderBy: { order: 'asc' } } } } },
        orderBy: { date: 'asc' },
      },
    },
  });
};

const findByUserId = async (userId, limit = 10) => {
  return prisma.userWeeklyPlan.findMany({
    where: { userId },
    include: {
      doctor: { include: { user: { select: { id: true, name: true } } } },
      days: {
        include: { workoutTemplate: true },
        orderBy: { date: 'asc' },
      },
    },
    orderBy: { weekStart: 'desc' },
    take: limit,
  });
};

const findByDoctorId = async (doctorId, limit = 50) => {
  return prisma.userWeeklyPlan.findMany({
    where: { doctorId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      days: { include: { workoutTemplate: true }, orderBy: { date: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
};

const update = async (id, data) => {
  const { days, ...rest } = data;
  const payload = { ...rest };
  if (rest.weekStart) payload.weekStart = new Date(rest.weekStart);
  if (rest.weekEnd) payload.weekEnd = new Date(rest.weekEnd);
  if (days !== undefined) {
    await prisma.userWeeklyPlanDay.deleteMany({ where: { userWeeklyPlanId: id } });
    if (days.length > 0) {
      await prisma.userWeeklyPlanDay.createMany({
        data: days.map((d, i) => ({
          userWeeklyPlanId: id,
          date: new Date(d.date),
          workoutTemplateId: d.workoutTemplateId,
          order: d.order ?? i,
        })),
      });
    }
  }
  return prisma.userWeeklyPlan.update({
    where: { id },
    data: payload,
    include: {
      user: { select: { id: true, name: true } },
      doctor: { include: { user: { select: { id: true, name: true } } } },
      days: {
        include: { workoutTemplate: { include: { templateExercises: { include: { exercise: true }, orderBy: { order: 'asc' } } } } },
        orderBy: { date: 'asc' },
      },
    },
  });
};

const remove = async (id) => {
  return prisma.userWeeklyPlan.delete({ where: { id } });
};

const getDayByPlanAndDate = async (planId, date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return prisma.userWeeklyPlanDay.findFirst({
    where: {
      userWeeklyPlanId: planId,
      date: { gte: d, lte: end },
    },
    include: {
      userWeeklyPlan: { include: { doctor: { include: { user: { select: { id: true, name: true } } } } } },
      workoutTemplate: {
        include: {
          templateExercises: { include: { exercise: true }, orderBy: { order: 'asc' } },
        },
      },
    },
  });
};

module.exports = {
  create,
  findById,
  findCurrentByUserId,
  findByUserId,
  findByDoctorId,
  update,
  remove,
  getDayByPlanAndDate,
};
