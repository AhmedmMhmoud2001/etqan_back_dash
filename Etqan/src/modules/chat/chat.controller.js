const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const chatService = require('./chat.service');

const getMyConversations = asyncHandler(async (req, res) => {
  const result = await chatService.getMyConversations(req.user.id, req.user.role);
  success(res, result, 'Conversations');
});

const getOrCreateMyConversation = asyncHandler(async (req, res) => {
  const conv = await chatService.getOrCreateMyConversation(req.user.id);
  success(res, conv, 'Conversation');
});

const getConversation = asyncHandler(async (req, res) => {
  const conv = await chatService.getConversationById(req.params.id, req.user.id);
  success(res, conv, 'Conversation');
});

const getMessages = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
  const before = req.query.before || undefined;
  const result = await chatService.getMessages(req.params.id, req.user.id, page, limit, before);
  success(res, result, 'Messages');
});

const sendMessage = asyncHandler(async (req, res) => {
  const msg = await chatService.sendMessage(req.params.id, req.user.id, req.body);
  success(res, msg, 'Message sent', 201);
});

module.exports = {
  getMyConversations,
  getOrCreateMyConversation,
  getConversation,
  getMessages,
  sendMessage,
};
