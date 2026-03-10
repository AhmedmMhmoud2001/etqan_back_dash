const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const doctorNoteService = require('./doctorNote.service');

const create = asyncHandler(async (req, res) => {
  const note = await doctorNoteService.create(req.body, req.user);
  success(res, note, 'Note added', 201);
});

const getLatestForMe = asyncHandler(async (req, res) => {
  const note = await doctorNoteService.getLatestForPatient(req.user.id);
  success(res, note || { note: null }, 'Latest doctor note');
});

const listMyNotes = asyncHandler(async (req, res) => {
  const list = await doctorNoteService.listForPatient(req.user.id, req.user);
  success(res, { notes: list }, 'My doctor notes');
});

const listForPatient = asyncHandler(async (req, res) => {
  const patientId = req.params.patientId;
  const list = await doctorNoteService.listForPatient(patientId, req.user);
  success(res, { notes: list }, 'Doctor notes');
});

module.exports = {
  create,
  getLatestForMe,
  listMyNotes,
  listForPatient,
};
