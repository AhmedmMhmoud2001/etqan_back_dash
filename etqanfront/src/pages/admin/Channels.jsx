import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import { useTranslation } from '../../translations';
import { get, post, patch, del } from '../../api';
import { IconEdit, IconDelete } from '../../components/ActionIcons';

export default function AdminChannels() {
  const { lang } = useLang();
  const t = useTranslation(lang);
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', nameAr: '', nameIt: '', description: '', descriptionAr: '', descriptionIt: '', icon: '' });

  const loadChannels = async () => {
    setLoading(true);
    setError('');
    const { res, data } = await get(`/channels?page=${page}&limit=${limit}`);
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
    setItems(d.items || d.channels || d || []);
    setTotal(d.total ?? (d.items || d.channels || d || []).length);
    setLoading(false);
  };

  useEffect(() => {
    loadChannels();
  }, [page]);

  const openCreate = () => {
    setForm({ name: '', nameAr: '', nameIt: '', description: '', descriptionAr: '', descriptionIt: '', icon: '' });
    setSelected(null);
    setModal('create');
  };

  const openEdit = (ch) => {
    setSelected(ch);
    setForm({
      name: ch.name || '',
      nameAr: ch.nameAr || '',
      nameIt: ch.nameIt || '',
      description: ch.description || '',
      descriptionAr: ch.descriptionAr || '',
      descriptionIt: ch.descriptionIt || '',
      icon: ch.icon || '',
    });
    setModal('edit');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    const { res, data } = await post('/admin/channels', {
      name: form.name,
      nameAr: form.nameAr || undefined,
      nameIt: form.nameIt || undefined,
      description: form.description || undefined,
      descriptionAr: form.descriptionAr || undefined,
      descriptionIt: form.descriptionIt || undefined,
      icon: form.icon || undefined,
    });
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (!res.ok) { setError(data.message || 'Failed'); return; }
    setModal(null);
    loadChannels();
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selected) return;
    const { res, data } = await patch(`/admin/channels/${selected.id}`, {
      name: form.name,
      nameAr: form.nameAr || undefined,
      nameIt: form.nameIt || undefined,
      description: form.description || undefined,
      descriptionAr: form.descriptionAr || undefined,
      descriptionIt: form.descriptionIt || undefined,
      icon: form.icon || undefined,
    });
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (!res.ok) { setError(data.message || 'Failed'); return; }
    setModal(null);
    loadChannels();
  };

  const handleDelete = async (ch) => {
    if (!window.confirm(t('confirmDelete'))) return;
    const { res } = await del(`/admin/channels/${ch.id}`);
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (res.ok) loadChannels();
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('channelsTitle')}</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{t('channelsDesc')}</p>
        </div>
        <button type="button" onClick={openCreate} className="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700">{t('add')} {t('channels')}</button>
      </div>
      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">{error}</div>}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm overflow-hidden">
        {loading ? <div className="p-8 text-center text-slate-500 dark:text-slate-400">{t('loading')}</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-sm text-start">
                <tr>
                  <th className="px-4 py-3 font-medium text-start">{t('name')}</th>
                  <th className="px-4 py-3 font-medium text-start">{t('channelDescription')}</th>
                  <th className="px-4 py-3 font-medium text-end">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-600 text-start">
                {items.map((ch) => (
                  <tr key={ch.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-start text-slate-800 dark:text-slate-200">
                      {lang === 'ar' ? (ch.nameAr || ch.nameIt || ch.name) : lang === 'it' ? (ch.nameIt || ch.name || ch.nameAr) : (ch.name || ch.nameAr || ch.nameIt)}
                    </td>
                    <td className="px-4 py-3 text-start text-slate-600 dark:text-slate-300 max-w-md truncate">
                      {lang === 'ar' ? (ch.descriptionAr || ch.descriptionIt || ch.description || '—') : lang === 'it' ? (ch.descriptionIt || ch.description || ch.descriptionAr || '—') : (ch.description || ch.descriptionAr || ch.descriptionIt || '—')}
                    </td>
                    <td className="px-4 py-3 text-start">
                      <div className="flex gap-1 justify-end items-center flex-wrap">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/channels/${ch.id}/chat`)}
                          className="p-2 rounded-lg text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors"
                          title={t('channelsOpenChat')}
                          aria-label={t('channelsOpenChat')}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </button>
                        <button type="button" onClick={() => openEdit(ch)} className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title={t('edit')} aria-label={t('edit')}><IconEdit /></button>
                        <button type="button" onClick={() => handleDelete(ch)} className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title={t('delete')} aria-label={t('delete')}><IconDelete /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && total > limit && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-600 flex justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">{t('total')}: {total}</p>
            <div className="flex gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 rounded border border-slate-300 dark:border-slate-500 disabled:opacity-50">{t('previous')}</button>
              <span className="px-3 py-1 text-sm">{page} / {totalPages}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 rounded border border-slate-300 dark:border-slate-500 disabled:opacity-50">{t('next')}</button>
            </div>
          </div>
        )}
      </div>
      {modal === 'create' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setModal(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">{t('add')} {t('channels')}</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('nameEn')}</label><input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" required placeholder="e.g. Fitness Tips" /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('nameAr')}</label><input type="text" value={form.nameAr} onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" placeholder="مثل: نصائح لياقة" dir="rtl" /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('nameIt')}</label><input type="text" value={form.nameIt} onChange={(e) => setForm((f) => ({ ...f, nameIt: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" placeholder="es. Consigli fitness" /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('channelDescription')} (EN)</label><textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" rows={2} /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('descriptionAr')}</label><textarea value={form.descriptionAr} onChange={(e) => setForm((f) => ({ ...f, descriptionAr: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" rows={2} dir="rtl" /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('descriptionIt')}</label><textarea value={form.descriptionIt} onChange={(e) => setForm((f) => ({ ...f, descriptionIt: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" rows={2} /></div>
              <div className="flex gap-2 justify-end pt-2"><button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-500">{t('cancel')}</button><button type="submit" className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">{t('save')}</button></div>
            </form>
          </div>
        </div>
      )}
      {modal === 'edit' && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setModal(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">{t('edit')} {t('channels')}</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('nameEn')}</label><input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" required /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('nameAr')}</label><input type="text" value={form.nameAr} onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" dir="rtl" /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('nameIt')}</label><input type="text" value={form.nameIt} onChange={(e) => setForm((f) => ({ ...f, nameIt: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('channelDescription')} (EN)</label><textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" rows={2} /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('descriptionAr')}</label><textarea value={form.descriptionAr} onChange={(e) => setForm((f) => ({ ...f, descriptionAr: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" rows={2} dir="rtl" /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('descriptionIt')}</label><textarea value={form.descriptionIt} onChange={(e) => setForm((f) => ({ ...f, descriptionIt: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" rows={2} /></div>
              <div className="flex gap-2 justify-end pt-2"><button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-500">{t('cancel')}</button><button type="submit" className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">{t('save')}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
