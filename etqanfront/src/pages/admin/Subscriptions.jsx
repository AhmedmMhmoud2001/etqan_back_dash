import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import { useTranslation } from '../../translations';
import { get, patch } from '../../api';
import { IconEdit } from '../../components/ActionIcons';

export default function AdminSubscriptions() {
  const { lang } = useLang();
  const t = useTranslation(lang);
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [planFilter, setPlanFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ plan: 'FREE', endsAt: '' });
  const [saving, setSaving] = useState(false);

  const totalPages = useMemo(() => Math.ceil(total / limit) || 1, [total, limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = async () => {
    setLoading(true);
    setError('');
    let url = `/admin/subscriptions?page=${page}&limit=${limit}`;
    if (planFilter) url += `&plan=${encodeURIComponent(planFilter)}`;
    if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
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

  useEffect(() => {
    load();
  }, [page, planFilter, searchQuery]);

  const openEdit = (row) => {
    setSelected(row);
    setForm({
      plan: row.plan || 'FREE',
      endsAt: row.endsAt ? new Date(row.endsAt).toISOString().slice(0, 16) : '',
    });
    setModalOpen(true);
    setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      const body = {
        plan: form.plan,
        endsAt: form.plan === 'PREMIUM' ? new Date(form.endsAt).toISOString() : null,
      };
      const { res, data } = await patch(`/admin/subscriptions/${selected.userId}`, body);
      if (res.status === 401) {
        navigate('/login', { replace: true });
        return;
      }
      if (!res.ok) throw new Error(data.message || t('saveError'));
      setModalOpen(false);
      setSelected(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('subscriptions')}</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{t('subscriptionsDesc')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={planFilter}
            onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm min-w-[170px]"
            title={t('plan')}
          >
            <option value="">{t('all')} ({t('plan')})</option>
            <option value="FREE">FREE</option>
            <option value="PREMIUM">PREMIUM</option>
          </select>
          <input
            type="text"
            placeholder={t('searchByNameOrEmail')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm w-64 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          {(planFilter || searchQuery) && (
            <button
              type="button"
              onClick={() => { setPlanFilter(''); setSearchInput(''); setSearchQuery(''); setPage(1); }}
              className="text-sm text-slate-600 dark:text-slate-300 hover:underline"
            >
              {t('clearFilters')}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">{t('loading')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-sm text-start">
                <tr>
                  <th className="px-4 py-3 font-medium text-start">{t('name')}</th>
                  <th className="px-4 py-3 font-medium text-start">{t('email')}</th>
                  <th className="px-4 py-3 font-medium text-start">{t('plan')}</th>
                  <th className="px-4 py-3 font-medium text-start">{t('endsAt')}</th>
                  <th className="px-4 py-3 font-medium text-start">{t('discountPercentToApply')}</th>
                  <th className="px-4 py-3 font-medium text-start">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-600 text-start">
                {items.map((row) => (
                  <tr key={row.userId} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{row.user?.name || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 break-all">{row.user?.email || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        row.plan === 'PREMIUM'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200'
                      }`}>
                        {row.plan || 'FREE'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {row.endsAt ? new Date(row.endsAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US') : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {row.discountPercentToApply ?? 0}%
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title={t('edit')}
                        aria-label={t('edit')}
                      >
                        <IconEdit />
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">
                      {t('noData')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && total > limit && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-600 flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t('total')}: {total}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 rounded border border-slate-300 dark:border-slate-500 disabled:opacity-50"
              >
                {t('previous')}
              </button>
              <span className="px-3 py-1 text-sm">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded border border-slate-300 dark:border-slate-500 disabled:opacity-50"
              >
                {t('next')}
              </button>
            </div>
          </div>
        )}
      </div>

      {modalOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setModalOpen(false)}>
          <div
            className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
              {t('edit')} — {selected.user?.name || selected.userId}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('plan')}</label>
                <select
                  value={form.plan}
                  onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2"
                >
                  <option value="FREE">FREE</option>
                  <option value="PREMIUM">PREMIUM</option>
                </select>
              </div>
              {form.plan === 'PREMIUM' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('endsAt')}</label>
                  <input
                    type="datetime-local"
                    value={form.endsAt}
                    onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2"
                    required
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('endsAtHint')}</p>
                </div>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-500"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving ? t('saving') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

