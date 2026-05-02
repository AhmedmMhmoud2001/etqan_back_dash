const express = require('express');
const bannerController = require('../modules/banners/banner.controller');
const bannerValidator = require('../modules/banners/banner.validator');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Public: list active banners
router.get('/', asyncHandler(bannerController.listActive));

// Admin CRUD
router.get(
  '/admin',
  authenticate,
  authorize('ADMIN'),
  bannerValidator.listRules(),
  bannerValidator.validate,
  asyncHandler(bannerController.listAdmin)
);
router.post(
  '/admin',
  authenticate,
  authorize('ADMIN'),
  bannerValidator.createRules(),
  bannerValidator.validate,
  asyncHandler(bannerController.create)
);
router.patch(
  '/admin/:id',
  authenticate,
  authorize('ADMIN'),
  bannerValidator.updateRules(),
  bannerValidator.validate,
  asyncHandler(bannerController.update)
);
router.delete(
  '/admin/:id',
  authenticate,
  authorize('ADMIN'),
  bannerValidator.idParamRules(),
  bannerValidator.validate,
  asyncHandler(bannerController.remove)
);

module.exports = router;

