import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import { useTranslation } from '../../translations';
import { get, post } from '../../api';

export default function AdminDoctorNotes() {
  const { lang } = useLang();
  const t = useTranslation(lang);
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [error, setError] = useState('');
  const [formContent, setFormContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadPatients = async () => {
    setLoading(true);
    setError('');
    const { res, data } = await get('/admin/users?limit=500&role=USER');
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
    setPatients(d.items || d || []);
    setLoading(false);
  };

  const loadNotes = async () => {
    if (!selectedPatientId) {
      setNotes([]);
      return;
    }
    setLoadingNotes(true);
    const { res, data } = await get(`/doctor-notes/patient/${selectedPatientId}`);
    if (res.status === 401) {
      navigate('/login', { replace: true });
      return;
    }
    if (!res.ok) {
      setNotes([]);
      setLoadingNotes(false);
      return;
    }
    const d = data.data || data;
    setNotes(Array.isArray(d) ? d : (d.notes || d.items || []));
    setLoadingNotes(false);
  };

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    loadNotes();
  }, [selectedPatientId]);

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!selectedPatientId || !formContent.trim()) return;
    setSubmitting(true);
    const { res, data } = await post('/doctor-notes', { patientId: selectedPatientId, content: formContent.trim() });
    if (res.status === 401) {
      navigate('/login', { replace: true });
      return;
    }
    if (!res.ok) {
      setError(data.message || 'Failed to add note');
      setSubmitting(false);
      return;
    }
    setFormContent('');
    setSubmitting(false);
    loadNotes();
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('doctorNotesTitle')}</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{t('doctorNotesDesc')}</p>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">{error}</div>}

      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('patient')}:</label>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2 min-w-[200px]"
          >
            <option value="">— {t('choose')} —</option>
            {patients.map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
            ))}
          </select>
        </div>

        {selectedPatientId && (
          <>
            <form onSubmit={handleCreateNote} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 p-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('content')} (ملاحظة جديدة)</label>
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2 min-h-[80px]"
                placeholder={t('content')}
                required
              />
              <button type="submit" disabled={submitting} className="mt-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">
                {submitting ? t('saving') : t('add')}
              </button>
            </form>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm overflow-hidden">
              <h2 className="px-4 py-3 border-b border-slate-200 dark:border-slate-600 font-medium text-slate-800 dark:text-slate-100">ملاحظات المريض</h2>
              {loadingNotes ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">{t('loading')}</div>
              ) : notes.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">لا توجد ملاحظات</div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-600">
                  {notes.map((note) => (
                    <div key={note.id} className="px-4 py-3">
                      <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{note.content}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {note.createdAt ? new Date(note.createdAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en') : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {!selectedPatientId && !loading && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 p-8 text-center text-slate-500 dark:text-slate-400">
            اختر مريضاً لعرض ملاحظاته أو إضافة ملاحظة
          </div>
        )}
      </div>
    </div>
  );
}
