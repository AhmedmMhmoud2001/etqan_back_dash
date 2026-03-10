const { body, param, validationResult } = require('express-validator');

const createPostRules = () => [
  body('content').trim().notEmpty().withMessage('Content is required').isLength({ max: 10000 }).withMessage('Content too long'),
  body('imageUrl').optional().trim().isURL().withMessage('Invalid image URL'),
  body('badge').optional().trim().isLength({ max: 200 }),
];

const updatePostRules = () => [
  param('id').trim().notEmpty().withMessage('Post id is required'),
  body('content').optional().trim().isLength({ max: 10000 }).withMessage('Content too long'),
  body('imageUrl').optional().trim(),
  body('badge').optional().trim().isLength({ max: 200 }),
];

const addCommentRules = () => [
  param('id').trim().notEmpty().withMessage('Post id is required'),
  body('content').trim().notEmpty().withMessage('Comment content is required').isLength({ max: 2000 }).withMessage('Comment too long'),
];

const updateCommentRules = () => [
  param('commentId').trim().notEmpty().withMessage('Comment id is required'),
  body('content').trim().notEmpty().withMessage('Comment content is required').isLength({ max: 2000 }).withMessage('Comment too long'),
];

const idParam = (name = 'id') => [param(name).trim().notEmpty().withMessage(`${name} is required`)];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const extracted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  return res.status(400).json({ success: false, message: 'Validation failed', errors: extracted });
};

module.exports = {
  createPostRules,
  updatePostRules,
  addCommentRules,
  updateCommentRules,
  idParam,
  validate,
};
