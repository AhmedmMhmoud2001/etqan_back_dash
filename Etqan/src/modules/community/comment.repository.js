const { prisma } = require('../../prisma/client');

const authorSelect = { id: true, name: true, email: true };

const listByPostId = async (postId, params = {}) => {
  const { skip = 0, take = 50 } = params;
  const [items, total] = await Promise.all([
    prisma.comment.findMany({
      where: { postId },
      include: { user: { select: authorSelect } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.comment.count({ where: { postId } }),
  ]);
  return { items, total };
};

const findById = async (id) => {
  return prisma.comment.findUnique({
    where: { id },
    include: { user: { select: authorSelect }, post: { select: { id: true, userId: true } } },
  });
};

const create = async (data) => {
  return prisma.comment.create({
    data: { postId: data.postId, userId: data.userId, content: data.content },
    include: { user: { select: authorSelect } },
  });
};

const update = async (id, data) => {
  return prisma.comment.update({
    where: { id },
    data: { content: data.content },
    include: { user: { select: authorSelect } },
  });
};

const remove = async (id) => {
  return prisma.comment.delete({ where: { id } });
};

module.exports = { listByPostId, findById, create, update, remove };
