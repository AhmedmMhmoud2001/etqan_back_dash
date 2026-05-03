const repo = require('./banner.repository');
const { normalizeStoredAssetUrl } = require('../../utils/publicAssetUrl');

const toDateOrNull = (v) => {
  if (v == null || v === '') return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
};

const listAdmin = async (query) => repo.listAdmin({ page: query.page, limit: query.limit });

const listActive = async () => {
  const items = await repo.listActive();
  return { items };
};

const create = async (body, req) => {
  const imageUrlRaw = String(body.imageUrl || '').trim();
  const imageUrl = imageUrlRaw ? normalizeStoredAssetUrl(imageUrlRaw, { req }) : '';
  if (!imageUrl) {
    const err = new Error('imageUrl is required');
    err.statusCode = 400;
    throw err;
  }
  const startsAt = toDateOrNull(body.startsAt);
  const endsAt = toDateOrNull(body.endsAt);
  if (startsAt === undefined || endsAt === undefined) {
    const err = new Error('Invalid startsAt/endsAt');
    err.statusCode = 400;
    throw err;
  }
  if (startsAt && endsAt && endsAt <= startsAt) {
    const err = new Error('endsAt must be after startsAt');
    err.statusCode = 400;
    throw err;
  }

  return repo.create({
    title: body.title != null ? String(body.title).trim() : null,
    titleAr: body.titleAr != null ? String(body.titleAr).trim() : null,
    titleIt: body.titleIt != null ? String(body.titleIt).trim() : null,
    description: body.description != null ? String(body.description).trim() : null,
    descriptionAr: body.descriptionAr != null ? String(body.descriptionAr).trim() : null,
    descriptionIt: body.descriptionIt != null ? String(body.descriptionIt).trim() : null,
    imageUrl,
    link: body.link != null && String(body.link).trim() ? String(body.link).trim() : null,
    order: body.order != null ? Number(body.order) : 0,
    isActive: body.isActive !== false,
    startsAt,
    endsAt,
  });
};

const update = async (id, body, req) => {
  const existing = await repo.findById(id);
  if (!existing) {
    const err = new Error('Banner not found');
    err.statusCode = 404;
    throw err;
  }
  const data = {};
  if (body.title != null) data.title = String(body.title).trim() || null;
  if (body.titleAr != null) data.titleAr = String(body.titleAr).trim() || null;
  if (body.titleIt != null) data.titleIt = String(body.titleIt).trim() || null;
  if (body.description != null) data.description = String(body.description).trim() || null;
  if (body.descriptionAr != null) data.descriptionAr = String(body.descriptionAr).trim() || null;
  if (body.descriptionIt != null) data.descriptionIt = String(body.descriptionIt).trim() || null;
  if (body.imageUrl != null) {
    const raw = String(body.imageUrl).trim();
    data.imageUrl = raw ? normalizeStoredAssetUrl(raw, { req }) : '';
  }
  if (body.link != null) data.link = String(body.link).trim() || null;
  if (body.order != null) data.order = Number(body.order);
  if (body.isActive != null) data.isActive = Boolean(body.isActive);

  if (body.startsAt !== undefined) {
    const d = toDateOrNull(body.startsAt);
    if (d === undefined) {
      const err = new Error('Invalid startsAt');
      err.statusCode = 400;
      throw err;
    }
    data.startsAt = d;
  }
  if (body.endsAt !== undefined) {
    const d = toDateOrNull(body.endsAt);
    if (d === undefined) {
      const err = new Error('Invalid endsAt');
      err.statusCode = 400;
      throw err;
    }
    data.endsAt = d;
  }
  const nextStarts = data.startsAt !== undefined ? data.startsAt : existing.startsAt;
  const nextEnds = data.endsAt !== undefined ? data.endsAt : existing.endsAt;
  if (nextStarts && nextEnds && nextEnds <= nextStarts) {
    const err = new Error('endsAt must be after startsAt');
    err.statusCode = 400;
    throw err;
  }
  if (data.imageUrl !== undefined && !data.imageUrl) {
    const err = new Error('imageUrl is required');
    err.statusCode = 400;
    throw err;
  }

  return repo.update(id, data);
};

const remove = async (id) => {
  const existing = await repo.findById(id);
  if (!existing) {
    const err = new Error('Banner not found');
    err.statusCode = 404;
    throw err;
  }
  await repo.remove(id);
  return { deleted: true };
};

module.exports = {
  listAdmin,
  listActive,
  create,
  update,
  remove,
};

