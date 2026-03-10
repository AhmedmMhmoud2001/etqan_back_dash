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
  return notificationRepository.create(data);
};

module.exports = {
  list,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  create,
};
