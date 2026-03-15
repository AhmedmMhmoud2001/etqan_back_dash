import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import { useTranslation } from '../../translations';
import { get } from '../../api';

export default function AdminDashboard() {
  const { lang } = useLang();
  const t = useTranslation(lang);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetchDashboard = async () => {
      const { res, data } = await get('/admin/dashboard');
      if (cancelled) return;
      if (res.status === 401) {
        navigate('/login', { replace: true });
        return;
      }
      if (!res.ok) {
        setError(data.message || (lang === 'ar' ? 'فشل التحميل' : 'Load failed'));
        setLoading(false);
        return;
      }
      const d = data.data != null ? data.data : data;
      setStats(d);
      setLoading(false);
    };
    fetchDashboard();
    return () => { cancelled = true; };
  }, [navigate, lang]);

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="h-72 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            <div className="h-72 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-8">
        <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-4 rounded-lg">{error}</div>
      </div>
    );
  }

  const usersCount = stats?.usersCount ?? 0;
  const doctorsCount = stats?.doctorsCount ?? 0;
  const adminsCount = stats?.adminsCount ?? 0;
  const mealsCount = stats?.mealsCount ?? 0;
  const exercisesCount = stats?.exercisesCount ?? 0;
  const channelsCount = stats?.channelsCount ?? 0;
  const postsCount = stats?.postsCount ?? 0;
  const nutritionPlansCount = stats?.nutritionPlansCount ?? 0;
  const workoutPlansCount = stats?.workoutPlansCount ?? 0;
  const doctorNotesCount = stats?.doctorNotesCount ?? 0;
  const total =
    usersCount +
    doctorsCount +
    adminsCount +
    mealsCount +
    exercisesCount +
    channelsCount +
    postsCount +
    nutritionPlansCount +
    workoutPlansCount +
    doctorNotesCount || 1;

  const kpiCards = [
    { labelKey: 'users', value: usersCount, icon: '👥', color: 'bg-blue-500', circleBg: 'bg-blue-100 dark:bg-blue-900/40', link: '/admin/users' },
    { labelKey: 'doctors', value: doctorsCount, icon: '🩺', color: 'bg-emerald-500', circleBg: 'bg-emerald-100 dark:bg-emerald-900/40', link: '/admin/doctors' },
    { labelKey: 'admins', value: adminsCount, icon: '⚙️', color: 'bg-amber-500', circleBg: 'bg-amber-100 dark:bg-amber-900/40', link: '/admin/users' },
    { labelKey: 'meals', value: mealsCount, icon: '🍽️', color: 'bg-violet-500', circleBg: 'bg-violet-100 dark:bg-violet-900/40', link: '/admin/meals' },
    { labelKey: 'exercises', value: exercisesCount, icon: '💪', color: 'bg-rose-500', circleBg: 'bg-rose-100 dark:bg-rose-900/40', link: '/admin/exercises' },
    { labelKey: 'channels', value: channelsCount, icon: '💬', color: 'bg-sky-500', circleBg: 'bg-sky-100 dark:bg-sky-900/40', link: '/admin/channels' },
    { labelKey: 'communityPosts', value: postsCount, icon: '📝', color: 'bg-teal-500', circleBg: 'bg-teal-100 dark:bg-teal-900/40', link: '/admin/community-posts' },
    { labelKey: 'nutritionPlans', value: nutritionPlansCount, icon: '🥗', color: 'bg-lime-500', circleBg: 'bg-lime-100 dark:bg-lime-900/40', link: '/admin/nutrition-plans' },
    { labelKey: 'workoutPlans', value: workoutPlansCount, icon: '📅', color: 'bg-orange-500', circleBg: 'bg-orange-100 dark:bg-orange-900/40', link: '/admin/workout-plans' },
    { labelKey: 'doctorNotes', value: doctorNotesCount, icon: '📋', color: 'bg-indigo-500', circleBg: 'bg-indigo-100 dark:bg-indigo-900/40', link: '/admin/doctor-notes' },
  ];

  const chartData = [
    { name: t('users'), value: usersCount, fill: '#3b82f6' },
    { name: t('doctors'), value: doctorsCount, fill: '#10b981' },
    { name: t('admins'), value: adminsCount, fill: '#f59e0b' },
    { name: t('meals'), value: mealsCount, fill: '#8b5cf6' },
    { name: t('exercises'), value: exercisesCount, fill: '#f43f5e' },
    { name: t('channels'), value: channelsCount, fill: '#0ea5e9' },
    { name: t('communityPosts'), value: postsCount, fill: '#14b8a6' },
    { name: t('nutritionPlans'), value: nutritionPlansCount, fill: '#84cc16' },
    { name: t('workoutPlans'), value: workoutPlansCount, fill: '#f97316' },
    { name: t('doctorNotes'), value: doctorNotesCount, fill: '#6366f1' },
  ].filter((d) => d.value > 0);

  const maxBar = Math.max(...chartData.map((d) => d.value), 1);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('dashboardTitle')}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          {lang === 'ar' ? 'نظرة عامة على إحصائيات المنصة والرسوم البيانية' : 'Overview of platform statistics and charts'}
        </p>
      </div>

      {/* بطاقات الإحصائيات — أسلوب Minimal */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpiCards.map((card) => (
          <Link key={card.labelKey} to={card.link} className="block">
          <div
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {t(card.labelKey)}
                </p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{card.value}</p>
              </div>
              <div
                className={`w-12 h-12 rounded-full ${card.circleBg} flex items-center justify-center text-xl shrink-0`}
              >
                {card.icon}
              </div>
            </div>
            {total > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>{lang === 'ar' ? 'نسبة من المجموع' : 'Of total'}</span>
                  <span>{Math.round((card.value / total) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${card.color} rounded-full transition-all duration-500`}
                    style={{ width: `${(card.value / total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          </Link>
        ))}
      </div>

      {/* رسوم بيانية */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* رسم الأعمدة — توزيع المحتوى */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
            {lang === 'ar' ? 'توزيع المحتوى' : 'Content distribution'}
          </h2>
          <div className="space-y-4">
            {chartData.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm py-8 text-center">
                {lang === 'ar' ? 'لا توجد بيانات لعرضها' : 'No data to display'}
              </p>
            ) : (
              chartData.map((item) => (
                <div key={item.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-100">{item.value}</span>
                  </div>
                  <div className="h-8 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-2"
                      style={{
                        width: `${(item.value / maxBar) * 100}%`,
                        backgroundColor: item.fill,
                        minWidth: item.value > 0 ? '2rem' : 0,
                      }}
                    >
                      {item.value > 0 && (
                        <span className="text-xs font-medium text-white drop-shadow">
                          {item.value}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* رسم دائري مبسط — نسبة كل نوع */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
            {lang === 'ar' ? 'نسبة الإحصائيات' : 'Statistics share'}
          </h2>
          {chartData.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm py-8 text-center">
              {lang === 'ar' ? 'لا توجد بيانات' : 'No data'}
            </p>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative w-44 h-44 shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  {chartData.reduce((acc, item) => {
                    const pct = (item.value / total) * 100;
                    const dash = (pct * 100) / 100;
                    const offset = acc.offset;
                    acc.offset += dash;
                    acc.elements.push(
                      <circle
                        key={item.name}
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke={item.fill}
                        strokeWidth="3"
                        strokeDasharray={`${dash} ${100 - dash}`}
                        strokeDashoffset={-offset}
                        className="transition-all duration-700"
                      />
                    );
                    return acc;
                  }, { offset: 0, elements: [] }).elements}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{total}</span>
                </div>
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                {chartData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-300 truncate">{item.name}</span>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-100 ml-auto">
                      {Math.round((item.value / total) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* شريط الأهداف — نسب من هدف افتراضي */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
          {lang === 'ar' ? 'نسبة التحقق من الأهداف' : 'Target progress'}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          {lang === 'ar' ? 'نسبة كل بند من الهدف المرجعي (أعلى قيمة = 100%)' : 'Each item as % of max value (max = 100%)'}
        </p>
        <div className="space-y-4">
          {kpiCards.map((card) => {
            const targetPct = maxBar > 0 ? Math.min(100, Math.round((card.value / maxBar) * 100)) : 0;
            return (
              <div key={card.labelKey}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 dark:text-slate-300">{t(card.labelKey)}</span>
                  <span className="font-medium text-slate-800 dark:text-slate-100">{targetPct}%</span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${card.color} rounded-full transition-all duration-700`}
                    style={{ width: `${targetPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
