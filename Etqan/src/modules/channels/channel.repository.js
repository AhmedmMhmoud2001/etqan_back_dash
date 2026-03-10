const { prisma } = require('../../prisma/client');

const list = async (params = {}) => {
  const { skip = 0, take = 50 } = params;
  const where = { isActive: true };
  const [items, total] = await Promise.all([
    prisma.channel.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take,
      include: { _count: { select: { messages: true } } },
    }),
    prisma.channel.count({ where }),
  ]);
  return { items, total };
};

const findById = async (id) => {
  return prisma.channel.findUnique({
    where: { id },
    include: { _count: { select: { messages: true } } },
  });
};

const create = async (data) => {
  return prisma.channel.create({
    data: {
      name: data.name,
      nameAr: data.nameAr ?? undefined,
      description: data.description ?? undefined,
      descriptionAr: data.descriptionAr ?? undefined,
      icon: data.icon ?? undefined,
    },
  });
};

const update = async (id, data) => {
  const payload = {};
  if (data.name != null) payload.name = data.name;
  if (data.nameAr !== undefined) payload.nameAr = data.nameAr || null;
  if (data.description !== undefined) payload.description = data.description || null;
  if (data.descriptionAr !== undefined) payload.descriptionAr = data.descriptionAr || null;
  if (data.icon !== undefined) payload.icon = data.icon || null;
  if (data.isActive !== undefined) payload.isActive = data.isActive;
  return prisma.channel.update({
    where: { id },
    data: payload,
  });
};

const remove = async (id) => {
  return prisma.channel.delete({ where: { id } });
};

module.exports = { list, findById, create, update, remove };
