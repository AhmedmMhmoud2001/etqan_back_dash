import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import { useTranslation } from '../../translations';
import { get, post, patch, del, uploadImage, resolveMediaUrl } from '../../api';
import { IconEdit, IconDelete } from '../../components/ActionIcons';

const emptyForm = {
  title: '',
  titleAr: '',
  titleIt: '',
  description: '',
  descriptionAr: '',
  descriptionIt: '',
  imageUrl: '',
};

export default function AdminBanners() {
  const { lang } = useLang();
  const t = useTranslation(lang);
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modal, setModal] = useState(null); // 'create' | 'edit' | null
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const totalPages = useMemo(() => Math.ceil(total / limit) || 1, [total, limit]);

  const load = async () => {
    setLoading(true);
    setError('');
    const { res, data } = await get(`/banners/admin?page=${page}&limit=${limit}`);
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (!res.ok) { setError(data.message || t('loadError')); setLoading(false); return; }
    const d = data.data || data;
    setItems(d.items || []);
    setTotal(d.total ?? 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, [page]);

  const openCreate = () => {
    setSelected(null);
    setForm(emptyForm);
    setModal('create');
    setError('');
  };

  const openEdit = (b) => {
    setSelected(b);
    setForm({
      title: b.title || '',
      titleAr: b.titleAr || '',
      titleIt: b.titleIt || '',
      description: b.description || '',
      descriptionAr: b.descriptionAr || '',
      descriptionIt: b.descriptionIt || '',
      imageUrl: b.imageUrl || '',
    });
    setModal('edit');
    setError('');
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = {
        title: form.title || null,
        titleAr: form.titleAr || null,
        titleIt: form.titleIt || null,
        description: form.description || null,
        descriptionAr: form.descriptionAr || null,
        descriptionIt: form.descriptionIt || null,
        imageUrl: form.imageUrl,
      };
      const resp = modal === 'create'
        ? await post('/banners/admin', body)
        : await patch(`/banners/admin/${selected.id}`, body);
      if (resp.res.status === 401) { navigate('/login', { replace: true }); return; }
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

  const remove = async (b) => {
    if (!window.confirm(t('confirmDelete') || 'Delete?')) return;
    const { res, data } = await del(`/banners/admin/${b.id}`);
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (!res.ok) { setError(data.message || t('loadError')); return; }
    load();
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('banners')}</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{t('bannersDesc')}</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 shrink-0"
          >
            {t('add')} {t('banners')}
          </button>
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
                  <th className="px-4 py-3 font-medium text-start">{t('image')}</th>
                  <th className="px-4 py-3 font-medium text-start">{t('title')}</th>
                  <th className="px-4 py-3 font-medium text-start">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-600 text-start">
                {items.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3">
                      <img src={resolveMediaUrl(b.imageUrl)} alt="" className="w-16 h-10 object-cover rounded border border-slate-200 dark:border-slate-600" />
                    </td>
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{b.title || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(b)}
                          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title={t('edit')}
                        >
                          <IconEdit />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(b)}
                          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title={t('delete')}
                        >
                          <IconDelete />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">{t('noData')}</td>
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
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 rounded border border-slate-300 dark:border-slate-500 disabled:opacity-50">
                {t('previous')}
              </button>
              <span className="px-3 py-1 text-sm">{page} / {totalPages}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 rounded border border-slate-300 dark:border-slate-500 disabled:opacity-50">
                {t('next')}
              </button>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setModal(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
              {modal === 'create' ? `${t('add')} ${t('banners')}` : `${t('edit')} — ${selected?.title || ''}`}
            </h2>

            <form onSubmit={save} className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('titleEn')}</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('titleAr')}</label>
                  <input
                    type="text"
                    value={form.titleAr}
                    onChange={(e) => setForm((f) => ({ ...f, titleAr: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('titleIt')}</label>
                  <input
                    type="text"
                    value={form.titleIt}
                    onChange={(e) => setForm((f) => ({ ...f, titleIt: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('description')}</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('descriptionAr')}</label>
                  <textarea
                    rows={3}
                    value={form.descriptionAr}
                    onChange={(e) => setForm((f) => ({ ...f, descriptionAr: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('descriptionIt')}</label>
                  <textarea
                    rows={3}
                    value={form.descriptionIt}
                    onChange={(e) => setForm((f) => ({ ...f, descriptionIt: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('image')}</label>
                {form.imageUrl ? (
                  <img src={resolveMediaUrl(form.imageUrl)} alt="" className="w-full max-h-48 object-cover rounded-lg border border-slate-200 dark:border-slate-600 mb-2" />
                ) : null}
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  className="w-full text-sm text-slate-600 dark:text-slate-300 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-100 file:text-primary-700 dark:file:bg-primary-900/50 dark:file:text-primary-300"
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (!file) return;
                    setUploading(true);
                    const { res, data: payload, url } = await uploadImage(file);
                    setUploading(false);
                    if (res.status === 401) { navigate('/login', { replace: true }); return; }
                    if (res.ok && url) {
                      setForm((f) => ({ ...f, imageUrl: url }));
                    } else {
                      setError(payload?.message || t('loadError'));
                    }
                  }}
                />
                <input
                  type="text"
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  className="mt-2 w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2"
                  placeholder="/uploads/..."
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-500">
                  {t('cancel')}
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">
                  {saving ? t('saving') : t('saveBanner')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

