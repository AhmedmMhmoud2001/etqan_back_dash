const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const notificationService = require('./notification.service');

const list = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const unreadOnly = req.query.unreadOnly === 'true' || req.query.unreadOnly === '1';
  const result = await notificationService.list(req.user.id, { page, limit, unreadOnly });
  success(res, result, 'Notifications list');
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.params.id, req.user.id);
  success(res, notification, 'Notification marked as read');
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user.id);
  const count = await notificationService.getUnreadCount(req.user.id);
  success(res, { unreadCount: count }, 'All notifications marked as read');
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user.id);
  success(res, { unreadCount: count }, 'Unread count');
});

module.exports = {
  list,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};
