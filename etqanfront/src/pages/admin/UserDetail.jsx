import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import { useTranslation } from '../../translations';
import { get } from '../../api';
import UserDetailContent from './UserDetailContent';

/** يُستخدم من صفحة المستخدمين لفتح تحرير نفس الحساب بعد العودة */
export const ADMIN_OPEN_USER_EDIT_KEY = 'adminOpenUserEdit';

export default function AdminUserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { lang } = useLang();
  const t = useTranslation(lang);
  const [userDetails, setUserDetails] = useState(null);
  const [workoutSessions, setWorkoutSessions] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const seqRef = useRef(0);

  useEffect(() => {
    if (!userId) {
      setError(lang === 'ar' ? 'معرّف مستخدم غير صالح.' : 'Invalid user id.');
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
        const { res: userRes, data: raw } = await get(`/admin/users/${userId}`);
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
          const forbidden = userRes.status === 403;
          setError(
            raw?.message ||
              (forbidden
                ? lang === 'ar'
                  ? 'غير مصرّح بعرض تفاصيل المستخدمين.'
                  : 'Not allowed to load user details.'
                : t('loadError'))
          );
        }

        let nextSessions = [];
        let nextMeasurements = [];
        if (bodyOk && seq === seqRef.current) {
          const [{ res: sessionsRes, data: sessRaw }, { res: measRes, data: measRaw }] = await Promise.all([
            get(`/admin/users/${userId}/workout-sessions?limit=30`),
            get(`/admin/users/${userId}/measurements?limit=60`),
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
  }, [userId, navigate, lang]);

  const goBack = () => navigate('/admin/users');

  const handleEdit = () => {
    if (!userDetails?.id) return;
    try {
      sessionStorage.setItem(ADMIN_OPEN_USER_EDIT_KEY, userDetails.id);
    } catch {
      void 0;
    }
    navigate('/admin/users');
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <button
            type="button"
            onClick={goBack}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline mb-1"
          >
            ← {lang === 'ar' ? 'العودة إلى المستخدمين' : 'Back to users'}
          </button>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('viewDetails')}</h1>
        </div>
        {userDetails && (
          <button
            type="button"
            onClick={handleEdit}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 text-sm"
          >
            {t('edit')}
          </button>
        )}
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
