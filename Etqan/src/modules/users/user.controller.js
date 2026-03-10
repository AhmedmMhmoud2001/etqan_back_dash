const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const userService = require('./user.service');

const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getById(req.user.id);
  success(res, user, 'User profile');
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.user.id, req.body);
  success(res, user, 'Profile updated');
});

module.exports = { getProfile, updateProfile };
