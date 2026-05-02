import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import { useTranslation } from '../../translations';
import { get, post, patch, del } from '../../api';
import { IconEdit, IconDelete } from '../../components/ActionIcons';

const SLOT_TYPES = ['BREAKFAST', 'SNACK', 'LUNCH', 'DINNER'];
const SLOT_TIMES = { BREAKFAST: '08:00', SNACK: '10:30', LUNCH: '13:00', DINNER: '19:00' };

/** Parse YYYY-MM-DD as local date to avoid timezone shifting the day */
function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toLocalDateString(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDaysBetween(start, end) {
  const days = [];
  const d = parseLocalDate(start);
  const endDate = parseLocalDate(end);
  if (!d || !endDate) return [];
  while (d <= endDate) {
    days.push(toLocalDateString(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function getSlotsForDays(days, existingSlotsByDate = {}) {
  const slots = [];
  days.forEach((date) => {
    SLOT_TYPES.forEach((slotType) => {
      const existing = existingSlotsByDate[date]?.[slotType];
      slots.push({
        date,
        slotType,
        time: existing?.time || SLOT_TIMES[slotType],
        mealId: existing?.mealId || '',
        meal: existing?.meal,
      });
    });
  });
  return slots;
}

function groupSlotsByDay(slots) {
  const byDay = {};
  (slots || []).forEach((s) => {
    const raw = s.date;
    let d;
    if (typeof raw === 'string') d = raw.slice(0, 10);
    else if (raw) { const x = new Date(raw); d = toLocalDateString(x); }
    else d = '';
    if (!d) return;
    if (!byDay[d]) byDay[d] = {};
    byDay[d][s.slotType] = { ...s, mealId: s.mealId != null ? String(s.mealId) : '' };
  });
  return byDay;
}

export default function AdminNutritionPlans() {
  const { lang } = useLang();
  const t = useTranslation(lang);
  const navigate = useNavigate();
  const me = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
  const isDoctor = me?.role === 'DOCTOR';
  const [plans, setPlans] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    doctorId: '',
    userId: '',
    startDate: '',
    endDate: '',
    dailyCalorieTarget: 2000,
    dailyProteinTarget: 100,
    dailyCarbsTarget: 250,
    dailyFatsTarget: 65,
    slots: [],
  });
  const [slotMealIds, setSlotMealIds] = useState({}); // { "date_slotType": mealId }

  const mealsMap = useMemo(() => {
    const m = new Map();
    meals.forEach((meal) => m.set(String(meal.id), meal));
    return m;
  }, [meals]);

  const loadPlans = async () => {
    setLoading(true);
    const { res, data } = await get(isDoctor ? '/nutrition-plan/my-created' : '/admin/nutrition-plans?limit=200');
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (res.ok) {
      const d = data.data || data;
      const list = isDoctor ? (d.items ?? d.plans ?? d ?? []) : (data.items ?? data.data?.items ?? data.data ?? []);
      setPlans(Array.isArray(list) ? list : []);
    } else setPlans([]);
    setLoading(false);
  };

  const loadDoctors = async () => {
    if (isDoctor) return;
    const { res, data } = await get('/admin/doctors?limit=500');
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (res.ok) {
      const d = data.data || data;
      setDoctors(d.items || d || []);
    }
  };

  const loadPatientsForDoctor = async (doctorId) => {
    if (isDoctor) {
      setLoadingPatients(true);
      const { res, data } = await get('/doctors/me/patients?limit=500');
      if (res.status === 401) { navigate('/login', { replace: true }); return; }
      if (res.ok) {
        const d = data.data || data;
        setPatients(d.items || d || []);
      } else setPatients([]);
      setLoadingPatients(false);
      return;
    }
    if (!doctorId) { setPatients([]); return; }
    setLoadingPatients(true);
    const { res, data } = await get(`/admin/doctors/${doctorId}/patients?limit=500`);
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (res.ok) {
      const d = data.data || data;
      setPatients(d.items || d || []);
    } else setPatients([]);
    setLoadingPatients(false);
  };

  const loadMeals = async () => {
    const { res, data } = await get('/meals?limit=500');
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (res.ok) {
      const d = data.data || data;
      const list = d.items ?? d ?? [];
      setMeals(Array.isArray(list) ? list : []);
    }
  };

  useEffect(() => { loadPlans(); loadDoctors(); }, []);
  useEffect(() => { if (modal) loadMeals(); }, [modal]);
  useEffect(() => { if (isDoctor) loadPatientsForDoctor('me'); }, [isDoctor]);
  useEffect(() => { if (modal === 'create' && isDoctor) loadPatientsForDoctor('me'); }, [modal, isDoctor]);

  const openCreate = () => {
    const today = toLocalDateString(new Date());
    setForm({
      doctorId: isDoctor ? 'me' : '',
      userId: '',
      startDate: today,
      endDate: '', // اختياري — يُحسب أسبوع من تاريخ البداية تلقائياً
      dailyCalorieTarget: 2000,
      dailyProteinTarget: 100,
      dailyCarbsTarget: 250,
      dailyFatsTarget: 65,
      slots: [],
    });
    setSlotMealIds({});
    // Don't clear doctor patients list (doctor flow relies on it).
    if (!isDoctor) setPatients([]);
    setModal('create');
  };

  const daysForForm = useMemo(() => {
    if (!form.startDate) return [];
    const end = form.endDate || toLocalDateString((() => {
      const d = parseLocalDate(form.startDate);
      if (!d) return new Date();
      d.setDate(d.getDate() + 6);
      return d;
    })());
    return getDaysBetween(form.startDate, end);
  }, [form.startDate, form.endDate]);

  const setSlotMeal = (date, slotType, mealId) => {
    setSlotMealIds((prev) => ({ ...prev, [`${date}_${slotType}`]: mealId || '' }));
  };

  const getSlotMealId = (date, slotType) => {
    const v = slotMealIds[`${date}_${slotType}`];
    return v !== undefined && v !== null ? String(v) : '';
  };

  const buildSlotsPayload = () => {
    const arr = [];
    daysForForm.forEach((date) => {
      SLOT_TYPES.forEach((slotType) => {
        const mealId = getSlotMealId(date, slotType);
        const d = parseLocalDate(date);
        arr.push({
          date: d ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0).toISOString() : new Date(date).toISOString(),
          slotType,
          time: SLOT_TIMES[slotType],
          mealId: mealId || null,
        });
      });
    });
    return arr;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    if ((!isDoctor && !form.doctorId) || !form.userId || !form.startDate) {
      setError(lang === 'ar' ? 'اختر الدكتور والمريض وتاريخ البداية' : 'Select doctor, patient, and start date');
      return;
    }
    const startD = parseLocalDate(form.startDate);
    const endD = form.endDate ? parseLocalDate(form.endDate) : (() => { const d = new Date(startD); d.setDate(d.getDate() + 6); return d; })();
    const body = {
      doctorId: isDoctor ? undefined : form.doctorId,
      userId: form.userId,
      startDate: new Date(startD.getFullYear(), startD.getMonth(), startD.getDate(), 12, 0, 0).toISOString(),
      endDate: new Date(endD.getFullYear(), endD.getMonth(), endD.getDate(), 12, 0, 0).toISOString(),
      dailyCalorieTarget: Number(form.dailyCalorieTarget) || 2000,
      dailyProteinTarget: Number(form.dailyProteinTarget) || 100,
      dailyCarbsTarget: Number(form.dailyCarbsTarget) || 250,
      dailyFatsTarget: Number(form.dailyFatsTarget) || 65,
      slots: buildSlotsPayload(),
    };
    const { res, data } = await post('/nutrition-plan', body);
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (!res.ok) { setError(data.message || data.errors?.[0]?.message || 'Failed'); return; }
    setModal(null);
    loadPlans();
  };

  const openEdit = async (plan) => {
    setSelected(plan);
    const { res, data } = await get(`/nutrition-plan/${plan.id}`);
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (!res.ok) { setError('Failed to load plan'); return; }
    const p = data.data || data;
    const start = p.startDate ? (() => { const d = new Date(p.startDate); return toLocalDateString(d); })() : '';
    const end = p.endDate ? (() => { const d = new Date(p.endDate); return toLocalDateString(d); })() : '';
    const byDay = groupSlotsByDay(p.slots || []);
    const ids = {};
    Object.keys(byDay).forEach((date) => {
      SLOT_TYPES.forEach((st) => {
        const s = byDay[date][st];
        if (s?.mealId) ids[`${date}_${st}`] = String(s.mealId);
      });
    });
    setSlotMealIds(ids);
    setForm({
      doctorId: p.doctorId,
      userId: p.userId,
      startDate: start,
      endDate: end,
      dailyCalorieTarget: p.dailyCalorieTarget ?? 2000,
      dailyProteinTarget: p.dailyProteinTarget ?? 100,
      dailyCarbsTarget: p.dailyCarbsTarget ?? 250,
      dailyFatsTarget: p.dailyFatsTarget ?? 65,
      slots: p.slots || [],
    });
    setModal('edit');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setError('');
    const body = {
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      dailyCalorieTarget: Number(form.dailyCalorieTarget) || 2000,
      dailyProteinTarget: Number(form.dailyProteinTarget) || 100,
      dailyCarbsTarget: Number(form.dailyCarbsTarget) || 250,
      dailyFatsTarget: Number(form.dailyFatsTarget) || 65,
      slots: buildSlotsPayload(),
    };
    const { res, data } = await patch(`/nutrition-plan/${selected.id}`, body);
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (!res.ok) { setError(data.message || 'Failed'); return; }
    setModal(null);
    setSelected(null);
    loadPlans();
  };

  const handleDelete = async (plan) => {
    if (!window.confirm(t('confirmDelete'))) return;
    const { res } = await del(`/nutrition-plan/${plan.id}`);
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (res.ok) loadPlans();
  };

  const slotLabel = (st) => t('mealType' + st.charAt(0) + st.slice(1).toLowerCase());

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('nutritionPlansTitle')}</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{t('nutritionPlansDesc')}</p>
        </div>
        <button type="button" onClick={openCreate} className="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700">
          {t('add')} {t('nutritionPlans')}
        </button>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">{error}</div>}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">{t('loading')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-sm text-start">
                <tr>
                  <th className="px-4 py-3 font-medium text-start">{t('doctor')}</th>
                  <th className="px-4 py-3 font-medium text-start">{t('patient')}</th>
                  <th className="px-4 py-3 font-medium text-start">{t('startDate')}</th>
                  <th className="px-4 py-3 font-medium text-start">{t('endDate')}</th>
                  <th className="px-4 py-3 font-medium text-start">{t('dailyCalorieTarget')}</th>
                  <th className="px-4 py-3 font-medium text-start">{lang === 'ar' ? 'بروتين' : 'Protein'}</th>
                  <th className="px-4 py-3 font-medium text-start">{lang === 'ar' ? 'كاربوهيدرات' : 'Carbs'}</th>
                  <th className="px-4 py-3 font-medium text-start">{lang === 'ar' ? 'دهون' : 'Fats'}</th>
                  <th className="px-4 py-3 font-medium text-start">{lang === 'ar' ? 'عدد الوجبات' : 'Meals'}</th>
                  <th className="px-4 py-3 font-medium text-start">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-600 text-start">
                {plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-start text-slate-800 dark:text-slate-200">{plan.doctor?.user?.name ?? plan.doctorId ?? '—'}</td>
                    <td className="px-4 py-3 text-start">{plan.user?.name ?? plan.userId ?? '—'}</td>
                    <td className="px-4 py-3 text-start">{plan.startDate ? new Date(plan.startDate).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 text-start">{plan.endDate ? new Date(plan.endDate).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 text-start">{plan.dailyCalorieTarget ?? '—'}</td>
                    <td className="px-4 py-3 text-start">{plan.dailyProteinTarget ?? '—'}</td>
                    <td className="px-4 py-3 text-start">{plan.dailyCarbsTarget ?? '—'}</td>
                    <td className="px-4 py-3 text-start">{plan.dailyFatsTarget ?? '—'}</td>
                    <td className="px-4 py-3 text-start">{plan.slots?.length ?? 0}</td>
                    <td className="px-4 py-3 text-start">
                      <div className="flex gap-1 justify-end">
                        <button type="button" onClick={() => openEdit(plan)} className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700" title={t('edit')} aria-label={t('edit')}><IconEdit /></button>
                        <button type="button" onClick={() => handleDelete(plan)} className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700" title={t('delete')} aria-label={t('delete')}><IconDelete /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {plans.length === 0 && !loading && <div className="p-8 text-center text-slate-500 dark:text-slate-400">{t('none')}</div>}
          </div>
        )}
      </div>

      {/* Create modal */}
      {modal === 'create' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto" onClick={() => setModal(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full my-8 p-6 max-h-[95vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">{t('add')} {t('nutritionPlans')}</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('doctor')}</label>
                {isDoctor ? (
                  <div className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/30 px-3 py-2 text-sm text-slate-700 dark:text-slate-200">
                    {lang === 'ar' ? 'أنت (الدكتور الحالي)' : lang === 'it' ? 'Tu (dottore corrente)' : 'You (current doctor)'}
                  </div>
                ) : (
                  <select
                    value={form.doctorId}
                    onChange={(e) => { setForm((f) => ({ ...f, doctorId: e.target.value })); loadPatientsForDoctor(e.target.value); }}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2"
                    required
                  >
                    <option value="">— {t('choose')} {t('doctor')} —</option>
                    {doctors.map((d) => <option key={d.id} value={d.id}>{d.user?.name ?? d.title} ({d.user?.email})</option>)}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('patient')}</label>
                <select
                  value={form.userId}
                  onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2"
                  required
                  disabled={(!isDoctor && !form.doctorId) || loadingPatients}
                >
                  <option value="">— {(isDoctor || form.doctorId) ? (loadingPatients ? t('loading') : t('choose')) : (lang === 'ar' ? 'اختر الدكتور أولاً' : 'Select doctor first')} —</option>
                  {patients.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('startDate')}</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('endDate')} {lang === 'ar' ? '(اختياري)' : '(optional)'}</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('dailyCalorieTarget')}</label>
                  <input type="number" min={0} value={form.dailyCalorieTarget} onChange={(e) => setForm((f) => ({ ...f, dailyCalorieTarget: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('dailyProteinTarget')}</label>
                  <input type="number" min={0} value={form.dailyProteinTarget} onChange={(e) => setForm((f) => ({ ...f, dailyProteinTarget: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('dailyCarbsTarget')}</label>
                  <input type="number" min={0} value={form.dailyCarbsTarget} onChange={(e) => setForm((f) => ({ ...f, dailyCarbsTarget: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('dailyFatsTarget')}</label>
                  <input type="number" min={0} value={form.dailyFatsTarget} onChange={(e) => setForm((f) => ({ ...f, dailyFatsTarget: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" />
                </div>
              </div>

              {daysForForm.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{lang === 'ar' ? 'الخطة الأسبوعية — الوجبات لكل يوم' : 'Weekly plan — meals per day'}</h3>
                  <div className="space-y-4">
                    {daysForForm.map((date) => {
                      const dayCal = SLOT_TYPES.reduce((sum, st) => {
                        const mealId = getSlotMealId(date, st);
                        const meal = mealId ? mealsMap.get(mealId) : null;
                        return sum + (meal?.calories ?? 0);
                      }, 0);
                      return (
                        <div key={date} className="border border-slate-200 dark:border-slate-600 rounded-lg p-3 bg-slate-50/50 dark:bg-slate-700/30">
                          <div className="font-medium text-slate-700 dark:text-slate-200 mb-2">
                            {(parseLocalDate(date) || new Date()).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          {SLOT_TYPES.map((st) => (
                            <div key={st} className="flex items-center gap-2 py-1">
                              <span className="w-24 text-sm text-slate-600 dark:text-slate-400">{slotLabel(st)}</span>
                              <select
                                value={getSlotMealId(date, st)}
                                onChange={(e) => setSlotMeal(date, st, e.target.value)}
                                className="flex-1 rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-2 py-1.5 text-sm"
                              >
                                <option value="">— {t('selectMeal')} —</option>
                                {meals.map((m) => <option key={m.id} value={String(m.id)}>{m.name} ({m.calories ?? 0} {t('calories')})</option>)}
                              </select>
                            </div>
                          ))}
                          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-600 text-sm font-medium text-primary-600 dark:text-primary-400">
                            {t('dayCalories')}: {dayCal}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-500">{t('cancel')}</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">{t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {modal === 'edit' && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto" onClick={() => { setModal(null); setSelected(null); }}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full my-8 p-6 max-h-[95vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">{t('edit')} {t('nutritionPlans')}</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-slate-500 dark:text-slate-400">{t('doctor')}:</span> <span className="font-medium">{selected.doctor?.user?.name ?? selected.doctorId}</span></div>
                <div><span className="text-slate-500 dark:text-slate-400">{t('patient')}:</span> <span className="font-medium">{selected.user?.name ?? selected.userId}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('startDate')}</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('endDate')} {lang === 'ar' ? '(اختياري)' : '(optional)'}</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('dailyCalorieTarget')}</label>
                  <input type="number" min={0} value={form.dailyCalorieTarget} onChange={(e) => setForm((f) => ({ ...f, dailyCalorieTarget: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('dailyProteinTarget')}</label>
                  <input type="number" min={0} value={form.dailyProteinTarget} onChange={(e) => setForm((f) => ({ ...f, dailyProteinTarget: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('dailyCarbsTarget')}</label>
                  <input type="number" min={0} value={form.dailyCarbsTarget} onChange={(e) => setForm((f) => ({ ...f, dailyCarbsTarget: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('dailyFatsTarget')}</label>
                  <input type="number" min={0} value={form.dailyFatsTarget} onChange={(e) => setForm((f) => ({ ...f, dailyFatsTarget: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" />
                </div>
              </div>

              {daysForForm.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{lang === 'ar' ? 'الخطة الأسبوعية — تعديل الوجبات لكل يوم' : 'Weekly plan — edit meals per day'}</h3>
                  <div className="space-y-4">
                    {daysForForm.map((date) => {
                      const dayCal = SLOT_TYPES.reduce((sum, st) => {
                        const mealId = getSlotMealId(date, st);
                        const meal = mealId ? mealsMap.get(mealId) : null;
                        return sum + (meal?.calories ?? 0);
                      }, 0);
                      return (
                        <div key={date} className="border border-slate-200 dark:border-slate-600 rounded-lg p-3 bg-slate-50/50 dark:bg-slate-700/30">
                          <div className="font-medium text-slate-700 dark:text-slate-200 mb-2">
                            {(parseLocalDate(date) || new Date()).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          {SLOT_TYPES.map((st) => (
                            <div key={st} className="flex items-center gap-2 py-1">
                              <span className="w-24 text-sm text-slate-600 dark:text-slate-400">{slotLabel(st)}</span>
                              <select
                                value={getSlotMealId(date, st)}
                                onChange={(e) => setSlotMeal(date, st, e.target.value)}
                                className="flex-1 rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-2 py-1.5 text-sm"
                              >
                                <option value="">— {t('selectMeal')} —</option>
                                {meals.map((m) => <option key={m.id} value={String(m.id)}>{m.name} ({m.calories ?? 0} {t('calories')})</option>)}
                              </select>
                            </div>
                          ))}
                          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-600 text-sm font-medium text-primary-600 dark:text-primary-400">
                            {t('dayCalories')}: {dayCal}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => { setModal(null); setSelected(null); }} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-500">{t('cancel')}</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">{t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
