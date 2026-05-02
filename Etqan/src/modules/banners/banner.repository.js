const { prisma } = require('../../prisma/client');

const listAdmin = async ({ page = 1, limit = 50 } = {}) => {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (safePage - 1) * safeLimit;

  const [total, items] = await Promise.all([
    prisma.banner.count(),
    prisma.banner.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: safeLimit,
    }),
  ]);

  return { items, total, page: safePage, limit: safeLimit };
};

const listActive = async () => {
  const now = new Date();
  return prisma.banner.findMany({
    where: {
      isActive: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gt: now } }] }],
    },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });
};

const findById = async (id) => prisma.banner.findUnique({ where: { id } });
const create = async (data) => prisma.banner.create({ data });
const update = async (id, data) => prisma.banner.update({ where: { id }, data });
const remove = async (id) => prisma.banner.delete({ where: { id } });

module.exports = {
  listAdmin,
  listActive,
  findById,
  create,
  update,
  remove,
};

