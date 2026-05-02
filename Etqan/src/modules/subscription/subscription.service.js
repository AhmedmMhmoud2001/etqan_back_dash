const subscriptionRepository = require('./subscription.repository');
const { prisma } = require('../../prisma/client');

const computeNewEndsAt = ({ currentEndsAt, durationMonths }) => {
  const now = new Date();
  const currentEnds = currentEndsAt ? new Date(currentEndsAt) : null;
  const startFrom = currentEnds && currentEnds > now ? currentEnds : now;
  const newEndsAt = new Date(startFrom);
  newEndsAt.setMonth(newEndsAt.getMonth() + durationMonths);
  return newEndsAt;
};

const getMySubscription = async (userId) => {
  let sub = await subscriptionRepository.findByUserId(userId);
  if (!sub) {
    sub = await subscriptionRepository.upsert(userId, { plan: 'FREE' });
  }
  const pkg = sub.packageId
    ? await prisma.subscriptionPackage.findUnique({
      where: { id: sub.packageId },
      select: { id: true, name: true, durationMonths: true, listPrice: true, payPrice: true, currency: true, isActive: true },
    })
    : null;
  return {
    plan: sub.plan,
    endsAt: sub.endsAt,
    discountPercentToApply: sub.discountPercentToApply ?? 0,
    isPremium: sub.plan === 'PREMIUM',
    package: pkg,
    lastListPrice: sub.lastListPrice ?? null,
    lastPayPrice: sub.lastPayPrice ?? null,
    lastCurrency: sub.lastCurrency ?? null,
  };
};

const upgrade = async (userId, durationMonths = 1) => {
  const sub = await subscriptionRepository.findByUserId(userId);
  const newEndsAt = computeNewEndsAt({ currentEndsAt: sub?.endsAt, durationMonths });
  const updated = await subscriptionRepository.upsert(userId, {
    plan: 'PREMIUM',
    endsAt: newEndsAt,
  });
  return getMySubscription(updated.userId);
};

const listActivePackages = async () => {
  const items = await prisma.subscriptionPackage.findMany({
    where: { isActive: true },
    orderBy: [{ durationMonths: 'asc' }, { payPrice: 'asc' }],
  });
  return { items };
};

const upgradeByPackage = async (userId, packageId, overrides = {}) => {
  const pkg = await prisma.subscriptionPackage.findUnique({ where: { id: packageId } });
  if (!pkg || !pkg.isActive) {
    const err = new Error('Package not found');
    err.statusCode = 404;
    throw err;
  }

  const sub = await subscriptionRepository.findByUserId(userId);
  const newEndsAt = computeNewEndsAt({ currentEndsAt: sub?.endsAt, durationMonths: pkg.durationMonths });
  const startedAt = new Date();
  const lastListPrice = overrides.listPrice ?? pkg.listPrice;
  const lastPayPrice = overrides.payPrice ?? pkg.payPrice;
  const lastCurrency = overrides.currency ?? pkg.currency;

  await subscriptionRepository.upsert(userId, {
    plan: 'PREMIUM',
    endsAt: newEndsAt,
    packageId: pkg.id,
    startedAt,
    lastListPrice,
    lastPayPrice,
    lastCurrency,
  });

  return getMySubscription(userId);
};

const applyDiscountOnRenewal = async (userId) => {
  await subscriptionRepository.applyDiscountAndReset(userId);
  return getMySubscription(userId);
};

module.exports = {
  getMySubscription,
  upgrade,
  listActivePackages,
  upgradeByPackage,
  applyDiscountOnRenewal,
};
