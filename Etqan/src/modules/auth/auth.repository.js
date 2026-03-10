const { prisma } = require('../../prisma/client');

const doctorInclude = { select: { id: true, title: true, specialization: true, user: { select: { id: true, name: true, email: true } } } };

const findUserByEmail = async (email) => {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { profile: true, doctor: doctorInclude },
  });
};

const findUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    include: { profile: true, doctor: doctorInclude },
  });
};

const createUser = async (data) => {
  const { referredById, ...rest } = data;
  return prisma.user.create({
    data: {
      ...rest,
      email: rest.email.toLowerCase(),
      referredById: referredById || undefined,
    },
    include: { profile: true },
  });
};

const updateUserEmailVerified = async (userId, verified = true) => {
  return prisma.user.update({
    where: { id: userId },
    data: { emailVerified: verified },
    include: { profile: true },
  });
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  updateUserEmailVerified,
};
