const { prisma } = require('../../prisma/client');

const add = async (postId, userId) => {
  await prisma.postShare.create({ data: { postId, userId } });
  return prisma.postShare.count({ where: { postId } });
};

const countByPostId = async (postId) => {
  return prisma.postShare.count({ where: { postId } });
};

module.exports = { add, countByPostId };
