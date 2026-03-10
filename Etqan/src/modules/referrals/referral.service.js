const { prisma } = require('../../prisma/client');
const referralRepository = require('./referral.repository');

const DISCOUNT_PERCENT_PER_REFERRAL = 10;
const MAX_DISCOUNT_PERCENT = 50;

const getMyStatus = async (userId) => {
  const code = await referralRepository.getOrCreateReferralCode(userId);
  if (!code) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  const friendsJoined = await referralRepository.countReferredUsers(userId);
  const discountEarned = Math.min(friendsJoined * DISCOUNT_PERCENT_PER_REFERRAL, MAX_DISCOUNT_PERCENT);
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { discountPercentToApply: true },
  });
  const discountToApply = subscription?.discountPercentToApply ?? 0;
  return {
    referralCode: code,
    friendsJoined,
    discountPerReferral: DISCOUNT_PERCENT_PER_REFERRAL,
    discountEarned,
    discountToApplyOnNextRenewal: discountToApply,
    messageOnNextRenewal: discountToApply > 0 ? `On your next Premium renewal` : null,
  };
};

const listMyReferrals = async (userId) => {
  const list = await referralRepository.listReferredUsers(userId);
  return list.map((u) => ({
    id: u.id,
    name: u.name,
    joinedAt: u.createdAt,
  }));
};

const addReferrerDiscount = async (referrerId, percent = DISCOUNT_PERCENT_PER_REFERRAL) => {
  const existing = await prisma.subscription.findUnique({ where: { userId: referrerId } });
  const current = existing?.discountPercentToApply ?? 0;
  const next = Math.min(current + percent, MAX_DISCOUNT_PERCENT);
  const sub = await prisma.subscription.upsert({
    where: { userId: referrerId },
    create: { userId: referrerId, plan: 'FREE', discountPercentToApply: next },
    update: { discountPercentToApply: next },
  });
  return sub;
};

module.exports = {
  getMyStatus,
  listMyReferrals,
  addReferrerDiscount,
  DISCOUNT_PERCENT_PER_REFERRAL,
  MAX_DISCOUNT_PERCENT,
};
