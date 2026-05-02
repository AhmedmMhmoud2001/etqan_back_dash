const { prisma } = require('../../prisma/client');
const referralRepository = require('./referral.repository');
const referralSettingsAdminService = require('./referralSettings.admin.service');

const DISCOUNT_PERCENT_PER_REFERRAL = 10;
const MAX_DISCOUNT_PERCENT = 50;

const isActivePremiumSubscription = (sub, now = new Date()) => {
  if (!sub) return false;
  if (sub.plan !== 'PREMIUM') return false;
  if (sub.endsAt == null) return true;
  return new Date(sub.endsAt) > now;
};

const getMyStatus = async (userId) => {
  const code = await referralRepository.getOrCreateReferralCode(userId);
  if (!code) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  const settings = await referralSettingsAdminService.getSettings();
  const friendsJoined = await referralRepository.countReferredUsers(userId);
  const discountEarned = Math.min(friendsJoined * settings.discountPercentPerReferral, settings.maxDiscountPercent);
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { discountPercentToApply: true },
  });
  const discountToApply = subscription?.discountPercentToApply ?? 0;
  return {
    referralCode: code,
    friendsJoined,
    discountPerReferral: settings.discountPercentPerReferral,
    discountEarned,
    discountToApplyOnNextRenewal: discountToApply,
    messageOnNextRenewal: discountToApply > 0 ? `On your next Premium renewal` : null,
  };
};

const getMyInfo = async (userId) => {
  const code = await referralRepository.getOrCreateReferralCode(userId);
  if (!code) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const [list, mySub] = await Promise.all([
    referralRepository.listReferredUsers(userId),
    prisma.subscription.findUnique({
      where: { userId },
      select: { plan: true, endsAt: true },
    }),
  ]);

  const settings = await referralSettingsAdminService.getSettings();
  const friendsJoined = list.length;
  const discountEarned = Math.min(friendsJoined * settings.discountPercentPerReferral, settings.maxDiscountPercent);

  const now = new Date();
  return {
    referralCode: code,
    friendsJoined,
    discountEarned,
    mySubscription: mySub ?? { plan: 'FREE', endsAt: null },
    referrals: list.map((u) => ({
      name: u.name,
      joinedAt: u.createdAt,
      status: isActivePremiumSubscription(u.subscription, now) ? 'ACTIVE' : 'PENDING',
    })),
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

const addReferrerDiscount = async (referrerId, percent) => {
  const settings = await referralSettingsAdminService.getSettings();
  const existing = await prisma.subscription.findUnique({ where: { userId: referrerId } });
  const current = existing?.discountPercentToApply ?? 0;
  const add = percent != null ? Number(percent) : settings.discountPercentPerReferral;
  const next = Math.min(current + add, settings.maxDiscountPercent);
  const sub = await prisma.subscription.upsert({
    where: { userId: referrerId },
    create: { userId: referrerId, plan: 'FREE', discountPercentToApply: next },
    update: { discountPercentToApply: next },
  });
  return sub;
};

module.exports = {
  getMyStatus,
  getMyInfo,
  listMyReferrals,
  addReferrerDiscount,
  DISCOUNT_PERCENT_PER_REFERRAL,
  MAX_DISCOUNT_PERCENT,
};
