const repo = require('./subscriptionPackage.repository');

const parseMoney = (v) => {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return s; // Prisma Decimal accepts string
};

const listPackages = async (query) => {
  return repo.list({
    page: query.page,
    limit: query.limit,
    activeOnly: query.activeOnly === 'true' || query.activeOnly === true,
  });
};

const getPackage = async (id) => {
  const p = await repo.findById(id);
  if (!p) {
    const err = new Error('Package not found');
    err.statusCode = 404;
    throw err;
  }
  return p;
};

const createPackage = async (body) => {
  const durationMonths = parseInt(body.durationMonths, 10);
  if (!Number.isFinite(durationMonths) || durationMonths <= 0) {
    const err = new Error('Invalid durationMonths');
    err.statusCode = 400;
    throw err;
  }
  const listPrice = parseMoney(body.listPrice);
  const payPrice = parseMoney(body.payPrice);
  if (listPrice == null || payPrice == null) {
    const err = new Error('Invalid prices');
    err.statusCode = 400;
    throw err;
  }
  const currency = (body.currency ? String(body.currency).trim().toUpperCase() : 'EGP') || 'EGP';
  const isActive = body.isActive !== false;
  const name = String(body.name || '').trim();
  if (!name) {
    const err = new Error('Name is required');
    err.statusCode = 400;
    throw err;
  }
  return repo.create({ name, durationMonths, listPrice, payPrice, currency, isActive });
};

const updatePackage = async (id, body) => {
  await getPackage(id);
  const data = {};
  if (body.name != null) data.name = String(body.name).trim();
  if (body.durationMonths != null) data.durationMonths = parseInt(body.durationMonths, 10);
  if (body.listPrice != null) data.listPrice = parseMoney(body.listPrice);
  if (body.payPrice != null) data.payPrice = parseMoney(body.payPrice);
  if (body.currency != null) data.currency = String(body.currency).trim().toUpperCase();
  if (body.isActive != null) data.isActive = Boolean(body.isActive);

  if (data.durationMonths != null && (!Number.isFinite(data.durationMonths) || data.durationMonths <= 0)) {
    const err = new Error('Invalid durationMonths');
    err.statusCode = 400;
    throw err;
  }
  if (data.listPrice === null || data.payPrice === null) {
    const err = new Error('Invalid prices');
    err.statusCode = 400;
    throw err;
  }
  if (data.name != null && !data.name) {
    const err = new Error('Invalid name');
    err.statusCode = 400;
    throw err;
  }

  return repo.update(id, data);
};

module.exports = {
  listPackages,
  getPackage,
  createPackage,
  updatePackage,
};

