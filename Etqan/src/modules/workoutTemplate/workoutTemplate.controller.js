const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const workoutTemplateService = require('./workoutTemplate.service');

const create = asyncHandler(async (req, res) => {
  const template = await workoutTemplateService.create(req.body, req.user);
  success(res, template, 'Workout template created', 201);
});

const getById = asyncHandler(async (req, res) => {
  const template = await workoutTemplateService.getById(req.params.id);
  success(res, template, 'Template details');
});

const list = asyncHandler(async (req, res) => {
  const { search, limit, offset } = req.query;
  const result = await workoutTemplateService.list(
    { search, limit: limit ? parseInt(limit, 10) : 50, offset: offset ? parseInt(offset, 10) : 0 },
    req.user
  );
  success(res, result, 'Workout templates list');
});

const update = asyncHandler(async (req, res) => {
  const template = await workoutTemplateService.update(req.params.id, req.body, req.user);
  success(res, template, 'Template updated');
});

const remove = asyncHandler(async (req, res) => {
  await workoutTemplateService.remove(req.params.id, req.user);
  success(res, { id: req.params.id }, 'Template deleted');
});

module.exports = {
  create,
  getById,
  list,
  update,
  remove,
};
