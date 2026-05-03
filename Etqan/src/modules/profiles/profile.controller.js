const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const profileService = require('./profile.service');

const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.getByUserId(req.user.id);
  success(res, profile, 'Profile retrieved');
});

const updateMyProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.createOrUpdate(req.user.id, req.body, req);
  success(res, profile, 'Profile updated');
});

module.exports = { getMyProfile, updateMyProfile };
