const { prisma } = require('../../prisma/client');

const parseFloatOrNull = (v) => {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  const n = parseFloat(v);
  if (Number.isNaN(n)) return undefined;
  return n;
};

const toPayload = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    weight: row.weight,
    bodyFat: row.bodyFat,
    muscleMass: row.muscleMass,
    water: row.water,
    waist: row.waist,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

const upsertBaseline = async (userId, body) => {
  const weight = parseFloatOrNull(body.weight);
  if (weight === undefined || weight === null) {
    const err = new Error('weight is required');
    err.statusCode = 400;
    throw err;
  }
  const data = {
    weight,
    bodyFat: parseFloatOrNull(body.bodyFat) ?? null,
    muscleMass: parseFloatOrNull(body.muscleMass) ?? null,
    water: parseFloatOrNull(body.water) ?? null,
    waist: parseFloatOrNull(body.waist) ?? null,
  };
  const row = await prisma.measurementBaseline.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
  return toPayload(row);
};

const getBaseline = async (userId) => {
  const row = await prisma.measurementBaseline.findUnique({ where: { userId } });
  return toPayload(row);
};

const deleteBaseline = async (userId) => {
  const row = await prisma.measurementBaseline.findUnique({ where: { userId } });
  if (!row) return { deleted: true };
  await prisma.measurementBaseline.delete({ where: { userId } });
  return { deleted: true };
};

const upsertGoal = async (userId, body) => {
  const weight = parseFloatOrNull(body.weight);
  if (weight === undefined || weight === null) {
    const err = new Error('weight is required');
    err.statusCode = 400;
    throw err;
  }
  const data = {
    weight,
    bodyFat: parseFloatOrNull(body.bodyFat) ?? null,
    muscleMass: parseFloatOrNull(body.muscleMass) ?? null,
    water: parseFloatOrNull(body.water) ?? null,
    waist: parseFloatOrNull(body.waist) ?? null,
  };
  const row = await prisma.measurementGoal.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
  return toPayload(row);
};

const getGoal = async (userId) => {
  const row = await prisma.measurementGoal.findUnique({ where: { userId } });
  return toPayload(row);
};

const deleteGoal = async (userId) => {
  const row = await prisma.measurementGoal.findUnique({ where: { userId } });
  if (!row) return { deleted: true };
  await prisma.measurementGoal.delete({ where: { userId } });
  return { deleted: true };
};

const compute = (start, current, goal) => {
  const metrics = ['weight', 'bodyFat', 'muscleMass', 'water', 'waist'];
  const byMetric = {};
  for (const k of metrics) {
    const s = start?.[k] ?? null;
    const c = current?.[k] ?? null;
    const g = goal?.[k] ?? null;
    const deltaFromStart = (s != null && c != null) ? c - s : null;
    const totalToGoal = (s != null && g != null) ? g - s : null;
    const progressPercent = (deltaFromStart != null && totalToGoal != null && totalToGoal !== 0)
      ? (deltaFromStart / totalToGoal) * 100
      : null;
    byMetric[k] = { start: s, current: c, goal: g, deltaFromStart, totalToGoal, progressPercent };
  }
  return byMetric;
};

const getSummary = async (userId) => {
  const [baseline, goal, latest] = await Promise.all([
    prisma.measurementBaseline.findUnique({ where: { userId } }),
    prisma.measurementGoal.findUnique({ where: { userId } }),
    prisma.measurement.findFirst({ where: { userId }, orderBy: { measuredAt: 'desc' } }),
  ]);
  const baselinePayload = toPayload(baseline);
  const goalPayload = toPayload(goal);
  const currentPayload = latest
    ? {
        id: latest.id,
        measuredAt: latest.measuredAt,
        weight: latest.weight,
        bodyFat: latest.bodyFat,
        muscleMass: latest.muscleMass,
        water: latest.water,
        waist: latest.waist,
      }
    : null;

  return {
    baseline: baselinePayload,
    goal: goalPayload,
    current: currentPayload,
    metrics: compute(baselinePayload, currentPayload, goalPayload),
  };
};

module.exports = {
  upsertBaseline,
  getBaseline,
  deleteBaseline,
  upsertGoal,
  getGoal,
  deleteGoal,
  getSummary,
};

