const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const dashboardService = require('./dashboard.service');

const getDashboard = asyncHandler(async (req, res) => {
  const date = req.query.date || null;
  const data = await dashboardService.getDashboard(req.user.id, date);
  success(res, data, 'Home dashboard');
});

module.exports = { getDashboard };
