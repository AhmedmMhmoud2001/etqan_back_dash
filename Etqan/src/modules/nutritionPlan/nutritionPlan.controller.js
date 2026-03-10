const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const nutritionPlanService = require('./nutritionPlan.service');

// ——— الدكتور / الأدمن ———

const create = asyncHandler(async (req, res) => {
  const plan = await nutritionPlanService.createPlan(req.body, req.user);
  success(res, plan, 'Nutrition plan created', 201);
});

const getById = asyncHandler(async (req, res) => {
  const plan = await nutritionPlanService.getPlanById(req.params.id);
  success(res, plan, 'Plan details');
});

const update = asyncHandler(async (req, res) => {
  const plan = await nutritionPlanService.updatePlan(req.params.id, req.body, req.user);
  success(res, plan, 'Plan updated');
});

const remove = asyncHandler(async (req, res) => {
  await nutritionPlanService.deletePlan(req.params.id, req.user);
  success(res, { id: req.params.id }, 'Plan deleted');
});

const listByDoctor = asyncHandler(async (req, res) => {
  const doctorId = req.params.doctorId || (await nutritionPlanService.getDoctorIdForUser(req.user));
  if (!doctorId) {
    return res.status(403).json({ success: false, message: 'Doctor ID required' });
  }
  const list = await nutritionPlanService.listPlansByDoctor(doctorId);
  success(res, { plans: list }, 'Plans by doctor');
});

/** خطط أنشأها الدكتور الحالي */
const listMyCreated = asyncHandler(async (req, res) => {
  const doctorId = await nutritionPlanService.getDoctorIdForUser(req.user);
  if (!doctorId) {
    return res.status(403).json({ success: false, message: 'Only doctors can list created plans' });
  }
  const list = await nutritionPlanService.listPlansByDoctor(doctorId);
  success(res, { plans: list }, 'My created plans');
});

const listForPatient = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.query.userId || req.user.id;
  const list = await nutritionPlanService.listPlansForPatient(userId);
  success(res, { plans: list }, 'Patient plans');
});

// ——— العميل (صفحة الخطة) ———

const getMyPlan = asyncHandler(async (req, res) => {
  const date = req.query.date || null;
  const plan = await nutritionPlanService.getMyActivePlan(req.user.id, date);
  success(res, plan || { plan: null }, 'My active plan');
});

/** كل خططي (للمريض) */
const getMyPlans = asyncHandler(async (req, res) => {
  const list = await nutritionPlanService.listPlansForPatient(req.user.id);
  success(res, { plans: list }, 'My plans');
});

const getTodaySlots = asyncHandler(async (req, res) => {
  const date = req.query.date || null;
  const result = await nutritionPlanService.getTodaySlots(req.user.id, date);
  success(res, result, "Today's meals (slots)");
});

const getTodayProgress = asyncHandler(async (req, res) => {
  const date = req.query.date || null;
  const result = await nutritionPlanService.getTodayProgress(req.user.id, date);
  success(res, result, "Today's progress");
});

const getWeeklyAdherence = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const result = await nutritionPlanService.getWeeklyAdherence(req.user.id, startDate, endDate);
  success(res, result, 'Weekly adherence');
});

module.exports = {
  create,
  getById,
  update,
  remove,
  listByDoctor,
  listMyCreated,
  listForPatient,
  getMyPlan,
  getMyPlans,
  getTodaySlots,
  getTodayProgress,
  getWeeklyAdherence,
};
