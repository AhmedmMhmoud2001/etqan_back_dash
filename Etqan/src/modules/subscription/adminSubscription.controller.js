const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const adminSubscriptionService = require('./adminSubscription.service');

const list = asyncHandler(async (req, res) => {
  const data = await adminSubscriptionService.listSubscriptions({
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    plan: req.query.plan,
  });
  success(res, data, 'Subscriptions');
});

const getByUserId = asyncHandler(async (req, res) => {
  const data = await adminSubscriptionService.getUserSubscription(req.params.userId);
  success(res, data, 'Subscription');
});

const updateByUserId = asyncHandler(async (req, res) => {
  const data = await adminSubscriptionService.updateUserSubscription(req.params.userId, {
    plan: req.body.plan,
    endsAt: req.body.endsAt,
  });
  success(res, data, 'Subscription updated');
});

const assignPackage = asyncHandler(async (req, res) => {
  const data = await adminSubscriptionService.assignPackageToUser(req.params.userId, {
    packageId: req.body.packageId,
    listPrice: req.body.listPrice,
    payPrice: req.body.payPrice,
    currency: req.body.currency,
  });
  success(res, data, 'Package assigned');
});

module.exports = {
  list,
  getByUserId,
  updateByUserId,
  assignPackage,
};

