const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const service = require('./subscriptionPackage.service');

const list = asyncHandler(async (req, res) => {
  const data = await service.listPackages(req.query);
  success(res, data, 'Packages');
});

const getById = asyncHandler(async (req, res) => {
  const data = await service.getPackage(req.params.id);
  success(res, data, 'Package');
});

const create = asyncHandler(async (req, res) => {
  const data = await service.createPackage(req.body);
  success(res, data, 'Package created');
});

const update = asyncHandler(async (req, res) => {
  const data = await service.updatePackage(req.params.id, req.body);
  success(res, data, 'Package updated');
});

module.exports = { list, getById, create, update };

