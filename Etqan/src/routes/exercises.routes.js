const express = require('express');
const exerciseController = require('../modules/exercises/exercise.controller');
const exerciseValidator = require('../modules/exercises/exercise.validator');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

// أي مستخدم مسجل يقدر يشوف قائمة التمارين (للعرض في التطبيق)
router.get(
  '/',
  exerciseValidator.listRules(),
  exerciseValidator.validate,
  asyncHandler(exerciseController.list)
);
router.get(
  '/:id',
  exerciseValidator.idParam('id'),
  exerciseValidator.validate,
  asyncHandler(exerciseController.getById)
);

// إضافة/تعديل/حذف للأدمن والدكتور فقط
router.post(
  '/',
  authorize('ADMIN', 'DOCTOR'),
  exerciseValidator.createExerciseRules(),
  exerciseValidator.validate,
  asyncHandler(exerciseController.create)
);
router.patch(
  '/:id',
  authorize('ADMIN', 'DOCTOR'),
  exerciseValidator.updateExerciseRules(),
  exerciseValidator.validate,
  asyncHandler(exerciseController.update)
);
router.delete(
  '/:id',
  authorize('ADMIN', 'DOCTOR'),
  exerciseValidator.idParam('id'),
  exerciseValidator.validate,
  asyncHandler(exerciseController.remove)
);

module.exports = router;
