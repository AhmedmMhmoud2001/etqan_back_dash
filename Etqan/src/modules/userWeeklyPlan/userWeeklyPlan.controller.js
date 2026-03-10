const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const userWeeklyPlanService = require('./userWeeklyPlan.service');

const create = asyncHandler(async (req, res) => {
  const plan = await userWeeklyPlanService.create(req.body, req.user);
  success(res, plan, 'Weekly workout plan created', 201);
});

const getById = asyncHandler(async (req, res) => {
  const plan = await userWeeklyPlanService.getById(req.params.id);
  success(res, plan, 'Plan details');
});

/** المستخدم: الخطة الأسبوعية الحالية (This Week) */
const getMyCurrentWeek = asyncHandler(async (req, res) => {
  const date = req.query.date || null;
  const plan = await userWeeklyPlanService.getMyCurrentWeek(req.user.id, date);
  if (!plan) {
    return success(res, { plan: null, progress: null }, 'No active weekly plan');
  }
  const progress = await userWeeklyPlanService.getWeeklyProgress(req.user.id, plan.id);
  success(res, { plan, progress }, 'My current week');
});

/** المستخدم: تفاصيل اليوم (تمارين اليوم + sets/reps) */
const getMyDayDetail = asyncHandler(async (req, res) => {
  const date = req.query.date || null;
  const result = await userWeeklyPlanService.getMyDayDetail(req.user.id, date);
  success(res, result, "Today's workout detail");
});

const getWeeklyProgress = asyncHandler(async (req, res) => {
  const planId = req.params.planId || req.query.planId;
  if (!planId) {
    return res.status(400).json({ success: false, message: 'planId is required' });
  }
  const progress = await userWeeklyPlanService.getWeeklyProgress(req.user.id, planId);
  success(res, progress, 'Weekly progress');
});

const listMyPlans = asyncHandler(async (req, res) => {
  const list = await userWeeklyPlanService.listMyPlans(req.user.id);
  success(res, { plans: list }, 'My weekly plans');
});

const listByDoctor = asyncHandler(async (req, res) => {
  const doctorId = req.params.doctorId || (await userWeeklyPlanService.getDoctorIdForUser(req.user));
  if (!doctorId) {
    return res.status(403).json({ success: false, message: 'Doctor ID required' });
  }
  const list = await userWeeklyPlanService.listByDoctor(doctorId);
  success(res, { plans: list }, 'Plans by doctor');
});

const update = asyncHandler(async (req, res) => {
  const plan = await userWeeklyPlanService.update(req.params.id, req.body, req.user);
  success(res, plan, 'Plan updated');
});

const remove = asyncHandler(async (req, res) => {
  await userWeeklyPlanService.remove(req.params.id, req.user);
  success(res, { id: req.params.id }, 'Plan deleted');
});

module.exports = {
  create,
  getById,
  getMyCurrentWeek,
  getMyDayDetail,
  getWeeklyProgress,
  listMyPlans,
  listByDoctor,
  update,
  remove,
};
