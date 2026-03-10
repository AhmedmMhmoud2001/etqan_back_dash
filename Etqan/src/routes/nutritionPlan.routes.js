const express = require('express');
const nutritionPlanController = require('../modules/nutritionPlan/nutritionPlan.controller');
const nutritionPlanValidator = require('../modules/nutritionPlan/nutritionPlan.validator');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

// ——— العميل: صفحة الخطة (Nutrition) ———
router.get('/my/plan', nutritionPlanValidator.dateQuery(), nutritionPlanValidator.validate, asyncHandler(nutritionPlanController.getMyPlan));
router.get('/my/plans', nutritionPlanValidator.dateQuery(), nutritionPlanValidator.validate, asyncHandler(nutritionPlanController.getMyPlans));
router.get('/my/today-slots', nutritionPlanValidator.dateQuery(), nutritionPlanValidator.validate, asyncHandler(nutritionPlanController.getTodaySlots));
router.get('/my/today-progress', nutritionPlanValidator.dateQuery(), nutritionPlanValidator.validate, asyncHandler(nutritionPlanController.getTodayProgress));
router.get('/my/weekly-adherence', nutritionPlanValidator.dateQuery(), nutritionPlanValidator.validate, asyncHandler(nutritionPlanController.getWeeklyAdherence));

// ——— الدكتور / الأدمن: إدارة الخطط ———
router.get('/my-created', authorize('ADMIN', 'DOCTOR'), asyncHandler(nutritionPlanController.listMyCreated));
router.get('/patient/:userId/plans', authorize('ADMIN', 'DOCTOR'), asyncHandler(nutritionPlanController.listForPatient));
router.get('/doctor/:doctorId/plans', authorize('ADMIN', 'DOCTOR'), asyncHandler(nutritionPlanController.listByDoctor));

router.post(
  '/',
  authorize('ADMIN', 'DOCTOR'),
  nutritionPlanValidator.createPlanRules(),
  nutritionPlanValidator.validate,
  asyncHandler(nutritionPlanController.create)
);
router.get('/:id', nutritionPlanValidator.idParam('id'), nutritionPlanValidator.validate, asyncHandler(nutritionPlanController.getById));
router.patch(
  '/:id',
  authorize('ADMIN', 'DOCTOR'),
  nutritionPlanValidator.updatePlanRules(),
  nutritionPlanValidator.validate,
  asyncHandler(nutritionPlanController.update)
);
router.delete(
  '/:id',
  authorize('ADMIN', 'DOCTOR'),
  nutritionPlanValidator.idParam('id'),
  nutritionPlanValidator.validate,
  asyncHandler(nutritionPlanController.remove)
);

module.exports = router;
