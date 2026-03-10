const express = require('express');
const profileController = require('../modules/profiles/profile.controller');
const profileValidator = require('../modules/profiles/profile.validator');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);
router.use(authorize('USER', 'DOCTOR', 'ADMIN'));

router.get('/me', asyncHandler(profileController.getMyProfile));
router.put('/me', profileValidator.updateProfileRules(), profileValidator.validate, asyncHandler(profileController.updateMyProfile));

module.exports = router;
