const channelRepository = require('./channel.repository');
const channelMessageRepository = require('./channelMessage.repository');

const formatMessage = (msg) => {
  if (!msg) return null;
  const { sender, ...rest } = msg;
  return { ...rest, sender };
};

// ——— للجميع (مستخدم أو دكتور)
const listChannels = async (page = 1, limit = 50) => {
  const skip = (Math.max(1, page) - 1) * limit;
  const take = Math.min(limit, 100);
  const { items, total } = await channelRepository.list({ skip, take });
  return { items, total, page, limit };
};

const getChannelById = async (id) => {
  const channel = await channelRepository.findById(id);
  if (!channel) {
    const err = new Error('Channel not found');
    err.statusCode = 404;
    throw err;
  }
  if (!channel.isActive) {
    const err = new Error('Channel not found');
    err.statusCode = 404;
    throw err;
  }
  return channel;
};

const getChannelMessages = async (channelId, page = 1, limit = 50, before) => {
  await getChannelById(channelId);
  const skip = (Math.max(1, page) - 1) * limit;
  const take = Math.min(limit, 100);
  const result = await channelMessageRepository.listByChannelId(channelId, { skip, take, before });
  return {
    items: result.items.map(formatMessage),
    total: result.total,
    page,
    limit,
  };
};

const sendMessage = async (channelId, userId, data) => {
  await getChannelById(channelId);
  const content = (data.content && data.content.trim()) || '';
  if (!content && !data.attachmentUrl) {
    const err = new Error('Content or attachment is required');
    err.statusCode = 400;
    throw err;
  }
  const msg = await channelMessageRepository.create({
    channelId,
    senderId: userId,
    content: content || '(attachment)',
    attachmentUrl: data.attachmentUrl || null,
    attachmentName: data.attachmentName || null,
  });
  const formatted = formatMessage(msg);
  try {
    const socketService = require('../../socket');
    socketService.emitChannelMessage(channelId, formatted);
  } catch (_) { /* Socket may not be initialized */ }
  return formatted;
};

// ——— للأدمن فقط
const createChannel = async (data) => {
  if (!data.name || !data.name.trim()) {
    const err = new Error('Channel name is required');
    err.statusCode = 400;
    throw err;
  }
  return channelRepository.create({
    name: data.name.trim(),
    nameAr: data.nameAr?.trim() || null,
    description: data.description ?? null,
    descriptionAr: data.descriptionAr ?? null,
    icon: data.icon ?? null,
  });
};

const updateChannel = async (id, data) => {
  const channel = await channelRepository.findById(id);
  if (!channel) {
    const err = new Error('Channel not found');
    err.statusCode = 404;
    throw err;
  }
  return channelRepository.update(id, {
    name: data.name,
    nameAr: data.nameAr,
    description: data.description,
    descriptionAr: data.descriptionAr,
    icon: data.icon,
    isActive: data.isActive,
  });
};

const deleteChannel = async (id) => {
  const channel = await channelRepository.findById(id);
  if (!channel) {
    const err = new Error('Channel not found');
    err.statusCode = 404;
    throw err;
  }
  await channelRepository.remove(id);
  return { deleted: true };
};

module.exports = {
  listChannels,
  getChannelById,
  getChannelMessages,
  sendMessage,
  createChannel,
  updateChannel,
  deleteChannel,
};
