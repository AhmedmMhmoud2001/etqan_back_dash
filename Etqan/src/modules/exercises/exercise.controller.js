const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const exerciseService = require('./exercise.service');

const create = asyncHandler(async (req, res) => {
  const exercise = await exerciseService.create(req.body, req.user, req);
  success(res, exercise, 'Exercise created', 201);
});

const getById = asyncHandler(async (req, res) => {
  const exercise = await exerciseService.getById(req.params.id);
  success(res, exercise, 'Exercise details');
});

const list = asyncHandler(async (req, res) => {
  const { search, limit, offset } = req.query;
  const result = await exerciseService.list(
    { search, limit: limit ? parseInt(limit, 10) : 50, offset: offset ? parseInt(offset, 10) : 0 },
    req.user
  );
  success(res, result, 'Exercises list');
});

const update = asyncHandler(async (req, res) => {
  const exercise = await exerciseService.update(req.params.id, req.body, req.user, req);
  success(res, exercise, 'Exercise updated');
});

const remove = asyncHandler(async (req, res) => {
  await exerciseService.remove(req.params.id, req.user);
  success(res, { id: req.params.id }, 'Exercise deleted');
});

module.exports = {
  create,
  getById,
  list,
  update,
  remove,
};
