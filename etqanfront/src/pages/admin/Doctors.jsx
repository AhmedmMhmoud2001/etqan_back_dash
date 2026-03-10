import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import { useTranslation } from '../../translations';
import { get, post, patch, del } from '../../api';
import { IconEdit, IconDelete } from '../../components/ActionIcons';

export default function AdminDoctors() {
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
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    title: '',
    titleAr: '',
    specialization: '',
    specializationAr: '',
    bio: '',
    bioAr: '',
  });

  const loadDoctors = async () => {
    setLoading(true);
    setError('');
    const { res, data } = await get(`/admin/doctors?page=${page}&limit=${limit}`);
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
    setItems(d.items || d || []);
    setTotal(d.total ?? (Array.isArray(d) ? d.length : 0));
    setLoading(false);
  };

  useEffect(() => {
    loadDoctors();
  }, [page]);

  const openCreate = () => {
    setForm({ name: '', email: '', password: '', title: '', specialization: '', bio: '' });
    setSelected(null);
    setModal('create');
  };

  const openEdit = (doc) => {
    setSelected(doc);
    setForm({
      name: doc.user?.name || '',
      email: doc.user?.email || '',
      password: '',
      title: doc.title || '',
      specialization: doc.specialization || '',
      bio: doc.bio || '',
    });
    setModal('edit');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return;
    const { res, data } = await post('/admin/doctors', {
      name: form.name,
      email: form.email,
      password: form.password,
      title: form.title || undefined,
      titleAr: form.titleAr || undefined,
      specialization: form.specialization || undefined,
      specializationAr: form.specializationAr || undefined,
      bio: form.bio || undefined,
      bioAr: form.bioAr || undefined,
    });
    if (res.status === 401) {
      navigate('/login', { replace: true });
      return;
    }
    if (!res.ok) {
      setError(data.message || 'Failed to create');
      return;
    }
    setModal(null);
    loadDoctors();
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selected) return;
    const body = {
      name: form.name,
      email: form.email,
      title: form.title || undefined,
      titleAr: form.titleAr || undefined,
      specialization: form.specialization || undefined,
      specializationAr: form.specializationAr || undefined,
      bio: form.bio || undefined,
      bioAr: form.bioAr || undefined,
    };
    if (form.password) body.password = form.password;
    const { res, data } = await patch(`/admin/doctors/${selected.id}`, body);
    if (res.status === 401) {
      navigate('/login', { replace: true });
      return;
    }
    if (!res.ok) {
      setError(data.message || 'Failed to update');
      return;
    }
    setModal(null);
    loadDoctors();
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(t('confirmDelete'))) return;
    const { res } = await del(`/admin/doctors/${doc.id}`);
    if (res.status === 401) {
      navigate('/login', { replace: true });
      return;
    }
    if (res.ok) loadDoctors();
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('doctorsTitle')}</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{t('doctorsDesc')}</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700"
        >
          {t('add')} {t('doctors')}
        </button>
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
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-sm">
                <tr>
                  <th className="px-4 py-3 font-medium">{t('name')}</th>
                  <th className="px-4 py-3 font-medium">{t('email')}</th>
                  <th className="px-4 py-3 font-medium">{t('title')}</th>
                  <th className="px-4 py-3 font-medium">{t('specialization')}</th>
                  <th className="px-4 py-3 font-medium text-end">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                {items.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{doc.user?.name || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{doc.user?.email || '—'}</td>
                    <td className="px-4 py-3">{doc.title || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{doc.specialization || '—'}</td>
                    <td className="px-4 py-3 text-end">
                      <div className="flex gap-1 justify-end items-center">
                        <button type="button" onClick={() => openEdit(doc)} className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title={t('edit')} aria-label={t('edit')}><IconEdit /></button>
                        <button type="button" onClick={() => handleDelete(doc)} className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title={t('delete')} aria-label={t('delete')}><IconDelete /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && total > limit && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-600 flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">{t('total')}: {total}</p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 rounded border border-slate-300 dark:border-slate-500 disabled:opacity-50"
              >
                {t('previous')}
              </button>
              <span className="px-3 py-1 text-sm">{page} / {totalPages}</span>
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

      {modal === 'create' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setModal(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">{t('add')} {t('doctors')}</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('name')}</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('email')}</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('password')}</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2"
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('titleEn')}</label>
                <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" placeholder="e.g. Fitness Coach" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('titleAr')}</label>
                <input type="text" value={form.titleAr} onChange={(e) => setForm((f) => ({ ...f, titleAr: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" placeholder="مثل: مدرب لياقة" dir="rtl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('specialization')}</label>
                <input type="text" value={form.specialization} onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" placeholder="e.g. Nutrition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('specializationAr')}</label>
                <input type="text" value={form.specializationAr} onChange={(e) => setForm((f) => ({ ...f, specializationAr: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" placeholder="مثل: تغذية" dir="rtl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('description')} (EN)</label>
                <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('descriptionAr')}</label>
                <textarea value={form.bioAr} onChange={(e) => setForm((f) => ({ ...f, bioAr: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" rows={2} dir="rtl" />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-500">{t('cancel')}</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">{t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === 'edit' && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setModal(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">{t('edit')} {t('doctors')}</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('name')}</label>
                <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('email')}</label>
                <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('password')} (optional)</label>
                <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" minLength={8} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('titleEn')}</label>
                <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('titleAr')}</label>
                <input type="text" value={form.titleAr} onChange={(e) => setForm((f) => ({ ...f, titleAr: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" dir="rtl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('specialization')}</label>
                <input type="text" value={form.specialization} onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('specializationAr')}</label>
                <input type="text" value={form.specializationAr} onChange={(e) => setForm((f) => ({ ...f, specializationAr: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" dir="rtl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('description')} (EN)</label>
                <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('descriptionAr')}</label>
                <textarea value={form.bioAr} onChange={(e) => setForm((f) => ({ ...f, bioAr: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" rows={2} dir="rtl" />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-500">{t('cancel')}</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">{t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
