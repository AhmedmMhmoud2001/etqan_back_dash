const { prisma } = require('../../prisma/client');

const create = async (data) => {
  const { exercises = [], equipmentNeeded, ...rest } = data;
  const payload = {
    ...rest,
    equipmentNeeded: equipmentNeeded != null ? equipmentNeeded : undefined,
    templateExercises: {
      create: exercises.map((e, i) => ({
        exerciseId: e.exerciseId,
        order: e.order ?? i,
        sets: e.sets,
        repMin: e.repMin,
        repMax: e.repMax,
        restSeconds: e.restSeconds ?? 90,
      })),
    },
  };
  return prisma.workoutTemplate.create({
    data: payload,
    include: {
      createdByDoctor: { include: { user: { select: { id: true, name: true } } } },
      templateExercises: { include: { exercise: true }, orderBy: { order: 'asc' } },
    },
  });
};

const findById = async (id) => {
  return prisma.workoutTemplate.findUnique({
    where: { id },
    include: {
      createdByDoctor: { include: { user: { select: { id: true, name: true } } } },
      templateExercises: { include: { exercise: true }, orderBy: { order: 'asc' } },
    },
  });
};

const findMany = async (filters = {}) => {
  const { createdByDoctorId, search, limit = 50, offset = 0 } = filters;
  const where = {};
  if (createdByDoctorId) where.createdByDoctorId = createdByDoctorId;
  if (search && search.trim()) {
    where.OR = [
      { name: { contains: search.trim() } },
      { nameAr: { contains: search.trim() } },
    ];
  }
  const [items, total] = await Promise.all([
    prisma.workoutTemplate.findMany({
      where,
      include: {
        createdByDoctor: { include: { user: { select: { id: true, name: true } } } },
        templateExercises: { include: { exercise: true }, orderBy: { order: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.workoutTemplate.count({ where }),
  ]);
  return { items, total };
};

const update = async (id, data) => {
  const { exercises, equipmentNeeded, ...rest } = data;
  const payload = { ...rest };
  if (equipmentNeeded !== undefined) payload.equipmentNeeded = equipmentNeeded;
  if (exercises !== undefined) {
    await prisma.workoutTemplateExercise.deleteMany({ where: { workoutTemplateId: id } });
    if (exercises.length > 0) {
      await prisma.workoutTemplateExercise.createMany({
        data: exercises.map((e, i) => ({
          workoutTemplateId: id,
          exerciseId: e.exerciseId,
          order: e.order ?? i,
          sets: e.sets,
          repMin: e.repMin,
          repMax: e.repMax,
          restSeconds: e.restSeconds ?? 90,
        })),
      });
    }
  }
  return prisma.workoutTemplate.update({
    where: { id },
    data: payload,
    include: {
      createdByDoctor: { include: { user: { select: { id: true, name: true } } } },
      templateExercises: { include: { exercise: true }, orderBy: { order: 'asc' } },
    },
  });
};

const remove = async (id) => {
  return prisma.workoutTemplate.delete({ where: { id } });
};

module.exports = {
  create,
  findById,
  findMany,
  update,
  remove,
};
