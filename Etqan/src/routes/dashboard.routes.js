const express = require('express');
const dashboardController = require('../modules/dashboard/dashboard.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

router.get('/', asyncHandler(dashboardController.getDashboard));

module.exports = router;
