import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import { useTranslation } from '../../translations';
import { get, post } from '../../api';

const CONTENT_PREVIEW_LENGTH = 80;

export default function AdminDoctorNotes() {
  const { lang } = useLang();
  const t = useTranslation(lang);
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [notes, setNotes] = useState([]);
  const [total, setTotal] = useState(0);
  const [filterDoctorId, setFilterDoctorId] = useState('');
  const [filterPatientId, setFilterPatientId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [error, setError] = useState('');
  const [formContent, setFormContent] = useState('');
  const [selectedPatientForAdd, setSelectedPatientForAdd] = useState('');
  const [selectedDoctorForAdd, setSelectedDoctorForAdd] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadDoctors = async () => {
    const { res, data } = await get('/admin/doctors?limit=500');
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (res.ok) {
      const d = data.data || data;
      setDoctors(d.items || d || []);
    }
  };

  const loadPatients = async () => {
    const { res, data } = await get('/admin/users?limit=500&role=USER');
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (res.ok) {
      const d = data.data || data;
      setPatients(d.items || d || []);
    }
  };

  const loadNotes = async () => {
    setLoadingNotes(true);
    setError('');
    let url = '/admin/doctor-notes?limit=300';
    if (filterDoctorId) url += `&doctorId=${encodeURIComponent(filterDoctorId)}`;
    if (filterPatientId) url += `&patientId=${encodeURIComponent(filterPatientId)}`;
    const { res, data } = await get(url);
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (!res.ok) {
      setError(data.message || t('loadError'));
      setNotes([]);
      setTotal(0);
      setLoadingNotes(false);
      return;
    }
    const result = data.data || data;
    const list = result.items ?? result.notes ?? result ?? [];
    setNotes(Array.isArray(list) ? list : []);
    setTotal(result.total ?? list.length);
    setLoadingNotes(false);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadDoctors(), loadPatients()]).then(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadNotes();
  }, [filterDoctorId, filterPatientId]);

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!selectedPatientForAdd || !formContent.trim()) return;
    setSubmitting(true);
    setError('');
    const body = { patientId: selectedPatientForAdd, content: formContent.trim() };
    if (selectedDoctorForAdd) body.doctorId = selectedDoctorForAdd;
    const { res, data } = await post('/doctor-notes', body);
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (!res.ok) {
      setError(data.message || 'Failed to add note');
      setSubmitting(false);
      return;
    }
    setFormContent('');
    setSelectedPatientForAdd('');
    setSelectedDoctorForAdd('');
    setSubmitting(false);
    loadNotes();
  };

  const contentPreview = (text) => {
    if (!text) return '—';
    const s = String(text).trim();
    if (s.length <= CONTENT_PREVIEW_LENGTH) return s;
    return s.slice(0, CONTENT_PREVIEW_LENGTH) + (lang === 'ar' ? '…' : '…');
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('doctorNotesTitle')}</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{t('doctorNotesDesc')}</p>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">{error}</div>}

      {/* فلاتر: الدكتور — المستخدم */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('doctor')}:</label>
          <select
            value={filterDoctorId}
            onChange={(e) => setFilterDoctorId(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2 min-w-[200px]"
          >
            <option value="">— {lang === 'ar' ? 'كل الأطباء' : 'All doctors'} —</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>{d.user?.name || d.title} ({d.user?.email})</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('patient')}:</label>
          <select
            value={filterPatientId}
            onChange={(e) => setFilterPatientId(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2 min-w-[200px]"
          >
            <option value="">— {lang === 'ar' ? 'كل المستخدمين' : 'All users'} —</option>
            {patients.map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
            ))}
          </select>
        </div>
      </div>

      {/* جدول كل الملاحظات */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm overflow-hidden mb-8">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-600 flex justify-between items-center">
          <h2 className="font-medium text-slate-800 dark:text-slate-100">
            {lang === 'ar' ? 'كل الملاحظات' : 'All notes'} {total > 0 && `(${total})`}
          </h2>
        </div>
        {loadingNotes ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">{t('loading')}</div>
        ) : notes.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            {lang === 'ar' ? 'لا توجد ملاحظات' : 'No notes'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-start">
                <tr>
                  <th className="px-4 py-3 font-medium text-start">{t('doctor')}</th>
                  <th className="px-4 py-3 font-medium text-start">{t('patient')}</th>
                  <th className="px-4 py-3 font-medium text-start">{lang === 'ar' ? 'الملاحظة' : 'Note'}</th>
                  <th className="px-4 py-3 font-medium text-start">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-600 text-start">
                {notes.map((note) => (
                  <tr key={note.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-start text-slate-800 dark:text-slate-200">
                      {note.doctor?.user?.name ?? note.doctorId ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-start text-slate-800 dark:text-slate-200">
                      {note.patient?.name ?? note.patientId ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-start text-slate-700 dark:text-slate-300 max-w-md">
                      <span title={note.content}>{contentPreview(note.content)}</span>
                    </td>
                    <td className="px-4 py-3 text-start text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {note.createdAt ? new Date(note.createdAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* إضافة ملاحظة جديدة */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 p-4">
        <h2 className="font-medium text-slate-800 dark:text-slate-100 mb-3">{lang === 'ar' ? 'إضافة ملاحظة جديدة' : 'Add new note'}</h2>
        <form onSubmit={handleCreateNote} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('doctor')} {lang === 'ar' ? '(اختياري — إن لم تختر يُستخدم دكتور المريض)' : '(optional — uses patient\'s doctor if not set)'}</label>
            <select
              value={selectedDoctorForAdd}
              onChange={(e) => setSelectedDoctorForAdd(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2"
            >
              <option value="">— {lang === 'ar' ? 'دكتور المريض' : 'Patient\'s doctor'} —</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.user?.name || d.title} ({d.user?.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('patient')}</label>
            <select
              value={selectedPatientForAdd}
              onChange={(e) => setSelectedPatientForAdd(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2"
              required
            >
              <option value="">— {t('choose')} —</option>
              {patients.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('content')}</label>
            <textarea
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2 min-h-[80px]"
              placeholder={t('content')}
              required
            />
          </div>
          <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">
            {submitting ? t('saving') : t('add')}
          </button>
        </form>
      </div>
    </div>
  );
}
