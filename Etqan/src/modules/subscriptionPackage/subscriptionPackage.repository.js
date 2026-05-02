const { prisma } = require('../../prisma/client');

const list = async ({ page = 1, limit = 50, activeOnly = false } = {}) => {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (safePage - 1) * safeLimit;

  const where = {};
  if (activeOnly) where.isActive = true;

  const [total, items] = await Promise.all([
    prisma.subscriptionPackage.count({ where }),
    prisma.subscriptionPackage.findMany({
      where,
      orderBy: [{ isActive: 'desc' }, { durationMonths: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: safeLimit,
    }),
  ]);

  return { items, total, page: safePage, limit: safeLimit };
};

const findById = async (id) => {
  return prisma.subscriptionPackage.findUnique({ where: { id } });
};

const create = async (data) => prisma.subscriptionPackage.create({ data });

const update = async (id, data) =>
  prisma.subscriptionPackage.update({ where: { id }, data });

module.exports = { list, findById, create, update };

