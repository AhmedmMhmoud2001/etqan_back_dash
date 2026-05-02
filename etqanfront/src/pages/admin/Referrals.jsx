import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import { useTranslation } from '../../translations';
import { get, patch } from '../../api';

export default function AdminReferrals() {
  const { lang } = useLang();
  const t = useTranslation(lang);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState(null);
  const [settingsForm, setSettingsForm] = useState({ discountPercentPerReferral: '', maxDiscountPercent: '' });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');

  const me = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
  const isAdmin = me?.role === 'ADMIN';

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      if (!isAdmin) {
        navigate('/admin/dashboard', { replace: true });
        return;
      }
      const s = await get('/admin/referrals/settings');
      if (cancelled) return;
      if (s.res.status === 401) { navigate('/login', { replace: true }); return; }
      if (!s.res.ok) {
        setError(s.data?.message || t('loadError'));
        setLoading(false);
        return;
      }
      const sd = s.data.data || s.data;
      setSettings(sd);
      setSettingsForm({
        discountPercentPerReferral: String(sd.discountPercentPerReferral ?? ''),
        maxDiscountPercent: String(sd.maxDiscountPercent ?? ''),
      });
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [navigate, lang]);

  const saveSettings = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSettingsSaving(true);
    setSettingsMsg('');
    try {
      const body = {
        discountPercentPerReferral: Number(settingsForm.discountPercentPerReferral),
        maxDiscountPercent: Number(settingsForm.maxDiscountPercent),
      };
      const { res, data: payload } = await patch('/admin/referrals/settings', body);
      if (res.status === 401) { navigate('/login', { replace: true }); return; }
      if (!res.ok) throw new Error(payload.message || t('saveError'));
      const sd = payload.data || payload;
      setSettings(sd);
      setSettingsMsg(t('saved'));
      setTimeout(() => setSettingsMsg(''), 1500);
    } catch (err) {
      setSettingsMsg(err.message);
    } finally {
      setSettingsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48" />
          <div className="h-40 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl" />
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

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('referrals')}</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{t('referralsAdminDesc')}</p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t('referralSettings')}</p>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{t('referralSettingsDesc')}</p>
          </div>
          {settings && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t('current')}: {settings.discountPercentPerReferral}% / {t('max')}: {settings.maxDiscountPercent}%
            </span>
          )}
        </div>

        <form onSubmit={saveSettings} className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('discountPerReferral')}</label>
            <input
              type="number"
              min="0"
              max="100"
              value={settingsForm.discountPercentPerReferral}
              onChange={(e) => setSettingsForm((f) => ({ ...f, discountPercentPerReferral: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('maxDiscount')}</label>
            <input
              type="number"
              min="0"
              max="100"
              value={settingsForm.maxDiscountPercent}
              onChange={(e) => setSettingsForm((f) => ({ ...f, maxDiscountPercent: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2"
              required
            />
          </div>
          <button
            type="submit"
            disabled={settingsSaving}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {settingsSaving ? t('saving') : t('save')}
          </button>
        </form>

        {settingsMsg && (
          <p className={`mt-3 text-sm ${settingsMsg === t('saved') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {settingsMsg}
          </p>
        )}
      </div>
    </div>
  );
}

