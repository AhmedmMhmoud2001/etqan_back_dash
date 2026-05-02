import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import { useTranslation } from '../../translations';
import { get, post, patch } from '../../api';
import { IconEdit } from '../../components/ActionIcons';

const defaultForm = {
  name: '',
  durationMonths: 1,
  listPrice: '',
  payPrice: '',
  currency: 'EGP',
  isActive: true,
};

export default function AdminPackages() {
  const { lang } = useLang();
  const t = useTranslation(lang);
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [activeOnly, setActiveOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modal, setModal] = useState(null); // 'create' | 'edit' | null
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const totalPages = useMemo(() => Math.ceil(total / limit) || 1, [total, limit]);

  const load = async () => {
    setLoading(true);
    setError('');
    let url = `/admin/packages?page=${page}&limit=${limit}`;
    if (activeOnly) url += '&activeOnly=true';
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
  }, [page, activeOnly]);

  const openCreate = () => {
    setSelected(null);
    setForm(defaultForm);
    setModal('create');
    setError('');
  };

  const openEdit = (pkg) => {
    setSelected(pkg);
    setForm({
      name: pkg.name || '',
      durationMonths: pkg.durationMonths || 1,
      listPrice: String(pkg.listPrice ?? ''),
      payPrice: String(pkg.payPrice ?? ''),
      currency: pkg.currency || 'EGP',
      isActive: pkg.isActive !== false,
    });
    setModal('edit');
    setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = {
        name: form.name,
        durationMonths: Number(form.durationMonths),
        listPrice: form.listPrice,
        payPrice: form.payPrice,
        currency: form.currency,
        isActive: form.isActive,
      };

      const resp = modal === 'create'
        ? await post('/admin/packages', body)
        : await patch(`/admin/packages/${selected.id}`, body);

      if (resp.res.status === 401) {
        navigate('/login', { replace: true });
        return;
      }
      if (!resp.res.ok) throw new Error(resp.data.message || t('saveError'));
      setModal(null);
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('packages')}</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{t('packagesDesc')}</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 shrink-0"
          >
            {t('add')} {t('packages')}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => { setActiveOnly(e.target.checked); setPage(1); }}
              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">{t('activeOnly')}</span>
          </label>
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
                  <th className="px-4 py-3 font-medium text-start">{t('duration')}</th>
                  <th className="px-4 py-3 font-medium text-start">{t('listPrice')}</th>
                  <th className="px-4 py-3 font-medium text-start">{t('payPrice')}</th>
                  <th className="px-4 py-3 font-medium text-start">{t('currency')}</th>
                  <th className="px-4 py-3 font-medium text-start">{t('status')}</th>
                  <th className="px-4 py-3 font-medium text-start">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-600 text-start">
                {items.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{p.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {p.durationMonths} {t('months')}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{p.listPrice}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{p.payPrice}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{p.currency}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        p.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200'
                      }`}>
                        {p.isActive ? t('active') : t('inactive')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
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
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">
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

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setModal(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
              {modal === 'create' ? `${t('add')} ${t('packages')}` : `${t('edit')} — ${selected?.name || ''}`}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('name')}</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('durationMonths')}</label>
                  <select
                    value={form.durationMonths}
                    onChange={(e) => setForm((f) => ({ ...f, durationMonths: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2"
                  >
                    {[1, 3, 6, 12].map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('currency')}</label>
                  <input
                    type="text"
                    value={form.currency}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('listPrice')}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.listPrice}
                    onChange={(e) => setForm((f) => ({ ...f, listPrice: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('payPrice')}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.payPrice}
                    onChange={(e) => setForm((f) => ({ ...f, payPrice: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2"
                    required
                  />
                </div>
              </div>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="rounded border-slate-300 text-primary-600"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">{t('active')}</span>
              </label>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-500">
                  {t('cancel')}
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">
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

