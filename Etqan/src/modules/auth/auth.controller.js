const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const authService = require('./auth.service');
const otpService = require('../otp/otp.service');

const register = asyncHandler(async (req, res) => {
  const { name, email, password, referralCode } = req.body;
  const result = await authService.register({ name, email, password, referralCode });
  const { password: _, ...userWithoutPassword } = result.user;
  // In dev we may auto-verify and return JWT immediately.
  if (result.token) {
    return success(res, { user: userWithoutPassword, token: result.token }, 'Registered', 201);
  }
  await otpService.createAndSend(result.user.id, result.user.email, 'EMAIL_VERIFICATION');
  return success(
    res,
    { user: userWithoutPassword, message: 'Registration successful. Please verify your email with OTP.' },
    'Registered',
    201
  );
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  success(res, result, 'Login successful');
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  success(res, user, 'Profile retrieved');
});

module.exports = { register, login, getMe };
