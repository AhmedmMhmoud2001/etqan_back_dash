const { prisma } = require('../../prisma/client');

const follow = async (followerId, followingId) => {
  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
  if (existing) return { followed: true };
  await prisma.follow.create({ data: { followerId, followingId } });
  return { followed: true };
};

const unfollow = async (followerId, followingId) => {
  await prisma.follow.deleteMany({
    where: { followerId, followingId },
  });
  return { followed: false };
};

const countFollowers = async (userId) => {
  return prisma.follow.count({ where: { followingId: userId } });
};

const countFollowing = async (userId) => {
  return prisma.follow.count({ where: { followerId: userId } });
};

const isFollowing = async (followerId, followingId) => {
  const f = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
  return !!f;
};

module.exports = { follow, unfollow, countFollowers, countFollowing, isFollowing };
