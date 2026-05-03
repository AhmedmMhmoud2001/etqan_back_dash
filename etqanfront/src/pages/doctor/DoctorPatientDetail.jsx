import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import { useTranslation } from '../../translations';
import { get } from '../../api';
import UserDetailContent from '../admin/UserDetailContent';

export default function DoctorPatientDetail() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { lang } = useLang();
  const t = useTranslation(lang);
  const [userDetails, setUserDetails] = useState(null);
  const [workoutSessions, setWorkoutSessions] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const seqRef = useRef(0);

  const title =
    lang === 'ar' ? 'ملفّ المريض' : lang === 'it' ? 'Scheda paziente' : 'Patient file';
  const backLabel =
    lang === 'ar' ? 'العودة إلى مرضاي' : lang === 'it' ? 'Torna ai pazienti' : 'Back to my patients';

  useEffect(() => {
    if (!patientId) {
      setError(lang === 'ar' ? 'معرّف مريض غير صالح.' : 'Invalid patient id.');
      setLoading(false);
      return;
    }
    const seq = ++seqRef.current;
    setLoading(true);
    setError('');
    setUserDetails(null);
    setWorkoutSessions([]);
    setMeasurements([]);

    (async () => {
      try {
        const { res: userRes, data: raw } = await get(`/doctors/me/patients/${patientId}`);
        if (seq !== seqRef.current) return;
        if (userRes.status === 401) {
          navigate('/login', { replace: true });
          return;
        }
        const bodyOk =
          userRes.ok && raw && raw.success !== false && raw.data && typeof raw.data === 'object' && raw.data.id;
        if (bodyOk) {
          setUserDetails(raw.data);
        } else {
          setUserDetails(null);
          const notFound = userRes.status === 404;
          const forbidden = userRes.status === 403;
          setError(
            raw?.message ||
              (notFound || forbidden
                ? lang === 'ar'
                  ? 'المريض غير موجود أو غير مسجَّل ضمن قائمتك.'
                  : lang === 'it'
                    ? 'Paziente non trovato o non assegnato a te.'
                    : 'Patient not found or not assigned to you.'
                : t('loadError'))
          );
        }

        let nextSessions = [];
        let nextMeasurements = [];
        if (bodyOk && seq === seqRef.current) {
          const [{ res: sessionsRes, data: sessRaw }, { res: measRes, data: measRaw }] = await Promise.all([
            get(`/doctors/me/patients/${patientId}/workout-sessions?limit=30`),
            get(`/doctors/me/patients/${patientId}/measurements?limit=60`),
          ]);
          if (seq !== seqRef.current) return;
          if (sessionsRes.ok && sessRaw?.success !== false) {
            nextSessions = sessRaw?.data?.sessions || sessRaw?.sessions || [];
          }
          if (measRes.ok && measRaw?.success !== false) {
            nextMeasurements = measRaw?.data?.measurements || measRaw?.measurements || [];
          }
        }
        setWorkoutSessions(nextSessions);
        setMeasurements(nextMeasurements);
      } catch {
        if (seq !== seqRef.current) return;
        setUserDetails(null);
        setError(t('loadError'));
      } finally {
        if (seq === seqRef.current) setLoading(false);
      }
    })();
  }, [patientId, navigate, lang]);

  const goBack = () => navigate('/admin/patients');

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <button
            type="button"
            onClick={goBack}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline mb-1"
          >
            ← {backLabel}
          </button>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{title}</h1>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm p-6">
        {loading ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400">{t('loading')}</div>
        ) : userDetails ? (
          <UserDetailContent
            userDetails={userDetails}
            workoutSessions={workoutSessions}
            measurements={measurements}
            lang={lang}
            t={t}
          />
        ) : (
          <p className="text-slate-500 dark:text-slate-400 py-4">{error || t('loadError')}</p>
        )}
      </div>
    </div>
  );
}
