const { prisma } = require('../../prisma/client');

const listByUserId = async (userId, { page = 1, limit = 20, unreadOnly = false } = {}) => {
  const skip = (Math.max(1, page) - 1) * limit;
  const take = Math.min(Math.max(1, limit), 100);
  const where = { userId };
  if (unreadOnly) where.read = false;
  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.notification.count({ where }),
  ]);
  return { items, total, page, limit };
};

const findByIdAndUserId = async (id, userId) => {
  return prisma.notification.findFirst({
    where: { id, userId },
  });
};

const markAsRead = async (id, userId) => {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { read: true },
  });
};

const markAllAsRead = async (userId) => {
  return prisma.notification.updateMany({
    where: { userId },
    data: { read: true },
  });
};

const getUnreadCount = async (userId) => {
  return prisma.notification.count({
    where: { userId, read: false },
  });
};

const create = async (data) => {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      title: data.title,
      body: data.body ?? null,
      type: data.type ?? null,
      link: data.link ?? null,
    },
  });
};

module.exports = {
  listByUserId,
  findByIdAndUserId,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  create,
};
