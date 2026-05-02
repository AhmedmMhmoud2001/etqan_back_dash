import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import { useTranslation } from '../../translations';
import { get, post, patch, del, uploadImage, resolveMediaUrl } from '../../api';
import { IconDelete, IconComment, IconShare, IconEdit } from '../../components/ActionIcons';

const PREVIEW_LEN = 100;

export default function AdminCommunityPosts() {
  const { lang } = useLang();
  const t = useTranslation(lang);
  const navigate = useNavigate();
  const me = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
  const isDoctor = me?.role === 'DOCTOR';
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [users, setUsers] = useState([]);
  const [filterUserId, setFilterUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState('');

  // إضافة بوست
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImageUrl, setNewPostImageUrl] = useState(''); // يُملأ بعد رفع الصورة
  const [submittingPost, setSubmittingPost] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null); // data URL للمعاينة

  // تعليقات — مودال
  const [commentsModalPostId, setCommentsModalPostId] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const [sharingPostId, setSharingPostId] = useState(null);

  // تعديل بوست — مودال
  const [editPost, setEditPost] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editImagePreview, setEditImagePreview] = useState(null); // data URL أو عرض الصورة الحالية
  const [uploadingEditImage, setUploadingEditImage] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const loadUsers = async () => {
    if (isDoctor) { setUsers([]); return; }
    const { res, data } = await get('/admin/users?limit=500&role=USER');
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (res.ok) {
      const d = data.data || data;
      setUsers(d.items || d || []);
    }
  };

  const loadPosts = async () => {
    setLoadingPosts(true);
    setError('');
    let url = isDoctor ? '/community/posts?limit=100' : '/admin/community/posts?limit=300';
    if (!isDoctor && filterUserId) url += `&userId=${encodeURIComponent(filterUserId)}`;
    const { res, data } = await get(url);
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (!res.ok) {
      setError(data.message || t('loadError'));
      setPosts([]);
      setTotal(0);
      setLoadingPosts(false);
      return;
    }
    const result = data.data || data;
    const list = result.items ?? result.posts ?? result ?? [];
    setPosts(Array.isArray(list) ? list : []);
    setTotal(result.total ?? list.length);
    setLoadingPosts(false);
  };

  useEffect(() => {
    setLoading(true);
    loadUsers().then(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadPosts();
  }, [filterUserId, isDoctor]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    setSubmittingPost(true);
    setError('');
    const body = { content: newPostContent.trim() };
    if (newPostImageUrl.trim()) body.imageUrl = newPostImageUrl.trim();
    const { res, data } = await post('/community/posts', body);
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (!res.ok) {
      setError(data.message || data.errors?.[0]?.message || 'Failed');
      setSubmittingPost(false);
      return;
    }
    setNewPostContent('');
    setNewPostImageUrl('');
    setImagePreview(null);
    setSubmittingPost(false);
    loadPosts();
  };

  const handleImageSelect = async (e) => {
    const file = e.target?.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setUploadingImage(true);
    setError('');
    const { res, url } = await uploadImage(file);
    setUploadingImage(false);
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (!res.ok || !url) {
      setError(lang === 'ar' ? 'فشل رفع الصورة' : 'Image upload failed');
      return;
    }
    setNewPostImageUrl(url);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clearImage = () => {
    setNewPostImageUrl('');
    setImagePreview(null);
  };

  const handleShare = async (postId) => {
    setSharingPostId(postId);
    const { res } = await post(`/community/posts/${postId}/share`);
    setSharingPostId(null);
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (res.ok) loadPosts();
  };

  const openCommentsModal = async (postId) => {
    setCommentsModalPostId(postId);
    setComments([]);
    setNewCommentContent('');
    if (!postId) return;
    setLoadingComments(true);
    const { res, data } = await get(`/community/posts/${postId}/comments?limit=100`);
    setLoadingComments(false);
    if (res.ok) {
      const r = data.data || data;
      setComments(r.items ?? r.comments ?? r ?? []);
      setCommentsTotal(r.total ?? 0);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentsModalPostId || !newCommentContent.trim()) return;
    setSubmittingComment(true);
    const { res, data } = await post(`/community/posts/${commentsModalPostId}/comments`, { content: newCommentContent.trim() });
    setSubmittingComment(false);
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (res.ok) {
      setNewCommentContent('');
      const r = data.data || data;
      if (r && r.id) setComments((prev) => [r, ...prev]);
      else openCommentsModal(commentsModalPostId);
      setCommentsTotal((c) => c + 1);
      loadPosts();
    }
  };

  const openEdit = (post) => {
    setEditPost(post);
    setEditContent(post.content ?? '');
    setEditImageUrl(post.imageUrl ?? '');
    setEditImagePreview(null);
  };

  const handleUpdatePost = async (e) => {
    e.preventDefault();
    if (!editPost) return;
    setSubmittingEdit(true);
    const body = { content: editContent.trim() };
    body.imageUrl = editImageUrl.trim() || null;
    const { res } = await patch(`/community/posts/${editPost.id}`, body);
    setSubmittingEdit(false);
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (res.ok) {
      setEditPost(null);
      loadPosts();
    }
  };

  const handleEditImageSelect = async (e) => {
    const file = e.target?.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setUploadingEditImage(true);
    const { res, url } = await uploadImage(file);
    setUploadingEditImage(false);
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (!res.ok || !url) return;
    setEditImageUrl(url);
    const reader = new FileReader();
    reader.onload = () => setEditImagePreview(reader.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clearEditImage = () => {
    setEditImageUrl('');
    setEditImagePreview(null);
  };

  const handleDelete = async (post) => {
    if (!window.confirm(t('confirmDelete'))) return;
    const { res } = await del(isDoctor ? `/community/posts/${post.id}` : `/admin/community/posts/${post.id}`);
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (res.ok) {
      loadPosts();
      if (commentsModalPostId === post.id) setCommentsModalPostId(null);
    }
  };

  const contentPreview = (text) => {
    if (!text) return '—';
    const s = String(text).trim();
    if (s.length <= PREVIEW_LEN) return s;
    return s.slice(0, PREVIEW_LEN) + (lang === 'ar' ? '…' : '…');
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('communityPostsTitle')}</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{t('communityPostsDesc')}</p>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">{error}</div>}

      {/* إضافة بوست جديد */}
      <div className="mb-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 p-4">
        <h2 className="font-medium text-slate-800 dark:text-slate-100 mb-3">{lang === 'ar' ? 'إضافة بوست جديد' : 'Add new post'}</h2>
        <form onSubmit={handleCreatePost} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{lang === 'ar' ? 'المحتوى' : 'Content'}</label>
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2 min-h-[80px]"
              placeholder={lang === 'ar' ? 'اكتب المحتوى...' : 'Write content...'}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{lang === 'ar' ? 'صورة (اختياري)' : 'Image (optional)'}</label>
            {!newPostImageUrl ? (
              <div className="flex items-center gap-2">
                <input type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={handleImageSelect} disabled={uploadingImage} className="text-sm text-slate-600 dark:text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary-100 file:text-primary-700 dark:file:bg-primary-900/50 dark:file:text-primary-300" />
                {uploadingImage && <span className="text-sm text-slate-500">{t('saving')}</span>}
              </div>
            ) : (
              <div className="flex items-start gap-3">
                {imagePreview && <img src={resolveMediaUrl(imagePreview)} alt="" className="h-20 w-20 object-cover rounded-lg border border-slate-200 dark:border-slate-600" />}
                <button type="button" onClick={clearImage} className="text-sm text-red-600 dark:text-red-400 hover:underline">{lang === 'ar' ? 'إزالة الصورة' : 'Remove image'}</button>
              </div>
            )}
          </div>
          <button type="submit" disabled={submittingPost} className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">
            {submittingPost ? t('saving') : (lang === 'ar' ? 'نشر البوست' : 'Publish post')}
          </button>
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        {!isDoctor && (
          <>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {lang === 'ar' ? 'المستخدم (الناشر)' : 'User (author)'}:
            </label>
            <select
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
              className="rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2 min-w-[220px]"
            >
              <option value="">— {lang === 'ar' ? 'كل المستخدمين' : 'All users'} —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-600 flex justify-between items-center">
          <h2 className="font-medium text-slate-800 dark:text-slate-100">
            {lang === 'ar' ? 'البوستات' : 'Posts'} {total > 0 && `(${total})`}
          </h2>
        </div>
        {loadingPosts ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">{t('loading')}</div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            {lang === 'ar' ? 'لا توجد بوستات' : 'No posts'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-start">
                <tr>
                  <th className="px-4 py-3 font-medium text-start w-14">{lang === 'ar' ? 'الصورة' : 'Image'}</th>
                  <th className="px-4 py-3 font-medium text-start">{lang === 'ar' ? 'الناشر' : 'Author'}</th>
                  <th className="px-4 py-3 font-medium text-start">{lang === 'ar' ? 'المحتوى' : 'Content'}</th>
                  <th className="px-4 py-3 font-medium text-start">{lang === 'ar' ? 'إعجابات' : 'Likes'}</th>
                  <th className="px-4 py-3 font-medium text-start">{lang === 'ar' ? 'تعليقات' : 'Comments'}</th>
                  <th className="px-4 py-3 font-medium text-start">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                  <th className="px-4 py-3 font-medium text-start">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-600 text-start">
                {posts.map((post) => {
                  const isOwn = String(post?.userId || '') === String(me?.id || '');
                  return (
                  <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-start">
                      {post.imageUrl ? (
                        <img src={resolveMediaUrl(post.imageUrl)} alt="" className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-600" />
                      ) : (
                        <span className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-600 inline-flex items-center justify-center text-slate-400 text-lg shrink-0" title={lang === 'ar' ? 'لا صورة' : 'No image'}>📝</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-start text-slate-800 dark:text-slate-200">
                      {post.user?.name ?? post.userId ?? '—'}
                      {post.user?.email && <span className="text-xs text-slate-500 block">{post.user.email}</span>}
                    </td>
                    <td className="px-4 py-3 text-start text-slate-700 dark:text-slate-300 max-w-md">
                      <span title={post.content}>{contentPreview(post.content)}</span>
                    </td>
                    <td className="px-4 py-3 text-start">{post._count?.likes ?? 0}</td>
                    <td className="px-4 py-3 text-start">{post._count?.comments ?? 0}</td>
                    <td className="px-4 py-3 text-start text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {post.createdAt ? new Date(post.createdAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en') : '—'}
                    </td>
                    <td className="px-4 py-3 text-start">
                      <div className="flex items-center justify-end gap-0">
                        <button
                          type="button"
                          onClick={() => openEdit(post)}
                          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                          title={t('edit')}
                          aria-label={t('edit')}
                        >
                          <IconEdit />
                        </button>
                        <button
                          type="button"
                          onClick={() => openCommentsModal(post.id)}
                          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                          title={lang === 'ar' ? 'تعليقات / إضافة تعليق' : 'Comments / Add comment'}
                          aria-label={lang === 'ar' ? 'تعليقات' : 'Comments'}
                        >
                          <IconComment />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShare(post.id)}
                          disabled={sharingPostId === post.id}
                          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
                          title={lang === 'ar' ? 'مشاركة' : 'Share'}
                          aria-label={lang === 'ar' ? 'مشاركة' : 'Share'}
                        >
                          <IconShare />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(post)}
                          disabled={isDoctor && !isOwn}
                          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
                          title={t('delete')}
                          aria-label={t('delete')}
                        >
                          <IconDelete />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* مودال تعديل البوست */}
      {editPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto" onClick={() => setEditPost(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full my-8 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">{lang === 'ar' ? 'تعديل البوست' : 'Edit post'}</h3>
            <form onSubmit={handleUpdatePost} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{lang === 'ar' ? 'المحتوى' : 'Content'}</label>
                <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2 min-h-[80px]" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{lang === 'ar' ? 'صورة' : 'Image'}</label>
                {!editImageUrl && !editImagePreview ? (
                  <div className="flex items-center gap-2">
                    <input type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={handleEditImageSelect} disabled={uploadingEditImage} className="text-sm text-slate-600 dark:text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary-100 file:text-primary-700 dark:file:bg-primary-900/50 dark:file:text-primary-300" />
                    {uploadingEditImage && <span className="text-sm text-slate-500">{t('saving')}</span>}
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <img src={resolveMediaUrl(editImagePreview || editImageUrl)} alt="" className="h-20 w-20 object-cover rounded-lg border border-slate-200 dark:border-slate-600" />
                    <div className="flex flex-col gap-1">
                      <button type="button" onClick={clearEditImage} className="text-sm text-red-600 dark:text-red-400 hover:underline">{lang === 'ar' ? 'إزالة الصورة' : 'Remove image'}</button>
                      {!uploadingEditImage && (
                        <label className="text-sm text-primary-600 dark:text-primary-400 hover:underline cursor-pointer">
                          {lang === 'ar' ? 'تغيير الصورة' : 'Change image'}
                          <input type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={handleEditImageSelect} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={submittingEdit} className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-sm hover:bg-primary-700 disabled:opacity-50">{submittingEdit ? t('saving') : t('save')}</button>
                <button type="button" onClick={() => setEditPost(null)} className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-500 text-sm">{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال التعليقات */}
      {commentsModalPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto" onClick={() => setCommentsModalPostId(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full my-8 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">{lang === 'ar' ? 'التعليقات' : 'Comments'} ({commentsTotal})</h3>
            <form onSubmit={handleAddComment} className="mb-4">
              <textarea
                value={newCommentContent}
                onChange={(e) => setNewCommentContent(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2 min-h-[60px] text-sm"
                placeholder={lang === 'ar' ? 'اكتب تعليقاً...' : 'Write a comment...'}
                required
              />
              <div className="flex gap-2 mt-2">
                <button type="submit" disabled={submittingComment} className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-sm hover:bg-primary-700 disabled:opacity-50">
                  {submittingComment ? t('saving') : (lang === 'ar' ? 'إضافة تعليق' : 'Add comment')}
                </button>
                <button type="button" onClick={() => setCommentsModalPostId(null)} className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-500 text-sm">
                  {t('cancel')}
                </button>
              </div>
            </form>
            {loadingComments ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm">{t('loading')}</p>
            ) : (
              <ul className="space-y-3 divide-y divide-slate-200 dark:divide-slate-600">
                {comments.map((c) => (
                  <li key={c.id} className="pt-3 first:pt-0">
                    <p className="text-slate-800 dark:text-slate-200 text-sm">{c.content}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {c.user?.name ?? c.userId} — {c.createdAt ? new Date(c.createdAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en') : ''}
                    </p>
                  </li>
                ))}
                {comments.length === 0 && !loadingComments && (
                  <li className="text-slate-500 dark:text-slate-400 text-sm py-2">{lang === 'ar' ? 'لا تعليقات بعد' : 'No comments yet'}</li>
                )}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
