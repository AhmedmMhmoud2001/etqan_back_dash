const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const measurementService = require('./measurement.service');

const create = asyncHandler(async (req, res) => {
  const measurement = await measurementService.create(req.user.id, req.body);
  success(res, measurement, 'Measurement saved', 201);
});

const getById = asyncHandler(async (req, res) => {
  const measurement = await measurementService.getById(req.params.id, req.user.id);
  success(res, measurement, 'Measurement details');
});

const listMine = asyncHandler(async (req, res) => {
  const { startDate, endDate, limit, offset } = req.query;
  const result = await measurementService.listMine(req.user.id, {
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    limit: limit ? parseInt(limit, 10) : undefined,
    offset: offset ? parseInt(offset, 10) : undefined,
  });
  success(res, result, 'My measurements');
});

const getProgress = asyncHandler(async (req, res) => {
  const period = req.query.period || '3M';
  const result = await measurementService.getProgress(req.user.id, period);
  success(res, result, 'Progress');
});

const remove = asyncHandler(async (req, res) => {
  await measurementService.remove(req.params.id, req.user.id);
  success(res, { id: req.params.id }, 'Measurement deleted');
});

module.exports = {
  create,
  getById,
  listMine,
  getProgress,
  remove,
};
