const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const communityService = require('./community.service');

// Stats
const getStats = asyncHandler(async (req, res) => {
  const stats = await communityService.getStats(req.user?.id);
  success(res, stats, 'Community stats');
});

// Feed & single post
const getFeed = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const result = await communityService.getFeed(page, limit, req.user?.id);
  success(res, result, 'Feed');
});

const getPost = asyncHandler(async (req, res) => {
  const post = await communityService.getPostById(req.params.id, req.user?.id);
  success(res, post, 'Post');
});

const createPost = asyncHandler(async (req, res) => {
  const post = await communityService.createPost(req.user.id, req.body);
  success(res, post, 'Post created', 201);
});

const updatePost = asyncHandler(async (req, res) => {
  const post = await communityService.updatePost(req.params.id, req.user.id, req.body);
  success(res, post, 'Post updated');
});

const deletePost = asyncHandler(async (req, res) => {
  await communityService.deletePost(req.params.id, req.user.id);
  success(res, { deleted: true }, 'Post deleted');
});

// Comments
const getComments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
  const result = await communityService.getComments(req.params.id, page, limit);
  success(res, result, 'Comments');
});

const addComment = asyncHandler(async (req, res) => {
  const comment = await communityService.addComment(req.params.id, req.user.id, req.body.content);
  success(res, comment, 'Comment added', 201);
});

const updateComment = asyncHandler(async (req, res) => {
  const comment = await communityService.updateComment(req.params.commentId, req.user.id, req.body.content);
  success(res, comment, 'Comment updated');
});

const deleteComment = asyncHandler(async (req, res) => {
  await communityService.deleteComment(req.params.commentId, req.user.id);
  success(res, { deleted: true }, 'Comment deleted');
});

// Like
const toggleLike = asyncHandler(async (req, res) => {
  const result = await communityService.toggleLike(req.params.id, req.user.id);
  success(res, result, result.liked ? 'Post liked' : 'Post unliked');
});

// Share
const sharePost = asyncHandler(async (req, res) => {
  const result = await communityService.sharePost(req.params.id, req.user.id);
  success(res, result, 'Post shared');
});

// Follow
const followUser = asyncHandler(async (req, res) => {
  const result = await communityService.followUser(req.user.id, req.params.userId);
  success(res, result, 'Following');
});

const unfollowUser = asyncHandler(async (req, res) => {
  await communityService.unfollowUser(req.user.id, req.params.userId);
  success(res, { unfollowed: true }, 'Unfollowed');
});

module.exports = {
  getStats,
  getFeed,
  getPost,
  createPost,
  updatePost,
  deletePost,
  getComments,
  addComment,
  updateComment,
  deleteComment,
  toggleLike,
  sharePost,
  followUser,
  unfollowUser,
};
