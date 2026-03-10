const subscriptionRepository = require('./subscription.repository');

const getMySubscription = async (userId) => {
  let sub = await subscriptionRepository.findByUserId(userId);
  if (!sub) {
    sub = await subscriptionRepository.upsert(userId, { plan: 'FREE' });
  }
  return {
    plan: sub.plan,
    endsAt: sub.endsAt,
    discountPercentToApply: sub.discountPercentToApply ?? 0,
    isPremium: sub.plan === 'PREMIUM',
  };
};

const upgrade = async (userId, durationMonths = 1) => {
  const sub = await subscriptionRepository.findByUserId(userId);
  const now = new Date();
  const endsAt = new Date(now);
  endsAt.setMonth(endsAt.getMonth() + durationMonths);
  const currentEnds = sub?.endsAt ? new Date(sub.endsAt) : null;
  const startFrom = currentEnds && currentEnds > now ? currentEnds : now;
  const newEndsAt = new Date(startFrom);
  newEndsAt.setMonth(newEndsAt.getMonth() + durationMonths);
  const updated = await subscriptionRepository.upsert(userId, {
    plan: 'PREMIUM',
    endsAt: newEndsAt,
  });
  return {
    plan: updated.plan,
    endsAt: updated.endsAt,
    discountPercentToApply: updated.discountPercentToApply ?? 0,
    isPremium: true,
  };
};

const applyDiscountOnRenewal = async (userId) => {
  await subscriptionRepository.applyDiscountAndReset(userId);
  return getMySubscription(userId);
};

module.exports = {
  getMySubscription,
  upgrade,
  applyDiscountOnRenewal,
};
