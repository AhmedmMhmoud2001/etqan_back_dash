const express = require('express');
const otpController = require('../modules/otp/otp.controller');
const otpValidator = require('../modules/otp/otp.validator');
const { optionalAuth } = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/verify', otpValidator.verifyRules(), otpValidator.validate, asyncHandler(otpController.verifyOtp));
router.post('/resend', optionalAuth, otpValidator.resendRules(), otpValidator.validate, asyncHandler(otpController.resendOtp));

module.exports = router;
