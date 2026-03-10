const { prisma } = require('../../prisma/client');

const senderSelect = { id: true, name: true, email: true };

const listByChannelId = async (channelId, params = {}) => {
  const { skip = 0, take = 50, before } = params;
  const where = { channelId };
  if (before) {
    const t = new Date(before);
    if (!isNaN(t.getTime())) where.createdAt = { lt: t };
  }
  const [items, total] = await Promise.all([
    prisma.channelMessage.findMany({
      where,
      include: { sender: { select: senderSelect } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.channelMessage.count({ where: { channelId } }),
  ]);
  return { items: items.reverse(), total };
};

const create = async (data) => {
  const msg = await prisma.channelMessage.create({
    data: {
      channelId: data.channelId,
      senderId: data.senderId,
      content: data.content || '',
      attachmentUrl: data.attachmentUrl ?? undefined,
      attachmentName: data.attachmentName ?? undefined,
    },
    include: { sender: { select: senderSelect } },
  });
  await prisma.channel.update({
    where: { id: data.channelId },
    data: { updatedAt: new Date() },
  });
  return msg;
};

module.exports = { listByChannelId, create };
