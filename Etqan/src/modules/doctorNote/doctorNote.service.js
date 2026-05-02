const { prisma } = require('../../prisma/client');
const doctorNoteRepository = require('./doctorNote.repository');

const getDoctorIdForUser = async (user) => {
  if (user.role !== 'DOCTOR') return null;
  const doc = await prisma.doctor.findUnique({ where: { userId: user.id } });
  return doc?.id ?? null;
};

const create = async (data, user) => {
  const { patientId, content, doctorId: bodyDoctorId } = data;
  const doctorId = await getDoctorIdForUser(user);
  if (!doctorId) {
    const err = new Error('Only doctors can add notes');
    err.statusCode = 403;
    throw err;
  }
  const patient = await prisma.user.findUnique({ where: { id: patientId }, include: { doctor: true } });
  if (!patient) {
    const err = new Error('Patient not found');
    err.statusCode = 404;
    throw err;
  }
  let finalDoctorId = doctorId;
  // Admin cannot create notes on behalf of doctors.
  void bodyDoctorId;
  const doctorRecord = await prisma.doctor.findUnique({ where: { id: finalDoctorId } });
  if (!doctorRecord) {
    const err = new Error('Doctor not found');
    err.statusCode = 404;
    throw err;
  }
  return doctorNoteRepository.create({
    doctorId: doctorRecord.id,
    patientId,
    content,
  });
};

const getLatestForPatient = async (patientId) => {
  return doctorNoteRepository.getLatestForPatient(patientId);
};

const listForPatient = async (patientId, user) => {
  if (patientId !== user.id) {
    const patient = await prisma.user.findUnique({ where: { id: patientId }, select: { doctorId: true } });
    const doctorId = await getDoctorIdForUser(user);
    if (!doctorId || patient?.doctorId !== doctorId) {
      const err = new Error('Not allowed to view these notes');
      err.statusCode = 403;
      throw err;
    }
  }
  return doctorNoteRepository.findByPatientId(patientId);
};

module.exports = {
  create,
  getLatestForPatient,
  listForPatient,
  listForMyPatients: async (user) => {
    const doctorId = await getDoctorIdForUser(user);
    if (!doctorId) {
      const err = new Error('Doctor only');
      err.statusCode = 403;
      throw err;
    }
    return doctorNoteRepository.findByDoctorPatientsDoctorId(doctorId);
  },
  getDoctorIdForUser,
};
