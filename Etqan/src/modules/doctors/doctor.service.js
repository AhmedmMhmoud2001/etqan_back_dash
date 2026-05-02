const doctorRepository = require('./doctor.repository');
const { prisma } = require('../../prisma/client');

const getById = async (id) => {
  const doctor = await doctorRepository.findById(id);
  if (!doctor) {
    const err = new Error('Doctor not found');
    err.statusCode = 404;
    throw err;
  }
  const { password: _, ...rest } = doctor;
  return rest;
};

const list = async (page = 1, limit = 20) => {
  const skip = (Math.max(1, page) - 1) * limit;
  const { items, total } = await doctorRepository.findAll({ skip, take: limit });
  const sanitized = items.map(({ password: _, ...u }) => u);
  return { items: sanitized, total, page, limit };
};

const listMyPatients = async (user, page = 1, limit = 50) => {
  if (user.role !== 'DOCTOR') {
    const err = new Error('Doctor only');
    err.statusCode = 403;
    throw err;
  }
  const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } });
  if (!doctor) {
    const err = new Error('Doctor profile not found for this account');
    err.statusCode = 404;
    throw err;
  }

  const skip = (Math.max(1, page) - 1) * limit;
  const take = Math.min(limit, 500);
  const where = { role: 'USER', doctorId: doctor.id };
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, isActive: true, createdAt: true, profile: true },
    }),
    prisma.user.count({ where }),
  ]);
  return { items, total, page, limit };
};

module.exports = { getById, list, listMyPatients };
