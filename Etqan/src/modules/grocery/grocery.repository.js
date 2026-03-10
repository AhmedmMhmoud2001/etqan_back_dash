const { prisma } = require('../../prisma/client');

const create = async (userId, data) => {
  const maxOrder = await prisma.groceryItem.aggregate({
    where: { userId },
    _max: { order: true },
  });
  const order = (maxOrder._max?.order ?? -1) + 1;
  return prisma.groceryItem.create({
    data: {
      userId,
      name: data.name,
      quantity: data.quantity || null,
      checked: data.checked ?? false,
      order: data.order ?? order,
    },
  });
};

const findById = async (id) => {
  return prisma.groceryItem.findUnique({
    where: { id },
    include: { user: { select: { id: true } } },
  });
};

const findByUserId = async (userId) => {
  return prisma.groceryItem.findMany({
    where: { userId },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });
};

const update = async (id, data) => {
  const payload = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.quantity !== undefined) payload.quantity = data.quantity;
  if (data.checked !== undefined) payload.checked = data.checked;
  if (data.order !== undefined) payload.order = data.order;
  return prisma.groceryItem.update({
    where: { id },
    data: payload,
  });
};

const remove = async (id) => {
  return prisma.groceryItem.delete({ where: { id } });
};

const toggleChecked = async (id, checked) => {
  return prisma.groceryItem.update({
    where: { id },
    data: { checked: !!checked },
  });
};

module.exports = {
  create,
  findById,
  findByUserId,
  update,
  remove,
  toggleChecked,
};
