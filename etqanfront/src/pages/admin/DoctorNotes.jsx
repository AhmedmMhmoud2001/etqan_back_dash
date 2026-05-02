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
  const me = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
  const isDoctor = me?.role === 'DOCTOR';
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [notes, setNotes] = useState([]);
  const [total, setTotal] = useState(0);
  const [filterDoctorId, setFilterDoctorId] = useState('');
  const [filterPatientId, setFilterPatientId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [error, setError] = useState('');
  const [newNotePatientId, setNewNotePatientId] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [saving, setSaving] = useState(false);

  const loadDoctors = async () => {
    if (isDoctor) return;
    const { res, data } = await get('/admin/doctors?limit=500');
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (res.ok) {
      const d = data.data || data;
      setDoctors(d.items || d || []);
    }
  };

  const loadPatients = async () => {
    const { res, data } = await get(isDoctor ? '/doctors/me/patients?limit=500' : '/admin/users?limit=500&role=USER');
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (res.ok) {
      const d = data.data || data;
      setPatients(d.items || d || []);
    }
  };

  const loadNotes = async () => {
    setLoadingNotes(true);
    setError('');
    let url = isDoctor ? '/doctor-notes/my' : '/admin/doctor-notes?limit=300';
    if (!isDoctor) {
      if (filterDoctorId) url += `&doctorId=${encodeURIComponent(filterDoctorId)}`;
      if (filterPatientId) url += `&patientId=${encodeURIComponent(filterPatientId)}`;
    } else if (filterPatientId) {
      url = `/doctor-notes/patient/${encodeURIComponent(filterPatientId)}`;
    }
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
  }, [filterDoctorId, filterPatientId, isDoctor]);

  useEffect(() => {
    if (!isDoctor) return;
    if (!newNotePatientId && patients.length > 0) {
      setNewNotePatientId(String(patients[0].id));
    }
  }, [isDoctor, patients, newNotePatientId]);

  const contentPreview = (text) => {
    if (!text) return '—';
    const s = String(text).trim();
    if (s.length <= CONTENT_PREVIEW_LENGTH) return s;
    return s.slice(0, CONTENT_PREVIEW_LENGTH) + (lang === 'ar' ? '…' : '…');
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!isDoctor) return;
    setError('');
    if (!newNotePatientId || !String(newNoteContent || '').trim()) {
      setError(lang === 'ar' ? 'اختر المريض واكتب المحتوى' : lang === 'it' ? 'Seleziona il paziente e scrivi il contenuto' : 'Select patient and write content');
      return;
    }
    setSaving(true);
    const { res, data } = await post('/doctor-notes', {
      patientId: newNotePatientId,
      content: String(newNoteContent || '').trim(),
    });
    setSaving(false);
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (!res.ok) {
      setError(data.message || t('saveError') || 'Failed');
      return;
    }
    setNewNoteContent('');
    loadNotes();
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('doctorNotesTitle')}</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{t('doctorNotesDesc')}</p>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">{error}</div>}

      {/* إنشاء ملاحظة (للدكتور فقط) */}
      {isDoctor && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm p-4 mb-6">
          <h2 className="font-medium text-slate-800 dark:text-slate-100 mb-3">
            {lang === 'ar' ? 'إضافة ملاحظة للمريض' : lang === 'it' ? 'Aggiungi nota al paziente' : 'Add note to patient'}
          </h2>
          <form onSubmit={handleCreateNote} className="grid gap-3 md:grid-cols-3 items-start">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('patient')}</label>
              <select
                value={newNotePatientId}
                onChange={(e) => setNewNotePatientId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2"
                required
              >
                {patients.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{lang === 'ar' ? 'المحتوى' : lang === 'it' ? 'Contenuto' : 'Content'}</label>
              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2"
                placeholder={lang === 'ar' ? 'اكتب الملاحظة...' : lang === 'it' ? 'Scrivi la nota...' : 'Write a note...'}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-60"
                >
                  {saving ? t('loading') : t('save')}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* فلاتر: الدكتور — المستخدم */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {!isDoctor && (
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
        )}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('patient')}:</label>
          <select
            value={filterPatientId}
            onChange={(e) => setFilterPatientId(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2 min-w-[200px]"
          >
            <option value="">— {lang === 'ar' ? (isDoctor ? 'كل المرضى' : 'كل المستخدمين') : (isDoctor ? (lang === 'it' ? 'Tutti i pazienti' : 'All patients') : 'All users')} —</option>
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
    </div>
  );
}
