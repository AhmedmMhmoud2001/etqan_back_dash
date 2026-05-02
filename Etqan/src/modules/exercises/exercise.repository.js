const { prisma } = require('../../prisma/client');

const create = async (data) => {
  return prisma.exercise.create({
    data: {
      ...data,
      targetMuscles: data.targetMuscles ?? undefined,
    },
  });
};

const findById = async (id) => {
  return prisma.exercise.findUnique({
    where: { id },
    include: { addedByUser: { select: { id: true, name: true } } },
  });
};

const findMany = async (filters = {}) => {
  const { addedByUserId, search, limit = 50, offset = 0 } = filters;
  const where = {};
  if (addedByUserId) where.addedByUserId = addedByUserId;
  if (search && search.trim()) {
    where.OR = [
      { name: { contains: search.trim() } },
      { nameAr: { contains: search.trim() } },
      { nameIt: { contains: search.trim() } },
    ];
  }
  const [items, total] = await Promise.all([
    prisma.exercise.findMany({
      where,
      include: { addedByUser: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.exercise.count({ where }),
  ]);
  return { items, total };
};

const update = async (id, data) => {
  return prisma.exercise.update({
    where: { id },
    data: {
      ...data,
      targetMuscles: data.targetMuscles !== undefined ? data.targetMuscles : undefined,
    },
    include: { addedByUser: { select: { id: true, name: true } } },
  });
};

const remove = async (id) => {
  return prisma.exercise.delete({ where: { id } });
};

module.exports = {
  create,
  findById,
  findMany,
  update,
  remove,
};
