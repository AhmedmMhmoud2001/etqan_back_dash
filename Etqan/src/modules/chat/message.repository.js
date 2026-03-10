const { prisma } = require('../../prisma/client');

const senderSelect = { id: true, name: true, email: true };

const listByConversationId = async (conversationId, params = {}) => {
  const { skip = 0, take = 50, before } = params;
  const where = { conversationId };
  if (before) {
    const beforeDate = new Date(before);
    if (!isNaN(beforeDate.getTime())) where.createdAt = { lt: beforeDate };
  }
  const [items, total] = await Promise.all([
    prisma.chatMessage.findMany({
      where,
      include: { sender: { select: senderSelect } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.chatMessage.count({ where: { conversationId } }),
  ]);
  return { items: items.reverse(), total };
};

const create = async (data) => {
  const msg = await prisma.chatMessage.create({
    data: {
      conversationId: data.conversationId,
      senderId: data.senderId,
      content: data.content || '',
      attachmentUrl: data.attachmentUrl ?? undefined,
      attachmentName: data.attachmentName ?? undefined,
    },
    include: { sender: { select: senderSelect } },
  });
  await prisma.conversation.update({
    where: { id: data.conversationId },
    data: { updatedAt: new Date() },
  });
  return msg;
};

module.exports = { listByConversationId, create };
