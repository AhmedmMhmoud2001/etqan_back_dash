const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const subscriptionService = require('./subscription.service');

const getMy = asyncHandler(async (req, res) => {
  const data = await subscriptionService.getMySubscription(req.user.id);
  success(res, data, 'My subscription');
});

const listPackages = asyncHandler(async (_req, res) => {
  const data = await subscriptionService.listActivePackages();
  success(res, data, 'Packages');
});

const upgrade = asyncHandler(async (req, res) => {
  if (req.body.packageId) {
    const data = await subscriptionService.upgradeByPackage(req.user.id, req.body.packageId);
    success(res, data, 'Upgraded to Premium');
    return;
  }
  const durationMonths = parseInt(req.body.durationMonths, 10) || 1;
  const data = await subscriptionService.upgrade(req.user.id, durationMonths);
  success(res, data, 'Upgraded to Premium');
});

const applyDiscount = asyncHandler(async (req, res) => {
  const data = await subscriptionService.applyDiscountOnRenewal(req.user.id);
  success(res, data, 'Discount applied on renewal');
});

module.exports = {
  getMy,
  listPackages,
  upgrade,
  applyDiscount,
};
