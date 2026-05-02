const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const referralService = require('./referral.service');

const getMyStatus = asyncHandler(async (req, res) => {
  const data = await referralService.getMyStatus(req.user.id);
  success(res, data, 'Referral status');
});

const listMyReferrals = asyncHandler(async (req, res) => {
  const list = await referralService.listMyReferrals(req.user.id);
  success(res, { referrals: list }, 'My referrals');
});

const getMyInfo = asyncHandler(async (req, res) => {
  const data = await referralService.getMyInfo(req.user.id);
  success(res, data, 'My referrals info');
});

module.exports = {
  getMyStatus,
  getMyInfo,
  listMyReferrals,
};
