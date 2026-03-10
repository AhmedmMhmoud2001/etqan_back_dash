const express = require('express');
const communityController = require('../modules/community/community.controller');
const communityValidator = require('../modules/community/community.validator');
const { authenticate, optionalAuth } = require('../middlewares/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// إحصائيات (اختياري تسجيل دخول لعرض "منشوراتي" و "متابعون")
router.get('/stats', optionalAuth, asyncHandler(communityController.getStats));

// الفيد (قائمة المنشورات)
router.get('/posts', optionalAuth, asyncHandler(communityController.getFeed));

// منشور واحد
router.get('/posts/:id', optionalAuth, asyncHandler(communityController.getPost));

// إنشاء/تعديل/حذف منشور (يتطلب تسجيل دخول)
router.post('/posts', authenticate, communityValidator.createPostRules(), communityValidator.validate, asyncHandler(communityController.createPost));
router.patch('/posts/:id', authenticate, communityValidator.updatePostRules(), communityValidator.validate, asyncHandler(communityController.updatePost));
router.delete('/posts/:id', authenticate, communityValidator.idParam('id'), communityValidator.validate, asyncHandler(communityController.deletePost));

// تعليقات على منشور
router.get('/posts/:id/comments', communityValidator.idParam('id'), communityValidator.validate, asyncHandler(communityController.getComments));
router.post('/posts/:id/comments', authenticate, communityValidator.addCommentRules(), communityValidator.validate, asyncHandler(communityController.addComment));

// تعديل/حذف تعليق (على التعليق نفسه)
router.patch('/comments/:commentId', authenticate, communityValidator.updateCommentRules(), communityValidator.validate, asyncHandler(communityController.updateComment));
router.delete('/comments/:commentId', authenticate, communityValidator.idParam('commentId'), communityValidator.validate, asyncHandler(communityController.deleteComment));

// إعجاب ومنشور
router.post('/posts/:id/like', authenticate, communityValidator.idParam('id'), communityValidator.validate, asyncHandler(communityController.toggleLike));
router.post('/posts/:id/share', authenticate, communityValidator.idParam('id'), communityValidator.validate, asyncHandler(communityController.sharePost));

// متابعة مستخدم
router.post('/users/:userId/follow', authenticate, communityValidator.idParam('userId'), communityValidator.validate, asyncHandler(communityController.followUser));
router.delete('/users/:userId/follow', authenticate, communityValidator.idParam('userId'), communityValidator.validate, asyncHandler(communityController.unfollowUser));

module.exports = router;
