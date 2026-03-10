const { prisma } = require('../../prisma/client');

const findById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    include: { profile: true },
  });
};

const update = async (id, data) => {
  return prisma.user.update({
    where: { id },
    data,
    include: { profile: true },
  });
};

module.exports = { findById, update };
