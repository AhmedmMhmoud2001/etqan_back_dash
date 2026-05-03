const { prisma } = require('../../prisma/client');

const getStats = async () => {
  const [
    usersCount,
    doctorsCount,
    adminsCount,
    mealsCount,
    exercisesCount,
    channelsCount,
    postsCount,
    nutritionPlansCount,
    workoutPlansCount,
    doctorNotesCount,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.doctor.count(),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.meal.count(),
    prisma.exercise.count(),
    prisma.channel.count(),
    prisma.post.count(),
    prisma.nutritionPlan.count(),
    prisma.userWeeklyPlan.count(),
    prisma.doctorNote.count(),
  ]);
  return {
    usersCount,
    doctorsCount,
    adminsCount,
    mealsCount,
    exercisesCount,
    channelsCount,
    postsCount,
    nutritionPlansCount,
    workoutPlansCount,
    doctorNotesCount,
  };
};

const userInclude = { profile: true, doctor: { select: { id: true, title: true, user: { select: { id: true, name: true, email: true } } } } };

const listUsers = async (params) => {
  const { role, search, skip = 0, take = 20 } = params;
  const where = {};
  if (role) where.role = role;
  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { name: { contains: term } },
      { email: { contains: term } },
    ];
  }
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: userInclude,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);
  return { items, total };
};

const findUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    include: userInclude,
  });
};

const getStatsForUser = async (userId) => {
  const [measurementsCount, mealLogsCount, workoutSessionsCount, nutritionPlansCount, latestMeasurement, firstMeasurement] = await Promise.all([
    prisma.measurement.count({ where: { userId } }),
    prisma.userMealLog.count({ where: { userId } }),
    prisma.workoutSession.count({ where: { userId } }),
    prisma.nutritionPlan.count({ where: { userId } }),
    prisma.measurement.findFirst({
      where: { userId },
      orderBy: { measuredAt: 'desc' },
      select: { weight: true, measuredAt: true, bodyFat: true, waist: true },
    }),
    prisma.measurement.findFirst({
      where: { userId },
      orderBy: { measuredAt: 'asc' },
      select: { weight: true, measuredAt: true },
    }),
  ]);
  return {
    measurementsCount,
    mealLogsCount,
    workoutSessionsCount,
    nutritionPlansCount,
    latestWeight: latestMeasurement?.weight ?? null,
    latestMeasuredAt: latestMeasurement?.measuredAt ?? null,
    latestBodyFat: latestMeasurement?.bodyFat ?? null,
    latestWaist: latestMeasurement?.waist ?? null,
    firstWeight: firstMeasurement?.weight ?? null,
    firstMeasuredAt: firstMeasurement?.measuredAt ?? null,
  };
};

const findUserByEmail = async (email) => {
  if (!email) return null;
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
};

const createUser = async (data) => {
  return prisma.user.create({
    data: {
      ...data,
      email: (data.email || '').toLowerCase(),
    },
    include: userInclude,
  });
};

const updateUser = async (id, data) => {
  const payload = { ...data };
  if (payload.email) payload.email = payload.email.toLowerCase();
  return prisma.user.update({
    where: { id },
    data: payload,
    include: userInclude,
  });
};

const deleteUser = async (id) => {
  return prisma.user.update({
    where: { id },
    data: { isActive: false },
    include: userInclude,
  });
};

const toggleUserActive = async (id) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return null;
  return prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
    include: userInclude,
  });
};

// Doctors (جدول Doctor)
const listDoctors = async (params = {}) => {
  const { skip = 0, take = 20 } = params;
  const where = { isActive: true };
  const [items, total] = await Promise.all([
    prisma.doctor.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, profile: true } } },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.doctor.count({ where }),
  ]);
  return { items, total };
};

const findDoctorById = async (id) => {
  return prisma.doctor.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true, profile: true } }, _count: { select: { patients: true } } },
  });
};

const findDoctorByUserId = async (userId) => {
  return prisma.doctor.findUnique({
    where: { userId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
};

const listPatientsForDoctor = async (doctorId, params = {}) => {
  const { skip = 0, take = 20 } = params;
  const where = { doctorId, role: 'USER' };
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: userInclude,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);
  return { items, total };
};

const createDoctor = async (userData, doctorData = {}) => {
  const user = await prisma.user.create({
    data: {
      name: userData.name,
      email: (userData.email || '').toLowerCase(),
      password: userData.password,
      role: 'DOCTOR',
      emailVerified: userData.emailVerified !== false,
    },
  });
  const doctor = await prisma.doctor.create({
    data: {
      userId: user.id,
      title: doctorData.title,
      titleAr: doctorData.titleAr,
      titleIt: doctorData.titleIt,
      specialization: doctorData.specialization,
      specializationAr: doctorData.specializationAr,
      specializationIt: doctorData.specializationIt,
      bio: doctorData.bio,
      bioAr: doctorData.bioAr,
      bioIt: doctorData.bioIt,
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return doctor;
};

const updateDoctor = async (id, data) => {
  const doctor = await prisma.doctor.findUnique({ where: { id }, include: { user: true } });
  if (!doctor) return null;
  const doctorPayload = {};
  if (data.title !== undefined) doctorPayload.title = data.title;
  if (data.titleAr !== undefined) doctorPayload.titleAr = data.titleAr;
  if (data.titleIt !== undefined) doctorPayload.titleIt = data.titleIt;
  if (data.specialization !== undefined) doctorPayload.specialization = data.specialization;
  if (data.specializationAr !== undefined) doctorPayload.specializationAr = data.specializationAr;
  if (data.specializationIt !== undefined) doctorPayload.specializationIt = data.specializationIt;
  if (data.bio !== undefined) doctorPayload.bio = data.bio;
  if (data.bioAr !== undefined) doctorPayload.bioAr = data.bioAr;
  if (data.bioIt !== undefined) doctorPayload.bioIt = data.bioIt;
  if (data.isActive !== undefined) doctorPayload.isActive = data.isActive;
  if (data.name != null || data.email != null) {
    const userPayload = {};
    if (data.name != null) userPayload.name = data.name;
    if (data.email != null) userPayload.email = data.email.toLowerCase();
    await prisma.user.update({ where: { id: doctor.userId }, data: userPayload });
  }
  return prisma.doctor.update({
    where: { id },
    data: doctorPayload,
    include: { user: { select: { id: true, name: true, email: true, profile: true } } },
  });
};

const deleteDoctor = async (id) => {
  return prisma.doctor.update({
    where: { id },
    data: { isActive: false },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
};

const listAllNutritionPlans = async (params = {}) => {
  const { skip = 0, take = 100 } = params;
  const items = await prisma.nutritionPlan.findMany({
    skip,
    take,
    orderBy: { createdAt: 'desc' },
    include: {
      doctor: { include: { user: { select: { id: true, name: true, email: true } } } },
      user: { select: { id: true, name: true, email: true } },
      slots: { include: { meal: true }, orderBy: [{ date: 'asc' }, { time: 'asc' }] },
    },
  });
  const total = await prisma.nutritionPlan.count();
  return { items, total };
};

const listAllWorkoutPlans = async (params = {}) => {
  const { skip = 0, take = 200 } = params;
  const items = await prisma.userWeeklyPlan.findMany({
    skip,
    take,
    orderBy: { createdAt: 'desc' },
    include: {
      doctor: { include: { user: { select: { id: true, name: true, email: true } } } },
      user: { select: { id: true, name: true, email: true } },
      days: { include: { exercise: true }, orderBy: { date: 'asc' } },
    },
  });
  const total = await prisma.userWeeklyPlan.count();
  return { items, total };
};

const getWorkoutSessionsForUser = async (userId, limit = 30) => {
  return prisma.workoutSession.findMany({
    where: { userId },
    take: limit,
    orderBy: { startedAt: 'desc' },
    include: {
      exercises: {
        include: {
          exercise: { select: { id: true, name: true, nameAr: true } },
          setsLog: { orderBy: { setNumber: 'asc' } },
        },
        orderBy: { order: 'asc' },
      },
    },
  });
};

const getMeasurementsForUser = async (userId, limit = 60) => {
  const take = Math.min(Math.max(Number(limit) || 60, 1), 100);
  return prisma.measurement.findMany({
    where: { userId },
    take,
    orderBy: { measuredAt: 'desc' },
  });
};

const listAllDoctorNotes = async (params = {}) => {
  const { doctorId, patientId, skip = 0, take = 200 } = params;
  const where = {};
  if (doctorId) where.doctorId = doctorId;
  if (patientId) where.patientId = patientId;
  const [items, total] = await Promise.all([
    prisma.doctorNote.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: { include: { user: { select: { id: true, name: true, email: true } } } },
        patient: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.doctorNote.count({ where }),
  ]);
  return { items, total };
};

const listAllCommunityPosts = async (params = {}) => {
  const { userId, skip = 0, take = 200 } = params;
  const where = {};
  if (userId) where.userId = userId;
  const [items, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { likes: true, comments: true, shares: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);
  return { items, total };
};

const deleteCommunityPost = async (postId) => {
  return prisma.post.delete({ where: { id: postId } });
};

module.exports = {
  getStats,
  listUsers,
  findUserById,
  findUserByEmail,
  getStatsForUser,
  createUser,
  updateUser,
  deleteUser,
  toggleUserActive,
  listDoctors,
  findDoctorById,
  findDoctorByUserId,
  listPatientsForDoctor,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  listAllNutritionPlans,
  listAllWorkoutPlans,
  getWorkoutSessionsForUser,
  getMeasurementsForUser,
  listAllDoctorNotes,
  listAllCommunityPosts,
  deleteCommunityPost,
};
