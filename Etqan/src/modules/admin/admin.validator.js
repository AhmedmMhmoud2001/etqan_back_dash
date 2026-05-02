const { body, param, validationResult } = require('express-validator');

const createUserRules = () => [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name too long'),
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('emailVerified').optional().isBoolean(),
];

const updateUserRules = () => [
  param('id').trim().notEmpty().withMessage('User id is required'),
  body('name').optional().trim().isLength({ max: 100 }).withMessage('Name too long'),
  body('email').optional().trim().isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('isActive').optional().isBoolean(),
  body('doctorId').optional({ values: 'null' }).isString().withMessage('doctorId must be string or null to unassign'),
  body('role').optional().trim().isIn(['USER', 'DOCTOR', 'ADMIN']).withMessage('Invalid role'),
  body('emailVerified').optional().isBoolean(),
];

const assignDoctorRules = () => [
  param('id').trim().notEmpty().withMessage('User id is required'),
  body('doctorId').trim().notEmpty().withMessage('doctorId is required'),
];

const createDoctorRules = () => [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name too long'),
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('emailVerified').optional().isBoolean(),
  body('title').optional().trim().isLength({ max: 100 }),
  body('titleAr').optional().trim().isLength({ max: 100 }),
  body('titleIt').optional().trim().isLength({ max: 100 }),
  body('specialization').optional().trim().isLength({ max: 200 }),
  body('specializationAr').optional().trim().isLength({ max: 200 }),
  body('specializationIt').optional().trim().isLength({ max: 200 }),
  body('bio').optional().trim().isLength({ max: 5000 }),
  body('bioAr').optional().trim().isLength({ max: 5000 }),
  body('bioIt').optional().trim().isLength({ max: 5000 }),
];

const updateDoctorRules = () => [
  param('id').trim().notEmpty().withMessage('Doctor id is required'),
  body('name').optional().trim().isLength({ max: 100 }).withMessage('Name too long'),
  body('email').optional().trim().isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('isActive').optional().isBoolean(),
  body('title').optional().trim().isLength({ max: 100 }),
  body('titleAr').optional().trim().isLength({ max: 100 }),
  body('titleIt').optional().trim().isLength({ max: 100 }),
  body('specialization').optional().trim().isLength({ max: 200 }),
  body('specializationAr').optional().trim().isLength({ max: 200 }),
  body('specializationIt').optional().trim().isLength({ max: 200 }),
  body('bio').optional().trim().isLength({ max: 5000 }),
  body('bioAr').optional().trim().isLength({ max: 5000 }),
  body('bioIt').optional().trim().isLength({ max: 5000 }),
];

const idParamRules = (paramName = 'id') => [param(paramName).trim().notEmpty().withMessage(`${paramName} is required`)];

const createNotificationRules = () => [
  body('userId').trim().notEmpty().withMessage('userId is required'),
  body('title').trim().notEmpty().withMessage('title is required').isLength({ max: 255 }).withMessage('title too long'),
  body('body').optional().trim().isLength({ max: 5000 }),
  body('type').optional().trim().isLength({ max: 50 }),
  body('link').optional({ values: 'falsy' }).trim().isURL().withMessage('link must be valid URL').bail().isLength({ max: 500 }),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const extracted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  return res.status(400).json({ success: false, message: 'Validation failed', errors: extracted });
};

module.exports = {
  createUserRules,
  updateUserRules,
  assignDoctorRules,
  createDoctorRules,
  updateDoctorRules,
  idParamRules,
  createNotificationRules,
  validate,
};
