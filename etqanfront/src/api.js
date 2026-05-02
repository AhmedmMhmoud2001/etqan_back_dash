/**
 * مساعد طلبات API للوحة الأدمن
 * كل الطلبات تحتاج توكن في الهيدر؛ في حالة 401 يتم التوجيه من الصفحة نفسها.
 *
 * ضبط الإنتاج: أنشئ `etqanfront/.env.production` وفيه:
 *   VITE_BACKEND_URL=https://etqan.nodeteam.site
 * بدون سلاش أخيرة. فارغاً = طلب نسبي `/api` مع proxy في `npm run dev`.
 */
const BACKEND_ORIGIN = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '');
export const API_BASE = BACKEND_ORIGIN ? `${BACKEND_ORIGIN}/api` : '/api';

/** رابط وسائط نسبية مثل `/uploads/...` يُكمَّل أمام BACKEND المنشور */
export function resolveMediaUrl(url) {
  if (url == null || typeof url !== 'string') return url;
  const u = url.trim();
  if (!u) return u;
  if (/^(https?:|data:|blob:)/i.test(u)) return u;
  const path = u.startsWith('/') ? u : `/${u}`;
  if (BACKEND_ORIGIN) return `${BACKEND_ORIGIN}${path}`;
  return path;
}

export function getToken() {
  return localStorage.getItem('token');
}

export async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { ...options, headers });
  return res;
}

export async function get(path) {
  const res = await request(path, { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

export async function post(path, body) {
  const res = await request(path, { method: 'POST', body: JSON.stringify(body || {}) });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

export async function patch(path, body) {
  const res = await request(path, { method: 'PATCH', body: JSON.stringify(body || {}) });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

export async function del(path) {
  const res = await request(path, { method: 'DELETE' });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

/**
 * رفع صورة واحدة — يُرجع الرابط بعد الرفع
 * @param {File} file
 * @returns {Promise<{ res: Response, data: object, url?: string }>}
 */
export async function uploadImage(file) {
  if (!file || !(file instanceof File)) {
    return { res: { ok: false, status: 400 }, data: { message: 'No file' } };
  }
  const formData = new FormData();
  formData.append('image', file);
  const url = `${API_BASE}/upload/image`;
  const token = getToken();
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  const uploadedUrl = data.data?.url;
  return { res, data, url: uploadedUrl };
}
