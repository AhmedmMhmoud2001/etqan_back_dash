const express = require('express');
const doctorNoteController = require('../modules/doctorNote/doctorNote.controller');
const doctorNoteValidator = require('../modules/doctorNote/doctorNote.validator');
const { authenticate, authorize, requirePremium } = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

router.get('/my/latest', requirePremium, asyncHandler(doctorNoteController.getLatestForMe));
router.get('/my', requirePremium, asyncHandler(doctorNoteController.listMyNotes));
router.get('/patient/:patientId', authorize('ADMIN', 'DOCTOR'), asyncHandler(doctorNoteController.listForPatient));

router.post(
  '/',
  authorize('DOCTOR'),
  doctorNoteValidator.createRules(),
  doctorNoteValidator.validate,
  asyncHandler(doctorNoteController.create)
);

module.exports = router;
