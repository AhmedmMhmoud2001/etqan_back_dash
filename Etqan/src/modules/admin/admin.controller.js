const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const adminService = require('./admin.service');

const getDashboard = asyncHandler(async (req, res) => {
  const stats = await adminService.getDashboardStats();
  success(res, stats, 'Dashboard stats');
});

// Users CRUD
const listUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const role = req.query.role || null;
  const search = req.query.search && req.query.search.trim() ? req.query.search.trim() : null;
  const result = await adminService.listUsers(page, limit, role, search);
  success(res, result, 'Users list');
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await adminService.getUserById(req.params.id);
  success(res, user, 'User details');
});

const getUserWorkoutSessions = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 30, 50);
  const sessions = await adminService.getWorkoutSessionsForUser(req.params.id, limit);
  success(res, { sessions }, 'User workout sessions');
});

const getUserMeasurements = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 60, 100);
  const measurements = await adminService.getMeasurementsForUser(req.params.id, limit);
  success(res, { measurements }, 'User measurements');
});

const createUser = asyncHandler(async (req, res) => {
  const user = await adminService.createUser(req.body);
  success(res, user, 'User created', 201);
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await adminService.updateUser(req.params.id, req.body);
  success(res, user, 'User updated');
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await adminService.deleteUser(req.params.id);
  success(res, user, 'User deactivated');
});

const toggleUserActive = asyncHandler(async (req, res) => {
  const user = await adminService.toggleUserActive(req.params.id);
  success(res, user, 'User status updated');
});

// Doctors CRUD
const listDoctors = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const result = await adminService.listDoctors(page, limit);
  success(res, result, 'Doctors list');
});

const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await adminService.getDoctorById(req.params.id);
  success(res, doctor, 'Doctor details');
});

const createDoctor = asyncHandler(async (req, res) => {
  const doctor = await adminService.createDoctor(req.body);
  success(res, doctor, 'Doctor created', 201);
});

const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await adminService.updateDoctor(req.params.id, req.body);
  success(res, doctor, 'Doctor updated');
});

const deleteDoctor = asyncHandler(async (req, res) => {
  const doctor = await adminService.deleteDoctor(req.params.id);
  success(res, doctor, 'Doctor deactivated');
});

const assignDoctorToUser = asyncHandler(async (req, res) => {
  const { id: userId } = req.params;
  const { doctorId } = req.body;
  const user = await adminService.assignDoctorToUser(userId, doctorId);
  success(res, user, 'Doctor assigned to user');
});

const listDoctorPatients = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const result = await adminService.listDoctorPatients(req.params.id, page, limit);
  success(res, result, 'Doctor patients');
});

const createNotification = asyncHandler(async (req, res) => {
  const notification = await adminService.createNotification(req.body);
  success(res, notification, 'Notification created', 201);
});

const listNutritionPlans = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200);
  const result = await adminService.listAllNutritionPlans(page, limit);
  success(res, result, 'Nutrition plans list');
});

const listWorkoutPlans = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 200, 300);
  const result = await adminService.listAllWorkoutPlans(page, limit);
  success(res, result, 'Workout plans list');
});

const listDoctorNotes = asyncHandler(async (req, res) => {
  const doctorId = req.query.doctorId && req.query.doctorId.trim() ? req.query.doctorId.trim() : null;
  const patientId = req.query.patientId && req.query.patientId.trim() ? req.query.patientId.trim() : null;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 200, 300);
  const result = await adminService.listAllDoctorNotes(doctorId, patientId, page, limit);
  success(res, result, 'Doctor notes list');
});

const listCommunityPosts = asyncHandler(async (req, res) => {
  const userId = req.query.userId && req.query.userId.trim() ? req.query.userId.trim() : null;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 200, 300);
  const result = await adminService.listAllCommunityPosts(userId, page, limit);
  success(res, result, 'Community posts list');
});

const deleteCommunityPost = asyncHandler(async (req, res) => {
  await adminService.deleteCommunityPost(req.params.id);
  success(res, { id: req.params.id }, 'Post deleted');
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const profile = await adminService.updateUserProfile(req.params.id, req.body, req);
  success(res, profile, 'User profile updated');
});

module.exports = {
  getDashboard,
  listUsers,
  getUserById,
  getUserWorkoutSessions,
  getUserMeasurements,
  createUser,
  updateUser,
  deleteUser,
  toggleUserActive,
  listDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  assignDoctorToUser,
  listDoctorPatients,
  createNotification,
  updateUserProfile,
  listNutritionPlans,
  listWorkoutPlans,
  listDoctorNotes,
  listCommunityPosts,
  deleteCommunityPost,
};
