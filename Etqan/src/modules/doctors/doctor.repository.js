const { prisma } = require('../../prisma/client');

const findById = async (id) => {
  return prisma.doctor.findFirst({
    where: { id, isActive: true },
    include: { user: { select: { id: true, name: true, email: true, profile: true } } },
  });
};

const findAll = async (params = {}) => {
  const { skip = 0, take = 20 } = params;
  const [items, total] = await Promise.all([
    prisma.doctor.findMany({
      where: { isActive: true },
      include: { user: { select: { id: true, name: true, email: true, profile: true } } },
      skip,
      take,
    }),
    prisma.doctor.count({ where: { isActive: true } }),
  ]);
  return { items, total };
};

module.exports = { findById, findAll };
