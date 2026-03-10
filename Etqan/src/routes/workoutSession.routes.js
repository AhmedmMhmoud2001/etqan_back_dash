const express = require('express');
const workoutSessionController = require('../modules/workoutSession/workoutSession.controller');
const workoutSessionValidator = require('../modules/workoutSession/workoutSession.validator');
const { authenticate } = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  workoutSessionValidator.startSessionRules(),
  workoutSessionValidator.validate,
  asyncHandler(workoutSessionController.start)
);
router.get(
  '/',
  workoutSessionValidator.listRules(),
  workoutSessionValidator.validate,
  asyncHandler(workoutSessionController.listMine)
);
router.post(
  '/complete-set/:sessionExerciseId',
  workoutSessionValidator.completeSetRules(),
  workoutSessionValidator.validate,
  asyncHandler(workoutSessionController.completeSet)
);
router.get(
  '/:id',
  workoutSessionValidator.idParam('id'),
  workoutSessionValidator.validate,
  asyncHandler(workoutSessionController.getById)
);
router.patch(
  '/:id/end',
  workoutSessionValidator.idParam('id'),
  workoutSessionValidator.endSessionRules(),
  workoutSessionValidator.validate,
  asyncHandler(workoutSessionController.endSession)
);

module.exports = router;
