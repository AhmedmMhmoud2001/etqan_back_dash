# Etqan Admin Dashboard (Frontend)

لوحة تحكم الأدمن — React + Vite + Tailwind CSS.

## التشغيل

```bash
npm install
npm run dev
```

يفتح التطبيق على `http://localhost:5173`. تأكد أن الباك اند (Etqan) يعمل على `http://localhost:3000`؛ الـ proxy يوجّه `/api` للباك اند.

## تسجيل الدخول

استخدم حساباً له دور **ADMIN** (من الباك اند). المسار: `/login`.

## الصفحات (للأدمن فقط)

| المسار | الصفحة |
|--------|--------|
| `/admin/dashboard` | لوحة التحكم (إحصائيات) |
| `/admin/users` | إدارة المستخدمين |
| `/admin/doctors` | إدارة الأطباء |
| `/admin/meals` | إدارة الوجبات |
| `/admin/exercises` | إدارة التمارين |
| `/admin/workout-templates` | قوالب التمرين |
| `/admin/nutrition-plans` | خطط التغذية |
| `/admin/workout-plans` | الخطط الأسبوعية للتمارين |
| `/admin/channels` | القنوات |
| `/admin/doctor-notes` | ملاحظات الدكتور |

## البناء للإنتاج

```bash
npm run build
```

الملفات الناتجة في `dist/`.
