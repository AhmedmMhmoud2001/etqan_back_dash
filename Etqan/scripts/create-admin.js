/**
 * One-time script to create an ADMIN user.
 * Usage: node scripts/create-admin.js
 * Set ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME in env or edit below.
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@etqan.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123';
  const name = process.env.ADMIN_NAME || 'Admin';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Admin user already exists:', email);
    process.exit(0);
  }
  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      password: hashed,
      name,
      role: 'ADMIN',
      emailVerified: true,
    },
  });
  console.log('Admin created:', email);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
