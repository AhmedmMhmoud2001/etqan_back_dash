const express = require('express');
const adminController = require('../modules/admin/admin.controller');
const adminValidator = require('../modules/admin/admin.validator');
const profileValidator = require('../modules/profiles/profile.validator');
const channelController = require('../modules/channels/channel.controller');
const channelValidator = require('../modules/channels/channel.validator');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/dashboard', asyncHandler(adminController.getDashboard));

// Users CRUD
router.get('/users', asyncHandler(adminController.listUsers));
router.get('/users/:id', adminValidator.idParamRules('id'), adminValidator.validate, asyncHandler(adminController.getUserById));
router.post('/users', adminValidator.createUserRules(), adminValidator.validate, asyncHandler(adminController.createUser));
router.patch('/users/:id/profile', profileValidator.updateProfileRules(), profileValidator.validate, asyncHandler(adminController.updateUserProfile));
router.patch('/users/:id/assign-doctor', adminValidator.assignDoctorRules(), adminValidator.validate, asyncHandler(adminController.assignDoctorToUser));
router.patch('/users/:id', adminValidator.updateUserRules(), adminValidator.validate, asyncHandler(adminController.updateUser));
router.delete('/users/:id', adminValidator.idParamRules('id'), adminValidator.validate, asyncHandler(adminController.deleteUser));
router.patch('/users/:id/toggle-active', adminValidator.idParamRules('id'), adminValidator.validate, asyncHandler(adminController.toggleUserActive));

// Doctors CRUD (/:id/patients قبل /:id عشان الـ route يتحقق صح)
router.get('/doctors', asyncHandler(adminController.listDoctors));
router.get('/doctors/:id/patients', adminValidator.idParamRules('id'), adminValidator.validate, asyncHandler(adminController.listDoctorPatients));
router.get('/doctors/:id', adminValidator.idParamRules('id'), adminValidator.validate, asyncHandler(adminController.getDoctorById));
router.post('/doctors', adminValidator.createDoctorRules(), adminValidator.validate, asyncHandler(adminController.createDoctor));
router.patch('/doctors/:id', adminValidator.updateDoctorRules(), adminValidator.validate, asyncHandler(adminController.updateDoctor));
router.delete('/doctors/:id', adminValidator.idParamRules('id'), adminValidator.validate, asyncHandler(adminController.deleteDoctor));

// القنوات (دردشة جماعية) — إنشاء، تعديل، حذف
router.post('/channels', channelValidator.createChannelRules(), channelValidator.validate, asyncHandler(channelController.createChannel));
router.patch('/channels/:id', channelValidator.updateChannelRules(), channelValidator.validate, asyncHandler(channelController.updateChannel));
router.delete('/channels/:id', channelValidator.channelIdParam(), channelValidator.validate, asyncHandler(channelController.deleteChannel));

// إنشاء إشعار لمستخدم (أدمن)
router.post('/notifications', adminValidator.createNotificationRules(), adminValidator.validate, asyncHandler(adminController.createNotification));

// خطط التغذية — عرض كل الخطط للأدمن
router.get('/nutrition-plans', asyncHandler(adminController.listNutritionPlans));

module.exports = router;
