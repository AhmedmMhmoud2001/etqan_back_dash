const express = require('express');
const measurementController = require('../modules/measurements/measurement.controller');
const measurementValidator = require('../modules/measurements/measurement.validator');
const baselineGoalController = require('../modules/measurements/baselineGoal.controller');
const baselineGoalValidator = require('../modules/measurements/baselineGoal.validator');
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

// Start (Baseline) CRUD (self)
router.get('/baseline', asyncHandler(baselineGoalController.getBaseline));
router.put(
  '/baseline',
  baselineGoalValidator.upsertRules(),
  baselineGoalValidator.validate,
  asyncHandler(baselineGoalController.upsertBaseline)
);
router.delete('/baseline', asyncHandler(baselineGoalController.deleteBaseline));

// Goal CRUD (self)
router.get('/goal', asyncHandler(baselineGoalController.getGoal));
router.put(
  '/goal',
  baselineGoalValidator.upsertRules(),
  baselineGoalValidator.validate,
  asyncHandler(baselineGoalController.upsertGoal)
);
router.delete('/goal', asyncHandler(baselineGoalController.deleteGoal));

// Summary based on baseline + latest measurement + goal
router.get('/progress/summary', asyncHandler(baselineGoalController.getSummary));
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
