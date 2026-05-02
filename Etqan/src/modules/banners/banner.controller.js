const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const service = require('./banner.service');

const listActive = asyncHandler(async (_req, res) => {
  const data = await service.listActive();
  success(res, data, 'Banners');
});

const listAdmin = asyncHandler(async (req, res) => {
  const data = await service.listAdmin(req.query);
  success(res, data, 'Banners');
});

const create = asyncHandler(async (req, res) => {
  const data = await service.create(req.body);
  success(res, data, 'Banner created', 201);
});

const update = asyncHandler(async (req, res) => {
  const data = await service.update(req.params.id, req.body);
  success(res, data, 'Banner updated');
});

const remove = asyncHandler(async (req, res) => {
  const data = await service.remove(req.params.id);
  success(res, data, 'Banner deleted');
});

module.exports = {
  listActive,
  listAdmin,
  create,
  update,
  remove,
};

