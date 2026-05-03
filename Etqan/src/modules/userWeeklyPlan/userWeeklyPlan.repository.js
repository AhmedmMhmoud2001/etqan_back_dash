const { prisma } = require('../../prisma/client');

const dayData = (d, i) => {
  const base = { date: new Date(d.date), order: d.order ?? i };
  if (d.exerciseId) {
    base.exerciseId = d.exerciseId;
    base.sets = d.sets != null ? d.sets : 3;
    base.repMin = d.repMin != null ? d.repMin : 8;
    base.repMax = d.repMax != null ? d.repMax : 12;
  }
  return base;
};

const daysInclude = {
  include: { exercise: true },
  orderBy: { date: 'asc' },
};

const create = async (data) => {
  const { days = [], ...rest } = data;
  const plan = await prisma.userWeeklyPlan.create({
    data: {
      ...rest,
      weekStart: new Date(rest.weekStart),
      weekEnd: new Date(rest.weekEnd),
    },
  });
  if (days.length > 0) {
    const toCreate = days
      .map((d, i) => ({ userWeeklyPlanId: plan.id, ...dayData(d, i) }))
      .filter((row) => row.exerciseId);
    if (toCreate.length > 0) {
      await prisma.userWeeklyPlanDay.createMany({
        data: toCreate.map(({ date, order, exerciseId, sets, repMin, repMax }) => ({
          userWeeklyPlanId: plan.id,
          date,
          order,
          exerciseId,
          sets,
          repMin,
          repMax,
        })),
      });
    }
  }
  return findById(plan.id);
};

const findById = async (id) => {
  return prisma.userWeeklyPlan.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      doctor: { include: { user: { select: { id: true, name: true } } } },
      days: daysInclude,
    },
  });
};

const findCurrentByUserId = async (userId, atDate = new Date()) => {
  const dayStart = new Date(atDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setHours(23, 59, 59, 999);
  // Admin UI saves weekStart/weekEnd as local noon → ISO (often mid-day UTC). Comparing only
  // to midnight `day` breaks when weekStart on the same calendar day is still after 00:00 UTC.
  // Overlap rule: plan interval [weekStart, weekEnd] intersects calendar day [dayStart, dayEnd].
  return prisma.userWeeklyPlan.findFirst({
    where: {
      userId,
      weekStart: { lte: dayEnd },
      weekEnd: { gte: dayStart },
    },
    orderBy: { weekStart: 'desc' },
    include: {
      doctor: { include: { user: { select: { id: true, name: true } } } },
      days: daysInclude,
    },
  });
};

const findByUserId = async (userId, limit = 10) => {
  return prisma.userWeeklyPlan.findMany({
    where: { userId },
    include: {
      doctor: { include: { user: { select: { id: true, name: true } } } },
      days: { include: { exercise: true }, orderBy: { date: 'asc' } },
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
      days: { include: { exercise: true }, orderBy: { date: 'asc' } },
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
      const toCreate = days
        .map((d, i) => ({ userWeeklyPlanId: id, ...dayData(d, i) }))
        .filter((row) => row.exerciseId);
      if (toCreate.length > 0) {
        await prisma.userWeeklyPlanDay.createMany({
          data: toCreate.map(({ userWeeklyPlanId, date, order, exerciseId, sets, repMin, repMax }) => ({
            userWeeklyPlanId,
            date,
            order,
            exerciseId,
            sets,
            repMin,
            repMax,
          })),
        });
      }
    }
  }
  return prisma.userWeeklyPlan.update({
    where: { id },
    data: payload,
    include: {
      user: { select: { id: true, name: true } },
      doctor: { include: { user: { select: { id: true, name: true } } } },
      days: daysInclude,
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
      exercise: true,
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
