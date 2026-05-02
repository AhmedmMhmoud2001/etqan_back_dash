const { prisma } = require('../../prisma/client');

const REFERRAL_CODE_PREFIX = 'ETQAN';
const ALPHANUM = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // بدون 0,O,1,I لتفادي الالتباس

const generateCode = () => {
  let s = REFERRAL_CODE_PREFIX;
  for (let i = 0; i < 6; i++) s += ALPHANUM[Math.floor(Math.random() * ALPHANUM.length)];
  return s;
};

const getOrCreateReferralCode = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });
  if (!user) return null;
  if (user.referralCode) return user.referralCode;
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCode();
    const existing = await prisma.user.findUnique({ where: { referralCode: code } });
    if (!existing) {
      await prisma.user.update({
        where: { id: userId },
        data: { referralCode: code },
      });
      return code;
    }
  }
  const fallback = REFERRAL_CODE_PREFIX + userId.slice(-6).toUpperCase().replace(/[^A-Z0-9]/g, '2');
  await prisma.user.update({
    where: { id: userId },
    data: { referralCode: fallback },
  });
  return fallback;
};

const findByReferralCode = async (code) => {
  if (!code || typeof code !== 'string') return null;
  const normalized = code.trim().toUpperCase();
  return prisma.user.findUnique({
    where: { referralCode: normalized },
    select: { id: true },
  });
};

const countReferredUsers = async (referrerId) => {
  return prisma.user.count({
    where: { referredById: referrerId },
  });
};

const listReferredUsers = async (referrerId, limit = 50) => {
  return prisma.user.findMany({
    where: { referredById: referrerId },
    select: {
      id: true,
      name: true,
      createdAt: true,
      subscription: { select: { plan: true, endsAt: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
};

const setReferredBy = async (userId, referrerId) => {
  return prisma.user.update({
    where: { id: userId },
    data: { referredById: referrerId },
  });
};

module.exports = {
  getOrCreateReferralCode,
  findByReferralCode,
  countReferredUsers,
  listReferredUsers,
  setReferredBy,
};
