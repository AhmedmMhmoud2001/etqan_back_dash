const { prisma } = require('../../prisma/client');
const measurementRepository = require('./measurement.repository');

const create = async (userId, data) => {
  return measurementRepository.create({
    userId,
    weight: parseFloat(data.weight),
    bodyFat: data.bodyFat != null ? parseFloat(data.bodyFat) : null,
    muscleMass: data.muscleMass != null ? parseFloat(data.muscleMass) : null,
    water: data.water != null ? parseFloat(data.water) : null,
    waist: data.waist != null ? parseFloat(data.waist) : null,
    source: data.source || 'MANUAL',
    measuredAt: data.measuredAt || new Date(),
  });
};

const getById = async (id, userId) => {
  const m = await measurementRepository.findById(id);
  if (!m) {
    const err = new Error('Measurement not found');
    err.statusCode = 404;
    throw err;
  }
  if (m.userId !== userId) {
    const err = new Error('Not allowed to view this measurement');
    err.statusCode = 403;
    throw err;
  }
  return m;
};

const listMine = async (userId, filters = {}) => {
  const { startDate, endDate, limit, offset } = filters;
  return measurementRepository.findByUserId(userId, {
    startDate,
    endDate,
    limit: limit || 100,
    offset: offset || 0,
  });
};

/** تقدم المستخدم: آخر قياس + التغيّر + الهدف من البروفايل + نقاط للرسم */
const getProgress = async (userId, period = '3M') => {
  const now = new Date();
  let start = new Date(now);
  if (period === '1M') start.setMonth(start.getMonth() - 1);
  else if (period === '3M') start.setMonth(start.getMonth() - 3);
  else if (period === '6M') start.setMonth(start.getMonth() - 6);
  else if (period === '1Y') start.setFullYear(start.getFullYear() - 1);
  else start.setMonth(start.getMonth() - 3);
  start.setHours(0, 0, 0, 0);

  const [latest, oldestInRange, profile, listInRange] = await Promise.all([
    measurementRepository.getLatestByUserId(userId),
    measurementRepository.getOldestInRange(userId, start, now),
    prisma.profile.findUnique({ where: { userId }, select: { targetWeight: true } }),
    measurementRepository.findByUserId(userId, { startDate: start, endDate: now, limit: 500 }),
  ]);

  const current = latest || null;
  const startMeasurement = oldestInRange || latest;
  const targetWeight = profile?.targetWeight ?? null;

  const changes = current && startMeasurement ? {
    weight: current.weight - startMeasurement.weight,
    bodyFat: (current.bodyFat != null && startMeasurement.bodyFat != null) ? current.bodyFat - startMeasurement.bodyFat : null,
    muscleMass: (current.muscleMass != null && startMeasurement.muscleMass != null) ? current.muscleMass - startMeasurement.muscleMass : null,
    water: (current.water != null && startMeasurement.water != null) ? current.water - startMeasurement.water : null,
  } : null;

  return {
    current: current ? {
      id: current.id,
      measuredAt: current.measuredAt,
      weight: current.weight,
      bodyFat: current.bodyFat,
      muscleMass: current.muscleMass,
      water: current.water,
      waist: current.waist,
    } : null,
    start: startMeasurement ? {
      weight: startMeasurement.weight,
      bodyFat: startMeasurement.bodyFat,
      muscleMass: startMeasurement.muscleMass,
      water: startMeasurement.water,
    } : null,
    targetWeight,
    changes,
    chartData: (listInRange.items || []).map((m) => ({
      date: m.measuredAt,
      weight: m.weight,
      bodyFat: m.bodyFat,
      muscleMass: m.muscleMass,
      water: m.water,
    })).reverse(),
  };
};

const remove = async (id, userId) => {
  const m = await measurementRepository.findById(id);
  if (!m) {
    const err = new Error('Measurement not found');
    err.statusCode = 404;
    throw err;
  }
  if (m.userId !== userId) {
    const err = new Error('Not allowed to delete this measurement');
    err.statusCode = 403;
    throw err;
  }
  await measurementRepository.remove(id);
  return { deleted: true };
};

module.exports = {
  create,
  getById,
  listMine,
  getProgress,
  remove,
};
