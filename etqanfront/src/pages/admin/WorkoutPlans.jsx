import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import { useTranslation } from '../../translations';
import { get, post, del } from '../../api';
import { IconDelete } from '../../components/ActionIcons';

/** Parse YYYY-MM-DD as local date */
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

export default function AdminWorkoutPlans() {
  const { lang } = useLang();
  const t = useTranslation(lang);
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    doctorId: '',
    userId: '',
    weekStart: '',
    weekEnd: '',
  });
  const [dayExercises, setDayExercises] = useState({}); // { "date": { exerciseId, sets, repMin, repMax } }

  const loadDoctors = async () => {
    const { res, data } = await get('/admin/doctors?limit=500');
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (res.ok) {
      const d = data.data || data;
      setDoctors(d.items || d || []);
    }
    setLoading(false);
  };

  const loadPlans = async () => {
    setLoadingPlans(true);
    const { res, data } = await get('/admin/workout-plans?limit=300');
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (res.ok) {
      const list = data.items ?? data.data?.items ?? data.data ?? [];
      setPlans(Array.isArray(list) ? list : []);
    } else setPlans([]);
    setLoadingPlans(false);
  };

  const loadPatientsForDoctor = async (doctorId) => {
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

  const loadExercises = async () => {
    const { res, data } = await get('/exercises?limit=500');
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (res.ok) {
      const list = data.items ?? data.data?.items ?? data.data ?? [];
      setExercises(Array.isArray(list) ? list : []);
    }
  };

  useEffect(() => { loadDoctors(); loadPlans(); }, []);
  useEffect(() => { if (modal === 'create') loadExercises(); }, [modal]);
  useEffect(() => { if (form.doctorId) loadPatientsForDoctor(form.doctorId); }, [form.doctorId]);

  const plansToShow = useMemo(() => {
    if (!selectedDoctorId) return plans;
    return plans.filter((p) => p.doctorId === selectedDoctorId);
  }, [plans, selectedDoctorId]);

  const daysForForm = useMemo(() => {
    if (!form.weekStart) return [];
    const end = form.weekEnd || (() => {
      const d = parseLocalDate(form.weekStart);
      if (!d) return form.weekStart;
      d.setDate(d.getDate() + 6);
      return toLocalDateString(d);
    })();
    return getDaysBetween(form.weekStart, end);
  }, [form.weekStart, form.weekEnd]);

  const setDayExercise = (date, field, value) => {
    setDayExercises((prev) => {
      const cur = prev[date] || { exerciseId: '', sets: 3, repMin: 8, repMax: 12 };
      if (field === 'exerciseId') return { ...prev, [date]: { ...cur, exerciseId: value || '' } };
      return { ...prev, [date]: { ...cur, [field]: value } };
    });
  };

  const getDayExercise = (date) => ({
    exerciseId: dayExercises[date]?.exerciseId ?? '',
    sets: dayExercises[date]?.sets ?? 3,
    repMin: dayExercises[date]?.repMin ?? 8,
    repMax: dayExercises[date]?.repMax ?? 12,
  });

  const openCreate = () => {
    const today = toLocalDateString(new Date());
    const endDefault = (() => {
      const d = parseLocalDate(today);
      d.setDate(d.getDate() + 6);
      return toLocalDateString(d);
    })();
    setForm({
      doctorId: '',
      userId: '',
      weekStart: today,
      weekEnd: endDefault,
    });
    setDayExercises({});
    setPatients([]);
    setModal('create');
  };

  const buildDaysPayload = () => {
    return daysForForm.map((date, i) => {
      const { exerciseId, sets, repMin, repMax } = getDayExercise(date);
      const d = parseLocalDate(date);
      const dateIso = d ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0).toISOString() : new Date(date).toISOString();
      return {
        date: dateIso,
        exerciseId: exerciseId || null,
        sets: sets || 3,
        repMin: repMin ?? 8,
        repMax: repMax ?? 12,
        order: i,
      };
    }).filter((day) => day.exerciseId);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.doctorId || !form.userId || !form.weekStart) {
      setError(lang === 'ar' ? 'اختر الدكتور والمريض وتاريخ البداية' : 'Select doctor, patient, and start date');
      return;
    }
    const days = buildDaysPayload();
    if (days.length === 0) {
      setError(lang === 'ar' ? 'اختر تمريناً واحداً على الأقل لأحد الأيام مع عدد المجموعات والتكرارات' : 'Select at least one exercise for a day with sets and reps');
      return;
    }
    const startD = parseLocalDate(form.weekStart);
    const endD = form.weekEnd ? parseLocalDate(form.weekEnd) : (() => { const d = new Date(startD); d.setDate(d.getDate() + 6); return d; })();
    const body = {
      doctorId: form.doctorId,
      userId: form.userId,
      weekStart: new Date(startD.getFullYear(), startD.getMonth(), startD.getDate(), 12, 0, 0).toISOString(),
      weekEnd: new Date(endD.getFullYear(), endD.getMonth(), endD.getDate(), 12, 0, 0).toISOString(),
      days,
    };
    const { res, data } = await post('/workout-plan', body);
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (!res.ok) { setError(data.message || data.errors?.[0]?.message || 'Failed'); return; }
    setModal(null);
    loadPlans();
  };

  const handleDelete = async (plan) => {
    if (!window.confirm(t('confirmDelete'))) return;
    const { res } = await del(`/workout-plan/${plan.id}`);
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (res.ok) loadPlans();
  };

  const exerciseLabel = (ex) => (ex ? (lang === 'ar' ? ex.nameAr || ex.name : ex.name || ex.nameAr) : '');

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('workoutPlansTitle')}</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{t('workoutPlansDesc')}</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2 min-w-[180px]"
          >
            <option value="">— {lang === 'ar' ? 'كل الأطباء' : 'All doctors'} —</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>{d.user?.name || d.title} ({d.user?.email})</option>
            ))}
          </select>
          <button type="button" onClick={openCreate} className="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700">
            {t('add')} {t('workoutPlans')}
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">{error}</div>}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm overflow-hidden">
        {loadingPlans && <div className="p-8 text-center text-slate-500 dark:text-slate-400">{t('loading')}</div>}
        {!loadingPlans && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-sm">
                <tr>
                  <th className="px-4 py-3 font-medium">{t('doctor')}</th>
                  <th className="px-4 py-3 font-medium">{t('patient')}</th>
                  <th className="px-4 py-3 font-medium">{t('weekStart')}</th>
                  <th className="px-4 py-3 font-medium">{t('weekEnd')}</th>
                  <th className="px-4 py-3 font-medium text-end">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                {plansToShow.map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{plan.doctor?.user?.name ?? plan.doctorId ?? '—'}</td>
                    <td className="px-4 py-3">{plan.user?.name ?? plan.userId ?? '—'}</td>
                    <td className="px-4 py-3">{plan.weekStart ? new Date(plan.weekStart).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3">{plan.weekEnd ? new Date(plan.weekEnd).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 text-end">
                      <button type="button" onClick={() => handleDelete(plan)} className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title={t('delete')} aria-label={t('delete')}><IconDelete /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {plansToShow.length === 0 && !loadingPlans && <div className="p-8 text-center text-slate-500 dark:text-slate-400">{lang === 'ar' ? 'لا توجد خطط' : 'No plans'}</div>}
          </div>
        )}
      </div>

      {modal === 'create' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto" onClick={() => setModal(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full my-8 p-6 max-h-[95vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">{t('add')} {t('workoutPlans')}</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('doctor')}</label>
                <select
                  value={form.doctorId}
                  onChange={(e) => setForm((f) => ({ ...f, doctorId: e.target.value, userId: '' }))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2"
                  required
                >
                  <option value="">— {t('choose')} {t('doctor')} —</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>{d.user?.name || d.title} ({d.user?.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('patient')}</label>
                <select
                  value={form.userId}
                  onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2"
                  required
                  disabled={!form.doctorId || loadingPatients}
                >
                  <option value="">— {form.doctorId ? (loadingPatients ? t('loading') : t('choose')) : (lang === 'ar' ? 'اختر الدكتور أولاً' : 'Select doctor first')} —</option>
                  {patients.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('weekStart')}</label>
                  <input type="date" value={form.weekStart} onChange={(e) => setForm((f) => ({ ...f, weekStart: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('weekEnd')} {lang === 'ar' ? '(اختياري)' : '(optional)'}</label>
                  <input type="date" value={form.weekEnd} onChange={(e) => setForm((f) => ({ ...f, weekEnd: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" />
                </div>
              </div>

              {daysForForm.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{lang === 'ar' ? 'التمارين لكل يوم — اختر التمرين وحدد عدد المجموعات والتكرارات' : 'Exercise per day — select exercise and set sets/reps'}</h3>
                  <div className="space-y-3">
                    {daysForForm.map((date) => {
                      const { exerciseId, sets, repMin, repMax } = getDayExercise(date);
                      return (
                        <div key={date} className="p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-700/30 space-y-2">
                          <div className="font-medium text-slate-700 dark:text-slate-200">
                            {(parseLocalDate(date) || new Date()).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              value={exerciseId}
                              onChange={(e) => setDayExercise(date, 'exerciseId', e.target.value)}
                              className="min-w-[180px] flex-1 rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2 text-sm"
                            >
                              <option value="">— {lang === 'ar' ? 'اختر التمرين' : 'Select exercise'} —</option>
                              {exercises.map((ex) => (
                                <option key={ex.id} value={ex.id}>{exerciseLabel(ex)}</option>
                              ))}
                            </select>
                            <label className="text-slate-600 dark:text-slate-400 text-sm shrink-0">
                              {lang === 'ar' ? 'مجموعات' : 'Sets'}
                              <input type="number" min={1} max={20} value={sets} onChange={(e) => setDayExercise(date, 'sets', parseInt(e.target.value, 10) || 3)} className="w-14 ml-1 rounded border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-2 py-1 text-center text-sm" />
                            </label>
                            <label className="text-slate-600 dark:text-slate-400 text-sm shrink-0">
                              {lang === 'ar' ? 'تكرار' : 'Reps'}
                              <input type="number" min={1} max={100} value={repMin} onChange={(e) => setDayExercise(date, 'repMin', parseInt(e.target.value, 10) || 8)} className="w-12 ml-1 rounded border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-2 py-1 text-center text-sm" />
                              <span className="mx-0.5">–</span>
                              <input type="number" min={1} max={100} value={repMax} onChange={(e) => setDayExercise(date, 'repMax', parseInt(e.target.value, 10) || 12)} className="w-12 rounded border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-2 py-1 text-center text-sm" />
                            </label>
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
    </div>
  );
}
