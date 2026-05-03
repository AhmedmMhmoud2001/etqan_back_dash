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
 * - مطور موبايل (QA — Premium، قناة، شات مع الدكتور، مجتمع): mobiledev@etqan.com / MobileDev@123
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const hash = (password) => bcrypt.hashSync(password, 12);

async function main() {
  console.log('🌱 Seeding...');

  // ——— Referral settings (discounts) ———
  const existingReferralSettings = await prisma.$queryRaw`
    SELECT id FROM ReferralSettings ORDER BY createdAt ASC LIMIT 1
  `;
  if (!existingReferralSettings?.[0]?.id) {
    await prisma.$executeRaw`
      INSERT INTO ReferralSettings (id, discountPercentPerReferral, maxDiscountPercent, createdAt, updatedAt)
      VALUES (${require('crypto').randomUUID()}, 10, 50, NOW(), NOW())
    `;
  }

  // ——— باقات الاشتراك (Premium Packages) ———
  const packages = [
    { name: 'Premium Monthly', durationMonths: 1, listPrice: '199.00', payPrice: '199.00', currency: 'EGP', isActive: true },
    { name: 'Premium 3 Months', durationMonths: 3, listPrice: '549.00', payPrice: '549.00', currency: 'EGP', isActive: true },
    { name: 'Premium 6 Months', durationMonths: 6, listPrice: '999.00', payPrice: '999.00', currency: 'EGP', isActive: true },
    { name: 'Premium Yearly', durationMonths: 12, listPrice: '1799.00', payPrice: '1799.00', currency: 'EGP', isActive: true },
  ];
  for (const p of packages) {
    // upsert via unique-like match (name + duration) using findFirst
    const existing = await prisma.subscriptionPackage.findFirst({
      where: { name: p.name, durationMonths: p.durationMonths },
      select: { id: true },
    });
    if (!existing) {
      await prisma.subscriptionPackage.create({ data: p });
    }
  }
  console.log('Created subscription packages');

  // ——— Banners (اختياري) ———
  const existingBanner = await prisma.banner.findFirst({ select: { id: true } }).catch(() => null);
  if (!existingBanner?.id) {
    await prisma.banner.createMany({
      data: [
        {
          title: 'Welcome to Etqan',
          titleAr: 'مرحباً بك في Etqan',
          titleIt: 'Benvenuto in Etqan',
          description: 'Start your journey with personalized plans.',
          descriptionAr: 'ابدأ رحلتك مع خطط مخصصة لك.',
          descriptionIt: 'Inizia il tuo percorso con piani personalizzati.',
          imageUrl: '/uploads/sample-banner-1.jpg',
          link: null,
          order: 0,
          isActive: true,
        },
        {
          title: 'Premium offers',
          titleAr: 'عروض Premium',
          titleIt: 'Offerte Premium',
          description: 'Unlock premium features and content.',
          descriptionAr: 'افتح مميزات ومحتوى بريميم.',
          descriptionIt: 'Sblocca funzionalità e contenuti premium.',
          imageUrl: '/uploads/sample-banner-2.jpg',
          link: null,
          order: 1,
          isActive: false,
        },
      ],
    }).catch(() => {});
    console.log('Created sample banners (imageUrl placeholders)');
  }

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
      titleAr: 'مدرب لياقة',
      titleIt: 'Allenatore fitness',
      specialization: 'Nutrition & Exercise',
      specializationAr: 'التغذية والتمارين',
      specializationIt: 'Nutrizione e allenamento',
      bio: 'Expert in weight management and strength training.',
      bioAr: 'خبير في إدارة الوزن وتمارين القوة.',
      bioIt: 'Esperta in gestione del peso e allenamento della forza.',
      isActive: true,
    },
  });

  const doc2 = await prisma.doctor.upsert({
    where: { userId: doctor2User.id },
    update: {},
    create: {
      userId: doctor2User.id,
      title: 'Nutrition Doctor',
      titleAr: 'طبيب تغذية',
      titleIt: 'Medico nutrizionista',
      specialization: 'Sports Nutrition',
      specializationAr: 'التغذية الرياضية',
      specializationIt: 'Nutrizione sportiva',
      bio: 'متخصص في التغذية الرياضية وإنقاص الوزن.',
      bioAr: 'متخصص في التغذية الرياضية وإنقاص الوزن.',
      bioIt: 'Specialista in nutrizione sportiva e perdita di peso.',
      isActive: true,
    },
  });
  console.log('Created doctors: Sarah, Ahmed');

  const patient1 = await prisma.user.upsert({
    where: { email: 'marwa@etqan.com' },
    update: {
      role: 'USER',
      emailVerified: true,
      doctorId: doc1.id,
      referralCode: 'ETQAN2026',
    },
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
    update: {
      role: 'USER',
      emailVerified: true,
      doctorId: doc1.id,
    },
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
    update: {
      role: 'USER',
      emailVerified: true,
      doctorId: doc2.id,
    },
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
        nameAr: 'سلطة دجاج مشوي',
        nameIt: 'Insalata di pollo alla griglia',
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
      nameAr: 'شوفان مع موز',
      nameIt: 'Porridge d’avena con banana',
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
      nameAr: 'سلمون مع أرز',
      nameIt: 'Salmone con riso',
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
      nameIt: 'Distensioni su panca',
      description: 'Compound chest exercise with barbell or dumbbells.',
      descriptionAr: 'تمرين مركب للصدر باستخدام بار أو دمبل.',
      descriptionIt: 'Esercizio multiarticolare per il petto con bilanciere o manubri.',
      targetMuscles: ['CHEST', 'SHOULDER', 'TRICEPS'],
      equipmentNeeded: [
        { name: 'Barbell', nameAr: 'بار', nameIt: 'Bilanciere' },
        { name: 'Bench', nameAr: 'بنش', nameIt: 'Panca' },
      ],
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
      nameIt: 'Squat',
      description: 'Lower body compound movement.',
      descriptionAr: 'حركة مركبة لعضلات الجزء السفلي من الجسم.',
      descriptionIt: 'Movimento multiarticolare per la parte inferiore del corpo.',
      targetMuscles: ['QUADS', 'GLUTES', 'HAMSTRINGS'],
      equipmentNeeded: [
        { name: 'Barbell', nameAr: 'بار', nameIt: 'Bilanciere' },
      ],
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
      nameIt: 'Stacco da terra',
      description: 'Full-body compound lift focusing on posterior chain.',
      descriptionAr: 'تمرين مركب للجسم كامل يركز على السلسلة الخلفية.',
      descriptionIt: 'Sollevamento multiarticolare per tutto il corpo con focus sulla catena posteriore.',
      targetMuscles: ['BACK', 'GLUTES', 'HAMSTRINGS'],
      equipmentNeeded: [
        { name: 'Barbell', nameAr: 'بار', nameIt: 'Bilanciere' },
      ],
      addedByUserId: adminUser.id,
    },
  });
  }
  console.log('Created exercises');

  // ——— قناة ———
  const existingChannel = await prisma.channel.findFirst({ where: { name: 'مجتمع Etqan' } });
  if (!existingChannel) {
    await prisma.channel.create({
      data: {
        name: 'مجتمع Etqan',
        nameAr: 'مجتمع Etqan',
        nameIt: 'Community Etqan',
        description: 'قناة عامة للمناقشات والدعم',
        descriptionAr: 'قناة عامة للمناقشات والدعم',
        descriptionIt: 'Canale pubblico per discussioni e supporto',
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

  // ——— خطة أسبوعية تمارين (تمرين لكل يوم) ———
  const weekStart = new Date(planStart);
  const weekEndDate = new Date(planStart);
  weekEndDate.setDate(weekEndDate.getDate() + 6);
  const existingWp = await prisma.userWeeklyPlan.findFirst({
    where: { userId: patient1.id, doctorId: doc1.id },
  });
  if (!existingWp && ex1 && ex3) {
    await prisma.userWeeklyPlan.create({
      data: {
        userId: patient1.id,
        doctorId: doc1.id,
        weekStart,
        weekEnd: weekEndDate,
        days: {
          create: [
            { date: weekStart, exerciseId: ex1.id, sets: 4, repMin: 8, repMax: 10, order: 0 },
            { date: new Date(weekStart.getTime() + 86400000), exerciseId: ex3.id, sets: 3, repMin: 6, repMax: 8, order: 1 },
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

  // ——— مستخدم مطور الموبايل (حساب QA كامل: Premium، بروفايل، قناة، شات، مجتمع) ———
  const mobileDevEmail = 'mobiledev@etqan.com';
  const premiumEndsAt = new Date();
  premiumEndsAt.setFullYear(premiumEndsAt.getFullYear() + 1);
  const yearlyPackage = await prisma.subscriptionPackage.findFirst({
    where: { durationMonths: 12 },
    select: { id: true },
  });

  const mobileDev = await prisma.user.upsert({
    where: { email: mobileDevEmail },
    update: {
      name: 'مطور الموبايل',
      role: 'USER',
      emailVerified: true,
      doctorId: doc1.id,
      isActive: true,
    },
    create: {
      email: mobileDevEmail,
      password: hash('MobileDev@123'),
      name: 'مطور الموبايل',
      role: 'USER',
      emailVerified: true,
      doctorId: doc1.id,
      referralCode: 'ETQANMOBDEV',
    },
  });

  await prisma.subscription.upsert({
    where: { userId: mobileDev.id },
    update: {
      plan: 'PREMIUM',
      endsAt: premiumEndsAt,
      startedAt: new Date(),
      packageId: yearlyPackage?.id ?? null,
      discountPercentToApply: 0,
    },
    create: {
      userId: mobileDev.id,
      plan: 'PREMIUM',
      endsAt: premiumEndsAt,
      startedAt: new Date(),
      packageId: yearlyPackage?.id ?? null,
      discountPercentToApply: 0,
    },
  });

  await prisma.profile.upsert({
    where: { userId: mobileDev.id },
    update: {
      measurementSystem: 'METRIC',
      gender: 'MALE',
      age: 31,
      height: 178,
      weight: 79,
      activityLevel: 'MODERATE',
      goal: 'MAINTAIN',
      targetWeight: 76,
      dietaryPreferences: ['HIGH_PROTEIN', 'LOW_CARB'],
      allergies: [],
      healthConditions: [],
      notificationsEnabled: true,
      darkMode: false,
      language: 'ar',
      imageUrl: null,
    },
    create: {
      userId: mobileDev.id,
      measurementSystem: 'METRIC',
      gender: 'MALE',
      age: 31,
      height: 178,
      weight: 79,
      activityLevel: 'MODERATE',
      goal: 'MAINTAIN',
      targetWeight: 76,
      dietaryPreferences: ['HIGH_PROTEIN', 'LOW_CARB'],
      allergies: [],
      healthConditions: [],
      notificationsEnabled: true,
      darkMode: false,
      language: 'ar',
      imageUrl: null,
    },
  });

  await prisma.measurementBaseline.upsert({
    where: { userId: mobileDev.id },
    update: {
      weight: 80,
      bodyFat: 17.5,
      muscleMass: 34,
      water: 54,
      waist: 84,
    },
    create: {
      userId: mobileDev.id,
      weight: 80,
      bodyFat: 17.5,
      muscleMass: 34,
      water: 54,
      waist: 84,
    },
  }).catch(() => {});

  await prisma.measurementGoal.upsert({
    where: { userId: mobileDev.id },
    update: {
      weight: 76,
      bodyFat: 14,
      muscleMass: 36,
      water: 56,
      waist: 78,
    },
    create: {
      userId: mobileDev.id,
      weight: 76,
      bodyFat: 14,
      muscleMass: 36,
      water: 56,
      waist: 78,
    },
  }).catch(() => {});

  const devMeasCount = await prisma.measurement.count({ where: { userId: mobileDev.id } });
  if (devMeasCount === 0) {
    await prisma.measurement.createMany({
      data: [
        {
          userId: mobileDev.id,
          weight: 80,
          bodyFat: 18,
          muscleMass: 33.5,
          water: 53,
          waist: 85,
          source: 'MANUAL',
        },
        {
          userId: mobileDev.id,
          weight: 79,
          bodyFat: 17.8,
          muscleMass: 34,
          water: 54,
          waist: 84,
          source: 'MANUAL',
        },
      ],
    }).catch(() => {});
  }

  /** شات الدكتورة سارة مع مطور الموبايل */
  const qaConv = await prisma.conversation.upsert({
    where: {
      patientId_doctorId: { patientId: mobileDev.id, doctorId: doc1.id },
    },
    update: {},
    create: {
      patientId: mobileDev.id,
      doctorId: doc1.id,
    },
  });
  const qaChatExisting = await prisma.chatMessage.count({ where: { conversationId: qaConv.id } });
  if (qaChatExisting === 0) {
    await prisma.chatMessage.createMany({
      data: [
        {
          conversationId: qaConv.id,
          senderId: mobileDev.id,
          content: 'مرحباً دكتورة، أستخدم حساب تجريبي لاختبار التطبيق وأريد تأكيد أن الخطة تظهر صح.',
        },
        {
          conversationId: qaConv.id,
          senderId: doctor1User.id,
          content: 'أهلاً بك 👋 كل شيء مربوط بملفّك؛ إذا لاحظت أي اختلاف أخبرني.',
        },
        {
          conversationId: qaConv.id,
          senderId: mobileDev.id,
          content: 'تمام، أتابع وأراجع القياسات من شاشة التقدّم.',
        },
      ],
    });
  }

  /** رسائل في قناة المجتمع */
  const communityCh = await prisma.channel.findFirst({
    where: { OR: [{ name: 'مجتمع Etqan' }, { nameAr: 'مجتمع Etqan' }] },
    select: { id: true },
  });
  if (communityCh) {
    const chFromDev = await prisma.channelMessage.count({
      where: { channelId: communityCh.id, senderId: mobileDev.id },
    });
    if (chFromDev === 0) {
      await prisma.channelMessage.createMany({
        data: [
          {
            channelId: communityCh.id,
            senderId: mobileDev.id,
            content: '👋 تجربة QA: هذا حساب مطور الموبايل على قناة المجتمع.',
          },
          {
            channelId: communityCh.id,
            senderId: doctor1User.id,
            content: 'مرحباً في القناة! يمكنكم مشاركة التقدّم هنا للجميع.',
          },
        ],
      });
    }
  }

  /** منشورات، تعليق، إعجاب، مشاركة، متابعات */
  const devPosts = await prisma.post.findMany({
    where: { userId: mobileDev.id },
    orderBy: { createdAt: 'asc' },
    take: 2,
    select: { id: true },
  });
  let postA = devPosts[0];
  let postB = devPosts[1];
  if (!postA) {
    postA = await prisma.post.create({
      data: {
        userId: mobileDev.id,
        content:
          '📱 أسبوع أول مع Etqan — حساب مختبر لتطبيق الجوال؛ البيانات ظاهرة في البروفايل والقياس.',
        badge: 'QA Week',
      },
    });
  }
  if (!postB) {
    postB = await prisma.post.create({
      data: {
        userId: mobileDev.id,
        content: 'اختبار المنشور الثاني مع صورة احتياطية نصّية بدون وسائط.',
        badge: null,
      },
    });
  }

  const commented = await prisma.comment.findFirst({
    where: { postId: postA.id, userId: patient2.id },
  });
  if (!commented) {
    await prisma.comment.create({
      data: {
        postId: postA.id,
        userId: patient2.id,
        content: 'توفيق في التجربة 👍 المحتوى واضح من التطبيق.',
      },
    });
  }

  await prisma.postLike
    .upsert({
      where: { postId_userId: { postId: postA.id, userId: patient2.id } },
      update: {},
      create: { postId: postA.id, userId: patient2.id },
    })
    .catch(() => {});

  let mohamedCommunityPost = await prisma.post.findFirst({
    where: { userId: patient2.id },
    orderBy: { createdAt: 'desc' },
  });
  if (!mohamedCommunityPost) {
    mohamedCommunityPost = await prisma.post.create({
      data: {
        userId: patient2.id,
        content: 'يوم ولياقة — نشارككم التقدّم للفريق ♥️',
        badge: 'Day 5',
      },
    });
  }
  await prisma.postLike
    .upsert({
      where: { postId_userId: { postId: mohamedCommunityPost.id, userId: mobileDev.id } },
      update: {},
      create: { postId: mohamedCommunityPost.id, userId: mobileDev.id },
    })
    .catch(() => {});

  const devShareExists = await prisma.postShare.findFirst({
    where: { postId: mohamedCommunityPost.id, userId: mobileDev.id },
  });
  if (!devShareExists) {
    await prisma.postShare
      .create({
        data: { postId: mohamedCommunityPost.id, userId: mobileDev.id },
      })
      .catch(() => {});
  }

  await prisma.follow
    .upsert({
      where: {
        followerId_followingId: { followerId: mobileDev.id, followingId: patient1.id },
      },
      update: {},
      create: { followerId: mobileDev.id, followingId: patient1.id },
    })
    .catch(() => {});

  await prisma.follow
    .upsert({
      where: {
        followerId_followingId: { followerId: patient2.id, followingId: mobileDev.id },
      },
      update: {},
      create: { followerId: patient2.id, followingId: mobileDev.id },
    })
    .catch(() => {});

  /** نشاط تمرين مكتمل (بسيط) */
  const existingSess = await prisma.workoutSession.findFirst({
    where: { userId: mobileDev.id, status: 'COMPLETED' },
  });
  if (!existingSess && ex1) {
    const started = new Date(Date.now() - 2 * 86400000);
    const ended = new Date(started.getTime() + 45 * 60 * 1000);
    const session = await prisma.workoutSession.create({
      data: {
        userId: mobileDev.id,
        startedAt: started,
        endedAt: ended,
        status: 'COMPLETED',
      },
    });
    const wse = await prisma.workoutSessionExercise.create({
      data: {
        sessionId: session.id,
        exerciseId: ex1.id,
        order: 0,
        sets: 3,
        repMin: 8,
        repMax: 12,
        restSeconds: 90,
      },
    });
    await prisma.workoutSessionSet.createMany({
      data: [
        {
          workoutSessionExerciseId: wse.id,
          setNumber: 1,
          targetRepMin: 8,
          targetRepMax: 12,
          actualReps: 10,
        },
        {
          workoutSessionExerciseId: wse.id,
          setNumber: 2,
          targetRepMin: 8,
          targetRepMax: 12,
          actualReps: 10,
        },
        {
          workoutSessionExerciseId: wse.id,
          setNumber: 3,
          targetRepMin: 8,
          targetRepMax: 12,
          actualReps: 9,
        },
      ],
    });
  }

  /** تسجيل وجبة • ملاحظة دكتور • بقالة • إشعار */
  const devLogs = meal1
    ? await prisma.userMealLog.count({ where: { userId: mobileDev.id, mealId: meal1.id } })
    : 1;
  if (meal1 && devLogs === 0) {
    await prisma.userMealLog
      .create({
        data: {
          userId: mobileDev.id,
          mealId: meal1.id,
          eatenAt: new Date(),
        },
      })
      .catch(() => {});
  }

  const noteExists = await prisma.doctorNote.findFirst({
    where: { doctorId: doc1.id, patientId: mobileDev.id },
    select: { id: true },
  });
  if (!noteExists) {
    await prisma.doctorNote.create({
      data: {
        doctorId: doc1.id,
        patientId: mobileDev.id,
        content:
          'حساب اختبار (مطور الموبايل): راقب مزامنة الشات الخاص والقنوات؛ يمكن إنشاء خطط غذائية/تمارين من لوحة الطبيب عند الحاجة.',
      },
    });
  }

  const groceriesCount = await prisma.groceryItem.count({ where: { userId: mobileDev.id } });
  if (groceriesCount === 0) {
    await prisma.groceryItem
      .createMany({
        data: [
          { userId: mobileDev.id, name: 'بيض كامل', quantity: '15', checked: true, order: 0 },
          { userId: mobileDev.id, name: 'شوفان', quantity: '1 kg', checked: false, order: 1 },
          { userId: mobileDev.id, name: 'زبادي يوناني', quantity: '6 قطع', checked: false, order: 2 },
        ],
      })
      .catch(() => {});
  }

  const qaNotifExists = await prisma.notification.findFirst({
    where: { userId: mobileDev.id, title: 'Etqan QA' },
    select: { id: true },
  });
  if (!qaNotifExists) {
    await prisma.notification
      .create({
        data: {
          userId: mobileDev.id,
          title: 'Etqan QA',
          body: 'تم تجهيز بيانات الاختبار: Premium، الشات مع الدكتور، قناة المجتمع، والمنشورات.',
          type: 'INFO',
          read: false,
        },
      })
      .catch(() => {});
  }

  console.log('Created QA user (mobile developer):', mobileDevEmail);

  console.log('✅ Seed completed.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
