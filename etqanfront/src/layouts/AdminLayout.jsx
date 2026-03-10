import { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LangContext';
import { useTranslation } from '../translations';
import { get } from '../api';

// أيقونات السايدبار (SVG) — حجم موحد للقائمة
const iconClass = 'w-5 h-5 shrink-0';
const IconDashboard = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
);
const IconUsers = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
);
const IconDoctors = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
);
const IconMeals = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
);
const IconExercises = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
);
const IconNutritionPlans = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
);
const IconWorkoutPlans = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
);
const IconChannels = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
);
const IconDoctorNotes = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
);
const IconCommunityPosts = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
);
const IconBell = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
);
const IconProfile = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
);
const IconLogout = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
);

const navItems = [
  { to: '/admin/dashboard', labelKey: 'dashboard', Icon: IconDashboard },
  { to: '/admin/users', labelKey: 'users', Icon: IconUsers },
  { to: '/admin/doctors', labelKey: 'doctors', Icon: IconDoctors },
  { to: '/admin/meals', labelKey: 'meals', Icon: IconMeals },
  { to: '/admin/exercises', labelKey: 'exercises', Icon: IconExercises },
  { to: '/admin/nutrition-plans', labelKey: 'nutritionPlans', Icon: IconNutritionPlans },
  { to: '/admin/workout-plans', labelKey: 'workoutPlans', Icon: IconWorkoutPlans },
  { to: '/admin/channels', labelKey: 'channels', Icon: IconChannels },
  { to: '/admin/doctor-notes', labelKey: 'doctorNotes', Icon: IconDoctorNotes },
  { to: '/admin/community-posts', labelKey: 'communityPosts', Icon: IconCommunityPosts },
  { to: '/admin/notifications', labelKey: 'notifications', Icon: IconBell },
  { to: '/admin/profile', labelKey: 'profile', Icon: IconProfile },
];

// أيقونات الهيدر (SVG)
const IconSun = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);
const IconMoon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);
const IconLang = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
  </svg>
);

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { darkMode, setDarkMode } = useTheme();
  const { lang, setLang } = useLang();
  const t = useTranslation(lang);
  const navigate = useNavigate();

  const fetchUnreadCount = useCallback(async () => {
    const { res, data } = await get('/notifications/unread-count');
    if (res.ok) {
      const count = (data.data || data).unreadCount ?? 0;
      setUnreadNotifications(count);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    const onFocus = () => fetchUnreadCount();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchUnreadCount]);

  useEffect(() => {
    const onNotificationsUpdated = () => fetchUnreadCount();
    window.addEventListener('notifications-updated', onNotificationsUpdated);
    return () => window.removeEventListener('notifications-updated', onNotificationsUpdated);
  }, [fetchUnreadCount]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleTheme = () => setDarkMode((v) => !v);
  const toggleLang = () => setLang((l) => (l === 'ar' ? 'en' : 'ar'));

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();
  const userInitial = (user.name || user.email || '?').charAt(0).toUpperCase();

  return (
    <div className={`min-h-screen flex bg-gray-100 dark:bg-gray-900 transition-colors ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar: فاتح في الوضع النهاري، داكن في الوضع الليلي */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } flex flex-col transition-all duration-300 ease-in-out
          bg-slate-100 dark:bg-slate-800
          text-slate-800 dark:text-white
          border-slate-200 dark:border-slate-700 border-e`}
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          {sidebarOpen && <span className="font-bold text-lg">Etqan</span>}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 transition-colors ${
                  !sidebarOpen ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                }`
              }
            >
              <span className="relative inline-flex">
                <item.Icon />
                {item.to === '/admin/notifications' && unreadNotifications > 0 && (
                  <span className="absolute -top-1 -end-1 min-w-[1rem] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-semibold">
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </span>
                )}
              </span>
              {sidebarOpen && <span>{t(item.labelKey)}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-red-500 dark:hover:bg-red-600 text-slate-800 dark:text-white transition-colors"
          >
            <IconLogout />
            {sidebarOpen && <span>{t('logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto flex flex-col">
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 shadow-sm flex items-center justify-between">
          <p className="text-slate-600 dark:text-slate-300 text-sm">{t('headerSubtitle')}</p>
          <div className="flex items-center gap-1">
            {/* تحويل اللغة — أيقونة فقط */}
            <button
              type="button"
              onClick={toggleLang}
              className="p-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title={lang === 'ar' ? 'English' : 'العربية'}
              aria-label={lang === 'ar' ? t('switchToEnglish') : t('switchToArabic')}
            >
              <IconLang />
            </button>
            {/* الوضع الليلي/النهاري — أيقونة فقط */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title={darkMode ? t('lightMode') : t('darkMode')}
              aria-label={darkMode ? t('lightMode') : t('darkMode')}
            >
              {darkMode ? <IconSun /> : <IconMoon />}
            </button>
            {/* الإشعارات — تؤدي لصفحة الإشعارات + شارة بعدد الجديد */}
            <NavLink
              to="/admin/notifications"
              className="p-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors relative inline-flex items-center justify-center"
              title={t('notifications')}
              aria-label={t('notifications')}
            >
              <IconBell />
              {unreadNotifications > 0 && (
                <span
                  className="absolute -top-0.5 -end-0.5 min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-semibold"
                  aria-label={unreadNotifications}
                >
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </NavLink>
            {/* البروفايل — صورة/أيقونة تؤدي للبروفايل */}
            <NavLink
              to="/admin/profile"
              className="flex items-center justify-center w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors shrink-0"
              title={t('profile')}
              aria-label={t('profile')}
            >
              {user.avatarUrl || user.imageUrl ? (
                <img
                  src={user.avatarUrl || user.imageUrl}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <span className="text-sm font-semibold">{userInitial}</span>
              )}
            </NavLink>
          </div>
        </header>
        <div className="flex-1 bg-gray-100 dark:bg-gray-900">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
