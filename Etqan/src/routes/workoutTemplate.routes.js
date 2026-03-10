const express = require('express');
const workoutTemplateController = require('../modules/workoutTemplate/workoutTemplate.controller');
const workoutTemplateValidator = require('../modules/workoutTemplate/workoutTemplate.validator');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

router.get(
  '/',
  workoutTemplateValidator.listRules(),
  workoutTemplateValidator.validate,
  asyncHandler(workoutTemplateController.list)
);
router.get(
  '/:id',
  workoutTemplateValidator.idParam('id'),
  workoutTemplateValidator.validate,
  asyncHandler(workoutTemplateController.getById)
);

router.post(
  '/',
  authorize('ADMIN', 'DOCTOR'),
  workoutTemplateValidator.createTemplateRules(),
  workoutTemplateValidator.validate,
  asyncHandler(workoutTemplateController.create)
);
router.patch(
  '/:id',
  authorize('ADMIN', 'DOCTOR'),
  workoutTemplateValidator.updateTemplateRules(),
  workoutTemplateValidator.validate,
  asyncHandler(workoutTemplateController.update)
);
router.delete(
  '/:id',
  authorize('ADMIN', 'DOCTOR'),
  workoutTemplateValidator.idParam('id'),
  workoutTemplateValidator.validate,
  asyncHandler(workoutTemplateController.remove)
);

module.exports = router;
