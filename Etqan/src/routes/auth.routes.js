const express = require('express');
const authController = require('../modules/auth/auth.controller');
const authValidator = require('../modules/auth/auth.validator');
const { authenticate } = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/register', authValidator.registerRules(), authValidator.validate, asyncHandler(authController.register));
router.post('/login', authValidator.loginRules(), authValidator.validate, asyncHandler(authController.login));
router.get('/me', authenticate, asyncHandler(authController.getMe));

module.exports = router;
