import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import { useTranslation } from '../../translations';
import { get, post, patch, del, uploadImage } from '../../api';
import { IconEdit, IconDelete } from '../../components/ActionIcons';

const MEAL_TYPES = ['BREAKFAST', 'SNACK', 'LUNCH', 'DINNER'];

export default function AdminMeals() {
  const { lang } = useLang();
  const t = useTranslation(lang);
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [mealTypeFilter, setMealTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form, setForm] = useState({
    name: '',
    nameAr: '',
    mealType: 'LUNCH',
    calories: 0,
    proteinG: 0,
    carbsG: 0,
    fatsG: 0,
    prepTimeMinutes: 0,
    imageUrl: '',
    ingredients: [],
  });

  const loadMeals = async () => {
    setLoading(true);
    setError('');
    let path = `/meals?page=${page}&limit=${limit}`;
    if (mealTypeFilter) path += `&mealType=${mealTypeFilter}`;
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
    setTotal(d.total ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    loadMeals();
  }, [page, mealTypeFilter]);

  const openCreate = () => {
    setForm({
      name: '',
      nameAr: '',
      mealType: 'LUNCH',
      calories: 0,
      proteinG: 0,
      carbsG: 0,
      fatsG: 0,
      prepTimeMinutes: 0,
      imageUrl: '',
      ingredients: [{ name: '', quantity: '', unit: 'g', order: 0 }],
    });
    setSelected(null);
    setModal('create');
  };

  const openEdit = (meal) => {
    setSelected(meal);
    const ings = (meal.ingredients || []).map((ing) => ({ name: ing.name || '', quantity: ing.quantity ?? '', unit: ing.unit ?? 'g', order: ing.order ?? 0 }));
    setForm({
      name: meal.name || '',
      nameAr: meal.nameAr || '',
      mealType: meal.mealType || 'LUNCH',
      calories: meal.calories ?? 0,
      proteinG: meal.proteinG ?? 0,
      carbsG: meal.carbsG ?? 0,
      fatsG: meal.fatsG ?? 0,
      prepTimeMinutes: meal.prepTimeMinutes ?? 0,
      imageUrl: meal.imageUrl || '',
      ingredients: ings.length ? ings : [{ name: '', quantity: '', unit: 'g', order: 0 }],
    });
    setModal('edit');
  };

  const addIngredient = () => {
    setForm((f) => ({ ...f, ingredients: [...(f.ingredients || []), { name: '', quantity: '', unit: 'g', order: (f.ingredients?.length ?? 0) }] }));
  };

  const updateIngredient = (index, field, value) => {
    setForm((f) => {
      const list = [...(f.ingredients || [])];
      if (!list[index]) return f;
      list[index] = { ...list[index], [field]: value };
      return { ...f, ingredients: list };
    });
  };

  const removeIngredient = (index) => {
    setForm((f) => ({ ...f, ingredients: (f.ingredients || []).filter((_, i) => i !== index) }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    const body = {
      name: form.name,
      nameAr: form.nameAr || undefined,
      mealType: form.mealType,
      calories: Number(form.calories) || 0,
      proteinG: Number(form.proteinG) || 0,
      carbsG: Number(form.carbsG) || 0,
      fatsG: Number(form.fatsG) || 0,
      prepTimeMinutes: Number(form.prepTimeMinutes) || 0,
      ingredients: (form.ingredients || []).filter((ing) => (ing.name || '').trim()).map((ing, i) => ({ name: (ing.name || '').trim(), quantity: String(ing.quantity ?? ''), unit: (ing.unit || 'g').trim() || 'g', order: i })),
    };
    if (form.imageUrl) body.imageUrl = form.imageUrl;
    const { res, data } = await post('/meals', body);
    if (res.status === 401) {
      navigate('/login', { replace: true });
      return;
    }
    if (!res.ok) {
      setError(data.message || 'Failed to create');
      return;
    }
    setModal(null);
    loadMeals();
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selected) return;
    const body = {
      name: form.name,
      nameAr: form.nameAr || undefined,
      mealType: form.mealType,
      calories: Number(form.calories) || 0,
      proteinG: Number(form.proteinG) || 0,
      carbsG: Number(form.carbsG) || 0,
      fatsG: Number(form.fatsG) || 0,
      prepTimeMinutes: Number(form.prepTimeMinutes) || 0,
      ingredients: (form.ingredients || []).filter((ing) => (ing.name || '').trim()).map((ing, i) => ({ name: (ing.name || '').trim(), quantity: String(ing.quantity ?? ''), unit: (ing.unit || 'g').trim() || 'g', order: i })),
    };
    if (form.imageUrl) body.imageUrl = form.imageUrl;
    const { res, data } = await patch(`/meals/${selected.id}`, body);
    if (res.status === 401) {
      navigate('/login', { replace: true });
      return;
    }
    if (!res.ok) {
      setError(data.message || 'Failed to update');
      return;
    }
    setModal(null);
    loadMeals();
  };

  const handleDelete = async (meal) => {
    if (!window.confirm(t('confirmDelete'))) return;
    const { res } = await del(`/meals/${meal.id}`);
    if (res.status === 401) {
      navigate('/login', { replace: true });
      return;
    }
    if (res.ok) loadMeals();
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('mealsTitle')}</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{t('mealsDesc')}</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <select
            value={mealTypeFilter}
            onChange={(e) => { setMealTypeFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2 text-sm"
          >
            <option value="">{t('all')} {t('meals')}</option>
            {MEAL_TYPES.map((type) => (
              <option key={type} value={type}>{t('mealType' + type.charAt(0) + type.slice(1).toLowerCase())}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700"
          >
            {t('add')} {t('meals')}
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
                  <th className="px-4 py-3 font-medium">{t('name')}</th>
                  <th className="px-4 py-3 font-medium">{t('mealType')}</th>
                  <th className="px-4 py-3 font-medium">{t('calories')}</th>
                  <th className="px-4 py-3 font-medium">{t('proteinG')}</th>
                  <th className="px-4 py-3 font-medium">{t('ingredients')}</th>
                  <th className="px-4 py-3 font-medium">{t('prepTimeMinutes')}</th>
                  <th className="px-4 py-3 font-medium text-end">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                {items.map((meal) => (
                  <tr key={meal.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{meal.name}</td>
                    <td className="px-4 py-3">{t('mealType' + (meal.mealType || '').charAt(0) + (meal.mealType || '').slice(1).toLowerCase())}</td>
                    <td className="px-4 py-3">{meal.calories ?? 0}</td>
                    <td className="px-4 py-3">{meal.proteinG ?? 0}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-sm">
                      {meal.ingredients?.length ? (
                        <span title={(meal.ingredients || []).map((i) => `${i.name}: ${i.quantity}${i.unit}`).join(', ')}>
                          {(meal.ingredients || []).map((i) => i.name).join(', ').slice(0, 40)}{(meal.ingredients?.length && meal.ingredients.map((i) => i.name).join(', ').length > 40) ? '…' : ''}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">{meal.prepTimeMinutes ?? 0} min</td>
                    <td className="px-4 py-3 text-end">
                      <div className="flex gap-1 justify-end items-center">
                        <button type="button" onClick={() => openEdit(meal)} className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title={t('edit')} aria-label={t('edit')}><IconEdit /></button>
                        <button type="button" onClick={() => handleDelete(meal)} className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title={t('delete')} aria-label={t('delete')}><IconDelete /></button>
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
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">{t('add')} {t('meals')}</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('nameEn')}</label>
                <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" required placeholder="e.g. Grilled Chicken" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('nameAr')}</label>
                <input type="text" value={form.nameAr} onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" placeholder="مثل: دجاج مشوي" dir="rtl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('mealType')}</label>
                <select value={form.mealType} onChange={(e) => setForm((f) => ({ ...f, mealType: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2">
                  {MEAL_TYPES.map((type) => <option key={type} value={type}>{t('mealType' + type.charAt(0) + type.slice(1).toLowerCase())}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('calories')}</label>
                  <input type="number" min={0} value={form.calories} onChange={(e) => setForm((f) => ({ ...f, calories: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('proteinG')}</label>
                  <input type="number" min={0} value={form.proteinG} onChange={(e) => setForm((f) => ({ ...f, proteinG: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('carbsG')}</label>
                  <input type="number" min={0} value={form.carbsG} onChange={(e) => setForm((f) => ({ ...f, carbsG: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('fatsG')}</label>
                  <input type="number" min={0} value={form.fatsG} onChange={(e) => setForm((f) => ({ ...f, fatsG: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('prepTimeMinutes')}</label>
                <input type="number" min={0} value={form.prepTimeMinutes} onChange={(e) => setForm((f) => ({ ...f, prepTimeMinutes: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" />
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
                    const { res, data, url } = await uploadImage(file);
                    setUploadingImage(false);
                    if (res.status === 401) { navigate('/login', { replace: true }); return; }
                    if (res.ok && url) setForm((f) => ({ ...f, imageUrl: url }));
                  }}
                />
                {uploadingImage && <p className="text-xs text-slate-500 mt-1">{lang === 'ar' ? 'جاري الرفع...' : 'Uploading...'}</p>}
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('ingredients')}</label>
                  <button type="button" onClick={addIngredient} className="text-sm px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800/50">
                    + {t('addIngredient')}
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(form.ingredients || []).map((ing, i) => (
                    <div key={i} className="flex gap-2 items-center flex-wrap">
                      <input type="text" value={ing.name} onChange={(e) => updateIngredient(i, 'name', e.target.value)} placeholder={lang === 'ar' ? 'المكون' : 'Ingredient'} className="flex-1 min-w-[100px] rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-2 py-1.5 text-sm" />
                      <input type="text" value={ing.quantity} onChange={(e) => updateIngredient(i, 'quantity', e.target.value)} placeholder={t('quantity')} className="w-20 rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-2 py-1.5 text-sm" />
                      <input type="text" value={ing.unit} onChange={(e) => updateIngredient(i, 'unit', e.target.value)} placeholder={t('unit')} className="w-16 rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-2 py-1.5 text-sm" title="e.g. g, tbsp, pcs" />
                      <button type="button" onClick={() => removeIngredient(i)} className="p-1.5 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" title={t('delete')} aria-label={t('delete')}>×</button>
                    </div>
                  ))}
                </div>
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
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">{t('edit')} {t('meals')}</h2>
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
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('mealType')}</label>
                <select value={form.mealType} onChange={(e) => setForm((f) => ({ ...f, mealType: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2">
                  {MEAL_TYPES.map((type) => <option key={type} value={type}>{t('mealType' + type.charAt(0) + type.slice(1).toLowerCase())}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('calories')}</label><input type="number" min={0} value={form.calories} onChange={(e) => setForm((f) => ({ ...f, calories: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('proteinG')}</label><input type="number" min={0} value={form.proteinG} onChange={(e) => setForm((f) => ({ ...f, proteinG: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('carbsG')}</label><input type="number" min={0} value={form.carbsG} onChange={(e) => setForm((f) => ({ ...f, carbsG: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" /></div>
                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('fatsG')}</label><input type="number" min={0} value={form.fatsG} onChange={(e) => setForm((f) => ({ ...f, fatsG: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" /></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('prepTimeMinutes')}</label>
                <input type="number" min={0} value={form.prepTimeMinutes} onChange={(e) => setForm((f) => ({ ...f, prepTimeMinutes: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" />
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
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('ingredients')}</label>
                  <button type="button" onClick={addIngredient} className="text-sm px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800/50">
                    + {t('addIngredient')}
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(form.ingredients || []).map((ing, i) => (
                    <div key={i} className="flex gap-2 items-center flex-wrap">
                      <input type="text" value={ing.name} onChange={(e) => updateIngredient(i, 'name', e.target.value)} placeholder={lang === 'ar' ? 'المكون' : 'Ingredient'} className="flex-1 min-w-[100px] rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-2 py-1.5 text-sm" />
                      <input type="text" value={ing.quantity} onChange={(e) => updateIngredient(i, 'quantity', e.target.value)} placeholder={t('quantity')} className="w-20 rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-2 py-1.5 text-sm" />
                      <input type="text" value={ing.unit} onChange={(e) => updateIngredient(i, 'unit', e.target.value)} placeholder={t('unit')} className="w-16 rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-2 py-1.5 text-sm" />
                      <button type="button" onClick={() => removeIngredient(i)} className="p-1.5 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" title={t('delete')} aria-label={t('delete')}>×</button>
                    </div>
                  ))}
                </div>
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
