import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import { useTranslation } from '../../translations';
import { get, patch } from '../../api';

export default function AdminNotifications() {
  const { lang } = useLang();
  const t = useTranslation(lang);
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    setLoading(true);
    setError('');
    let url = `/notifications?page=${page}&limit=${limit}`;
    if (unreadOnly) url += '&unreadOnly=true';
    const { res, data } = await get(url);
    if (res.status === 401) {
      navigate('/login', { replace: true });
      return;
    }
    if (!res.ok) {
      setError(data.message || t('loadError'));
      setLoading(false);
      return;
    }
    const d = data.data || data;
    setItems(d.items || []);
    setTotal(d.total ?? 0);
    setLoading(false);
  };

  const loadUnreadCount = async () => {
    const { res, data } = await get('/notifications/unread-count');
    if (res.ok) setUnreadCount((data.data || data).unreadCount ?? 0);
  };

  useEffect(() => {
    loadNotifications();
  }, [page, unreadOnly]);

  useEffect(() => {
    loadUnreadCount();
  }, [page, items]);

  const handleMarkAsRead = async (id) => {
    const { res } = await patch(`/notifications/${id}/read`, {});
    if (res.status === 401) {
      navigate('/login', { replace: true });
      return;
    }
    if (res.ok) {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      loadUnreadCount();
    }
  };

  const handleMarkAllAsRead = async () => {
    const { res } = await patch('/notifications/read-all', {});
    if (res.status === 401) {
      navigate('/login', { replace: true });
      return;
    }
    if (res.ok) {
      loadNotifications();
      setUnreadCount(0);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;
  const hasUnread = items.some((n) => !n.read);

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('notifications')}</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{t('notificationsPageDesc')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => { setUnreadOnly(e.target.checked); setPage(1); }}
              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">{t('unreadOnly')}</span>
          </label>
          {hasUnread && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-200 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              {t('markAllAsRead')}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-12 text-center">
          <p className="text-slate-500 dark:text-slate-400">{t('noNotifications')}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li
              key={n.id}
              className={`rounded-xl border p-4 transition-colors ${
                n.read
                  ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600'
                  : 'bg-primary-50/50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-800 dark:text-slate-100">{n.title}</p>
                  {n.body && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{n.body}</p>}
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                    {n.createdAt ? new Date(n.createdAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US') : ''}
                    {n.type && (
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300">
                        {n.type}
                      </span>
                    )}
                  </p>
                </div>
                {!n.read && (
                  <button
                    type="button"
                    onClick={() => handleMarkAsRead(n.id)}
                    className="shrink-0 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {t('markAsRead')}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200"
          >
            {lang === 'ar' ? 'السابق' : 'Previous'}
          </button>
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200"
          >
            {lang === 'ar' ? 'التالي' : 'Next'}
          </button>
        </div>
      )}
    </div>
  );
}
