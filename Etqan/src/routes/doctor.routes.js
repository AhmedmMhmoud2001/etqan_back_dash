const express = require('express');
const doctorController = require('../modules/doctors/doctor.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', authenticate, asyncHandler(doctorController.listDoctors));

/** مسارات `:patientId` الأطول قبل الأقصر */
router.get(
  '/me/patients/:patientId/workout-sessions',
  authenticate,
  authorize('DOCTOR'),
  asyncHandler(doctorController.getMyPatientWorkoutSessions)
);
router.get(
  '/me/patients/:patientId/measurements',
  authenticate,
  authorize('DOCTOR'),
  asyncHandler(doctorController.getMyPatientMeasurements)
);
router.get(
  '/me/patients/:patientId/stats',
  authenticate,
  authorize('DOCTOR'),
  asyncHandler(doctorController.getMyPatientStats)
);
router.post(
  '/me/patients/:patientId/conversation',
  authenticate,
  authorize('DOCTOR'),
  asyncHandler(doctorController.getOrCreatePatientConversation)
);
router.get(
  '/me/patients/:patientId',
  authenticate,
  authorize('DOCTOR'),
  asyncHandler(doctorController.getMyPatientDetail)
);

router.get('/me/patients', authenticate, authorize('DOCTOR'), asyncHandler(doctorController.listMyPatients));
router.get('/:id', authenticate, asyncHandler(doctorController.getDoctor));

module.exports = router;
