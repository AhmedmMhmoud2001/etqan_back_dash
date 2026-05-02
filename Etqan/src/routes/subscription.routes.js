const express = require('express');
const subscriptionController = require('../modules/subscription/subscription.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

router.get('/my', asyncHandler(subscriptionController.getMy));
router.get('/packages', asyncHandler(subscriptionController.listPackages));
router.post('/upgrade', asyncHandler(subscriptionController.upgrade));
router.post('/apply-discount', asyncHandler(subscriptionController.applyDiscount));

module.exports = router;
