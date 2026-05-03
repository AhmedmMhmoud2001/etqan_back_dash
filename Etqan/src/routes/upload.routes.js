const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const { normalizeStoredAssetUrl } = require('../utils/publicAssetUrl');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '').toLowerCase() || '.jpg';
    const safeExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext) ? ext : '.jpg';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${safeExt}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.mimetype);
    if (allowed) cb(null, true);
    else cb(new Error('Only images (JPEG, PNG, GIF, WebP) are allowed'), false);
  },
});

const router = express.Router();

router.use(authenticate);
router.use(authorize('USER', 'DOCTOR', 'ADMIN'));

router.post(
  '/image',
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ success: false, message: 'File too large (max 5MB)' });
        return res.status(400).json({ success: false, message: err.message || 'Invalid file' });
      }
      next();
    });
  },
  asyncHandler((req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image file' });
    const relativePath = `/uploads/${req.file.filename}`;
    const url = normalizeStoredAssetUrl(relativePath, { req });
    success(res, { url }, 'Image uploaded');
  })
);

module.exports = router;
