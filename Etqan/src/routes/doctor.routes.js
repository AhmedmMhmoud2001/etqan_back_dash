const express = require('express');
const doctorController = require('../modules/doctors/doctor.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', authenticate, asyncHandler(doctorController.listDoctors));
router.get('/me/patients', authenticate, authorize('DOCTOR'), asyncHandler(doctorController.listMyPatients));
router.get('/:id', authenticate, asyncHandler(doctorController.getDoctor));

module.exports = router;
