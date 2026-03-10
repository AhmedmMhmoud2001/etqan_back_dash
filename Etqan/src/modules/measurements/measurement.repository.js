const { prisma } = require('../../prisma/client');

const create = async (data) => {
  return prisma.measurement.create({
    data: {
      ...data,
      measuredAt: data.measuredAt ? new Date(data.measuredAt) : new Date(),
    },
  });
};

const findById = async (id) => {
  return prisma.measurement.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true } } },
  });
};

const findByUserId = async (userId, filters = {}) => {
  const { startDate, endDate, limit = 100, offset = 0 } = filters;
  const where = { userId };
  if (startDate || endDate) {
    where.measuredAt = {};
    if (startDate) where.measuredAt.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.measuredAt.lte = end;
    }
  }
  const [items, total] = await Promise.all([
    prisma.measurement.findMany({
      where,
      orderBy: { measuredAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.measurement.count({ where }),
  ]);
  return { items, total };
};

const getLatestByUserId = async (userId) => {
  return prisma.measurement.findFirst({
    where: { userId },
    orderBy: { measuredAt: 'desc' },
  });
};

const getOldestInRange = async (userId, startDate, endDate) => {
  const where = { userId };
  where.measuredAt = {};
  if (startDate) where.measuredAt.gte = new Date(startDate);
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    where.measuredAt.lte = end;
  }
  return prisma.measurement.findFirst({
    where,
    orderBy: { measuredAt: 'asc' },
  });
};

const remove = async (id) => {
  return prisma.measurement.delete({ where: { id } });
};

module.exports = {
  create,
  findById,
  findByUserId,
  getLatestByUserId,
  getOldestInRange,
  remove,
};
