const { prisma } = require('../../prisma/client');
const exerciseRepository = require('./exercise.repository');

const getDoctorIdForUser = async (user) => {
  if (user.role !== 'DOCTOR') return null;
  const doc = await prisma.doctor.findUnique({ where: { userId: user.id } });
  return doc?.id ?? null;
};

/** الأدمن أو الدكتور فقط يضيف التمارين */
const create = async (data, user) => {
  if (user.role !== 'ADMIN' && user.role !== 'DOCTOR') {
    const err = new Error('Only admin or doctor can add exercises');
    err.statusCode = 403;
    throw err;
  }
  return exerciseRepository.create({
    ...data,
    addedByUserId: user.id,
  });
};

const getById = async (id) => {
  const exercise = await exerciseRepository.findById(id);
  if (!exercise) {
    const err = new Error('Exercise not found');
    err.statusCode = 404;
    throw err;
  }
  return exercise;
};

const list = async (filters = {}, user) => {
  const opts = { ...filters };
  if (user.role !== 'ADMIN' && user.role !== 'DOCTOR') {
    // المستخدم العادي يشوف كل التمارين (للاختيار في الجلسة)
    delete opts.addedByUserId;
  }
  return exerciseRepository.findMany(opts);
};

const update = async (id, data, user) => {
  const exercise = await exerciseRepository.findById(id);
  if (!exercise) {
    const err = new Error('Exercise not found');
    err.statusCode = 404;
    throw err;
  }
  if (user.role !== 'ADMIN' && (user.role !== 'DOCTOR' || exercise.addedByUserId !== user.id)) {
    const err = new Error('Not allowed to update this exercise');
    err.statusCode = 403;
    throw err;
  }
  return exerciseRepository.update(id, data);
};

const remove = async (id, user) => {
  const exercise = await exerciseRepository.findById(id);
  if (!exercise) {
    const err = new Error('Exercise not found');
    err.statusCode = 404;
    throw err;
  }
  if (user.role !== 'ADMIN' && (user.role !== 'DOCTOR' || exercise.addedByUserId !== user.id)) {
    const err = new Error('Not allowed to delete this exercise');
    err.statusCode = 403;
    throw err;
  }
  await exerciseRepository.remove(id);
  return { deleted: true };
};

module.exports = {
  create,
  getById,
  list,
  update,
  remove,
  getDoctorIdForUser,
};
