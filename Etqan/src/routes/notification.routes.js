const express = require('express');
const notificationController = require('../modules/notifications/notification.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);
router.use(authorize('USER', 'DOCTOR', 'ADMIN'));

router.get('/', asyncHandler(notificationController.list));
router.get('/unread-count', asyncHandler(notificationController.getUnreadCount));
router.patch('/read-all', asyncHandler(notificationController.markAllAsRead));
router.patch('/:id/read', asyncHandler(notificationController.markAsRead));

module.exports = router;
