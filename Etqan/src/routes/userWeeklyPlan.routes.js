const express = require('express');
const userWeeklyPlanController = require('../modules/userWeeklyPlan/userWeeklyPlan.controller');
const userWeeklyPlanValidator = require('../modules/userWeeklyPlan/userWeeklyPlan.validator');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

// ——— المستخدم: عرض الأسبوع واليوم ———
router.get(
  '/my/current-week',
  userWeeklyPlanValidator.dateQuery(),
  userWeeklyPlanValidator.validate,
  asyncHandler(userWeeklyPlanController.getMyCurrentWeek)
);
router.get(
  '/my/day-detail',
  userWeeklyPlanValidator.dateQuery(),
  userWeeklyPlanValidator.validate,
  asyncHandler(userWeeklyPlanController.getMyDayDetail)
);
router.get('/my/plans', asyncHandler(userWeeklyPlanController.listMyPlans));
router.get(
  '/my/progress/:planId',
  userWeeklyPlanValidator.idParam('planId'),
  userWeeklyPlanValidator.validate,
  asyncHandler(userWeeklyPlanController.getWeeklyProgress)
);

// ——— الدكتور/الأدمن: إدارة الخطط ———
router.get('/my-created', authorize('DOCTOR'), asyncHandler(userWeeklyPlanController.listMyCreated));
router.get('/doctor/:doctorId/plans', authorize('ADMIN', 'DOCTOR'), asyncHandler(userWeeklyPlanController.listByDoctor));

router.post(
  '/',
  authorize('ADMIN', 'DOCTOR'),
  userWeeklyPlanValidator.createPlanRules(),
  userWeeklyPlanValidator.validate,
  asyncHandler(userWeeklyPlanController.create)
);
router.get(
  '/:id',
  userWeeklyPlanValidator.idParam('id'),
  userWeeklyPlanValidator.validate,
  asyncHandler(userWeeklyPlanController.getById)
);
router.patch(
  '/:id',
  authorize('ADMIN', 'DOCTOR'),
  userWeeklyPlanValidator.updatePlanRules(),
  userWeeklyPlanValidator.validate,
  asyncHandler(userWeeklyPlanController.update)
);
router.delete(
  '/:id',
  authorize('ADMIN', 'DOCTOR'),
  userWeeklyPlanValidator.idParam('id'),
  userWeeklyPlanValidator.validate,
  asyncHandler(userWeeklyPlanController.remove)
);

module.exports = router;
