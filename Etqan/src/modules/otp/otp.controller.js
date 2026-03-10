const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const otpService = require('./otp.service');

const verifyOtp = asyncHandler(async (req, res) => {
  const { userId, code, type } = req.body;
  const result = await otpService.verify(userId, code, type || 'EMAIL_VERIFICATION');
  success(res, result, 'OTP verified successfully');
});

const resendOtp = asyncHandler(async (req, res) => {
  const userId = req.body?.userId || (req.user && req.user.id);
  if (!userId) {
    return res.status(400).json({ success: false, message: 'userId is required (or send Authorization token)' });
  }
  const result = await otpService.resendOtp(userId);
  success(res, result, 'OTP sent successfully');
});

module.exports = { verifyOtp, resendOtp };
