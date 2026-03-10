import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import { useTranslation } from '../../translations';
import { get, post, patch, del, uploadImage } from '../../api';
import { IconEdit, IconDelete } from '../../components/ActionIcons';

export default function AdminExercises() {
  const { lang } = useLang();
  const t = useTranslation(lang);
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form, setForm] = useState({ name: '', nameAr: '', description: '', descriptionAr: '', imageUrl: '', targetMuscles: '', equipmentNeeded: [] });

  const loadExercises = async () => {
    setLoading(true);
    setError('');
    let path = '/exercises?limit=100';
    if (search) path += `&search=${encodeURIComponent(search)}`;
    const { res, data } = await get(path);
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
    setTotal(d.total ?? (d.items || d || []).length);
    setLoading(false);
  };

  useEffect(() => {
    loadExercises();
  }, [search]);

  const openCreate = () => {
    setForm({ name: '', nameAr: '', description: '', descriptionAr: '', imageUrl: '', targetMuscles: '', equipmentNeeded: [] });
    setSelected(null);
    setModal('create');
  };

  const openEdit = (ex) => {
    setSelected(ex);
    const eq = Array.isArray(ex.equipmentNeeded) ? ex.equipmentNeeded : [];
    setForm({
      name: ex.name || '',
      nameAr: ex.nameAr || '',
      description: ex.description || '',
      descriptionAr: ex.descriptionAr || '',
      imageUrl: ex.imageUrl || '',
      targetMuscles: Array.isArray(ex.targetMuscles) ? ex.targetMuscles.join(', ') : (ex.targetMuscles || ''),
      equipmentNeeded: eq.length ? eq : [],
    });
    setModal('edit');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    const body = {
      name: form.name,
      nameAr: form.nameAr || undefined,
      description: form.description || undefined,
      descriptionAr: form.descriptionAr || undefined,
      imageUrl: form.imageUrl || undefined,
      targetMuscles: form.targetMuscles ? form.targetMuscles.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
    };
    const { res, data } = await post('/exercises', body);
    if (res.status === 401) {
      navigate('/login', { replace: true });
      return;
    }
    if (!res.ok) {
      setError(data.message || 'Failed to create');
      return;
    }
    setModal(null);
    loadExercises();
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selected) return;
    const body = {
      name: form.name,
      nameAr: form.nameAr || undefined,
      description: form.description || undefined,
      descriptionAr: form.descriptionAr || undefined,
      imageUrl: form.imageUrl || undefined,
      targetMuscles: form.targetMuscles ? form.targetMuscles.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      equipmentNeeded: Array.isArray(form.equipmentNeeded) && form.equipmentNeeded.filter((eq) => (eq?.name || eq?.nameAr)).length > 0
        ? form.equipmentNeeded.filter((eq) => eq?.name || eq?.nameAr)
        : undefined,
    };
    const { res, data } = await patch(`/exercises/${selected.id}`, body);
    if (res.status === 401) {
      navigate('/login', { replace: true });
      return;
    }
    if (!res.ok) {
      setError(data.message || 'Failed to update');
      return;
    }
    setModal(null);
    loadExercises();
  };

  const handleDelete = async (ex) => {
    if (!window.confirm(t('confirmDelete'))) return;
    const { res } = await del(`/exercises/${ex.id}`);
    if (res.status === 401) {
      navigate('/login', { replace: true });
      return;
    }
    if (res.ok) loadExercises();
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('exercisesTitle')}</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{t('exercisesDesc')}</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <input
            type="text"
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2 text-sm w-40"
          />
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700"
          >
            {t('add')} {t('exercises')}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">{error}</div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">{t('loading')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-sm">
                <tr>
                  <th className="px-4 py-3 font-medium w-14">{lang === 'ar' ? 'الصورة' : 'Image'}</th>
                  <th className="px-4 py-3 font-medium">{t('name')}</th>
                  <th className="px-4 py-3 font-medium">{t('description')}</th>
                  <th className="px-4 py-3 font-medium">{t('equipmentNeeded')}</th>
                  <th className="px-4 py-3 font-medium text-end">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                {items.map((ex) => (
                  <tr key={ex.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3">
                      {ex.imageUrl ? (
                        <img src={ex.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-600" />
                      ) : (
                        <span className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-600 inline-flex items-center justify-center text-slate-400 text-lg shrink-0" title={lang === 'ar' ? 'لا صورة' : 'No image'}>💪</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{ex.name} {ex.nameAr ? `(${ex.nameAr})` : ''}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">{ex.description || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-sm">
                      {Array.isArray(ex.equipmentNeeded) && ex.equipmentNeeded.filter((eq) => eq?.name || eq?.nameAr).length > 0
                        ? ex.equipmentNeeded.filter((eq) => eq?.name || eq?.nameAr).map((eq, i) => (
                            <span key={i} className="inline-block mr-1 mb-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-600 text-xs">
                              {lang === 'ar' ? (eq.nameAr || eq.name) : (eq.name || eq.nameAr)}
                            </span>
                          ))
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <div className="flex gap-1 justify-end items-center">
                        <button type="button" onClick={() => openEdit(ex)} className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title={t('edit')} aria-label={t('edit')}><IconEdit /></button>
                        <button type="button" onClick={() => handleDelete(ex)} className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title={t('delete')} aria-label={t('delete')}><IconDelete /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-400">{t('total')}: {total}</div>}
      </div>

      {modal === 'create' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setModal(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">{t('add')} {t('exercises')}</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('nameEn')}</label>
                <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('nameAr')}</label>
                <input type="text" value={form.nameAr} onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" dir="rtl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('description')} (EN)</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('descriptionAr')}</label>
                <textarea value={form.descriptionAr} onChange={(e) => setForm((f) => ({ ...f, descriptionAr: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" rows={2} dir="rtl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('imageUrl')}</label>
                {form.imageUrl && <img src={form.imageUrl} alt="" className="w-20 h-20 object-cover rounded-lg mb-2" />}
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  className="w-full text-sm text-slate-600 dark:text-slate-300 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-primary-100 file:text-primary-700 dark:file:bg-primary-900/50 dark:file:text-primary-300"
                  disabled={uploadingImage}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (!file) return;
                    setUploadingImage(true);
                    const { res, url } = await uploadImage(file);
                    setUploadingImage(false);
                    if (res.status === 401) { navigate('/login', { replace: true }); return; }
                    if (res.ok && url) setForm((f) => ({ ...f, imageUrl: url }));
                  }}
                />
                {uploadingImage && <p className="text-xs text-slate-500 mt-1">{lang === 'ar' ? 'جاري الرفع...' : 'Uploading...'}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target muscles (comma separated)</label>
                <input type="text" value={form.targetMuscles} onChange={(e) => setForm((f) => ({ ...f, targetMuscles: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" placeholder="Chest, Triceps" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('equipmentNeededTitle')}</label>
                {Array.isArray(form.equipmentNeeded) && form.equipmentNeeded.map((eq, idx) => (
                  <div key={idx} className="flex flex-col gap-2 mb-2 border rounded-lg p-2 border-slate-200 dark:border-slate-600">
                    <div className="flex gap-2">
                      <input type="text" placeholder={t('nameEn')} value={eq?.name || ''} onChange={(e) => setForm((f) => { const next = [...(f.equipmentNeeded || [])]; next[idx] = { ...next[idx], name: e.target.value }; return { ...f, equipmentNeeded: next }; })} className="flex-1 rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-1 text-sm" />
                      <input type="text" placeholder={t('nameAr')} dir="rtl" value={eq?.nameAr || ''} onChange={(e) => setForm((f) => { const next = [...(f.equipmentNeeded || [])]; next[idx] = { ...next[idx], nameAr: e.target.value }; return { ...f, equipmentNeeded: next }; })} className="flex-1 rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-1 text-sm" />
                    </div>
                    <button type="button" onClick={() => setForm((f) => ({ ...f, equipmentNeeded: (f.equipmentNeeded || []).filter((_, i) => i !== idx) }))} className="self-end text-xs text-red-600 dark:text-red-300">{t('delete')}</button>
                  </div>
                ))}
                <button type="button" onClick={() => setForm((f) => ({ ...f, equipmentNeeded: [...(f.equipmentNeeded || []), { name: '', nameAr: '' }] }))} className="mt-1 text-sm text-primary-600 dark:text-primary-300">+ {t('addEquipment')}</button>
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
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">{t('edit')} {t('exercises')}</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('nameEn')}</label>
                <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('nameAr')}</label>
                <input type="text" value={form.nameAr} onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" dir="rtl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('description')} (EN)</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('descriptionAr')}</label>
                <textarea value={form.descriptionAr} onChange={(e) => setForm((f) => ({ ...f, descriptionAr: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" rows={2} dir="rtl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('imageUrl')}</label>
                {form.imageUrl && <img src={form.imageUrl} alt="" className="w-20 h-20 object-cover rounded-lg mb-2" />}
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  className="w-full text-sm text-slate-600 dark:text-slate-300 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-primary-100 file:text-primary-700 dark:file:bg-primary-900/50 dark:file:text-primary-300"
                  disabled={uploadingImage}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (!file) return;
                    setUploadingImage(true);
                    const { res, url } = await uploadImage(file);
                    setUploadingImage(false);
                    if (res.status === 401) { navigate('/login', { replace: true }); return; }
                    if (res.ok && url) setForm((f) => ({ ...f, imageUrl: url }));
                  }}
                />
                {uploadingImage && <p className="text-xs text-slate-500 mt-1">{lang === 'ar' ? 'جاري الرفع...' : 'Uploading...'}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target muscles (comma separated)</label>
                <input type="text" value={form.targetMuscles} onChange={(e) => setForm((f) => ({ ...f, targetMuscles: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('equipmentNeededTitle')}</label>
                {Array.isArray(form.equipmentNeeded) && form.equipmentNeeded.map((eq, idx) => (
                  <div key={idx} className="flex flex-col gap-2 mb-2 border rounded-lg p-2 border-slate-200 dark:border-slate-600">
                    <div className="flex gap-2">
                      <input type="text" placeholder={t('nameEn')} value={eq?.name || ''} onChange={(e) => setForm((f) => { const next = [...(f.equipmentNeeded || [])]; next[idx] = { ...next[idx], name: e.target.value }; return { ...f, equipmentNeeded: next }; })} className="flex-1 rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-1 text-sm" />
                      <input type="text" placeholder={t('nameAr')} dir="rtl" value={eq?.nameAr || ''} onChange={(e) => setForm((f) => { const next = [...(f.equipmentNeeded || [])]; next[idx] = { ...next[idx], nameAr: e.target.value }; return { ...f, equipmentNeeded: next }; })} className="flex-1 rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-1 text-sm" />
                    </div>
                    <button type="button" onClick={() => setForm((f) => ({ ...f, equipmentNeeded: (f.equipmentNeeded || []).filter((_, i) => i !== idx) }))} className="self-end text-xs text-red-600 dark:text-red-300">{t('delete')}</button>
                  </div>
                ))}
                <button type="button" onClick={() => setForm((f) => ({ ...f, equipmentNeeded: [...(f.equipmentNeeded || []), { name: '', nameAr: '' }] }))} className="mt-1 text-sm text-primary-600 dark:text-primary-300">+ {t('addEquipment')}</button>
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
