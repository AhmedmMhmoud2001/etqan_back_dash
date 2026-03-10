const express = require('express');
const doctorController = require('../modules/doctors/doctor.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', authenticate, asyncHandler(doctorController.listDoctors));
router.get('/:id', authenticate, asyncHandler(doctorController.getDoctor));

module.exports = router;
