const { prisma } = require('../../prisma/client');
const conversationRepository = require('./conversation.repository');
const messageRepository = require('./message.repository');

const formatMessage = (msg) => {
  if (!msg) return null;
  const { sender, ...rest } = msg;
  return { ...rest, sender };
};

// المستخدم (مريض): محادثته مع دكتوره فقط. الدكتور: قائمة محادثاته مع مرضاه.
const getMyConversations = async (userId, role) => {
  if (role === 'USER') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { doctorId: true },
    });
    if (!user || !user.doctorId) {
      return { items: [], total: 0 };
    }
    const conv = await conversationRepository.findOrCreateByPatientAndDoctor(userId, user.doctorId);
    return { items: [conv], total: 1 };
  }
  if (role === 'DOCTOR') {
    const doctor = await prisma.doctor.findUnique({ where: { userId } });
    if (!doctor) return { items: [], total: 0 };
    const items = await conversationRepository.findByDoctorId(doctor.id);
    return { items, total: items.length };
  }
  return { items: [], total: 0 };
};

const getConversationById = async (conversationId, userId) => {
  const conv = await conversationRepository.findById(conversationId);
  if (!conv) {
    const err = new Error('Conversation not found');
    err.statusCode = 404;
    throw err;
  }
  let isParticipant = conv.patientId === userId;
  if (!isParticipant) {
    const doctor = await prisma.doctor.findUnique({ where: { userId } });
    isParticipant = !!(doctor && conv.doctorId === doctor.id);
  }
  if (!isParticipant) {
    const err = new Error('Forbidden: you are not part of this conversation');
    err.statusCode = 403;
    throw err;
  }
  return conv;
};

const getOrCreateMyConversation = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { doctorId: true, role: true },
  });
  if (!user || user.role !== 'USER') {
    const err = new Error('Only patients can use this endpoint');
    err.statusCode = 400;
    throw err;
  }
  if (!user.doctorId) {
    const err = new Error('No doctor assigned. Ask admin to assign a doctor.');
    err.statusCode = 400;
    throw err;
  }
  return conversationRepository.findOrCreateByPatientAndDoctor(userId, user.doctorId);
};

const getMessages = async (conversationId, userId, page = 1, limit = 50, before) => {
  await getConversationById(conversationId, userId);
  const skip = (Math.max(1, page) - 1) * limit;
  const take = Math.min(limit, 100);
  const result = await messageRepository.listByConversationId(conversationId, { skip, take, before });
  return {
    ...result,
    items: result.items.map(formatMessage),
    page,
    limit,
  };
};

const sendMessage = async (conversationId, userId, data) => {
  const conv = await getConversationById(conversationId, userId); // يتحقق أن المستخدم مشارك (مريض أو دكتور)
  const content = (data.content && data.content.trim()) || '';
  if (!content && !data.attachmentUrl) {
    const err = new Error('Content or attachment is required');
    err.statusCode = 400;
    throw err;
  }
  const msg = await messageRepository.create({
    conversationId,
    senderId: userId,
    content: content || '(attachment)',
    attachmentUrl: data.attachmentUrl || null,
    attachmentName: data.attachmentName || null,
  });
  const formatted = formatMessage(msg);
  try {
    const socketService = require('../../socket');
    socketService.emitChatMessage(conv.patientId, conv.doctorId, conversationId, formatted);
  } catch (_) { /* Socket may not be initialized */ }
  return formatted;
};

module.exports = {
  getMyConversations,
  getConversationById,
  getOrCreateMyConversation,
  getMessages,
  sendMessage,
};
