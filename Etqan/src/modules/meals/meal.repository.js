const { prisma } = require('../../prisma/client');

const list = async ({ mealType, page, limit }) => {
  const skip = (Math.max(1, page) - 1) * limit;
  const where = mealType ? { mealType } : {};
  const [items, total] = await Promise.all([
    prisma.meal.findMany({
      where,
      include: {
        ingredients: { orderBy: { order: 'asc' } },
        addedByUser: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.meal.count({ where }),
  ]);
  return { items, total };
};

const findById = async (id) => {
  return prisma.meal.findUnique({
    where: { id },
    include: {
      ingredients: { orderBy: { order: 'asc' } },
      addedByUser: { select: { id: true, name: true, email: true } },
    },
  });
};

const create = async (data) => {
  const { ingredients = [], ...mealData } = data;
  return prisma.meal.create({
    data: {
      ...mealData,
      ingredients: {
        create: ingredients.map((ing, i) => ({
          name: ing.name,
          quantity: String(ing.quantity ?? ''),
          unit: ing.unit ?? '',
          order: ing.order ?? i,
        })),
      },
    },
    include: {
      ingredients: { orderBy: { order: 'asc' } },
      addedByUser: { select: { id: true, name: true, email: true } },
    },
  });
};

const update = async (id, data) => {
  const { ingredients, ...mealData } = data;
  if (ingredients !== undefined) {
    await prisma.mealIngredient.deleteMany({ where: { mealId: id } });
    if (ingredients.length > 0) {
      await prisma.mealIngredient.createMany({
        data: ingredients.map((ing, i) => ({
          mealId: id,
          name: ing.name,
          quantity: String(ing.quantity ?? ''),
          unit: ing.unit ?? '',
          order: ing.order ?? i,
        })),
      });
    }
  }
  return prisma.meal.update({
    where: { id },
    data: mealData,
    include: {
      ingredients: { orderBy: { order: 'asc' } },
      addedByUser: { select: { id: true, name: true, email: true } },
    },
  });
};

const remove = async (id) => {
  return prisma.meal.delete({ where: { id } });
};

/** قائمة أسماء المكونات المتاحة (من كل الوجبات) للفلتر */
const getDistinctIngredientNames = async () => {
  const rows = await prisma.mealIngredient.findMany({
    select: { name: true },
    distinct: ['name'],
    orderBy: { name: 'asc' },
  });
  return rows.map((r) => r.name.trim()).filter(Boolean);
};

/** كل الوجبات مع المكونات (لحساب نسبة التوافق) */
const findAllWithIngredients = async (mealType = null) => {
  const where = mealType ? { mealType } : {};
  return prisma.meal.findMany({
    where,
    include: {
      ingredients: { orderBy: { order: 'asc' } },
      addedByUser: { select: { id: true, name: true } },
    },
    orderBy: { name: 'asc' },
  });
};

module.exports = { list, findById, create, update, remove, getDistinctIngredientNames, findAllWithIngredients };
