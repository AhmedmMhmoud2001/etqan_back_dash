const { prisma } = require('../../prisma/client');

const findByUserId = async (userId) => {
  return prisma.profile.findUnique({
    where: { userId },
  });
};

const create = async (data) => {
  return prisma.profile.create({ data });
};

const update = async (userId, data) => {
  return prisma.profile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
};

module.exports = { findByUserId, create, update };
