const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const doctorService = require('./doctor.service');

const getDoctor = asyncHandler(async (req, res) => {
  const doctor = await doctorService.getById(req.params.id);
  success(res, doctor, 'Doctor details');
});

const listDoctors = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const result = await doctorService.list(page, limit);
  success(res, result, 'Doctors list');
});

const listMyPatients = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 500);
  const result = await doctorService.listMyPatients(req.user, page, limit);
  success(res, result, 'My patients');
});

const getMyPatientStats = asyncHandler(async (req, res) => {
  const result = await doctorService.getMyPatientStats(req.user, req.params.patientId);
  success(res, result, 'Patient stats');
});

const getMyPatientDetail = asyncHandler(async (req, res) => {
  const patient = await doctorService.getMyPatientDetail(req.user, req.params.patientId);
  success(res, patient, 'Patient detail');
});

const getMyPatientWorkoutSessions = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 30, 50);
  const sessions = await doctorService.getMyPatientWorkoutSessions(req.user, req.params.patientId, limit);
  success(res, { sessions }, 'Patient workout sessions');
});

const getMyPatientMeasurements = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 60, 100);
  const measurements = await doctorService.getMyPatientMeasurements(req.user, req.params.patientId, limit);
  success(res, { measurements }, 'Patient measurements');
});

const getOrCreatePatientConversation = asyncHandler(async (req, res) => {
  const conversation = await doctorService.getOrCreateMyPatientConversation(req.user, req.params.patientId);
  success(res, conversation, 'Conversation');
});

module.exports = {
  getDoctor,
  listDoctors,
  listMyPatients,
  getMyPatientStats,
  getMyPatientDetail,
  getMyPatientWorkoutSessions,
  getMyPatientMeasurements,
  getOrCreatePatientConversation,
};
