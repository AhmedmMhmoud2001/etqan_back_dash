const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const channelService = require('./channel.service');

const listChannels = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
  const result = await channelService.listChannels(page, limit);
  success(res, result, 'Channels');
});

const getChannel = asyncHandler(async (req, res) => {
  const channel = await channelService.getChannelById(req.params.id);
  success(res, channel, 'Channel');
});

const getChannelMessages = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
  const before = req.query.before || undefined;
  const result = await channelService.getChannelMessages(req.params.id, page, limit, before);
  success(res, result, 'Messages');
});

const sendMessage = asyncHandler(async (req, res) => {
  const msg = await channelService.sendMessage(req.params.id, req.user.id, req.body);
  if (msg && msg.removed) return success(res, msg, 'Removed', 200);
  success(res, msg, 'Message sent', 201);
});

// ——— أدمن فقط
const createChannel = asyncHandler(async (req, res) => {
  const channel = await channelService.createChannel(req.body);
  success(res, channel, 'Channel created', 201);
});

const updateChannel = asyncHandler(async (req, res) => {
  const channel = await channelService.updateChannel(req.params.id, req.body);
  success(res, channel, 'Channel updated');
});

const deleteChannel = asyncHandler(async (req, res) => {
  await channelService.deleteChannel(req.params.id);
  success(res, { deleted: true }, 'Channel deleted');
});

module.exports = {
  listChannels,
  getChannel,
  getChannelMessages,
  sendMessage,
  createChannel,
  updateChannel,
  deleteChannel,
};
