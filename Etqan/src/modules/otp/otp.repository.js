const { prisma } = require('../../prisma/client');

const create = async (data) => {
  return prisma.otp.create({ data });
};

const findValidByUserIdAndType = async (userId, type, code) => {
  return prisma.otp.findFirst({
    where: {
      userId,
      type,
      code,
      used: false,
      expiresAt: { gt: new Date() },
    },
  });
};

const markAsUsed = async (id) => {
  return prisma.otp.update({
    where: { id },
    data: { used: true },
  });
};

const invalidateByUserIdAndType = async (userId, type) => {
  return prisma.otp.updateMany({
    where: { userId, type },
    data: { used: true },
  });
};

module.exports = {
  create,
  findValidByUserIdAndType,
  markAsUsed,
  invalidateByUserIdAndType,
};
