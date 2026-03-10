const { body, param, validationResult } = require('express-validator');

const conversationIdParam = () => [param('id').trim().notEmpty().withMessage('Conversation id is required')];

const sendMessageRules = () => [
  param('id').trim().notEmpty().withMessage('Conversation id is required'),
  body('content').optional().trim().isLength({ max: 10000 }).withMessage('Content too long'),
  body('attachmentUrl').optional().trim().isURL().withMessage('Invalid attachment URL'),
  body('attachmentName').optional().trim().isLength({ max: 255 }),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const extracted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  return res.status(400).json({ success: false, message: 'Validation failed', errors: extracted });
};

module.exports = { conversationIdParam, sendMessageRules, validate };
