const { prisma } = require('../../prisma/client');

const toggle = async (postId, userId) => {
  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId } },
  });
  if (existing) {
    await prisma.postLike.delete({ where: { id: existing.id } });
    return { liked: false };
  }
  await prisma.postLike.create({ data: { postId, userId } });
  return { liked: true };
};

const isLikedByUser = async (postId, userId) => {
  const like = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId } },
  });
  return !!like;
};

const countByPostId = async (postId) => {
  return prisma.postLike.count({ where: { postId } });
};

module.exports = { toggle, isLikedByUser, countByPostId };
