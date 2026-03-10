const { body, param, validationResult } = require('express-validator');

const createRules = () => [
  body('patientId').trim().notEmpty().withMessage('patientId is required'),
  body('content').trim().notEmpty().withMessage('content is required').isLength({ max: 5000 }),
  body('doctorId').optional().trim(),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const extracted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  return res.status(400).json({ success: false, message: 'Validation failed', errors: extracted });
};

module.exports = { createRules, validate };
