const express = require('express');
const measurementController = require('../modules/measurements/measurement.controller');
const measurementValidator = require('../modules/measurements/measurement.validator');
const { authenticate } = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  measurementValidator.createMeasurementRules(),
  measurementValidator.validate,
  asyncHandler(measurementController.create)
);
router.get(
  '/progress',
  measurementValidator.progressQueryRules(),
  measurementValidator.validate,
  asyncHandler(measurementController.getProgress)
);
router.get(
  '/',
  measurementValidator.listRules(),
  measurementValidator.validate,
  asyncHandler(measurementController.listMine)
);
router.get(
  '/:id',
  measurementValidator.idParam('id'),
  measurementValidator.validate,
  asyncHandler(measurementController.getById)
);
router.delete(
  '/:id',
  measurementValidator.idParam('id'),
  measurementValidator.validate,
  asyncHandler(measurementController.remove)
);

module.exports = router;
