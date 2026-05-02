const request = require('supertest');
const app = require('../../src/app');
const { prisma } = require('../../src/prisma/client');
const bcrypt = require('bcryptjs');

const API = '/api';

describe('Auto doctor assignment (least patients, random tie)', () => {
  let doctorA;
  let doctorB;
  let createdUserIds = [];

  beforeAll(async () => {
    // Create two active doctors with controlled patient counts
    const ts = Date.now();
    const pass = await bcrypt.hash('Doctor@123', 12);

    const userA = await prisma.user.create({
      data: { email: `docA-${ts}@etqan.com`, password: pass, name: 'Doc A', role: 'DOCTOR', emailVerified: true },
    });
    const userB = await prisma.user.create({
      data: { email: `docB-${ts}@etqan.com`, password: pass, name: 'Doc B', role: 'DOCTOR', emailVerified: true },
    });
    createdUserIds.push(userA.id, userB.id);

    doctorA = await prisma.doctor.create({
      data: { userId: userA.id, title: 'DocA', specialization: 'Test', bio: 'A', isActive: true },
    });
    doctorB = await prisma.doctor.create({
      data: { userId: userB.id, title: 'DocB', specialization: 'Test', bio: 'B', isActive: true },
    });

    // Add 2 patients assigned to doctorA so doctorB is least-loaded
    const passUser = await bcrypt.hash('User@123', 12);
    const p1 = await prisma.user.create({
      data: { email: `p1-${ts}@etqan.com`, password: passUser, name: 'P1', role: 'USER', emailVerified: true, doctorId: doctorA.id },
    });
    const p2 = await prisma.user.create({
      data: { email: `p2-${ts}@etqan.com`, password: passUser, name: 'P2', role: 'USER', emailVerified: true, doctorId: doctorA.id },
    });
    createdUserIds.push(p1.id, p2.id);
  });

  afterAll(async () => {
    // Clean up created users (doctors cascade via user relation)
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } }).catch(() => {});
  });

  it('assigns new user to the doctor with the least patients', async () => {
    const unique = `new-${Date.now()}@etqan.com`;
    const res = await request(app)
      .post(`${API}/auth/register`)
      .set('Content-Type', 'application/json')
      .send({ name: 'New User', email: unique, password: 'User@123', confirmPassword: 'User@123' });
    expect(res.status).toBe(201);
    const user = res.body?.data?.user ?? res.body?.user ?? res.body?.data;
    expect(user).toBeDefined();
    expect(user.doctorId).toBe(doctorB.id);

    // cleanup that newly registered user
    if (user?.id) await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
  });
});

