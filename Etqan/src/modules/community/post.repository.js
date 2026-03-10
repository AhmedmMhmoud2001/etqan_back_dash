const { prisma } = require('../../prisma/client');

const authorSelect = { id: true, name: true, email: true };

const list = async (params) => {
  const { skip = 0, take = 20 } = params;
  return prisma.post.findMany({
    include: {
      user: { select: authorSelect },
      _count: { select: { likes: true, comments: true, shares: true } },
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take,
  });
};

const findById = async (id) => {
  return prisma.post.findUnique({
    where: { id },
    include: {
      user: { select: authorSelect },
      _count: { select: { likes: true, comments: true, shares: true } },
    },
  });
};

const create = async (data) => {
  return prisma.post.create({
    data: { userId: data.userId, content: data.content, imageUrl: data.imageUrl ?? undefined, badge: data.badge ?? undefined },
    include: {
      user: { select: authorSelect },
      _count: { select: { likes: true, comments: true, shares: true } },
    },
  });
};

const update = async (id, data) => {
  const payload = {};
  if (data.content != null) payload.content = data.content;
  if (data.imageUrl !== undefined) payload.imageUrl = data.imageUrl || null;
  if (data.badge !== undefined) payload.badge = data.badge || null;
  return prisma.post.update({
    where: { id },
    data: payload,
    include: {
      user: { select: authorSelect },
      _count: { select: { likes: true, comments: true, shares: true } },
    },
  });
};

const remove = async (id) => {
  return prisma.post.delete({ where: { id } });
};

const countByUserId = async (userId) => {
  return prisma.post.count({ where: { userId } });
};

module.exports = { list, findById, create, update, remove, countByUserId };
