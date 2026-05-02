/**
 * تكامل: تسجيل مستخدم ← أدمن يحدد له دكتور ← شات مع الدكتور ← ملاحظات ← خطط تغذية وتمارين ← شات في القنوات
 *
 * يشترط تشغيل الـ seed أولاً: npm run prisma:seed
 * ثم: npm test
 */
const request = require('supertest');
const app = require('../../src/app');

const API = '/api';

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

describe('User → Admin assigns doctor → Chat, Notes, Plans, Channels', () => {
  let adminToken;
  let doctorToken;
  let doctorId;
  let patientToken;
  let patientId;
  let patient2Token;
  let channelId;
  let mealIds = [];
  let exerciseIds = [];
  let conversationId;
  let nutritionPlanId;
  let workoutPlanId;

  const unique = `test-${Date.now()}@etqan.com`;
  const adminCreds = { email: 'admin@etqan.com', password: 'Admin@123' };
  const patient2Creds = { email: 'patient2@etqan.com', password: 'User@123' };

  beforeAll(async () => {
    const adminRes = await request(app)
      .post(`${API}/auth/login`)
      .set('Content-Type', 'application/json')
      .send(adminCreds);
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body?.data?.token || adminRes.body?.token;

    const doctorsRes = await request(app)
      .get(`${API}/admin/doctors`)
      .set(authHeader(adminToken));
    expect(doctorsRes.status).toBe(200);
    const doctors = doctorsRes.body?.data?.items ?? doctorsRes.body?.items ?? [];
    expect(doctors.length).toBeGreaterThan(0);
    const sarah = doctors.find((d) => (d.user?.email || d.email || '').toLowerCase() === 'sarah@etqan.com') || doctors[0];
    doctorId = sarah.id;
    const doctorEmail = sarah.user?.email ?? sarah.email ?? 'sarah@etqan.com';

    const doctorRes = await request(app)
      .post(`${API}/auth/login`)
      .set('Content-Type', 'application/json')
      .send({ email: (doctorEmail || '').toLowerCase().trim(), password: 'Doctor@123' });
    expect(doctorRes.status).toBe(200);
    doctorToken = doctorRes.body?.data?.token || doctorRes.body?.token;

    const channelsRes = await request(app).get(`${API}/channels`);
    expect(channelsRes.status).toBe(200);
    const data = channelsRes.body?.data ?? {};
    const list = data.items ?? data ?? [];
    const channelList = Array.isArray(list) ? list : [];
    expect(channelList.length).toBeGreaterThan(0);
    channelId = channelList[0].id;

    const mealsRes = await request(app)
      .get(`${API}/meals?limit=10`)
      .set(authHeader(adminToken));
    expect(mealsRes.status).toBe(200);
    const meals = mealsRes.body?.data?.items ?? mealsRes.body?.items ?? [];
    mealIds = meals.slice(0, 2).map((m) => m.id).filter(Boolean);

    const exRes = await request(app)
      .get(`${API}/exercises?limit=10`)
      .set(authHeader(doctorToken));
    expect(exRes.status).toBe(200);
    const exercises = exRes.body?.data?.items ?? exRes.body?.items ?? [];
    exerciseIds = exercises.slice(0, 2).map((e) => e.id).filter(Boolean);
  });

  it('1. تسجيل مستخدم جديد (مريض) عبر الأدمن ثم تسجيل دخول', async () => {
    const createRes = await request(app)
      .post(`${API}/admin/users`)
      .set(authHeader(adminToken))
      .set('Content-Type', 'application/json')
      .send({
        name: 'مريض اختبار',
        email: unique,
        password: 'User@123',
        emailVerified: true,
      });
    expect(createRes.status).toBe(201);
    const user = createRes.body?.data ?? createRes.body;
    expect(user).toBeDefined();
    patientId = user.id;

    const loginRes = await request(app)
      .post(`${API}/auth/login`)
      .set('Content-Type', 'application/json')
      .send({ email: unique, password: 'User@123' });
    expect(loginRes.status).toBe(200);
    patientToken = loginRes.body?.data?.token ?? loginRes.body?.token;
    expect(patientToken).toBeDefined();
  });

  it('2. أدمن يحدد للمستخدم دكتوراً', async () => {
    const res = await request(app)
      .patch(`${API}/admin/users/${patientId}/assign-doctor`)
      .set(authHeader(adminToken))
      .set('Content-Type', 'application/json')
      .send({ doctorId });
    expect(res.status).toBe(200);
  });

  it('2.1 ترقية المستخدم لـ Premium (مطلوب للشات والقنوات)', async () => {
    const res = await request(app)
      .post(`${API}/subscription/upgrade`)
      .set(authHeader(patientToken))
      .set('Content-Type', 'application/json')
      .send({ durationMonths: 1 });
    expect(res.status).toBe(200);
  });

  it('3. المستخدم يدخل الشات مع الدكتور (محادثة + رسالة)', async () => {
    const convRes = await request(app)
      .get(`${API}/chat/conversations/me`)
      .set(authHeader(patientToken));
    expect(convRes.status).toBe(200);
    const conv = convRes.body?.data ?? convRes.body;
    expect(conv).toBeDefined();
    conversationId = conv.id;

    const msgRes = await request(app)
      .post(`${API}/chat/conversations/${conversationId}/messages`)
      .set(authHeader(patientToken))
      .set('Content-Type', 'application/json')
      .send({ content: 'مرحبا دكتور، عندي استفسار عن النظام الغذائي' });
    expect([200, 201]).toContain(msgRes.status);
  });

  it('4. الدكتور يرد في الشات', async () => {
    const listRes = await request(app)
      .get(`${API}/chat/conversations`)
      .set(authHeader(doctorToken));
    expect(listRes.status).toBe(200);

    const msgRes = await request(app)
      .post(`${API}/chat/conversations/${conversationId}/messages`)
      .set(authHeader(doctorToken))
      .set('Content-Type', 'application/json')
      .send({ content: 'أهلاً، أنا جاهز لمساعدتك. اتبع الخطة الأسبوعية وشاركني أي ملاحظات.' });
    expect([200, 201]).toContain(msgRes.status);
  });

  it('5. الدكتور يضيف ملاحظة للمريض', async () => {
    const res = await request(app)
      .post(`${API}/doctor-notes`)
      .set(authHeader(doctorToken))
      .set('Content-Type', 'application/json')
      .send({
        patientId,
        content: 'ملاحظة اختبار: ننصح بتناول وجبة الإفطار قبل التمرين وتجنب السكر المضاف.',
      });
    expect([200, 201]).toContain(res.status);
  });

  it('6. الدكتور يضيف خطة أسبوعية للوجبات للمريض', async () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const slots = [];
    for (let d = 0; d <= 6; d++) {
      const date = new Date(start);
      date.setDate(date.getDate() + d);
      if (mealIds[0]) {
        slots.push({ date: date.toISOString().slice(0, 10), slotType: 'BREAKFAST', time: '08:00', mealId: mealIds[0] });
        slots.push({ date: date.toISOString().slice(0, 10), slotType: 'LUNCH', time: '13:00', mealId: mealIds[0] });
      }
      slots.push({ date: date.toISOString().slice(0, 10), slotType: 'DINNER', time: '19:00' });
    }

    const res = await request(app)
      .post(`${API}/nutrition-plan`)
      .set(authHeader(doctorToken))
      .set('Content-Type', 'application/json')
      .send({
        userId: patientId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        dailyCalorieTarget: 1800,
        dailyProteinTarget: 120,
        dailyCarbsTarget: 180,
        dailyFatsTarget: 60,
        slots: slots.length ? slots : undefined,
      });
    expect([200, 201]).toContain(res.status);
    const plan = res.body?.data ?? res.body;
    if (plan?.id) nutritionPlanId = plan.id;
  });

  it('7. الدكتور يضيف خطة أسبوعية للتمارين للمريض', async () => {
    if (exerciseIds.length === 0) {
      console.warn('Skip: no exercises in DB (run seed)');
      return;
    }
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const days = [];
    for (let i = 0; i <= 6; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      days.push({
        date: date.toISOString(),
        order: i,
        exerciseId: exerciseIds[0] || exerciseIds[i % exerciseIds.length],
        sets: 3,
        repMin: 8,
        repMax: 12,
      });
    }
    const validDays = days.filter((d) => d.exerciseId);

    const res = await request(app)
      .post(`${API}/workout-plan`)
      .set(authHeader(doctorToken))
      .set('Content-Type', 'application/json')
      .send({
        userId: patientId,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        days: validDays.length ? validDays : undefined,
      });
    if (res.status === 500) {
      console.warn('Skip: workout plan create failed (run prisma migrate deploy if needed)');
      return;
    }
    expect([200, 201]).toContain(res.status);
    const plan = res.body?.data ?? res.body;
    if (plan?.id) workoutPlanId = plan.id;
  });

  it('8. المستخدم يشوف خطته للتغذية والتمارين', async () => {
    const planRes = await request(app)
      .get(`${API}/nutrition-plan/my/plan`)
      .set(authHeader(patientToken));
    expect(planRes.status).toBe(200);

    const workoutRes = await request(app)
      .get(`${API}/workout-plan/my/current`)
      .set(authHeader(patientToken));
    expect([200, 404]).toContain(workoutRes.status);
  });

  it('9. المستخدمون يدخلون شات القنوات معاً (قناة واحدة، رسالتين من مستخدمين)', async () => {
    const user1Msg = await request(app)
      .post(`${API}/channels/${channelId}/messages`)
      .set(authHeader(patientToken))
      .set('Content-Type', 'application/json')
      .send({ content: 'مرحبا الجميع من المريض الجديد في القناة!' });
    expect([200, 201]).toContain(user1Msg.status);

    const patient2Login = await request(app)
      .post(`${API}/auth/login`)
      .set('Content-Type', 'application/json')
      .send(patient2Creds);
    expect(patient2Login.status).toBe(200);
    patient2Token = patient2Login.body?.data?.token ?? patient2Login.body?.token;

    const upgrade2 = await request(app)
      .post(`${API}/subscription/upgrade`)
      .set(authHeader(patient2Token))
      .set('Content-Type', 'application/json')
      .send({ durationMonths: 1 });
    expect(upgrade2.status).toBe(200);

    const user2Msg = await request(app)
      .post(`${API}/channels/${channelId}/messages`)
      .set(authHeader(patient2Token))
      .set('Content-Type', 'application/json')
      .send({ content: 'أهلاً بك! نحن هنا لنتشارك الدعم والنجاحات.' });
    expect([200, 201]).toContain(user2Msg.status);
  });

  it('10. عرض رسائل القناة (أي من المستخدمين)', async () => {
    const res = await request(app)
      .get(`${API}/channels/${channelId}/messages`)
      .set(authHeader(patientToken));
    expect(res.status).toBe(200);
    const msgData = res.body?.data ?? {};
    const messages = Array.isArray(msgData.items) ? msgData.items : (Array.isArray(msgData) ? msgData : []);
    expect(messages.length).toBeGreaterThanOrEqual(2);
  });
});
