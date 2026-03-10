import { useState, useEffect } from 'react';
import { useLang } from '../../context/LangContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../translations';

const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'العربية' },
];

export default function AdminSettings() {
  const { lang } = useLang();
  const { darkMode, setDarkMode } = useTheme();
  const t = useTranslation(lang);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [language, setLanguage] = useState('ar');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/profiles/me`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.status === 404) {
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error(t('loadError'));
        const json = await res.json();
        const p = json.data || json;
        setNotificationsEnabled(p.notificationsEnabled !== false);
        if (p.darkMode === true) setDarkMode(true);
        else if (p.darkMode === false) setDarkMode(false);
        setLanguage(p.language || 'ar');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_BASE}/profiles/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          notificationsEnabled,
          darkMode,
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل الحفظ');
      setSuccessMsg(t('settingsSaveSuccess'));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48" />
          <div className="h-14 bg-slate-200 rounded" />
          <div className="h-14 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-xl">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t('settingsTitle')}</h1>
      <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
        {t('settingsDesc')}
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">{error}</div>
      )}
      {successMsg && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm">{successMsg}</div>
      )}

      <div className="space-y-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 p-6 shadow-sm">
        {/* Notifications */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-100">{t('notificationsLabel')}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('notificationsDesc')}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={notificationsEnabled}
            onClick={() => setNotificationsEnabled((v) => !v)}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              notificationsEnabled ? 'bg-primary-600' : 'bg-slate-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition ${
                notificationsEnabled ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Dark mode */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-100">{t('darkModeLabel')}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('darkModeDesc')}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={darkMode}
            onClick={() => setDarkMode((v) => !v)}
            title={darkMode ? t('lightMode') : t('darkMode')}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              darkMode ? 'bg-primary-600' : 'bg-slate-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition ${
                darkMode ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Language */}
        <div>
          <label className="block font-medium text-slate-800 dark:text-slate-100 mb-2">{t('language')}</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {LANGUAGES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? t('saving') : t('saveSettings')}
          </button>
        </div>
      </div>
    </div>
  );
}
