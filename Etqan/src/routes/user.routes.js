const express = require('express');
const userController = require('../modules/users/user.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);
router.use(authorize('USER', 'DOCTOR', 'ADMIN'));

router.get('/me', asyncHandler(userController.getProfile));
router.patch('/me', asyncHandler(userController.updateProfile));

module.exports = router;
