const { prisma } = require('../../prisma/client');

const create = async (data) => {
  return prisma.doctorNote.create({
    data: {
      doctorId: data.doctorId,
      patientId: data.patientId,
      content: data.content,
    },
    include: {
      doctor: { include: { user: { select: { id: true, name: true } } } },
      patient: { select: { id: true, name: true } },
    },
  });
};

const getLatestForPatient = async (patientId) => {
  return prisma.doctorNote.findFirst({
    where: { patientId },
    orderBy: { createdAt: 'desc' },
    include: {
      doctor: { include: { user: { select: { id: true, name: true } } } },
    },
  });
};

const findById = async (id) => {
  return prisma.doctorNote.findUnique({
    where: { id },
    include: {
      doctor: { include: { user: { select: { id: true, name: true } } } },
      patient: { select: { id: true, name: true } },
    },
  });
};

const findByPatientId = async (patientId, limit = 20) => {
  return prisma.doctorNote.findMany({
    where: { patientId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      doctor: { include: { user: { select: { id: true, name: true } } } },
    },
  });
};

module.exports = {
  create,
  getLatestForPatient,
  findById,
  findByPatientId,
};
