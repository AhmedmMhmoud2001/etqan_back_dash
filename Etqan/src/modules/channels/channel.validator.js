const { body, param, validationResult } = require('express-validator');

const channelIdParam = () => [param('id').trim().notEmpty().withMessage('Channel id is required')];

const createChannelRules = () => [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 200 }),
  body('nameAr').optional().trim().isLength({ max: 200 }),
  body('nameIt').optional().trim().isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('descriptionAr').optional().trim().isLength({ max: 2000 }),
  body('descriptionIt').optional().trim().isLength({ max: 2000 }),
  body('icon').optional().trim().isLength({ max: 20 }),
];

const updateChannelRules = () => [
  param('id').trim().notEmpty().withMessage('Channel id is required'),
  body('name').optional().trim().isLength({ max: 200 }),
  body('nameAr').optional().trim().isLength({ max: 200 }),
  body('nameIt').optional().trim().isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('descriptionAr').optional().trim().isLength({ max: 2000 }),
  body('descriptionIt').optional().trim().isLength({ max: 2000 }),
  body('icon').optional().trim().isLength({ max: 20 }),
  body('isActive').optional().isBoolean(),
];

const sendMessageRules = () => [
  param('id').trim().notEmpty().withMessage('Channel id is required'),
  body('content').optional().trim().isLength({ max: 10000 }),
  body('attachmentUrl').optional().trim().isURL(),
  body('attachmentName').optional().trim().isLength({ max: 255 }),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const extracted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  return res.status(400).json({ success: false, message: 'Validation failed', errors: extracted });
};

module.exports = { channelIdParam, sendMessageRules, createChannelRules, updateChannelRules, validate };
