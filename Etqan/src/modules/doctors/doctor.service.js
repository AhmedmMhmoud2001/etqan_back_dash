const doctorRepository = require('./doctor.repository');

const getById = async (id) => {
  const doctor = await doctorRepository.findById(id);
  if (!doctor) {
    const err = new Error('Doctor not found');
    err.statusCode = 404;
    throw err;
  }
  const { password: _, ...rest } = doctor;
  return rest;
};

const list = async (page = 1, limit = 20) => {
  const skip = (Math.max(1, page) - 1) * limit;
  const { items, total } = await doctorRepository.findAll({ skip, take: limit });
  const sanitized = items.map(({ password: _, ...u }) => u);
  return { items: sanitized, total, page, limit };
};

module.exports = { getById, list };
