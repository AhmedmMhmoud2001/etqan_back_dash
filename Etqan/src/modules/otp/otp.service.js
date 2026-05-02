const crypto = require('crypto');
const config = require('../../config');
const { sendOtpEmail } = require('../../utils/email');
const otpRepository = require('./otp.repository');
const authRepository = require('../auth/auth.repository');

const OTP_TYPE_EMAIL_VERIFICATION = 'EMAIL_VERIFICATION';

const generateCode = () => crypto.randomInt(100000, 999999).toString();

const createAndSend = async (userId, email, type = OTP_TYPE_EMAIL_VERIFICATION) => {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000);
  await otpRepository.create({
    userId,
    code,
    type,
    expiresAt,
  });
  // In tests we don't send emails.
  if (process.env.NODE_ENV !== 'test') {
    await sendOtpEmail(email, code, type);
  }
  return { expiresInMinutes: config.otp.expiryMinutes };
};

const verify = async (userId, code, type = OTP_TYPE_EMAIL_VERIFICATION) => {
  const otp = await otpRepository.findValidByUserIdAndType(userId, type, code);
  if (!otp) {
    const err = new Error('Invalid or expired OTP');
    err.statusCode = 400;
    throw err;
  }
  await otpRepository.markAsUsed(otp.id);
  if (type === OTP_TYPE_EMAIL_VERIFICATION) {
    await authRepository.updateUserEmailVerified(userId, true);
  }
  return { verified: true };
};

const resendOtp = async (userId) => {
  const user = await authRepository.findUserById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  await otpRepository.invalidateByUserIdAndType(userId, OTP_TYPE_EMAIL_VERIFICATION);
  return createAndSend(userId, user.email, OTP_TYPE_EMAIL_VERIFICATION);
};

module.exports = {
  createAndSend,
  verify,
  resendOtp,
  OTP_TYPE_EMAIL_VERIFICATION,
};
