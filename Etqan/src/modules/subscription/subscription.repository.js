const { prisma } = require('../../prisma/client');

const findByUserId = async (userId) => {
  return prisma.subscription.findUnique({
    where: { userId },
  });
};

const upsert = async (userId, data) => {
  return prisma.subscription.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
};

const applyDiscountAndReset = async (userId) => {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub || !sub.discountPercentToApply || sub.discountPercentToApply <= 0) return sub;
  return prisma.subscription.update({
    where: { userId },
    data: { discountPercentToApply: 0 },
  });
};

module.exports = {
  findByUserId,
  upsert,
  applyDiscountAndReset,
};
