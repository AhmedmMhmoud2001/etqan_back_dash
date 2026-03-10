const { prisma } = require('../../prisma/client');

const userSelect = { id: true, name: true, email: true };
const doctorInclude = { select: { id: true, title: true, user: { select: userSelect } } };

const findOrCreateByPatientAndDoctor = async (patientId, doctorId) => {
  let conv = await prisma.conversation.findUnique({
    where: { patientId_doctorId: { patientId, doctorId } },
    include: {
      patient: { select: userSelect },
      doctor: doctorInclude,
    },
  });
  if (!conv) {
    conv = await prisma.conversation.create({
      data: { patientId, doctorId },
      include: {
        patient: { select: userSelect },
        doctor: doctorInclude,
      },
    });
  }
  return conv;
};

const findById = async (id) => {
  return prisma.conversation.findUnique({
    where: { id },
    include: {
      patient: { select: userSelect },
      doctor: doctorInclude,
    },
  });
};

const findByPatientId = async (patientId) => {
  return prisma.conversation.findMany({
    where: { patientId },
    include: {
      patient: { select: userSelect },
      doctor: doctorInclude,
    },
    orderBy: { updatedAt: 'desc' },
  });
};

const findByDoctorId = async (doctorId) => {
  return prisma.conversation.findMany({
    where: { doctorId },
    include: {
      patient: { select: userSelect },
      doctor: doctorInclude,
    },
    orderBy: { updatedAt: 'desc' },
  });
};

module.exports = { findOrCreateByPatientAndDoctor, findById, findByPatientId, findByDoctorId };
