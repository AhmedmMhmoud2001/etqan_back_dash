const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const service = require('./referralSettings.admin.service');

const get = asyncHandler(async (_req, res) => {
  const data = await service.getSettings();
  success(res, data, 'Referral settings');
});

const update = asyncHandler(async (req, res) => {
  const data = await service.updateSettings({
    discountPercentPerReferral: req.body.discountPercentPerReferral,
    maxDiscountPercent: req.body.maxDiscountPercent,
  });
  success(res, data, 'Referral settings updated');
});

module.exports = { get, update };

