import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import { useTranslation } from '../../translations';
import { get, post, patch, del, uploadImage, resolveMediaUrl } from '../../api';
import { IconEdit, IconDelete, IconAssignDoctor, IconDeactivate, IconActivate, IconView } from '../../components/ActionIcons';
import { ADMIN_OPEN_USER_EDIT_KEY } from './UserDetail';

const MEASUREMENT_SYSTEM = [{ value: 'METRIC', label: 'متري' }, { value: 'IMPERIAL', label: 'إمبراطوري' }];
const GENDER = [{ value: 'MALE', label: 'ذكر' }, { value: 'FEMALE', label: 'أنثى' }, { value: 'OTHER', label: 'آخر' }];
const ACTIVITY_LEVEL = [
  { value: 'SEDENTARY', label: 'قليل الحركة' }, { value: 'LIGHT', label: 'خفيف' }, { value: 'MODERATE', label: 'متوسط' },
  { value: 'ACTIVE', label: 'نشط' }, { value: 'VERY_ACTIVE', label: 'نشط جداً' },
];
const GOAL = [
  { value: 'LOSE_WEIGHT', label: 'إنقاص الوزن' }, { value: 'MAINTAIN', label: 'المحافظة' }, { value: 'BUILD_MUSCLE', label: 'بناء العضلات' },
];
const DIETARY_OPTIONS = ['BALANCED', 'LOW_CARB', 'HIGH_PROTEIN', 'KETO', 'VEGAN', 'VEGETARIAN', 'PALEO', 'MEDITERRANEAN'];
const ALLERGY_OPTIONS = ['DAIRY', 'EGGS', 'PEANUTS', 'SOY', 'WHEAT', 'TREE_NUTS', 'FISH', 'SHELLFISH'];
const HEALTH_OPTIONS = ['DIABETES', 'HIGH_BLOOD_PRESSURE', 'HIGH_CHOLESTEROL', 'PCOS', 'THYROID_ISSUES', 'HEART_DISEASE'];
const ROLES = [{ value: 'USER', label: 'مستخدم' }, { value: 'DOCTOR', label: 'دكتور' }, { value: 'ADMIN', label: 'أدمن' }];

export default function AdminUsers() {
  const { lang } = useLang();
  const t = useTranslation(lang);
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState(''); // قيمة حقل البحث (للتأخير عند الكتابة)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // 'create' | 'edit' | 'assign' | null
  const [selected, setSelected] = useState(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({
    name: '', email: '', password: '', isActive: true, doctorId: '', role: 'USER', emailVerified: false,
    imageUrl: '', measurementSystem: 'METRIC', gender: '', age: '', height: '', weight: '', targetWeight: '',
    activityLevel: '', goal: '', language: 'en', notificationsEnabled: true, darkMode: false,
    dietaryPreferences: [], allergies: [], healthConditions: [],
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    let url = `/admin/users?page=${page}&limit=${limit}`;
    if (roleFilter) url += `&role=${encodeURIComponent(roleFilter)}`;
    if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
    const { res, data } = await get(url);
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
    setItems(d.items || []);
    setTotal(d.total ?? 0);
    setLoading(false);
  };

  const loadDoctors = async () => {
    const { res, data } = await get('/admin/doctors?limit=500');
    if (res.ok) {
      const d = data.data || data;
      setDoctors(d.items || d || []);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, roleFilter, searchQuery]);

  // بحث بتأخير بسيط عند الكتابة مع إعادة الصفحة لـ 1
  useEffect(() => {
    const timer = setTimeout(() => {
      const q = searchInput.trim();
      setSearchQuery(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (modal === 'assign' || modal === 'edit') loadDoctors();
  }, [modal]);

  const openCreate = () => {
    setForm({ name: '', email: '', password: '', isActive: true });
    setSelected(null);
    setModal('create');
  };

  const openEdit = async (user) => {
    setSelected(user);
    setModal('edit');
    setLoadingEdit(true);
    const { res, data } = await get(`/admin/users/${user.id}`);
    setLoadingEdit(false);
    if (res.status === 401) {
      navigate('/login', { replace: true });
      return;
    }
    const u = res.ok ? (data.data || data) : user;
    setSelected(u);
    const p = u.profile || {};
    setForm({
      name: u.name ?? '',
      email: u.email ?? '',
      password: '',
      isActive: u.isActive !== false,
      doctorId: u.doctorId || u.doctor?.id || '',
      role: u.role || 'USER',
      emailVerified: u.emailVerified === true,
      imageUrl: p.imageUrl ?? '',
      measurementSystem: p.measurementSystem ?? 'METRIC',
      gender: p.gender ?? '',
      age: p.age ?? '',
      height: p.height ?? '',
      weight: p.weight ?? '',
      targetWeight: p.targetWeight ?? '',
      activityLevel: p.activityLevel ?? '',
      goal: p.goal ?? '',
      language: p.language ?? 'en',
      notificationsEnabled: p.notificationsEnabled !== false,
      darkMode: p.darkMode === true,
      dietaryPreferences: Array.isArray(p.dietaryPreferences) ? p.dietaryPreferences : [],
      allergies: Array.isArray(p.allergies) ? p.allergies : [],
      healthConditions: Array.isArray(p.healthConditions) ? p.healthConditions : [],
    });
  };

  /** عودة من صفحة التفاصيل مع طلب تحرير (زر «تحرير» في AdminUserDetail). */
  useEffect(() => {
    let storedId = '';
    try {
      storedId = sessionStorage.getItem(ADMIN_OPEN_USER_EDIT_KEY) || '';
    } catch {
      return;
    }
    if (!storedId) return;
    try {
      sessionStorage.removeItem(ADMIN_OPEN_USER_EDIT_KEY);
    } catch {
      void 0;
    }
    openEdit({ id: storedId });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- تشغيل مرة عند فتح قائمة المستخدمين فقط
  }, []);

  const openAssign = (user) => {
    setSelected(user);
    setForm({ doctorId: user.doctorId || user.doctor?.id || '' });
    setModal('assign');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return;
    const { res, data } = await post('/admin/users', {
      name: form.name,
      email: form.email,
      password: form.password,
    });
    if (res.status === 401) {
      navigate('/login', { replace: true });
      return;
    }
    if (!res.ok) {
      setError(data.message || 'Failed to create');
      return;
    }
    setModal(null);
    loadUsers();
  };

  const toggleProfileArray = (field, value) => {
    setForm((prev) => {
      const arr = prev[field] || [];
      const next = arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
      return { ...prev, [field]: next };
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selected) return;
    const accountBody = {
      name: form.name,
      email: form.email,
      isActive: form.isActive,
      role: form.role,
      emailVerified: form.emailVerified,
      doctorId: form.doctorId || null,
    };
    if (form.password) accountBody.password = form.password;
    const { res, data } = await patch(`/admin/users/${selected.id}`, accountBody);
    if (res.status === 401) {
      navigate('/login', { replace: true });
      return;
    }
    if (!res.ok) {
      setError(data.message || 'Failed to update');
      return;
    }
    const profileBody = {
      imageUrl: form.imageUrl || undefined,
      measurementSystem: form.measurementSystem || undefined,
      gender: form.gender || undefined,
      age: form.age ? Number(form.age) : undefined,
      height: form.height ? Number(form.height) : undefined,
      weight: form.weight ? Number(form.weight) : undefined,
      targetWeight: form.targetWeight ? Number(form.targetWeight) : undefined,
      activityLevel: form.activityLevel || undefined,
      goal: form.goal || undefined,
      language: form.language || undefined,
      notificationsEnabled: form.notificationsEnabled,
      darkMode: form.darkMode,
      dietaryPreferences: form.dietaryPreferences?.length ? form.dietaryPreferences : undefined,
      allergies: form.allergies?.length ? form.allergies : undefined,
      healthConditions: form.healthConditions?.length ? form.healthConditions : undefined,
    };
    const { res: resProfile } = await patch(`/admin/users/${selected.id}/profile`, profileBody);
    if (resProfile.status === 401) {
      navigate('/login', { replace: true });
      return;
    }
    if (!resProfile.ok) {
      const errData = await resProfile.json().catch(() => ({}));
      setError(errData.message || 'Failed to update profile');
      return;
    }
    setModal(null);
    loadUsers();
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selected) return;
    if (!form.doctorId) {
      const { res, data } = await patch(`/admin/users/${selected.id}`, { doctorId: null });
      if (res.status === 401) { navigate('/login', { replace: true }); return; }
      if (!res.ok) { setError(data.message || 'Failed'); return; }
      setModal(null);
      loadUsers();
      return;
    }
    const { res, data } = await patch(`/admin/users/${selected.id}/assign-doctor`, { doctorId: form.doctorId });
    if (res.status === 401) { navigate('/login', { replace: true }); return; }
    if (!res.ok) { setError(data.message || 'Failed to assign'); return; }
    setModal(null);
    loadUsers();
  };

  const handleToggleActive = async (user) => {
    const { res } = await patch(`/admin/users/${user.id}/toggle-active`, {});
    if (res.status === 401) {
      navigate('/login', { replace: true });
      return;
    }
    if (res.ok) loadUsers();
  };

  const handleDelete = async (user) => {
    if (!window.confirm(t('confirmDelete') || `Delete ${user.name}?`)) return;
    const { res } = await del(`/admin/users/${user.id}`);
    if (res.status === 401) {
      navigate('/login', { replace: true });
      return;
    }
    if (res.ok) loadUsers();
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('usersTitle')}</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{t('usersDesc')}</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 shrink-0"
          >
            {t('add')} {t('users')}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm min-w-[140px]"
            title={t('role')}
          >
            <option value="">{t('all')} ({t('role')})</option>
            <option value="USER">{t('users')} (USER)</option>
            <option value="DOCTOR">{t('doctors')} (DOCTOR)</option>
            <option value="ADMIN">{t('admins')} (ADMIN)</option>
          </select>
          <input
            type="text"
            placeholder={t('searchByNameOrEmail')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm w-56 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          {(roleFilter || searchQuery) && (
            <button
              type="button"
              onClick={() => { setRoleFilter(''); setSearchInput(''); setSearchQuery(''); setPage(1); }}
              className="text-sm text-slate-600 dark:text-slate-300 hover:underline"
            >
              {t('clearFilters')}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">{t('loading')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-sm text-start">
                <tr>
                  <th className="px-4 py-3 font-medium text-start w-14">{lang === 'ar' ? 'الصورة' : 'Photo'}</th>
                  <th className="px-4 py-3 font-medium text-start">{t('name')}</th>
                  <th className="px-4 py-3 font-medium text-start">{t('email')}</th>
                  <th className="px-4 py-3 font-medium text-start">{t('role')}</th>
                  <th className="px-4 py-3 font-medium text-start">{t('doctor')}</th>
                  <th className="px-4 py-3 font-medium text-start">{t('status')}</th>
                  <th className="px-4 py-3 font-medium text-start">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-600 text-start">
                {items.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-start">
                      {user.profile?.imageUrl || user.imageUrl ? (
                        <img src={resolveMediaUrl(user.profile?.imageUrl || user.imageUrl)} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-600" />
                      ) : (
                        <span className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 inline-flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm font-medium shrink-0">{(user.name || '?').charAt(0).toUpperCase()}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-start text-slate-800 dark:text-slate-200">{user.name}</td>
                    <td className="px-4 py-3 text-start text-slate-600 dark:text-slate-300">{user.email}</td>
                    <td className="px-4 py-3 text-start">{user.role}</td>
                    <td className="px-4 py-3 text-start text-slate-600 dark:text-slate-300">
                      {user.doctor?.user?.name || user.doctor?.title || '—'}
                    </td>
                    <td className="px-4 py-3 text-start">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          user.isActive !== false
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {user.isActive !== false ? t('active') : t('inactive')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-start">
                      <div className="flex flex-wrap gap-1 justify-end items-center">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/users/${user.id}`)}
                          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title={t('viewDetails') || 'عرض التفاصيل'}
                          aria-label={t('viewDetails') || 'View details'}
                        >
                          <IconView />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(user)}
                          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title={t('edit')}
                          aria-label={t('edit')}
                        >
                          <IconEdit />
                        </button>
                        <button
                          type="button"
                          onClick={() => openAssign(user)}
                          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title={t('assignDoctor')}
                          aria-label={t('assignDoctor')}
                        >
                          <IconAssignDoctor />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(user)}
                          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title={user.isActive !== false ? t('deactivate') : t('activate')}
                          aria-label={user.isActive !== false ? t('deactivate') : t('activate')}
                        >
                          {user.isActive !== false ? <IconDeactivate /> : <IconActivate />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(user)}
                          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title={t('delete')}
                          aria-label={t('delete')}
                        >
                          <IconDelete />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && total > limit && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-600 flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t('total')}: {total}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 rounded border border-slate-300 dark:border-slate-500 disabled:opacity-50"
              >
                {t('previous')}
              </button>
              <span className="px-3 py-1 text-sm">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded border border-slate-300 dark:border-slate-500 disabled:opacity-50"
              >
                {t('next')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Create */}
      {modal === 'create' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setModal(null)}>
          <div
            className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">{t('add')} {t('users')}</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('name')}</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('email')}</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('password')}</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2"
                  required
                  minLength={8}
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-500">
                  {t('cancel')}
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit — بيانات الحساب + البروفايل */}
      {modal === 'edit' && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setModal(null)}>
          <div
            className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">{t('edit')} — {selected.name}</h2>
            {loadingEdit ? (
              <div className="py-8 text-center text-slate-500 dark:text-slate-400">{t('loading')}</div>
            ) : (
              <form onSubmit={handleUpdate} className="space-y-6">
                {/* بيانات الحساب */}
                <section>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-600 pb-2 mb-3">{lang === 'ar' ? 'بيانات الحساب' : 'Account'}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('name')}</label>
                      <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('email')}</label>
                      <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('role')}</label>
                      <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2">
                        {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('password')} ({lang === 'ar' ? 'اختياري' : 'optional'})</label>
                      <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder={lang === 'ar' ? 'اتركه فارغاً لعدم التغيير' : 'Leave blank'} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2" minLength={8} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('doctor')}</label>
                      <select value={form.doctorId} onChange={(e) => setForm((f) => ({ ...f, doctorId: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2">
                        <option value="">— {t('none')} —</option>
                        {doctors.map((d) => <option key={d.id} value={d.id}>{d.user?.name || d.title}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="rounded border-slate-300 text-primary-600" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{t('active')}</span>
                      </label>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.emailVerified} onChange={(e) => setForm((f) => ({ ...f, emailVerified: e.target.checked }))} className="rounded border-slate-300 text-primary-600" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{lang === 'ar' ? 'البريد موثّق' : 'Email verified'}</span>
                      </label>
                    </div>
                  </div>
                </section>

                {/* البروفايل والهدف */}
                <section>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-600 pb-2 mb-3">{lang === 'ar' ? 'البروفايل والهدف' : 'Profile & goals'}</h3>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-4 items-start">
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0">
                        {form.imageUrl ? <img src={resolveMediaUrl(form.imageUrl)} alt="" className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center text-2xl text-slate-400">👤</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('profilePicture')}</label>
                        <input type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" className="w-full text-sm file:mr-2 file:py-1.5 file:px-2 file:rounded file:border-0 file:bg-primary-100 file:text-primary-700 dark:file:bg-primary-900/50" disabled={uploadingImage} onChange={async (e) => { const file = e.target.files?.[0]; e.target.value = ''; if (!file) return; setUploadingImage(true); const { res, url } = await uploadImage(file); setUploadingImage(false); if (res.status === 401) { navigate('/login', { replace: true }); return; } if (res.ok && url) setForm((f) => ({ ...f, imageUrl: url })); }} />
                        {uploadingImage && <p className="text-xs text-slate-500 mt-1">{lang === 'ar' ? 'جاري الرفع...' : 'Uploading...'}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-0.5">{t('measurementSystem')}</label>
                        <select value={form.measurementSystem} onChange={(e) => setForm((f) => ({ ...f, measurementSystem: e.target.value }))} className="w-full rounded border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-2 py-1.5 text-sm">
                          {MEASUREMENT_SYSTEM.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-0.5">{t('gender')}</label>
                        <select value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))} className="w-full rounded border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-2 py-1.5 text-sm">
                          <option value="">—</option>
                          {GENDER.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-0.5">{t('age')}</label>
                        <input type="number" min={1} max={150} value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))} className="w-full rounded border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-2 py-1.5 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-0.5">{t('height')}</label>
                        <input type="number" step="0.1" min={0} value={form.height} onChange={(e) => setForm((f) => ({ ...f, height: e.target.value }))} className="w-full rounded border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-2 py-1.5 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-0.5">{t('weight')}</label>
                        <input type="number" step="0.1" min={0} value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))} className="w-full rounded border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-2 py-1.5 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-0.5">{t('targetWeight')}</label>
                        <input type="number" step="0.1" min={0} value={form.targetWeight} onChange={(e) => setForm((f) => ({ ...f, targetWeight: e.target.value }))} className="w-full rounded border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-2 py-1.5 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-0.5">{t('activityLevel')}</label>
                        <select value={form.activityLevel} onChange={(e) => setForm((f) => ({ ...f, activityLevel: e.target.value }))} className="w-full rounded border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-2 py-1.5 text-sm">
                          <option value="">—</option>
                          {ACTIVITY_LEVEL.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-0.5">{t('goal')}</label>
                        <select value={form.goal} onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))} className="w-full rounded border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-2 py-1.5 text-sm">
                          <option value="">—</option>
                          {GOAL.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-0.5">{t('language')}</label>
                        <select value={form.language} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))} className="rounded border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-2 py-1.5 text-sm">
                          <option value="en">English</option>
                          <option value="ar">العربية</option>
                        </select>
                      </div>
                      <label className="inline-flex items-center gap-2 cursor-pointer pt-5">
                        <input type="checkbox" checked={form.notificationsEnabled} onChange={(e) => setForm((f) => ({ ...f, notificationsEnabled: e.target.checked }))} className="rounded border-slate-300 text-primary-600" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{lang === 'ar' ? 'الإشعارات' : 'Notifications'}</span>
                      </label>
                      <label className="inline-flex items-center gap-2 cursor-pointer pt-5">
                        <input type="checkbox" checked={form.darkMode} onChange={(e) => setForm((f) => ({ ...f, darkMode: e.target.checked }))} className="rounded border-slate-300 text-primary-600" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{t('darkModeLabel')}</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{t('dietaryPreferences')}</label>
                      <div className="flex flex-wrap gap-2">
                        {DIETARY_OPTIONS.map((opt) => (
                          <label key={opt} className="inline-flex items-center gap-1 cursor-pointer text-sm">
                            <input type="checkbox" checked={form.dietaryPreferences.includes(opt)} onChange={() => toggleProfileArray('dietaryPreferences', opt)} className="rounded border-slate-300 text-primary-600" />
                            <span>{opt.replace(/_/g, ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{t('allergies')}</label>
                      <div className="flex flex-wrap gap-2">
                        {ALLERGY_OPTIONS.map((opt) => (
                          <label key={opt} className="inline-flex items-center gap-1 cursor-pointer text-sm">
                            <input type="checkbox" checked={form.allergies.includes(opt)} onChange={() => toggleProfileArray('allergies', opt)} className="rounded border-slate-300 text-primary-600" />
                            <span>{opt.replace(/_/g, ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{t('healthConditions')}</label>
                      <div className="flex flex-wrap gap-2">
                        {HEALTH_OPTIONS.map((opt) => (
                          <label key={opt} className="inline-flex items-center gap-1 cursor-pointer text-sm">
                            <input type="checkbox" checked={form.healthConditions.includes(opt)} onChange={() => toggleProfileArray('healthConditions', opt)} className="rounded border-slate-300 text-primary-600" />
                            <span>{opt.replace(/_/g, ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                <div className="flex gap-2 justify-end pt-2 border-t border-slate-200 dark:border-slate-600">
                  <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-500">{t('cancel')}</button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">{t('save')}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Assign Doctor */}
      {modal === 'assign' && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setModal(null)}>
          <div
            className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">{t('assignDoctor')} — {selected.name}</h2>
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('doctor')}</label>
                <select
                  value={form.doctorId}
                  onChange={(e) => setForm((f) => ({ ...f, doctorId: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2"
                >
                  <option value="">— {t('none')} —</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.user?.name || d.title} ({d.user?.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-500">
                  {t('cancel')}
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
