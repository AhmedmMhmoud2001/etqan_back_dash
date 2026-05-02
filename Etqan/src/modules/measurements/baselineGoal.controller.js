const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const service = require('./baselineGoal.service');

const getBaseline = asyncHandler(async (req, res) => {
  const data = await service.getBaseline(req.user.id);
  success(res, data, 'Baseline');
});

const upsertBaseline = asyncHandler(async (req, res) => {
  const data = await service.upsertBaseline(req.user.id, req.body);
  success(res, data, 'Baseline saved');
});

const deleteBaseline = asyncHandler(async (req, res) => {
  const data = await service.deleteBaseline(req.user.id);
  success(res, data, 'Baseline deleted');
});

const getGoal = asyncHandler(async (req, res) => {
  const data = await service.getGoal(req.user.id);
  success(res, data, 'Goal');
});

const upsertGoal = asyncHandler(async (req, res) => {
  const data = await service.upsertGoal(req.user.id, req.body);
  success(res, data, 'Goal saved');
});

const deleteGoal = asyncHandler(async (req, res) => {
  const data = await service.deleteGoal(req.user.id);
  success(res, data, 'Goal deleted');
});

const getSummary = asyncHandler(async (req, res) => {
  const data = await service.getSummary(req.user.id);
  success(res, data, 'Progress summary');
});

module.exports = {
  getBaseline,
  upsertBaseline,
  deleteBaseline,
  getGoal,
  upsertGoal,
  deleteGoal,
  getSummary,
};

