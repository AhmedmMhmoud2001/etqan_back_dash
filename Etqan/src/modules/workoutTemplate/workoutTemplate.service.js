const { prisma } = require('../../prisma/client');
const workoutTemplateRepository = require('./workoutTemplate.repository');

const getDoctorIdForUser = async (user) => {
  if (user.role !== 'DOCTOR') return null;
  const doc = await prisma.doctor.findUnique({ where: { userId: user.id } });
  return doc?.id ?? null;
};

const create = async (data, user) => {
  const doctorId = await getDoctorIdForUser(user);
  if (!doctorId && user.role !== 'ADMIN') {
    const err = new Error('Only doctors or admin can create workout templates');
    err.statusCode = 403;
    throw err;
  }
  const payload = { ...data };
  if (user.role === 'DOCTOR') payload.createdByDoctorId = doctorId;
  if (user.role === 'ADMIN' && data.createdByDoctorId) payload.createdByDoctorId = data.createdByDoctorId;
  return workoutTemplateRepository.create(payload);
};

const getById = async (id) => {
  const template = await workoutTemplateRepository.findById(id);
  if (!template) {
    const err = new Error('Workout template not found');
    err.statusCode = 404;
    throw err;
  }
  return template;
};

const list = async (filters = {}, user) => {
  const opts = { ...filters };
  if (user.role === 'DOCTOR') {
    const doctorId = await getDoctorIdForUser(user);
    if (doctorId) opts.createdByDoctorId = doctorId;
  }
  return workoutTemplateRepository.findMany(opts);
};

const update = async (id, data, user) => {
  const template = await workoutTemplateRepository.findById(id);
  if (!template) {
    const err = new Error('Workout template not found');
    err.statusCode = 404;
    throw err;
  }
  const doctorId = await getDoctorIdForUser(user);
  if (user.role !== 'ADMIN' && (user.role !== 'DOCTOR' || template.createdByDoctorId !== doctorId)) {
    const err = new Error('Not allowed to update this template');
    err.statusCode = 403;
    throw err;
  }
  return workoutTemplateRepository.update(id, data);
};

const remove = async (id, user) => {
  const template = await workoutTemplateRepository.findById(id);
  if (!template) {
    const err = new Error('Workout template not found');
    err.statusCode = 404;
    throw err;
  }
  const doctorId = await getDoctorIdForUser(user);
  if (user.role !== 'ADMIN' && (user.role !== 'DOCTOR' || template.createdByDoctorId !== doctorId)) {
    const err = new Error('Not allowed to delete this template');
    err.statusCode = 403;
    throw err;
  }
  await workoutTemplateRepository.remove(id);
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
