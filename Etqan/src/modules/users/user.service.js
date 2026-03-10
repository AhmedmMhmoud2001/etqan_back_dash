const userRepository = require('./user.repository');

const getById = async (id) => {
  const user = await userRepository.findById(id);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  const { password: _, ...rest } = user;
  return rest;
};

const updateUser = async (id, data) => {
  const { password, email, role, ...allowed } = data;
  const user = await userRepository.update(id, allowed);
  const { password: _, ...rest } = user;
  return rest;
};

module.exports = { getById, updateUser };
