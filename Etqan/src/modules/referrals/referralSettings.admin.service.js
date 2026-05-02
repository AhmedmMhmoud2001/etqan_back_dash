const { prisma } = require('../../prisma/client');
const crypto = require('crypto');

const DEFAULTS = {
  discountPercentPerReferral: 10,
  maxDiscountPercent: 50,
};

const getSettings = async () => {
  const rows = await prisma.$queryRaw`
    SELECT discountPercentPerReferral, maxDiscountPercent
    FROM ReferralSettings
    ORDER BY createdAt ASC
    LIMIT 1
  `;
  const s = rows?.[0];
  if (!s) return { ...DEFAULTS };
  return {
    discountPercentPerReferral: Number(s.discountPercentPerReferral ?? DEFAULTS.discountPercentPerReferral),
    maxDiscountPercent: Number(s.maxDiscountPercent ?? DEFAULTS.maxDiscountPercent),
  };
};

const updateSettings = async ({ discountPercentPerReferral, maxDiscountPercent }) => {
  const next = {
    discountPercentPerReferral: discountPercentPerReferral != null ? Number(discountPercentPerReferral) : undefined,
    maxDiscountPercent: maxDiscountPercent != null ? Number(maxDiscountPercent) : undefined,
  };

  if (
    next.discountPercentPerReferral != null &&
    (!Number.isFinite(next.discountPercentPerReferral) || next.discountPercentPerReferral < 0 || next.discountPercentPerReferral > 100)
  ) {
    const err = new Error('Invalid discountPercentPerReferral');
    err.statusCode = 400;
    throw err;
  }
  if (
    next.maxDiscountPercent != null &&
    (!Number.isFinite(next.maxDiscountPercent) || next.maxDiscountPercent < 0 || next.maxDiscountPercent > 100)
  ) {
    const err = new Error('Invalid maxDiscountPercent');
    err.statusCode = 400;
    throw err;
  }

  const current = await getSettings();
  const merged = {
    discountPercentPerReferral: next.discountPercentPerReferral ?? current.discountPercentPerReferral,
    maxDiscountPercent: next.maxDiscountPercent ?? current.maxDiscountPercent,
  };

  // Ensure singleton row exists
  const existingRows = await prisma.$queryRaw`
    SELECT id FROM ReferralSettings ORDER BY createdAt ASC LIMIT 1
  `;
  const existingId = existingRows?.[0]?.id;
  if (!existingId) {
    const id = crypto.randomUUID();
    await prisma.$executeRaw`
      INSERT INTO ReferralSettings (id, discountPercentPerReferral, maxDiscountPercent, createdAt, updatedAt)
      VALUES (${id}, ${merged.discountPercentPerReferral}, ${merged.maxDiscountPercent}, NOW(), NOW())
    `;
    return merged;
  }

  await prisma.$executeRaw`
    UPDATE ReferralSettings
    SET discountPercentPerReferral = ${merged.discountPercentPerReferral},
        maxDiscountPercent = ${merged.maxDiscountPercent},
        updatedAt = NOW()
    WHERE id = ${existingId}
  `;

  return merged;
};

module.exports = {
  getSettings,
  updateSettings,
  DEFAULTS,
};

