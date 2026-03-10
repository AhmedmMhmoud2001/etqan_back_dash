# Etqan Backend API

Node.js + Express + Prisma + MySQL backend with module-based architecture.

## Architecture

- **Flow:** Route → Controller → Service → Repository → Prisma → Database
- **Roles:** USER, DOCTOR, ADMIN

## Setup

```bash
# Install dependencies
npm install

# Copy environment
cp .env.example .env
# Edit .env: set DATABASE_URL, JWT_SECRET, SMTP (optional for OTP emails)

# Generate Prisma client & run migrations
npx prisma generate
npx prisma migrate dev --name init

# Start
npm run dev
```

**API Documentation (Swagger):** بعد تشغيل السيرفر افتح [http://localhost:3000/api-docs](http://localhost:3000/api-docs) لتوثيق الـ API وتجربة الـ endpoints من المتصفح.

## User Registration Flow (matches onboarding UI)

1. **POST /api/auth/register** – Create account: `name`, `email`, `password`, `confirmPassword`. System sends OTP to email.
2. **POST /api/otp/verify** – Verify OTP: `userId`, `code`. Sets `emailVerified`.
3. **POST /api/auth/login** – Login with `email`, `password` (allowed only after email verification).
4. **PUT /api/profiles/me** – Fill profile (can be split across steps; all optional except validation):
   - **Step 1 – Basic info:** `measurementSystem`, `gender`, `age`, `height`, `weight`
   - **Step 2 – Activity:** `activityLevel`
   - **Step 3 – Goal:** `goal`, `targetWeight`
   - **Step 4 – Dietary:** `dietaryPreferences` (array)
   - **Step 4 – Allergies:** `allergies` (array; presets or `"CUSTOM: name"`)
   - **Step 6 – Health:** `healthConditions` (array, optional)
   - Step 7 (Connect Devices) is app-only; no profile fields.

## API Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | - | Register user, sends OTP |
| POST | /api/auth/login | - | Login |
| GET | /api/auth/me | Bearer | Current user |
| POST | /api/otp/verify | - | Verify OTP |
| POST | /api/otp/resend | - | Resend OTP (body: userId or use token) |
| GET | /api/users/me | Bearer | User profile |
| PATCH | /api/users/me | Bearer | Update user |
| GET | /api/profiles/me | Bearer | Get profile |
| PUT | /api/profiles/me | Bearer | Create/update profile (see Profile fields below) |
| GET | /api/doctors | Bearer | List doctors (paginated) |
| GET | /api/doctors/:id | Bearer | Doctor by id |
| GET | /api/admin/dashboard | Admin | Dashboard stats |
| GET | /api/admin/users | Admin | List users (query: page, limit, role) |
| GET | /api/admin/users/:id | Admin | Get user by id |
| POST | /api/admin/users | Admin | Create user (body: name, email, password) |
| PATCH | /api/admin/users/:id | Admin | Update user (name, email, password, isActive, doctorId) |
| PATCH | /api/admin/users/:id/assign-doctor | Admin | Assign doctor to user (body: doctorId) |
| DELETE | /api/admin/users/:id | Admin | Soft delete user (sets isActive: false) |
| PATCH | /api/admin/users/:id/toggle-active | Admin | Toggle user active |
| GET | /api/admin/doctors | Admin | List doctors (query: page, limit) |
| GET | /api/admin/doctors/:id | Admin | Get doctor by id |
| GET | /api/admin/doctors/:id/patients | Admin | List patients assigned to this doctor (query: page, limit) |
| POST | /api/admin/doctors | Admin | Create doctor (body: name, email, password) |
| PATCH | /api/admin/doctors/:id | Admin | Update doctor (name, email, password, isActive) |
| DELETE | /api/admin/doctors/:id | Admin | Soft delete doctor (sets isActive: false) |

## Community API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/community/stats | Optional | membersCount, myPostsCount, followersCount (آخران مع تسجيل الدخول) |
| GET | /api/community/posts | Optional | Feed (قائمة المنشورات، query: page, limit) |
| GET | /api/community/posts/:id | Optional | منشور واحد |
| POST | /api/community/posts | Bearer | إنشاء منشور (body: content, imageUrl?, badge?) |
| PATCH | /api/community/posts/:id | Bearer | تعديل منشورك |
| DELETE | /api/community/posts/:id | Bearer | حذف منشورك |
| GET | /api/community/posts/:id/comments | - | تعليقات على منشور (query: page, limit) |
| POST | /api/community/posts/:id/comments | Bearer | إضافة تعليق (body: content) |
| PATCH | /api/community/comments/:commentId | Bearer | تعديل تعليقك (body: content) |
| DELETE | /api/community/comments/:commentId | Bearer | حذف تعليقك |
| POST | /api/community/posts/:id/like | Bearer | إعجاب/إلغاء إعجاب (toggle) |
| POST | /api/community/posts/:id/share | Bearer | مشاركة منشور (يزيد عداد المشاركات) |
| POST | /api/community/users/:userId/follow | Bearer | متابعة مستخدم |
| DELETE | /api/community/users/:userId/follow | Bearer | إلغاء متابعة |

## القنوات (Channels — دردشة جماعية)

- **الأدمن** ينشئ القنوات (مثل Daily Motivation، Nutrition Tips، Workout Updates، Announcements).
- **أي مستخدم أو دكتور** مسجّل دخوله يمكنه قراءة رسائل القناة وإرسال رسائل فيها.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/channels | - | قائمة القنوات (query: page, limit) |
| GET | /api/channels/:id | - | قناة واحدة |
| GET | /api/channels/:id/messages | Bearer | رسائل القناة (query: page, limit, before) |
| POST | /api/channels/:id/messages | Bearer | إرسال رسالة (body: content?, attachmentUrl?, attachmentName?) |
| POST | /api/admin/channels | Admin | إنشاء قناة (body: name, description?, icon?) |
| PATCH | /api/admin/channels/:id | Admin | تعديل قناة (name, description, icon, isActive) |
| DELETE | /api/admin/channels/:id | Admin | حذف قناة |

حقول **Channel**: `name`, `description?`, `icon?` (مثل إيموجي 💪)، `isActive`. كل رسالة فيها `sender` (id, name, email) و `createdAt`.

## Chat API (العميل ↔ الدكتور المرتبط به)

المحادثة بين المريض والدكتور المعيّن له فقط (حقل `doctorId` على المستخدم).

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/chat/conversations | Bearer | قائمة محادثاتي (مريض: واحدة مع دكتوره؛ دكتور: كل محادثاته مع المرضى) |
| GET | /api/chat/conversations/me | Bearer | محادثتي مع دكتوره (مريض فقط؛ تُنشأ إن لم توجد) |
| GET | /api/chat/conversations/:id | Bearer | محادثة بالـ id (يجب أن تكون مشاركاً) |
| GET | /api/chat/conversations/:id/messages | Bearer | رسائل المحادثة (query: page, limit, before) |
| POST | /api/chat/conversations/:id/messages | Bearer | إرسال رسالة (body: content?, attachmentUrl?, attachmentName?) |

- **إرسال رسالة:** `content` (نص) و/أو `attachmentUrl` (رابط الملف) و `attachmentName` (مثل اسم الـ PDF).
- **الرسائل:** ترجع مع `sender` (id, name, email) و `createdAt`.

## Profile Fields (PUT /api/profiles/me)

| Field | Type | Allowed values |
|-------|------|----------------|
| measurementSystem | string | METRIC, IMPERIAL |
| gender | string | MALE, FEMALE, OTHER |
| age | number | 1–150 |
| height | number | cm |
| weight | number | kg |
| activityLevel | string | SEDENTARY, LIGHT, MODERATE, ACTIVE, VERY_ACTIVE |
| goal | string | LOSE_WEIGHT, MAINTAIN, BUILD_MUSCLE |
| targetWeight | number | kg |
| dietaryPreferences | string[] | BALANCED, LOW_CARB, HIGH_PROTEIN, KETO, VEGAN, VEGETARIAN, PALEO, MEDITERRANEAN |
| allergies | string[] | DAIRY, EGGS, PEANUTS, SOY, WHEAT, TREE_NUTS, FISH, SHELLFISH, or "CUSTOM: name" |
| healthConditions | string[] | DIABETES, HIGH_BLOOD_PRESSURE, HIGH_CHOLESTEROL, PCOS, THYROID_ISSUES, HEART_DISEASE |  

## جدول Doctor (جدول خاص بالدكتور)

- **Doctor** جدول منفصل: كل دكتور له حساب **User** (role=DOCTOR) وسجل **Doctor** مرتبط به (userId).
- حقول **Doctor**: `id`, `userId`, `title` (مثل "Fitness Coach"), `specialization`, `bio`, `isActive`, `createdAt`, `updatedAt`.
- إنشاء دكتور (أدمن): **POST /api/admin/doctors** ينشئ User + Doctor. Body: `name`, `email`, `password`، اختياري: `title`, `specialization`, `bio`.
- تعديل دكتور: **PATCH /api/admin/doctors/:id** يدعم `name`, `email`, `password`, `title`, `specialization`, `bio`, `isActive`. الـ `:id` هنا هو **Doctor.id** (وليس User.id).
- قائمة الدكاترة ومرضى دكتور والـ Chat تستخدم **Doctor.id**.

## User–Doctor assignment (Admin)

- كل مستخدم (مريض، role=USER) يمكن أن يكون له **دكتور واحد** (حقل `doctorId` يشير إلى **Doctor.id**).
- الأدمن يحدد الدكتور من خلال:
  - **PATCH /api/admin/users/:id/assign-doctor** مع body: `{ "doctorId": "<Doctor.id>" }`
  - أو **PATCH /api/admin/users/:id** مع body يتضمن `doctorId` (أو `null` لإلغاء التعيين).
- قائمة مرضى دكتور معين: **GET /api/admin/doctors/:id/patients** (الـ id = Doctor.id).

## Creating an Admin

After DB is set up, create an admin via Prisma Studio or a one-off script that hashes a password and creates a user with `role: 'ADMIN'` and `emailVerified: true`.
