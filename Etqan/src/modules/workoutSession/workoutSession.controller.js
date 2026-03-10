const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const workoutSessionService = require('./workoutSession.service');

const start = asyncHandler(async (req, res) => {
  const session = await workoutSessionService.startSession(req.user.id, req.body);
  success(res, session, 'Workout session started', 201);
});

const getById = asyncHandler(async (req, res) => {
  const session = await workoutSessionService.getById(req.params.id, req.user.id);
  success(res, session, 'Session details');
});

const listMine = asyncHandler(async (req, res) => {
  const { limit, offset, status } = req.query;
  const result = await workoutSessionService.listMySessions(req.user.id, {
    limit: limit ? parseInt(limit, 10) : 20,
    offset: offset ? parseInt(offset, 10) : 0,
    status: status || undefined,
  });
  success(res, result, 'My sessions');
});

const completeSet = asyncHandler(async (req, res) => {
  const session = await workoutSessionService.completeSet(
    req.user.id,
    req.params.sessionExerciseId,
    req.body.setNumber,
    req.body.actualReps
  );
  success(res, session, 'Set completed');
});

const endSession = asyncHandler(async (req, res) => {
  const status = req.body.status === 'ABANDONED' ? 'ABANDONED' : 'COMPLETED';
  const session = await workoutSessionService.endSession(req.params.id, req.user.id, status);
  success(res, session, status === 'ABANDONED' ? 'Workout abandoned' : 'Workout completed');
});

module.exports = {
  start,
  getById,
  listMine,
  completeSet,
  endSession,
};
