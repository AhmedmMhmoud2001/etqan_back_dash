/**
 * Socket.IO server للشات، القنوات، والإشعارات في الوقت الفعلي.
 * يتم تهيئته من server.js وربطه بـ HTTP server.
 *
 * الأحداث المرسلة للعميل:
 * - chat:message   { conversationId, message } — عند إرسال رسالة في محادثة
 * - channel:message { channelId, message }   — عند إرسال رسالة في قناة (يستقبلها من انضموا للقناة)
 * - notification   { title, body?, type?, link? } — إشعار جديد للمستخدم
 *
 * أحداث يستقبلها السيرفر من العميل:
 * - join:channel   (channelId) — انضمام لغرفة القناة لاستقبال channel:message
 * - leave:channel  (channelId) — مغادرة غرفة القناة
 */
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./config');
const { prisma } = require('./prisma/client');

let io = null;

const init = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
    path: '/socket.io',
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Token required'));
      }
      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, role: true },
      });
      if (!user || !user.id) return next(new Error('User not found'));
      socket.userId = user.id;
      socket.user = user;
      socket.join(`user:${user.id}`);
      next();
    } catch (e) {
      next(new Error(e.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('join:channel', (channelId) => {
      if (channelId && typeof channelId === 'string') {
        socket.join(`channel:${channelId}`);
      }
    });
    socket.on('leave:channel', (channelId) => {
      if (channelId && typeof channelId === 'string') {
        socket.leave(`channel:${channelId}`);
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

/** إرسال رسالة محادثة للمريض والدكتور */
const emitChatMessage = (patientId, doctorId, conversationId, message) => {
  if (!io) return;
  const payload = { conversationId, message };
  io.to(`user:${patientId}`).emit('chat:message', payload);
  io.to(`user:${doctorId}`).emit('chat:message', payload);
};

/** إرسال رسالة قناة لكل من انضم للقناة */
const emitChannelMessage = (channelId, message) => {
  if (!io) return;
  io.to(`channel:${channelId}`).emit('channel:message', { channelId, message });
};

/** إرسال إشعار لمستخدم واحد */
const emitNotification = (userId, notification) => {
  if (!io) return;
  io.to(`user:${userId}`).emit('notification', notification);
};

/** إرسال إشعار لعدة مستخدمين (مثلاً بعد البث) */
const emitNotificationToUsers = (userIds, notification) => {
  if (!io || !Array.isArray(userIds)) return;
  userIds.forEach((userId) => {
    io.to(`user:${userId}`).emit('notification', notification);
  });
};

module.exports = {
  init,
  getIO,
  emitChatMessage,
  emitChannelMessage,
  emitNotification,
  emitNotificationToUsers,
};
