const groceryRepository = require('./grocery.repository');

const create = async (userId, data) => {
  return groceryRepository.create(userId, data);
};

const getById = async (id, userId) => {
  const item = await groceryRepository.findById(id);
  if (!item) {
    const err = new Error('Grocery item not found');
    err.statusCode = 404;
    throw err;
  }
  if (item.userId !== userId) {
    const err = new Error('Not allowed');
    err.statusCode = 403;
    throw err;
  }
  return item;
};

const listMine = async (userId) => {
  return groceryRepository.findByUserId(userId);
};

const update = async (id, userId, data) => {
  await getById(id, userId);
  return groceryRepository.update(id, data);
};

const remove = async (id, userId) => {
  await getById(id, userId);
  await groceryRepository.remove(id);
  return { deleted: true };
};

const toggleChecked = async (id, userId, checked) => {
  await getById(id, userId);
  return groceryRepository.toggleChecked(id, checked);
};

module.exports = {
  create,
  getById,
  listMine,
  update,
  remove,
  toggleChecked,
};
