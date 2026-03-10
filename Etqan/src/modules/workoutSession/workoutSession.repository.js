const { prisma } = require('../../prisma/client');

/** إنشاء جلسة من قالب مع نسخ التمارين (exercises مع sets, repMin, repMax, restSeconds) */
const createFromTemplate = async (userId, workoutTemplateId, userWeeklyPlanDayId = null) => {
  const template = await prisma.workoutTemplate.findUnique({
    where: { id: workoutTemplateId },
    include: { templateExercises: { include: { exercise: true }, orderBy: { order: 'asc' } } },
  });
  if (!template) return null;

  const session = await prisma.workoutSession.create({
    data: {
      userId,
      workoutTemplateId,
      userWeeklyPlanDayId: userWeeklyPlanDayId || null,
      status: 'IN_PROGRESS',
      exercises: {
        create: template.templateExercises.map((te) => ({
          exerciseId: te.exerciseId,
          order: te.order,
          sets: te.sets,
          repMin: te.repMin,
          repMax: te.repMax,
          restSeconds: te.restSeconds,
        })),
      },
    },
    include: {
      workoutTemplate: true,
      userWeeklyPlanDay: true,
      exercises: {
        include: { exercise: true },
        orderBy: { order: 'asc' },
      },
    },
  });

  // إنشاء سجلات المجموعات (WorkoutSessionSet) لكل مجموعة في كل تمرين
  for (const se of session.exercises) {
    const setsToCreate = [];
    for (let i = 1; i <= se.sets; i++) {
      setsToCreate.push({
        workoutSessionExerciseId: se.id,
        setNumber: i,
        targetRepMin: se.repMin,
        targetRepMax: se.repMax,
      });
    }
    await prisma.workoutSessionSet.createMany({ data: setsToCreate });
  }

  return prisma.workoutSession.findUnique({
    where: { id: session.id },
    include: {
      workoutTemplate: true,
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
      workoutTemplate: true,
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
        workoutTemplate: true,
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
      workoutTemplate: true,
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
  createFromTemplate,
  findById,
  findByUserId,
  endSession,
  logSet,
  getSessionExerciseById,
};
