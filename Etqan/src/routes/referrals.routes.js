const express = require('express');
const referralController = require('../modules/referrals/referral.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

router.get('/me', asyncHandler(referralController.getMyInfo));
router.get('/my-status', asyncHandler(referralController.getMyStatus));
router.get('/list', asyncHandler(referralController.listMyReferrals));

module.exports = router;
