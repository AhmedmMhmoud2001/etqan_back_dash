const notificationRepository = require('./notification.repository');

const list = async (userId, query) => {
  return notificationRepository.listByUserId(userId, query);
};

const markAsRead = async (notificationId, userId) => {
  const notification = await notificationRepository.findByIdAndUserId(notificationId, userId);
  if (!notification) {
    const err = new Error('Notification not found');
    err.statusCode = 404;
    throw err;
  }
  await notificationRepository.markAsRead(notificationId, userId);
  return { ...notification, read: true };
};

const markAllAsRead = async (userId) => {
  await notificationRepository.markAllAsRead(userId);
  return { count: await notificationRepository.getUnreadCount(userId) };
};

const getUnreadCount = async (userId) => {
  return notificationRepository.getUnreadCount(userId);
};

const create = async (data) => {
  const notification = await notificationRepository.create(data);
  try {
    const socketService = require('../../socket');
    socketService.emitNotification(data.userId, notification);
  } catch (_) { /* Socket may not be initialized */ }
  return notification;
};

/** إرسال إشعار لجميع المستخدمين (عند إضافة/تعديل محتوى: بوست، وجبة، تمرين) */
const broadcast = async ({ title, body, type, link }) => {
  const { count, userIds = [] } = await notificationRepository.createBroadcast({ title, body, type, link });
  try {
    const socketService = require('../../socket');
    socketService.emitNotificationToUsers(userIds, { title, body, type, link });
  } catch (_) { /* Socket may not be initialized */ }
  return { count };
};

module.exports = {
  list,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  create,
  broadcast,
};
