const { prisma } = require('../../prisma/client');
const postRepository = require('./post.repository');
const commentRepository = require('./comment.repository');
const likeRepository = require('./like.repository');
const shareRepository = require('./share.repository');
const followRepository = require('./follow.repository');
const notificationService = require('../notifications/notification.service');
const { shouldRemoveMessage } = require('../../utils/moderation');

const formatPost = (post, currentUserId = null) => {
  if (!post) return null;
  const { user, _count, ...rest } = post;
  const out = {
    ...rest,
    author: user,
    likesCount: _count?.likes ?? 0,
    commentsCount: _count?.comments ?? 0,
    sharesCount: _count?.shares ?? 0,
  };
  if (currentUserId && post.id) {
    return likeRepository.isLikedByUser(post.id, currentUserId).then((liked) => ({ ...out, liked }));
  }
  return Promise.resolve({ ...out, liked: false });
};

const formatPostsWithLiked = async (posts, currentUserId) => {
  return Promise.all(posts.map((p) => formatPost(p, currentUserId)));
};

// ——— Posts ———
const getFeed = async (page = 1, limit = 20, currentUserId = null) => {
  const skip = (Math.max(1, page) - 1) * limit;
  const take = Math.min(limit, 100);
  const posts = await postRepository.list({ skip, take });
  const items = await formatPostsWithLiked(posts, currentUserId);
  const total = await prisma.post.count();
  return { items, total, page, limit };
};

const getPostById = async (id, currentUserId = null) => {
  const post = await postRepository.findById(id);
  if (!post) {
    const err = new Error('Post not found');
    err.statusCode = 404;
    throw err;
  }
  return formatPost(post, currentUserId);
};

const createPost = async (userId, data) => {
  if (!data.content || !data.content.trim()) {
    const err = new Error('Content is required');
    err.statusCode = 400;
    throw err;
  }
  if (shouldRemoveMessage(data.content)) {
    return { removed: true };
  }
  const post = await postRepository.create({
    userId,
    content: data.content.trim(),
    imageUrl: data.imageUrl || null,
    badge: data.badge || null,
  });
  notificationService.broadcast({
    title: 'منشور جديد في المجتمع',
    body: 'تم إضافة منشور جديد في المجتمع. تصفح التحديثات.',
    type: 'POST_CREATED',
    link: '/community',
  }).catch(() => {});
  return formatPost(post, userId);
};

const updatePost = async (postId, userId, data) => {
  const post = await postRepository.findById(postId);
  if (!post) {
    const err = new Error('Post not found');
    err.statusCode = 404;
    throw err;
  }
  if (post.userId !== userId) {
    const err = new Error('Forbidden: you can only edit your own post');
    err.statusCode = 403;
    throw err;
  }
  const payload = {};
  if (data.content !== undefined) {
    const c = typeof data.content === 'string' ? data.content.trim() : data.content;
    if (c === '') {
      const err = new Error('Content cannot be empty');
      err.statusCode = 400;
      throw err;
    }
    if (typeof c === 'string' && shouldRemoveMessage(c)) {
      await postRepository.remove(postId);
      return { removed: true, deleted: true };
    }
    payload.content = c;
  }
  if (data.imageUrl !== undefined) payload.imageUrl = data.imageUrl || null;
  if (data.badge !== undefined) payload.badge = data.badge || null;
  const updated = await postRepository.update(postId, payload);
  notificationService.broadcast({
    title: 'تم تحديث منشور في المجتمع',
    body: 'تم تحديث منشور في المجتمع. تصفح التحديثات.',
    type: 'POST_UPDATED',
    link: '/community',
  }).catch(() => {});
  return formatPost(updated, userId);
};

const deletePost = async (postId, userId) => {
  const post = await postRepository.findById(postId);
  if (!post) {
    const err = new Error('Post not found');
    err.statusCode = 404;
    throw err;
  }
  if (post.userId !== userId) {
    const err = new Error('Forbidden: you can only delete your own post');
    err.statusCode = 403;
    throw err;
  }
  await postRepository.remove(postId);
  return { deleted: true };
};

// ——— Comments ———
const getComments = async (postId, page = 1, limit = 50) => {
  const post = await postRepository.findById(postId);
  if (!post) {
    const err = new Error('Post not found');
    err.statusCode = 404;
    throw err;
  }
  const skip = (Math.max(1, page) - 1) * limit;
  const take = Math.min(limit, 100);
  return commentRepository.listByPostId(postId, { skip, take });
};

const addComment = async (postId, userId, content) => {
  const post = await postRepository.findById(postId);
  if (!post) {
    const err = new Error('Post not found');
    err.statusCode = 404;
    throw err;
  }
  if (!content || !content.trim()) {
    const err = new Error('Comment content is required');
    err.statusCode = 400;
    throw err;
  }
  if (shouldRemoveMessage(content)) {
    return { removed: true };
  }
  return commentRepository.create({ postId, userId, content: content.trim() });
};

const updateComment = async (commentId, userId, content) => {
  const comment = await commentRepository.findById(commentId);
  if (!comment) {
    const err = new Error('Comment not found');
    err.statusCode = 404;
    throw err;
  }
  if (comment.userId !== userId) {
    const err = new Error('Forbidden: you can only edit your own comment');
    err.statusCode = 403;
    throw err;
  }
  if (!content || !content.trim()) {
    const err = new Error('Comment content is required');
    err.statusCode = 400;
    throw err;
  }
  if (shouldRemoveMessage(content)) {
    await commentRepository.remove(commentId);
    return { removed: true, deleted: true };
  }
  return commentRepository.update(commentId, { content: content.trim() });
};

const deleteComment = async (commentId, userId) => {
  const comment = await commentRepository.findById(commentId);
  if (!comment) {
    const err = new Error('Comment not found');
    err.statusCode = 404;
    throw err;
  }
  if (comment.userId !== userId) {
    const err = new Error('Forbidden: you can only delete your own comment');
    err.statusCode = 403;
    throw err;
  }
  await commentRepository.remove(commentId);
  return { deleted: true };
};

// ——— Like ———
const toggleLike = async (postId, userId) => {
  const post = await postRepository.findById(postId);
  if (!post) {
    const err = new Error('Post not found');
    err.statusCode = 404;
    throw err;
  }
  return likeRepository.toggle(postId, userId);
};

// ——— Share ———
const sharePost = async (postId, userId) => {
  const post = await postRepository.findById(postId);
  if (!post) {
    const err = new Error('Post not found');
    err.statusCode = 404;
    throw err;
  }
  const sharesCount = await shareRepository.add(postId, userId);
  return { shared: true, sharesCount };
};

// ——— Follow ———
const followUser = async (followerId, followingId) => {
  if (followerId === followingId) {
    const err = new Error('Cannot follow yourself');
    err.statusCode = 400;
    throw err;
  }
  const target = await prisma.user.findUnique({ where: { id: followingId } });
  if (!target) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return followRepository.follow(followerId, followingId);
};

const unfollowUser = async (followerId, followingId) => {
  await followRepository.unfollow(followerId, followingId);
  return { unfollowed: true };
};

// ——— Stats ———
const getStats = async (currentUserId = null) => {
  const membersCount = await prisma.user.count();
  let myPostsCount = 0;
  let followersCount = 0;
  if (currentUserId) {
    myPostsCount = await postRepository.countByUserId(currentUserId);
    followersCount = await followRepository.countFollowers(currentUserId);
  }
  return { membersCount, myPostsCount, followersCount };
};

module.exports = {
  getFeed,
  getPostById,
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
  getStats,
};
