const bcrypt = require('bcryptjs');
const adminRepository = require('./admin.repository');
const notificationService = require('../notifications/notification.service');
const profileService = require('../profiles/profile.service');

const sanitizeUser = (user) => {
  const { password: _, ...rest } = user;
  return rest;
};

const getDashboardStats = async () => {
  return adminRepository.getStats();
};

const listUsers = async (page = 1, limit = 20, role = null, search = null) => {
  const skip = (Math.max(1, page) - 1) * limit;
  const { items, total } = await adminRepository.listUsers({ role, search, skip, take: limit });
  return { items: items.map(sanitizeUser), total, page, limit };
};

const getUserById = async (id) => {
  const user = await adminRepository.findUserById(id);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  const stats = await adminRepository.getStatsForUser(id);
  return { ...sanitizeUser(user), stats };
};

const createUser = async (data) => {
  const existing = await adminRepository.findUserByEmail(data.email);
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }
  const hashedPassword = await bcrypt.hash(data.password, 12);
  const user = await adminRepository.createUser({
    name: data.name,
    email: data.email,
    password: hashedPassword,
    role: 'USER',
    emailVerified: data.emailVerified !== false,
  });
  return sanitizeUser(user);
};

const updateUser = async (id, data) => {
  const user = await adminRepository.findUserById(id);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  const payload = {};
  if (data.name != null) payload.name = data.name;
  if (data.email != null) payload.email = data.email;
  if (data.isActive != null) payload.isActive = Boolean(data.isActive);
  if (data.role != null) payload.role = data.role;
  if (data.emailVerified !== undefined) payload.emailVerified = Boolean(data.emailVerified);
  if (data.password != null && data.password.trim()) {
    payload.password = await bcrypt.hash(data.password, 12);
  }
  if (data.doctorId !== undefined) {
    if (data.doctorId === null || data.doctorId === '') {
      payload.doctorId = null;
    } else {
      const doctor = await adminRepository.findDoctorById(data.doctorId);
      if (!doctor) {
        const err = new Error('Doctor not found');
        err.statusCode = 400;
        throw err;
      }
      payload.doctorId = data.doctorId;
    }
  }
  const updated = await adminRepository.updateUser(id, payload);
  return sanitizeUser(updated);
};

const updateUserProfile = async (userId, data) => {
  const user = await adminRepository.findUserById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return profileService.createOrUpdate(userId, data);
};

const deleteUser = async (id) => {
  const user = await adminRepository.findUserById(id);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  if (user.role === 'ADMIN') {
    const err = new Error('Cannot delete admin user');
    err.statusCode = 403;
    throw err;
  }
  const updated = await adminRepository.deleteUser(id);
  return sanitizeUser(updated);
};

const toggleUserActive = async (userId) => {
  const user = await adminRepository.toggleUserActive(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return sanitizeUser(user);
};

const sanitizeDoctor = (d) => {
  if (!d) return d;
  const { user, ...rest } = d;
  return { ...rest, user: user && sanitizeUser(user) };
};

// Doctors CRUD (جدول Doctor)
const listDoctors = async (page = 1, limit = 20) => {
  const skip = (Math.max(1, page) - 1) * limit;
  const { items, total } = await adminRepository.listDoctors({ skip, take: limit });
  return { items: items.map(sanitizeDoctor), total, page, limit };
};

const getDoctorById = async (id) => {
  const doctor = await adminRepository.findDoctorById(id);
  if (!doctor) {
    const err = new Error('Doctor not found');
    err.statusCode = 404;
    throw err;
  }
  return sanitizeDoctor(doctor);
};

const createDoctor = async (data) => {
  const existing = await adminRepository.findUserByEmail(data.email);
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }
  const hashedPassword = await bcrypt.hash(data.password, 12);
  const doctor = await adminRepository.createDoctor(
    { name: data.name, email: data.email, password: hashedPassword, emailVerified: data.emailVerified !== false },
    { title: data.title, titleAr: data.titleAr, specialization: data.specialization, specializationAr: data.specializationAr, bio: data.bio, bioAr: data.bioAr }
  );
  return sanitizeDoctor(doctor);
};

const updateDoctor = async (id, data) => {
  const doctor = await adminRepository.findDoctorById(id);
  if (!doctor) {
    const err = new Error('Doctor not found');
    err.statusCode = 404;
    throw err;
  }
  if (data.password != null && data.password.trim()) {
    const hashed = await bcrypt.hash(data.password, 12);
    await require('../../prisma/client').prisma.user.update({
      where: { id: doctor.userId },
      data: { password: hashed },
    });
  }
  const updated = await adminRepository.updateDoctor(id, data);
  return sanitizeDoctor(updated);
};

const deleteDoctor = async (id) => {
  const doctor = await adminRepository.findDoctorById(id);
  if (!doctor) {
    const err = new Error('Doctor not found');
    err.statusCode = 404;
    throw err;
  }
  const updated = await adminRepository.deleteDoctor(id);
  return sanitizeDoctor(updated);
};

const assignDoctorToUser = async (userId, doctorId) => {
  const user = await adminRepository.findUserById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  if (user.role !== 'USER') {
    const err = new Error('Only patients (USER role) can be assigned a doctor');
    err.statusCode = 400;
    throw err;
  }
  const doctor = await adminRepository.findDoctorById(doctorId);
  if (!doctor) {
    const err = new Error('Doctor not found');
    err.statusCode = 400;
    throw err;
  }
  const updated = await adminRepository.updateUser(userId, { doctorId });
  return sanitizeUser(updated);
};

const listDoctorPatients = async (doctorId, page = 1, limit = 20) => {
  const doctor = await adminRepository.findDoctorById(doctorId);
  if (!doctor) {
    const err = new Error('Doctor not found');
    err.statusCode = 404;
    throw err;
  }
  const skip = (Math.max(1, page) - 1) * limit;
  const { items, total } = await adminRepository.listPatientsForDoctor(doctorId, { skip, take: limit });
  return { items: items.map(sanitizeUser), total, page, limit };
};

const createNotification = async (data) => {
  const user = await adminRepository.findUserById(data.userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return notificationService.create({
    userId: data.userId,
    title: data.title,
    body: data.body ?? null,
    type: data.type ?? null,
    link: data.link ?? null,
  });
};

const listAllNutritionPlans = async (page = 1, limit = 100) => {
  const skip = (Math.max(1, page) - 1) * limit;
  return adminRepository.listAllNutritionPlans({ skip, take: limit });
};

const listAllWorkoutPlans = async (page = 1, limit = 200) => {
  const skip = (Math.max(1, page) - 1) * limit;
  return adminRepository.listAllWorkoutPlans({ skip, take: limit });
};

const getWorkoutSessionsForUser = async (userId, limit = 30) => {
  return adminRepository.getWorkoutSessionsForUser(userId, limit);
};

const listAllDoctorNotes = async (doctorId = null, patientId = null, page = 1, limit = 200) => {
  const skip = (Math.max(1, page) - 1) * limit;
  return adminRepository.listAllDoctorNotes({
    doctorId: doctorId || undefined,
    patientId: patientId || undefined,
    skip,
    take: limit,
  });
};

const listAllCommunityPosts = async (userId = null, page = 1, limit = 200) => {
  const skip = (Math.max(1, page) - 1) * limit;
  return adminRepository.listAllCommunityPosts({
    userId: userId || undefined,
    skip,
    take: limit,
  });
};

const deleteCommunityPost = async (postId) => {
  return adminRepository.deleteCommunityPost(postId);
};

module.exports = {
  getDashboardStats,
  listUsers,
  getUserById,
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
  listAllNutritionPlans,
  listAllWorkoutPlans,
  getWorkoutSessionsForUser,
  listAllDoctorNotes,
  listAllCommunityPosts,
  deleteCommunityPost,
};
