/**
 * Etqan DB Seed
 * تشغيل: npm run prisma:seed  أو  npx prisma db seed
 *
 * حسابات الدخول بعد الـ seed:
 * - أدمن:  admin@etqan.com   / Admin@123
 * - دكتور: sarah@etqan.com   / Doctor@123
 * - دكتور: ahmed@etqan.com   / Doctor@123
 * - مريض:  marwa@etqan.com   / User@123  (كود إحالة: ETQAN2026)
 * - مريض:  patient2@etqan.com / User@123
 * - مريض:  patient3@etqan.com / User@123
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const hash = (password) => bcrypt.hashSync(password, 12);

async function main() {
  console.log('🌱 Seeding...');

  // ——— المستخدمون ———
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@etqan.com' },
    update: {},
    create: {
      email: 'admin@etqan.com',
      password: hash('Admin@123'),
      name: 'أدمن Etqan',
      role: 'ADMIN',
      emailVerified: true,
    },
  });
  console.log('Created admin:', adminUser.email);

  const doctor1User = await prisma.user.upsert({
    where: { email: 'sarah@etqan.com' },
    update: {},
    create: {
      email: 'sarah@etqan.com',
      password: hash('Doctor@123'),
      name: 'Dr. Sarah Mitchell',
      role: 'DOCTOR',
      emailVerified: true,
    },
  });

  const doctor2User = await prisma.user.upsert({
    where: { email: 'ahmed@etqan.com' },
    update: {},
    create: {
      email: 'ahmed@etqan.com',
      password: hash('Doctor@123'),
      name: 'د. أحمد حسن',
      role: 'DOCTOR',
      emailVerified: true,
    },
  });

  const doc1 = await prisma.doctor.upsert({
    where: { userId: doctor1User.id },
    update: {},
    create: {
      userId: doctor1User.id,
      title: 'Fitness Coach',
      specialization: 'Nutrition & Exercise',
      bio: 'Expert in weight management and strength training.',
      isActive: true,
    },
  });

  const doc2 = await prisma.doctor.upsert({
    where: { userId: doctor2User.id },
    update: {},
    create: {
      userId: doctor2User.id,
      title: 'طبيب تغذية',
      specialization: 'Sports Nutrition',
      bio: 'متخصص في التغذية الرياضية وإنقاص الوزن.',
      isActive: true,
    },
  });
  console.log('Created doctors: Sarah, Ahmed');

  const patient1 = await prisma.user.upsert({
    where: { email: 'marwa@etqan.com' },
    update: {},
    create: {
      email: 'marwa@etqan.com',
      password: hash('User@123'),
      name: 'Marwa Elsodany',
      role: 'USER',
      emailVerified: true,
      doctorId: doc1.id,
      referralCode: 'ETQAN2026',
    },
  });

  const patient2 = await prisma.user.upsert({
    where: { email: 'patient2@etqan.com' },
    update: {},
    create: {
      email: 'patient2@etqan.com',
      password: hash('User@123'),
      name: 'محمد علي',
      role: 'USER',
      emailVerified: true,
      doctorId: doc1.id,
    },
  });

  const patient3 = await prisma.user.upsert({
    where: { email: 'patient3@etqan.com' },
    update: {},
    create: {
      email: 'patient3@etqan.com',
      password: hash('User@123'),
      name: 'فاطمة أحمد',
      role: 'USER',
      emailVerified: true,
      doctorId: doc2.id,
    },
  });
  console.log('Created patients: Marwa, Mohamed, Fatma');

  // ——— بروفايلات (اختياري) ———
  await prisma.profile.upsert({
    where: { userId: patient1.id },
    update: {},
    create: {
      userId: patient1.id,
      gender: 'FEMALE',
      age: 28,
      height: 165,
      weight: 68.5,
      targetWeight: 65,
      goal: 'LOSE_WEIGHT',
      activityLevel: 'MODERATE',
      language: 'en',
      notificationsEnabled: true,
    },
  });

  // ——— وجبات (يضيفها الأدمن) ———
  let meal1 = await prisma.meal.findFirst({
    where: { name: 'Grilled Chicken Salad', addedByUserId: adminUser.id },
  });
  if (!meal1) {
    meal1 = await prisma.meal.create({
      data: {
        name: 'Grilled Chicken Salad',
        mealType: 'LUNCH',
        prepTimeMinutes: 25,
        calories: 350,
        proteinG: 35,
        carbsG: 15,
        fatsG: 18,
        dietaryTags: ['HIGH_PROTEIN', 'LOW_CARB'],
        addedByUserId: adminUser.id,
        ingredients: {
          create: [
            { name: 'Chicken breast', quantity: '150', unit: 'g', order: 0 },
            { name: 'Mixed greens', quantity: '100', unit: 'g', order: 1 },
            { name: 'Olive oil', quantity: '1', unit: 'tbsp', order: 2 },
          ],
        },
      },
    });
  }

  await prisma.meal.create({
    data: {
      name: 'Oatmeal with Banana',
      mealType: 'BREAKFAST',
      prepTimeMinutes: 10,
      calories: 280,
      proteinG: 8,
      carbsG: 45,
      fatsG: 6,
      addedByUserId: adminUser.id,
      ingredients: {
        create: [
          { name: 'Oats', quantity: '50', unit: 'g', order: 0 },
          { name: 'Banana', quantity: '1', unit: 'pcs', order: 1 },
        ],
      },
    },
  }).catch(() => {});

  await prisma.meal.create({
    data: {
      name: 'Salmon with Rice',
      mealType: 'DINNER',
      prepTimeMinutes: 35,
      calories: 520,
      proteinG: 38,
      carbsG: 45,
      fatsG: 20,
      addedByUserId: adminUser.id,
      ingredients: {
        create: [
          { name: 'Salmon fillet', quantity: '180', unit: 'g', order: 0 },
          { name: 'Brown rice', quantity: '150', unit: 'g', order: 1 },
        ],
      },
    },
  }).catch(() => {});
  console.log('Created meals');

  // ——— تمارين ———
  let ex1 = await prisma.exercise.findFirst({ where: { name: 'Bench Press' } });
  if (!ex1) {
    ex1 = await prisma.exercise.create({
    data: {
      name: 'Bench Press',
      nameAr: 'ضغط البنش',
      description: 'Compound chest exercise with barbell or dumbbells.',
      targetMuscles: ['CHEST', 'SHOULDER', 'TRICEPS'],
      addedByUserId: adminUser.id,
    },
  });
  }
  let ex2 = await prisma.exercise.findFirst({ where: { name: 'Squat' } });
  if (!ex2) {
    ex2 = await prisma.exercise.create({
    data: {
      name: 'Squat',
      nameAr: 'السكوات',
      description: 'Lower body compound movement.',
      targetMuscles: ['QUADS', 'GLUTES', 'HAMSTRINGS'],
      addedByUserId: adminUser.id,
    },
  });
  }
  let ex3 = await prisma.exercise.findFirst({ where: { name: 'Deadlift' } });
  if (!ex3) {
    ex3 = await prisma.exercise.create({
    data: {
      name: 'Deadlift',
      nameAr: 'الرفعة المميتة',
      targetMuscles: ['BACK', 'GLUTES', 'HAMSTRINGS'],
      addedByUserId: adminUser.id,
    },
  });
  }
  console.log('Created exercises');

  // ——— قالب تمرين (الدكتور) ———
  let template = await prisma.workoutTemplate.findFirst({ where: { name: 'Upper Body Strength' } });
  if (!template) {
    template = await prisma.workoutTemplate.create({
    data: {
      name: 'Upper Body Strength',
      nameAr: 'قوة الجزء العلوي',
      durationMinutes: 45,
      level: 'INTERMEDIATE',
      createdByDoctorId: doc1.id,
      templateExercises: {
        create: [
          { exerciseId: ex1.id, order: 0, sets: 4, repMin: 8, repMax: 10, restSeconds: 90 },
          { exerciseId: ex3.id, order: 1, sets: 3, repMin: 6, repMax: 8, restSeconds: 120 },
        ],
      },
    },
  });
  }
  console.log('Created workout template');

  // ——— قناة ———
  const existingChannel = await prisma.channel.findFirst({ where: { name: 'مجتمع Etqan' } });
  if (!existingChannel) {
    await prisma.channel.create({
      data: {
        name: 'مجتمع Etqan',
        description: 'قناة عامة للمناقشات والدعم',
        icon: '💪',
        isActive: true,
      },
    });
  }
  console.log('Created channel');

  // ——— خطة تغذية (دكتور → مريض) ———
  const planStart = new Date();
  planStart.setHours(0, 0, 0, 0);
  const planEnd = new Date(planStart);
  planEnd.setDate(planEnd.getDate() + 6);

  const existingPlan = await prisma.nutritionPlan.findFirst({
    where: { userId: patient1.id, doctorId: doc1.id },
  });
  if (!existingPlan) {
    await prisma.nutritionPlan.create({
      data: {
        doctorId: doc1.id,
        userId: patient1.id,
        startDate: planStart,
        endDate: planEnd,
        dailyCalorieTarget: 1800,
        dailyProteinTarget: 120,
        dailyCarbsTarget: 180,
        dailyFatsTarget: 60,
        slots: {
          create: [
            { date: planStart, slotType: 'BREAKFAST', time: '08:00' },
            { date: planStart, slotType: 'LUNCH', time: '13:00', mealId: meal1?.id },
            { date: planStart, slotType: 'DINNER', time: '19:00' },
          ],
        },
      },
    });
  }
  console.log('Created nutrition plan');

  // ——— خطة أسبوعية تمارين ———
  const weekStart = new Date(planStart);
  const weekEndDate = new Date(planStart);
  weekEndDate.setDate(weekEndDate.getDate() + 6);
  const existingWp = await prisma.userWeeklyPlan.findFirst({
    where: { userId: patient1.id, doctorId: doc1.id },
  });
  if (!existingWp && template) {
    await prisma.userWeeklyPlan.create({
    data: {
      userId: patient1.id,
      doctorId: doc1.id,
      weekStart,
      weekEnd: weekEndDate,
      days: {
        create: [
          { date: weekStart, workoutTemplateId: template.id, order: 0 },
          { date: new Date(weekStart.getTime() + 86400000), workoutTemplateId: template.id, order: 1 },
        ],
      },
    },
  });
  }
  console.log('Created workout weekly plan');

  // ——— اشتراك + قياس + ملاحظة دكتور + بقالة ———
  await prisma.subscription.upsert({
    where: { userId: patient1.id },
    update: {},
    create: {
      userId: patient1.id,
      plan: 'FREE',
      discountPercentToApply: 10,
    },
  }).catch(() => {});

  await prisma.measurement.create({
    data: {
      userId: patient1.id,
      weight: 68.5,
      bodyFat: 18.2,
      muscleMass: 32.1,
      water: 56.4,
      waist: 70,
      source: 'MANUAL',
    },
  }).catch(() => {});

  await prisma.doctorNote.create({
    data: {
      doctorId: doc1.id,
      patientId: patient1.id,
      content: 'Great progress this week! Keep up the consistency with your meal plan.',
    },
  }).catch(() => {});

  await prisma.groceryItem.create({
    data: {
      userId: patient1.id,
      name: 'دجاج',
      quantity: '1 kg',
      checked: false,
      order: 0,
    },
  }).catch(() => {});

  await prisma.groceryItem.create({
    data: {
      userId: patient1.id,
      name: 'أرز بني',
      quantity: '500 g',
      checked: false,
      order: 1,
    },
  }).catch(() => {});

  // ——— إشعارات تجريبية ———
  await prisma.notification.createMany({
    data: [
      { userId: adminUser.id, title: 'مرحباً في لوحة التحكم', body: 'يمكنك إدارة المستخدمين والوجبات والتمارين من هنا.', type: 'INFO' },
      { userId: adminUser.id, title: 'تذكير', body: 'راجع تقارير المستخدمين بانتظام.', type: 'REMINDER', read: false },
    ],
  }).catch(() => {});
  console.log('Created sample notifications');

  console.log('✅ Seed completed.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
