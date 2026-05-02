const express = require('express');
const chatController = require('../modules/chat/chat.controller');
const chatValidator = require('../modules/chat/chat.validator');
const { authenticate, authorize, requirePremium } = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);
router.use(authorize('USER', 'DOCTOR'));
router.use(requirePremium);

// قائمة المحادثات: للمريض = محادثة واحدة مع دكتوره، للدكتور = كل محادثاته مع المرضى
router.get('/conversations', asyncHandler(chatController.getMyConversations));

// للمريض فقط: إرجاع/إنشاء المحادثة مع دكتوره (للتسهيل من الفرونت)
router.get('/conversations/me', asyncHandler(chatController.getOrCreateMyConversation));

// محادثة بالـ id (يجب أن تكون مشاركاً)
router.get('/conversations/:id', chatValidator.conversationIdParam(), chatValidator.validate, asyncHandler(chatController.getConversation));

// رسائل المحادثة (مع pagination و before للـ cursor)
router.get('/conversations/:id/messages', chatValidator.conversationIdParam(), chatValidator.validate, asyncHandler(chatController.getMessages));

// إرسال رسالة (نص و/أو مرفق)
router.post('/conversations/:id/messages', chatValidator.sendMessageRules(), chatValidator.validate, asyncHandler(chatController.sendMessage));

module.exports = router;
