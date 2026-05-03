const doctorRepository = require('./doctor.repository');
const adminRepository = require('../admin/admin.repository');
const baselineGoalService = require('../measurements/baselineGoal.service');
const conversationRepository = require('../chat/conversation.repository');
const { prisma } = require('../../prisma/client');
const { premiumSubscriptionActive } = require('../../utils/premiumSubscriptionActive');

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
  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        profile: true,
        subscription: { select: { plan: true, endsAt: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);
  const items = rows.map((u) => ({
    ...u,
    isPremiumActive: premiumSubscriptionActive(u.subscription),
  }));
  return { items, total, page, limit };
};

/** يتحقق أن المستخدم مسجّل كدكتور وأن المريض معيّن له؛ وإلا يرمي 403/404 */
const ensureAssignedPatient = async (user, patientUserId) => {
  if (user.role !== 'DOCTOR') {
    const err = new Error('Doctor only');
    err.statusCode = 403;
    throw err;
  }
  const doctorRecord = await prisma.doctor.findUnique({ where: { userId: user.id } });
  if (!doctorRecord) {
    const err = new Error('Doctor profile not found for this account');
    err.statusCode = 404;
    throw err;
  }
  const linked = await prisma.user.findFirst({
    where: { id: patientUserId, role: 'USER', doctorId: doctorRecord.id },
    select: { id: true },
  });
  if (!linked) {
    const err = new Error('Patient not found or not assigned to you');
    err.statusCode = 404;
    throw err;
  }
};

/**
 * ملفّ مريض كامل للدكتور المعيَّن له (بدون كلمة المرور)، يشبه شكل أدمن getUser مع stats + التقدّم.
 */
const getMyPatientDetail = async (user, patientUserId) => {
  await ensureAssignedPatient(user, patientUserId);
  const patientUser = await adminRepository.findUserById(patientUserId);
  if (!patientUser) {
    const err = new Error('Patient not found');
    err.statusCode = 404;
    throw err;
  }
  const { password: _, ...safe } = patientUser;
  const [stats, measurementProgress] = await Promise.all([
    adminRepository.getStatsForUser(patientUserId),
    baselineGoalService.getSummary(patientUserId),
  ]);
  return { ...safe, stats, measurementProgress };
};

const getMyPatientWorkoutSessions = async (user, patientUserId, limit = 30) => {
  await ensureAssignedPatient(user, patientUserId);
  const take = Math.min(parseInt(limit, 10) || 30, 50);
  return adminRepository.getWorkoutSessionsForUser(patientUserId, take);
};

const getMyPatientMeasurements = async (user, patientUserId, limit = 60) => {
  await ensureAssignedPatient(user, patientUserId);
  return adminRepository.getMeasurementsForUser(patientUserId, limit);
};

/**
 * إحصائيات مريض واحد للدكتور الحالي فقط إن كان المعيَّن له.
 */
const getMyPatientStats = async (user, patientUserId) => {
  await ensureAssignedPatient(user, patientUserId);
  const patient = await prisma.user.findFirst({
    where: { id: patientUserId },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      createdAt: true,
      profile: true,
    },
  });
  const [stats, measurementProgress] = await Promise.all([
    adminRepository.getStatsForUser(patientUserId),
    baselineGoalService.getSummary(patientUserId),
  ]);
  return { patient, stats, measurementProgress };
};

/** إنشاء محادثة مع مريض معيّن أو إرجاع الموجودة (للدكتور يبدأ الشات من اللوحة). */
const getOrCreateMyPatientConversation = async (user, patientUserId) => {
  await ensureAssignedPatient(user, patientUserId);
  const doctorRecord = await prisma.doctor.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!doctorRecord) {
    const err = new Error('Doctor profile not found for this account');
    err.statusCode = 404;
    throw err;
  }
  const conv = await conversationRepository.findOrCreateByPatientAndDoctor(patientUserId, doctorRecord.id);
  return {
    ...conv,
    patient: conv.patient
      ? {
          ...conv.patient,
          isPremiumActive: premiumSubscriptionActive(conv.patient.subscription),
        }
      : conv.patient,
  };
};

module.exports = {
  getById,
  list,
  listMyPatients,
  getMyPatientStats,
  getMyPatientDetail,
  getMyPatientWorkoutSessions,
  getMyPatientMeasurements,
  getOrCreateMyPatientConversation,
};
