const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../config');
const authRepository = require('./auth.repository');

const hashPassword = async (password) => bcrypt.hash(password, 12);

const comparePassword = async (plain, hashed) => bcrypt.compare(plain, hashed);

const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

const referralService = require('../referrals/referral.service');
const referralRepository = require('../referrals/referral.repository');

const register = async (payload) => {
  const existing = await authRepository.findUserByEmail(payload.email);
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }
  let referredById = null;
  if (payload.referralCode && payload.referralCode.trim()) {
    const referrer = await referralRepository.findByReferralCode(payload.referralCode.trim());
    if (referrer) referredById = referrer.id;
  }
  const hashedPassword = await hashPassword(payload.password);
  const user = await authRepository.createUser({
    name: payload.name,
    email: payload.email,
    password: hashedPassword,
    role: 'USER',
    referredById: referredById || undefined,
  });
  if (referredById) {
    await referralService.addReferrerDiscount(referredById);
  }
  return { user, token: null };
};

const login = async (email, password) => {
  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }
  const valid = await comparePassword(password, user.password);
  if (!valid) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }
  if (!user.emailVerified) {
    const err = new Error('Please verify your email with OTP before logging in');
    err.statusCode = 403;
    throw err;
  }
  const token = generateToken(user.id, user.role);
  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
};

const getMe = async (userId) => {
  const user = await authRepository.findUserById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  register,
  login,
  getMe,
};
