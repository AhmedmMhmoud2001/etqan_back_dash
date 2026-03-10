const { prisma } = require('../../prisma/client');

/** إنشاء جلسة من يوم خطة فيه تمرين واحد */
const createFromPlanDay = async (userId, planDayId) => {
  const day = await prisma.userWeeklyPlanDay.findUnique({
    where: { id: planDayId },
    include: { exercise: true, userWeeklyPlan: true },
  });
  if (!day || day.userWeeklyPlan.userId !== userId) return null;
  if (!day.exerciseId || !day.exercise) return null;
  const sets = day.sets ?? 3;
  const repMin = day.repMin ?? 8;
  const repMax = day.repMax ?? 12;

  const session = await prisma.workoutSession.create({
    data: {
      userId,
      userWeeklyPlanDayId: planDayId,
      status: 'IN_PROGRESS',
      exercises: {
        create: [{
          exerciseId: day.exerciseId,
          order: 0,
          sets,
          repMin,
          repMax,
          restSeconds: 90,
        }],
      },
    },
    include: {
      userWeeklyPlanDay: true,
      exercises: {
        include: { exercise: true },
        orderBy: { order: 'asc' },
      },
    },
  });

  for (const se of session.exercises) {
    const setsToCreate = [];
    for (let i = 1; i <= se.sets; i++) {
      setsToCreate.push({
        workoutSessionExerciseId: se.id,
        setNumber: i,
        targetRepMin: repMin,
        targetRepMax: repMax,
      });
    }
    await prisma.workoutSessionSet.createMany({ data: setsToCreate });
  }

  return prisma.workoutSession.findUnique({
    where: { id: session.id },
    include: {
      userWeeklyPlanDay: true,
      exercises: {
        include: {
          exercise: true,
          setsLog: { orderBy: { setNumber: 'asc' } },
        },
        orderBy: { order: 'asc' },
      },
    },
  });
};

const findById = async (id) => {
  return prisma.workoutSession.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true } },
      userWeeklyPlanDay: true,
      exercises: {
        include: {
          exercise: true,
          setsLog: { orderBy: { setNumber: 'asc' } },
        },
        orderBy: { order: 'asc' },
      },
    },
  });
};

const findByUserId = async (userId, filters = {}) => {
  const { limit = 20, offset = 0, status } = filters;
  const where = { userId };
  if (status) where.status = status;
  const [items, total] = await Promise.all([
    prisma.workoutSession.findMany({
      where,
      include: {
        userWeeklyPlanDay: true,
        exercises: {
          include: { exercise: true, setsLog: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.workoutSession.count({ where }),
  ]);
  return { items, total };
};

const endSession = async (id, status = 'COMPLETED') => {
  return prisma.workoutSession.update({
    where: { id },
    data: { endedAt: new Date(), status },
    include: {
      exercises: {
        include: { exercise: true, setsLog: { orderBy: { setNumber: 'asc' } } },
        orderBy: { order: 'asc' },
      },
    },
  });
};

const logSet = async (workoutSessionExerciseId, setNumber, actualReps) => {
  const set = await prisma.workoutSessionSet.findFirst({
    where: {
      workoutSessionExerciseId,
      setNumber: parseInt(setNumber, 10),
    },
  });
  if (!set) return null;
  return prisma.workoutSessionSet.update({
    where: { id: set.id },
    data: { actualReps: parseInt(actualReps, 10), completedAt: new Date() },
  });
};

const getSessionExerciseById = async (sessionExerciseId) => {
  return prisma.workoutSessionExercise.findUnique({
    where: { id: sessionExerciseId },
    include: {
      session: true,
      exercise: true,
      setsLog: { orderBy: { setNumber: 'asc' } },
    },
  });
};

module.exports = {
  createFromPlanDay,
  findById,
  findByUserId,
  endSession,
  logSet,
  getSessionExerciseById,
};
