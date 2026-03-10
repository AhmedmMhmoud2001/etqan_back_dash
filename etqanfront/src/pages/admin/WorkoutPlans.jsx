import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import { useTranslation } from '../../translations';
import { get, post, del } from '../../api';
import { IconDelete } from '../../components/ActionIcons';

export default function AdminWorkoutPlans() {
  const { lang } = useLang();
  const t = useTranslation(lang);
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ userId: '', weekStart: '', weekEnd: '' });

  const loadDoctors = async () => {
    const { res, data } = await get('/admin/doctors?limit=500');
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (res.ok) {
      const d = data.data || data;
      setDoctors(d.items || d || []);
    }
    setLoading(false);
  };

  const loadPatients = async () => {
    const { res, data } = await get('/admin/users?limit=500&role=USER');
    if (res.ok) {
      const d = data.data || data;
      setPatients(d.items || d || []);
    }
  };

  const loadPlans = async () => {
    if (!selectedDoctorId) { setPlans([]); return; }
    setLoadingPlans(true);
    const { res, data } = await get(`/workout-plan/doctor/${selectedDoctorId}/plans`);
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (res.ok) {
      const d = data.data || data;
      setPlans(d.plans || d || []);
    } else setPlans([]);
    setLoadingPlans(false);
  };

  useEffect(() => { loadDoctors(); }, []);
  useEffect(() => { loadPlans(); }, [selectedDoctorId]);
  useEffect(() => { if (modal === 'create') loadPatients(); }, [modal]);

  const openCreate = () => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    setForm({
      userId: '',
      weekStart: weekStart.toISOString().slice(0, 10),
      weekEnd: weekEnd.toISOString().slice(0, 10),
    });
    setModal('create');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.userId || !form.weekStart || !form.weekEnd) return;
    const body = {
      userId: form.userId,
      weekStart: new Date(form.weekStart).toISOString(),
      weekEnd: new Date(form.weekEnd).toISOString(),
    };
    if (selectedDoctorId) body.doctorId = selectedDoctorId;
    const { res, data } = await post('/workout-plan', body);
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (!res.ok) { setError(data.message || 'Failed'); return; }
    setModal(null);
    loadPlans();
  };

  const handleDelete = async (plan) => {
    if (!window.confirm(t('confirmDelete'))) return;
    const { res } = await del(`/workout-plan/${plan.id}`);
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (res.ok) loadPlans();
  };

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
            <option value="">— {t('choose')} {t('doctor')} —</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>{d.user?.name || d.title} ({d.user?.email})</option>
            ))}
          </select>
          <button type="button" onClick={openCreate} disabled={!selectedDoctorId} className="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50">{t('add')}</button>
        </div>
      </div>
      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">{error}</div>}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm overflow-hidden">
        {!selectedDoctorId && <div className="p-8 text-center text-slate-500 dark:text-slate-400">اختر دكتوراً لعرض الخطط الأسبوعية</div>}
        {selectedDoctorId && loadingPlans && <div className="p-8 text-center text-slate-500 dark:text-slate-400">{t('loading')}</div>}
        {selectedDoctorId && !loadingPlans && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-sm">
                <tr>
                  <th className="px-4 py-3 font-medium">{t('patient')}</th>
                  <th className="px-4 py-3 font-medium">{t('weekStart')}</th>
                  <th className="px-4 py-3 font-medium">{t('weekEnd')}</th>
                  <th className="px-4 py-3 font-medium text-end">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                {plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{plan.patient?.name || plan.userId || '—'}</td>
                    <td className="px-4 py-3">{plan.weekStart ? new Date(plan.weekStart).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3">{plan.weekEnd ? new Date(plan.weekEnd).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 text-end">
                      <button type="button" onClick={() => handleDelete(plan)} className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title={t('delete')} aria-label={t('delete')}><IconDelete /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {modal === 'create' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setModal(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">{t('add')} {t('workoutPlans')}</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('patient')}</label><select value={form.userId} onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" required><option value="">— {t('choose')} —</option>{patients.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}</select></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('weekStart')}</label><input type="date" value={form.weekStart} onChange={(e) => setForm((f) => ({ ...f, weekStart: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" required /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('weekEnd')}</label><input type="date" value={form.weekEnd} onChange={(e) => setForm((f) => ({ ...f, weekEnd: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2" required /></div>
              <div className="flex gap-2 justify-end pt-2"><button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-500">{t('cancel')}</button><button type="submit" className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">{t('save')}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
