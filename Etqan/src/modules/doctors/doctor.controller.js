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

module.exports = { getDoctor, listDoctors };
