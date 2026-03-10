const { prisma } = require('../../prisma/client');
const workoutSessionRepository = require('./workoutSession.repository');

/** بدء جلسة تمرين من يوم الخطة (تمرين واحد) */
const startSession = async (userId, data) => {
  const { userWeeklyPlanDayId } = data;
  if (!userWeeklyPlanDayId) {
    const err = new Error('userWeeklyPlanDayId is required');
    err.statusCode = 400;
    throw err;
  }
  const day = await prisma.userWeeklyPlanDay.findUnique({
    where: { id: userWeeklyPlanDayId },
    include: { userWeeklyPlan: true, exercise: true },
  });
  if (!day || day.userWeeklyPlan.userId !== userId) {
    const err = new Error('Plan day not found or not yours');
    err.statusCode = 404;
    throw err;
  }
  if (!day.exerciseId || !day.exercise) {
    const err = new Error('Plan day has no exercise');
    err.statusCode = 400;
    throw err;
  }
  const session = await workoutSessionRepository.createFromPlanDay(userId, userWeeklyPlanDayId);
  if (!session) {
    const err = new Error('Failed to create session from plan day');
    err.statusCode = 500;
    throw err;
  }
  return session;
};

const getById = async (id, userId) => {
  const session = await workoutSessionRepository.findById(id);
  if (!session) {
    const err = new Error('Session not found');
    err.statusCode = 404;
    throw err;
  }
  if (session.userId !== userId) {
    const err = new Error('Not allowed to view this session');
    err.statusCode = 403;
    throw err;
  }
  return session;
};

const listMySessions = async (userId, filters = {}) => {
  return workoutSessionRepository.findByUserId(userId, filters);
};

const completeSet = async (userId, sessionExerciseId, setNumber, actualReps) => {
  const se = await workoutSessionRepository.getSessionExerciseById(sessionExerciseId);
  if (!se) {
    const err = new Error('Session exercise not found');
    err.statusCode = 404;
    throw err;
  }
  if (se.session.userId !== userId) {
    const err = new Error('Not allowed to update this session');
    err.statusCode = 403;
    throw err;
  }
  if (se.session.status !== 'IN_PROGRESS') {
    const err = new Error('Session is not in progress');
    err.statusCode = 400;
    throw err;
  }
  const updated = await workoutSessionRepository.logSet(sessionExerciseId, setNumber, actualReps);
  if (!updated) {
    const err = new Error('Set not found');
    err.statusCode = 404;
    throw err;
  }
  return workoutSessionRepository.findById(se.sessionId);
};

const endSession = async (id, userId, status = 'COMPLETED') => {
  const session = await workoutSessionRepository.findById(id);
  if (!session) {
    const err = new Error('Session not found');
    err.statusCode = 404;
    throw err;
  }
  if (session.userId !== userId) {
    const err = new Error('Not allowed to end this session');
    err.statusCode = 403;
    throw err;
  }
  if (session.status !== 'IN_PROGRESS') {
    const err = new Error('Session is already ended');
    err.statusCode = 400;
    throw err;
  }
  return workoutSessionRepository.endSession(id, status);
};

module.exports = {
  startSession,
  getById,
  listMySessions,
  completeSet,
  endSession,
};
