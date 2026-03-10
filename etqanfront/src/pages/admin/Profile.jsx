import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import { useTranslation } from '../../translations';
import { getToken, uploadImage } from '../../api';

const API_BASE = '/api';

const LABEL_KEYS = {
  measurementSystem: 'measurementSystem',
  gender: 'gender',
  age: 'age',
  height: 'height',
  weight: 'weight',
  activityLevel: 'activityLevel',
  goal: 'goal',
  targetWeight: 'targetWeight',
  dietaryPreferences: 'dietaryPreferences',
  allergies: 'allergies',
  healthConditions: 'healthConditions',
};

const MEASUREMENT_SYSTEM = [
  { value: 'METRIC', label: 'متري' },
  { value: 'IMPERIAL', label: 'إمبراطوري' },
];
const GENDER = [
  { value: 'MALE', label: 'ذكر' },
  { value: 'FEMALE', label: 'أنثى' },
  { value: 'OTHER', label: 'آخر' },
];
const ACTIVITY_LEVEL = [
  { value: 'SEDENTARY', label: 'قليل الحركة' },
  { value: 'LIGHT', label: 'خفيف (1-3 أيام/أسبوع)' },
  { value: 'MODERATE', label: 'متوسط (3-5 أيام)' },
  { value: 'ACTIVE', label: 'نشط (6-7 أيام)' },
  { value: 'VERY_ACTIVE', label: 'نشط جداً (رياضي)' },
];
const GOAL = [
  { value: 'LOSE_WEIGHT', label: 'إنقاص الوزن' },
  { value: 'MAINTAIN', label: 'المحافظة' },
  { value: 'BUILD_MUSCLE', label: 'بناء العضلات' },
];
const DIETARY_OPTIONS = [
  'BALANCED', 'LOW_CARB', 'HIGH_PROTEIN', 'KETO', 'VEGAN', 'VEGETARIAN', 'PALEO', 'MEDITERRANEAN',
];
const ALLERGY_OPTIONS = [
  'DAIRY', 'EGGS', 'PEANUTS', 'SOY', 'WHEAT', 'TREE_NUTS', 'FISH', 'SHELLFISH',
];
const HEALTH_OPTIONS = [
  'DIABETES', 'HIGH_BLOOD_PRESSURE', 'HIGH_CHOLESTEROL', 'PCOS', 'THYROID_ISSUES', 'HEART_DISEASE',
];

const defaultProfile = {
  imageUrl: '',
  measurementSystem: 'METRIC',
  gender: '',
  age: '',
  height: '',
  weight: '',
  activityLevel: '',
  goal: '',
  targetWeight: '',
  dietaryPreferences: [],
  allergies: [],
  healthConditions: [],
};

export default function AdminProfile() {
  const { lang } = useLang();
  const t = useTranslation(lang);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [imageError, setImageError] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadImageError, setUploadImageError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/profiles/me`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.status === 401) {
          navigate('/login', { replace: true });
          return;
        }
        if (res.status === 404) {
          setProfile(null);
          setForm(defaultProfile);
          return;
        }
        if (!res.ok) throw new Error(t('loadError'));
        const json = await res.json();
        const p = json.data || json;
        setProfile(p);
        setImageError(false);
        setForm({
          imageUrl: p.imageUrl ?? '',
          measurementSystem: p.measurementSystem ?? 'METRIC',
          gender: p.gender ?? '',
          age: p.age ?? '',
          height: p.height ?? '',
          weight: p.weight ?? '',
          activityLevel: p.activityLevel ?? '',
          goal: p.goal ?? '',
          targetWeight: p.targetWeight ?? '',
          dietaryPreferences: Array.isArray(p.dietaryPreferences) ? p.dietaryPreferences : [],
          allergies: Array.isArray(p.allergies) ? p.allergies : [],
          healthConditions: Array.isArray(p.healthConditions) ? p.healthConditions : [],
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
    setSuccessMsg('');
  };

  const toggleArray = (field, value) => {
    setForm((prev) => {
      const arr = prev[field] || [];
      const next = arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
      return { ...prev, [field]: next };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const payload = {
        imageUrl: form.imageUrl && form.imageUrl.trim() ? form.imageUrl.trim() : undefined,
        measurementSystem: form.measurementSystem || undefined,
        gender: form.gender || undefined,
        age: form.age ? Number(form.age) : undefined,
        height: form.height ? Number(form.height) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        activityLevel: form.activityLevel || undefined,
        goal: form.goal || undefined,
        targetWeight: form.targetWeight ? Number(form.targetWeight) : undefined,
        dietaryPreferences: form.dietaryPreferences.length ? form.dietaryPreferences : undefined,
        allergies: form.allergies.length ? form.allergies : undefined,
        healthConditions: form.healthConditions.length ? form.healthConditions : undefined,
      };
      const res = await fetch(`${API_BASE}/profiles/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.status === 401) { navigate('/login', { replace: true }); return; }
      if (!res.ok) throw new Error(data.message || 'فشل الحفظ');
      setProfile(data.data || data);
      setSuccessMsg(t('saveSuccess'));
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
          <div className="h-12 bg-slate-200 rounded" />
          <div className="h-12 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t('profileTitle')}</h1>
      <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
        {t('profileDesc')}
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">{error}</div>
      )}
      {successMsg && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm">{successMsg}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex flex-col sm:flex-row items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600">
          <div className="shrink-0">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center">
              {form.imageUrl && !imageError ? (
                <img src={form.imageUrl} alt="" className="w-full h-full object-cover" onError={() => setImageError(true)} />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-3xl text-slate-400 dark:text-slate-500" aria-hidden>👤</span>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0 w-full sm:w-auto">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{t('profilePicture')}</label>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              className="w-full text-sm text-slate-600 dark:text-slate-300 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-100 file:text-primary-700 dark:file:bg-primary-900/50 dark:file:text-primary-300"
              disabled={uploadingImage}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                setImageError(false);
                setUploadImageError('');
                setUploadingImage(true);
                const { res, data, url } = await uploadImage(file);
                setUploadingImage(false);
                if (res.status === 401) {
                  navigate('/login', { replace: true });
                  return;
                }
                if (res.ok && url) {
                  handleChange('imageUrl', url);
                } else {
                  setUploadImageError(data?.message || t('loadError'));
                }
              }}
            />
            {uploadingImage && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{lang === 'ar' ? 'جاري رفع الصورة...' : 'Uploading...'}</p>}
            {uploadImageError && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{uploadImageError}</p>}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('profilePictureHintUpload')}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{t('measurementSystem')}</label>
          <select
            value={form.measurementSystem}
            onChange={(e) => handleChange('measurementSystem', e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {MEASUREMENT_SYSTEM.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{t('gender')}</label>
          <select
            value={form.gender}
            onChange={(e) => handleChange('gender', e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">{t('choose')}</option>
            {GENDER.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{t('age')}</label>
            <input
              type="number"
              min={1}
              max={150}
              value={form.age}
              onChange={(e) => handleChange('age', e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{t('height')}</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={form.height}
              onChange={(e) => handleChange('height', e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{t('weight')}</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={form.weight}
              onChange={(e) => handleChange('weight', e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{t('targetWeight')}</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={form.targetWeight}
              onChange={(e) => handleChange('targetWeight', e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{t('activityLevel')}</label>
          <select
            value={form.activityLevel}
            onChange={(e) => handleChange('activityLevel', e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">{t('choose')}</option>
            {ACTIVITY_LEVEL.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{t('goal')}</label>
          <select
            value={form.goal}
            onChange={(e) => handleChange('goal', e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">{t('choose')}</option>
            {GOAL.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t('dietaryPreferences')}</label>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((opt) => (
              <label key={opt} className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.dietaryPreferences.includes(opt)}
                  onChange={() => toggleArray('dietaryPreferences', opt)}
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">{opt.replace(/_/g, ' ')}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t('allergies')}</label>
          <div className="flex flex-wrap gap-2">
            {ALLERGY_OPTIONS.map((opt) => (
              <label key={opt} className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.allergies.includes(opt)}
                  onChange={() => toggleArray('allergies', opt)}
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">{opt.replace(/_/g, ' ')}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{t('healthConditions')}</label>
          <div className="flex flex-wrap gap-2">
            {HEALTH_OPTIONS.map((opt) => (
              <label key={opt} className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.healthConditions.includes(opt)}
                  onChange={() => toggleArray('healthConditions', opt)}
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">{opt.replace(/_/g, ' ')}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? t('saving') : t('saveProfile')}
          </button>
        </div>
      </form>
    </div>
  );
}
