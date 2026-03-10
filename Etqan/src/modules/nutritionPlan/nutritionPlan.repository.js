const { prisma } = require('../../prisma/client');

const create = async (data) => {
  const { slots = [], ...planData } = data;
  return prisma.nutritionPlan.create({
    data: {
      ...planData,
      startDate: new Date(planData.startDate),
      endDate: new Date(planData.endDate),
      slots: {
        create: slots.map((s) => ({
          date: new Date(s.date),
          slotType: s.slotType,
          time: s.time,
          mealId: s.mealId || null,
        })),
      },
    },
    include: {
      doctor: { include: { user: { select: { id: true, name: true } } } },
      slots: { include: { meal: true }, orderBy: [{ date: 'asc' }, { time: 'asc' }] },
    },
  });
};

const findById = async (id) => {
  return prisma.nutritionPlan.findUnique({
    where: { id },
    include: {
      doctor: { include: { user: { select: { id: true, name: true } } } },
      slots: { include: { meal: true }, orderBy: [{ date: 'asc' }, { time: 'asc' }] },
    },
  });
};

const findActiveByUserId = async (userId, atDate = new Date()) => {
  const day = new Date(atDate);
  day.setHours(0, 0, 0, 0);
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);
  return prisma.nutritionPlan.findFirst({
    where: {
      userId,
      startDate: { lte: end },
      endDate: { gte: day },
    },
    include: {
      doctor: { include: { user: { select: { id: true, name: true } } } },
      slots: { include: { meal: true }, orderBy: [{ date: 'asc' }, { time: 'asc' }] },
    },
  });
};

const findByUserId = async (userId, limit = 10) => {
  return prisma.nutritionPlan.findMany({
    where: { userId },
    include: {
      doctor: { include: { user: { select: { id: true, name: true } } } },
      slots: { include: { meal: true }, orderBy: [{ date: 'asc' }, { time: 'asc' }] },
    },
    orderBy: { startDate: 'desc' },
    take: limit,
  });
};

const findByDoctorId = async (doctorId, limit = 50) => {
  return prisma.nutritionPlan.findMany({
    where: { doctorId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      slots: { include: { meal: true }, orderBy: [{ date: 'asc' }, { time: 'asc' }] },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
};

const update = async (id, data) => {
  const { slots, ...planData } = data;
  const payload = { ...planData };
  if (planData.startDate) payload.startDate = new Date(planData.startDate);
  if (planData.endDate) payload.endDate = new Date(planData.endDate);
  if (slots !== undefined) {
    await prisma.nutritionPlanSlot.deleteMany({ where: { planId: id } });
    if (slots.length > 0) {
      await prisma.nutritionPlanSlot.createMany({
        data: slots.map((s) => ({
          planId: id,
          date: new Date(s.date),
          slotType: s.slotType,
          time: s.time,
          mealId: s.mealId || null,
        })),
      });
    }
  }
  return prisma.nutritionPlan.update({
    where: { id },
    data: payload,
    include: {
      doctor: { include: { user: { select: { id: true, name: true } } } },
      slots: { include: { meal: true }, orderBy: [{ date: 'asc' }, { time: 'asc' }] },
    },
  });
};

const remove = async (id) => {
  return prisma.nutritionPlan.delete({ where: { id } });
};

const getSlotsByPlanAndDate = async (planId, date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return prisma.nutritionPlanSlot.findMany({
    where: { planId, date: { gte: start, lte: end } },
    include: { meal: true },
    orderBy: { time: 'asc' },
  });
};

const getSlotById = async (slotId) => {
  return prisma.nutritionPlanSlot.findUnique({
    where: { id: slotId },
    include: { plan: true, meal: true },
  });
};

module.exports = {
  create,
  findById,
  findActiveByUserId,
  findByUserId,
  findByDoctorId,
  update,
  remove,
  getSlotsByPlanAndDate,
  getSlotById,
};
