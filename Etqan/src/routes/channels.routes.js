const express = require('express');
const channelController = require('../modules/channels/channel.controller');
const channelValidator = require('../modules/channels/channel.validator');
const { authenticate, authorize, requirePremium } = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// قائمة القنوات ومنشور واحد (أي زائر أو مع تسجيل دخول)
router.get('/', asyncHandler(channelController.listChannels));
router.get('/:id', channelValidator.channelIdParam(), channelValidator.validate, asyncHandler(channelController.getChannel));

// رسائل القناة وإرسال رسالة (مستخدم Premium أو دكتور/أدمن للإشراف)
router.get(
  '/:id/messages',
  authenticate,
  authorize('USER', 'DOCTOR', 'ADMIN'),
  requirePremium,
  channelValidator.channelIdParam(),
  channelValidator.validate,
  asyncHandler(channelController.getChannelMessages)
);
router.post(
  '/:id/messages',
  authenticate,
  authorize('USER', 'DOCTOR', 'ADMIN'),
  requirePremium,
  channelValidator.sendMessageRules(),
  channelValidator.validate,
  asyncHandler(channelController.sendMessage)
);

module.exports = router;
