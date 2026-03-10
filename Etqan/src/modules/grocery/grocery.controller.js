const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const groceryService = require('./grocery.service');

const create = asyncHandler(async (req, res) => {
  const item = await groceryService.create(req.user.id, req.body);
  success(res, item, 'Grocery item added', 201);
});

const getById = asyncHandler(async (req, res) => {
  const item = await groceryService.getById(req.params.id, req.user.id);
  success(res, item, 'Grocery item');
});

const listMine = asyncHandler(async (req, res) => {
  const items = await groceryService.listMine(req.user.id);
  success(res, { items }, 'Grocery list');
});

const update = asyncHandler(async (req, res) => {
  const item = await groceryService.update(req.params.id, req.user.id, req.body);
  success(res, item, 'Grocery item updated');
});

const remove = asyncHandler(async (req, res) => {
  await groceryService.remove(req.params.id, req.user.id);
  success(res, { id: req.params.id }, 'Grocery item deleted');
});

const toggleChecked = asyncHandler(async (req, res) => {
  const item = await groceryService.toggleChecked(req.params.id, req.user.id, req.body.checked);
  success(res, item, 'Updated');
});

module.exports = {
  create,
  getById,
  listMine,
  update,
  remove,
  toggleChecked,
};
