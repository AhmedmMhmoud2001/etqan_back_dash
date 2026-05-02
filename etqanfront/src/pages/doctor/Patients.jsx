import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import { useTranslation } from '../../translations';
import { get } from '../../api';

export default function DoctorPatients() {
  const { lang } = useLang();
  const t = useTranslation(lang);
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { res, data } = await get('/doctors/me/patients?limit=500');
        if (cancelled) return;
        if (res.status === 401) { navigate('/login', { replace: true }); return; }
        if (!res.ok) {
          setError(data.message || t('loadError'));
          setItems([]);
          setLoading(false);
          return;
        }
        const d = data.data || data;
        setItems(d.items || d || []);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setItems([]);
        setLoading(false);
        setError(
          lang === 'ar'
            ? 'تعذّر الاتصال بالسيرفر. تأكد أن الـ Backend يعمل على المنفذ 3000.'
            : lang === 'it'
              ? 'Impossibile connettersi al server. Assicurati che il backend sia in esecuzione sulla porta 3000.'
              : 'Could not connect to the server. Make sure the backend is running on port 3000.'
        );
        void e;
      }
    };
    load();
    return () => { cancelled = true; };
  }, [navigate, t]);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          {lang === 'ar' ? 'مرضاي' : lang === 'it' ? 'I miei pazienti' : 'My patients'}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
          {lang === 'ar' ? 'قائمة المرضى المرتبطين بك فقط.' : lang === 'it' ? 'Elenco dei pazienti associati a te.' : 'Only the patients assigned to you.'}
        </p>
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
                  <th className="px-4 py-3 font-medium text-start">{t('name')}</th>
                  <th className="px-4 py-3 font-medium text-start">{t('email')}</th>
                  <th className="px-4 py-3 font-medium text-start">{t('status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-600 text-start">
                {items.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{u.name || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{u.email || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{u.isActive ? t('active') : t('inactive')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length === 0 && (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">{t('none')}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

