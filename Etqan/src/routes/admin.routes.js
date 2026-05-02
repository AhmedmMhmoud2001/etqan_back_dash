const express = require('express');
const adminController = require('../modules/admin/admin.controller');
const adminValidator = require('../modules/admin/admin.validator');
const profileValidator = require('../modules/profiles/profile.validator');
const channelController = require('../modules/channels/channel.controller');
const channelValidator = require('../modules/channels/channel.validator');
const adminSubscriptionController = require('../modules/subscription/adminSubscription.controller');
const adminSubscriptionValidator = require('../modules/subscription/adminSubscription.validator');
const packageController = require('../modules/subscriptionPackage/subscriptionPackage.controller');
const packageValidator = require('../modules/subscriptionPackage/subscriptionPackage.validator');
const referralSettingsController = require('../modules/referrals/referralSettings.admin.controller');
const referralSettingsValidator = require('../modules/referrals/referralSettings.admin.validator');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/dashboard', asyncHandler(adminController.getDashboard));

// Users CRUD
router.get('/users', asyncHandler(adminController.listUsers));
router.get('/users/:id/workout-sessions', adminValidator.idParamRules('id'), adminValidator.validate, asyncHandler(adminController.getUserWorkoutSessions));
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

// خطط التمارين الأسبوعية — عرض كل الخطط للأدمن
router.get('/workout-plans', asyncHandler(adminController.listWorkoutPlans));

// Subscriptions — إدارة اشتراكات المستخدمين
router.get('/subscriptions', adminSubscriptionValidator.listRules(), adminSubscriptionValidator.validate, asyncHandler(adminSubscriptionController.list));
router.get('/subscriptions/:userId', adminSubscriptionValidator.userIdParamRules(), adminSubscriptionValidator.validate, asyncHandler(adminSubscriptionController.getByUserId));
router.patch('/subscriptions/:userId', adminSubscriptionValidator.updateRules(), adminSubscriptionValidator.validate, asyncHandler(adminSubscriptionController.updateByUserId));
router.post('/subscriptions/:userId/assign-package', adminSubscriptionValidator.assignPackageRules(), adminSubscriptionValidator.validate, asyncHandler(adminSubscriptionController.assignPackage));

// Referrals settings — تحديد نسبة الخصم
router.get('/referrals/settings', asyncHandler(referralSettingsController.get));
router.patch('/referrals/settings', referralSettingsValidator.updateRules(), referralSettingsValidator.validate, asyncHandler(referralSettingsController.update));

// Packages — إدارة باقات Premium
router.get('/packages', packageValidator.listRules(), packageValidator.validate, asyncHandler(packageController.list));
router.get('/packages/:id', packageValidator.idParamRules(), packageValidator.validate, asyncHandler(packageController.getById));
router.post('/packages', packageValidator.createRules(), packageValidator.validate, asyncHandler(packageController.create));
router.patch('/packages/:id', packageValidator.updateRules(), packageValidator.validate, asyncHandler(packageController.update));

// ملاحظات الأطباء — كل الملاحظات مع فلتر بالدكتور أو المستخدم
router.get('/doctor-notes', asyncHandler(adminController.listDoctorNotes));

// المجتمع — بوستات المجتمع: عرض كل البوستات والتحكم فيها
router.get('/community/posts', asyncHandler(adminController.listCommunityPosts));
router.delete('/community/posts/:id', adminValidator.idParamRules('id'), adminValidator.validate, asyncHandler(adminController.deleteCommunityPost));

module.exports = router;
