const { prisma } = require('../../prisma/client');
const subscriptionRepository = require('./subscription.repository');

const normalizePlan = (plan) => {
  if (!plan) return null;
  const p = String(plan).trim().toUpperCase();
  if (p === 'FREE' || p === 'PREMIUM') return p;
  return null;
};

const getUserSubscription = async (userId) => {
  let sub = await subscriptionRepository.findByUserId(userId);
  if (!sub) sub = await subscriptionRepository.upsert(userId, { plan: 'FREE' });
  return {
    userId,
    plan: sub.plan,
    endsAt: sub.endsAt,
    discountPercentToApply: sub.discountPercentToApply ?? 0,
    isPremium: sub.plan === 'PREMIUM',
  };
};

const listSubscriptions = async ({ page = 1, limit = 20, search = '', plan = '' }) => {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (safePage - 1) * safeLimit;

  const normalizedPlan = normalizePlan(plan);
  const q = search ? String(search).trim() : '';

  const where = {};
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { email: { contains: q } },
    ];
  }

  if (normalizedPlan === 'PREMIUM') {
    where.subscription = { is: { plan: 'PREMIUM' } };
  } else if (normalizedPlan === 'FREE') {
    where.OR = (where.OR || []).concat([
      { subscription: { is: null } },
      { subscription: { is: { plan: 'FREE' } } },
    ]);
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        subscription: { select: { plan: true, endsAt: true, discountPercentToApply: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: safeLimit,
    }),
  ]);

  const items = users.map((u) => ({
    userId: u.id,
    user: { name: u.name, email: u.email },
    plan: u.subscription?.plan ?? 'FREE',
    endsAt: u.subscription?.endsAt ?? null,
    discountPercentToApply: u.subscription?.discountPercentToApply ?? 0,
  }));

  return { items, total, page: safePage, limit: safeLimit };
};

const updateUserSubscription = async (userId, { plan, endsAt }) => {
  const nextPlan = plan != null ? normalizePlan(plan) : null;
  if (plan != null && !nextPlan) {
    const err = new Error('Invalid plan');
    err.statusCode = 400;
    throw err;
  }

  let nextEndsAt = undefined;
  if (nextPlan === 'FREE') {
    nextEndsAt = null;
  } else if (nextPlan === 'PREMIUM') {
    if (endsAt == null || String(endsAt).trim() === '') {
      const err = new Error('endsAt is required for PREMIUM');
      err.statusCode = 400;
      throw err;
    }
    const d = new Date(endsAt);
    if (Number.isNaN(d.getTime())) {
      const err = new Error('Invalid endsAt');
      err.statusCode = 400;
      throw err;
    }
    nextEndsAt = d;
  } else if (endsAt != null) {
    const d = new Date(endsAt);
    if (Number.isNaN(d.getTime())) {
      const err = new Error('Invalid endsAt');
      err.statusCode = 400;
      throw err;
    }
    nextEndsAt = d;
  }

  const data = {};
  if (nextPlan) data.plan = nextPlan;
  if (nextEndsAt !== undefined) data.endsAt = nextEndsAt;

  await subscriptionRepository.upsert(userId, data);
  return getUserSubscription(userId);
};

const assignPackageToUser = async (userId, { packageId, listPrice, payPrice, currency }) => {
  const pkg = await prisma.subscriptionPackage.findUnique({ where: { id: packageId } });
  if (!pkg || !pkg.isActive) {
    const err = new Error('Package not found');
    err.statusCode = 404;
    throw err;
  }
  const sub = await subscriptionRepository.findByUserId(userId);
  const now = new Date();
  const currentEnds = sub?.endsAt ? new Date(sub.endsAt) : null;
  const startFrom = currentEnds && currentEnds > now ? currentEnds : now;
  const newEndsAt = new Date(startFrom);
  newEndsAt.setMonth(newEndsAt.getMonth() + pkg.durationMonths);

  await subscriptionRepository.upsert(userId, {
    plan: 'PREMIUM',
    endsAt: newEndsAt,
    packageId: pkg.id,
    startedAt: now,
    lastListPrice: listPrice ?? pkg.listPrice,
    lastPayPrice: payPrice ?? pkg.payPrice,
    lastCurrency: currency ?? pkg.currency,
  });

  return getUserSubscription(userId);
};

module.exports = {
  listSubscriptions,
  getUserSubscription,
  updateUserSubscription,
  assignPackageToUser,
};

