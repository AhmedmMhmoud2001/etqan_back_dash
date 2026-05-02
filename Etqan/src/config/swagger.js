const config = require('./index');

const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Etqan API',
    description: [
      'Backend API لتطبيق Etqan (لياقة وتغذية).',
      'يشمل: Auth, Users, Doctors, Admin, Profiles, OTP, Community, Chat, Channels,',
      'Meals, Nutrition Plan, Exercises (with equipmentNeeded), Workout Plan, Workout Sessions,',
      'Measurements, Referrals, Subscription, Grocery, Doctor Notes, Dashboard (Home).',
      'معظم المسارات تتطلب تسجيل الدخول (Bearer JWT).',
    ].join(' '),
    version: '1.0.0',
  },
  servers: [
    { url: `http://localhost:${config.port}/api`, description: 'Local' },
  ],
  tags: [
    { name: 'Auth', description: 'Register, Login' },
    { name: 'OTP', description: 'Verify & Resend OTP' },
    { name: 'Users', description: 'Current user (authenticated)' },
    { name: 'Profiles', description: 'User profile data' },
    { name: 'Doctors', description: 'List & get doctors' },
    { name: 'Admin', description: 'Dashboard, Users CRUD, Doctors CRUD (Admin only)' },
    { name: 'Community', description: 'Posts, comments, likes, shares, follow' },
    { name: 'Chat', description: 'Chat between patient and assigned doctor' },
    { name: 'Channels', description: 'Group chat channels (admin creates, users/doctors send)' },
    { name: 'Meals', description: 'الوجبات: قائمة، إضافة، تسجيل أكل، إحصائيات (أدمن/دكتور يضيف)' },
    { name: 'Nutrition Plan', description: 'خطة التغذية الأسبوعية من الدكتور للعميل' },
    { name: 'Exercises', description: 'التمارين الأساسية + متطلبات المعدات (أدمن/دكتور يضيف، الجميع يشوف)' },
    { name: 'Workout Plan', description: 'الخطة الأسبوعية للتمارين (الدكتور يحدد لكل يوم قالب)' },
    { name: 'Workout Sessions', description: 'جلسات التمرين: بدء، إكمال مجموعة (تسجيل العدات)، إنهاء' },
    { name: 'Measurements', description: 'قياسات الجسم (وزن، دهون، عضلات، ماء، خصر) — Progress / Add Measurement' },
    { name: 'Referrals', description: 'الإحالات: كود المستخدم، عدد الأصدقاء، الخصم المكتسب' },
    { name: 'Subscription', description: 'Premium: حالة الاشتراك، ترقية، تطبيق خصم الإحالة' },
    { name: 'Banners', description: 'Banners: public list + admin CRUD' },
    { name: 'Grocery', description: 'قائمة البقالة (Grocery List)' },
    { name: 'Doctor Notes', description: 'ملاحظة/مراجعة من الدكتور للمريض (Note from your Doctor)' },
    { name: 'Dashboard', description: 'الصفحة الرئيسية: مقاييس، التزام، هدف، ملخص اليوم، ملاحظة الدكتور' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT من POST /auth/login — استخدم زر Authorize وأدخل: Bearer <token>',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          errors: { type: 'array', items: { type: 'object', properties: { field: { type: 'string' }, message: { type: 'string' } } } },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          role: { type: 'string', enum: ['USER', 'DOCTOR', 'ADMIN'] },
          isActive: { type: 'boolean' },
          emailVerified: { type: 'boolean' },
          doctorId: { type: 'string', nullable: true, description: 'Assigned doctor (patients only)' },
          doctor: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, email: { type: 'string' } }, description: 'Assigned doctor info' },
          profile: { $ref: '#/components/schemas/Profile' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Profile: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER'] },
          age: { type: 'integer' },
          height: { type: 'number' },
          weight: { type: 'number' },
          activityLevel: { type: 'string', enum: ['SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE'] },
          goal: { type: 'string', enum: ['LOSE_WEIGHT', 'MAINTAIN', 'BUILD_MUSCLE'] },
          targetWeight: { type: 'number' },
          measurementSystem: { type: 'string', enum: ['METRIC', 'IMPERIAL'] },
          dietaryPreferences: { type: 'array', items: { type: 'string' } },
          allergies: { type: 'array', items: { type: 'string' } },
          healthConditions: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password', 'confirmPassword'],
                properties: {
                  name: { type: 'string', example: 'John Doe' },
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', format: 'password', minLength: 8 },
                  confirmPassword: { type: 'string', format: 'password' },
                  referralCode: { type: 'string', description: 'Optional referral code (e.g. ETQAN2026)' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Registered; OTP sent to email' },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          409: { description: 'Email already registered' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Returns user + token',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                        token: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Invalid credentials or email not verified' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Current user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'User', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/User' } } } } } },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/otp/verify': {
      post: {
        tags: ['OTP'],
        summary: 'Verify OTP',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId', 'code'],
                properties: {
                  userId: { type: 'string' },
                  code: { type: 'string', minLength: 6, maxLength: 6 },
                  type: { type: 'string', default: 'EMAIL_VERIFICATION' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'OTP verified' },
          400: { description: 'Invalid or expired OTP' },
        },
      },
    },
    '/otp/resend': {
      post: {
        tags: ['OTP'],
        summary: 'Resend OTP',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { userId: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'OTP sent' },
          400: { description: 'userId required (or send Bearer token)' },
        },
      },
    },
    '/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Get my profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'User' },
          401: { description: 'Unauthorized' },
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update my user',
        security: [{ bearerAuth: [] }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } } },
        responses: { 200: { description: 'Updated' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/profiles/me': {
      get: {
        tags: ['Profiles'],
        summary: 'Get my profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Profile' },
          401: { description: 'Unauthorized' },
          404: { description: 'Profile not found' },
        },
      },
      put: {
        tags: ['Profiles'],
        summary: 'Create/update profile',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  measurementSystem: { type: 'string', enum: ['METRIC', 'IMPERIAL'] },
                  gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER'] },
                  age: { type: 'integer' },
                  height: { type: 'number' },
                  weight: { type: 'number' },
                  activityLevel: { type: 'string', enum: ['SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE'] },
                  goal: { type: 'string', enum: ['LOSE_WEIGHT', 'MAINTAIN', 'BUILD_MUSCLE'] },
                  targetWeight: { type: 'number' },
                  dietaryPreferences: { type: 'array', items: { type: 'string' } },
                  allergies: { type: 'array', items: { type: 'string' } },
                  healthConditions: { type: 'array', items: { type: 'string' } },
                  notificationsEnabled: { type: 'boolean', description: 'Preferences: notifications on/off' },
                  darkMode: { type: 'boolean', description: 'Preferences: dark mode' },
                  language: { type: 'string', description: 'e.g. en, ar' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Profile' }, 400: { description: 'Validation error' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/doctors': {
      get: {
        tags: ['Doctors'],
        summary: 'List doctors',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'Paginated doctors' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/doctors/{id}': {
      get: {
        tags: ['Doctors'],
        summary: 'Get doctor by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Doctor' }, 401: { description: 'Unauthorized' }, 404: { description: 'Not found' } },
      },
    },
    '/admin/dashboard': {
      get: {
        tags: ['Admin'],
        summary: 'Dashboard stats',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Counts: usersCount, doctorsCount, adminsCount',
            content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object' } } } } },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Admin only' },
        },
      },
    },
    '/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'List users',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['USER', 'DOCTOR', 'ADMIN'] } },
        ],
        responses: { 200: { description: 'Paginated users' }, 401: { description: 'Unauthorized' }, 403: { description: 'Admin only' } },
      },
      post: {
        tags: ['Admin'],
        summary: 'Create user',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  emailVerified: { type: 'boolean', default: true },
                  title: { type: 'string' },
                  titleAr: { type: 'string' },
                  titleIt: { type: 'string' },
                  specialization: { type: 'string' },
                  specializationAr: { type: 'string' },
                  specializationIt: { type: 'string' },
                  bio: { type: 'string' },
                  bioAr: { type: 'string' },
                  bioIt: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'User created' }, 400: { description: 'Validation error' }, 403: { description: 'Admin only' }, 409: { description: 'Email exists' } },
      },
    },
    '/admin/users/{id}': {
      get: {
        tags: ['Admin'],
        summary: 'Get user by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'User' }, 403: { description: 'Admin only' }, 404: { description: 'Not found' } },
      },
      patch: {
        tags: ['Admin'],
        summary: 'Update user',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  isActive: { type: 'boolean' },
                  doctorId: { type: 'string', nullable: true, description: 'Assign doctor (or null to unassign)' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Updated' }, 403: { description: 'Admin only' }, 404: { description: 'Not found' } },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Soft delete user (isActive: false)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Deactivated' }, 403: { description: 'Admin only / Cannot delete admin' }, 404: { description: 'Not found' } },
      },
    },
    '/admin/users/{id}/assign-doctor': {
      patch: {
        tags: ['Admin'],
        summary: 'Assign doctor to user (patient)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'User (patient) id' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['doctorId'], properties: { doctorId: { type: 'string' } } },
            },
          },
        },
        responses: { 200: { description: 'Doctor assigned' }, 400: { description: 'User not patient or doctor not found' }, 403: { description: 'Admin only' }, 404: { description: 'User not found' } },
      },
    },
    '/admin/users/{id}/toggle-active': {
      patch: {
        tags: ['Admin'],
        summary: 'Toggle user active',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Toggled' }, 403: { description: 'Admin only' }, 404: { description: 'Not found' } },
      },
    },
    '/admin/doctors': {
      get: {
        tags: ['Admin'],
        summary: 'List doctors',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'Paginated doctors' }, 403: { description: 'Admin only' } },
      },
      post: {
        tags: ['Admin'],
        summary: 'Create doctor',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  emailVerified: { type: 'boolean', default: true },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Doctor created' }, 400: { description: 'Validation error' }, 403: { description: 'Admin only' }, 409: { description: 'Email exists' } },
      },
    },
    '/admin/doctors/{id}/patients': {
      get: {
        tags: ['Admin'],
        summary: 'List patients (users) assigned to this doctor',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Doctor id' },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'Paginated list of patients' }, 403: { description: 'Admin only' }, 404: { description: 'Doctor not found' } },
      },
    },
    '/admin/doctors/{id}': {
      get: {
        tags: ['Admin'],
        summary: 'Get doctor by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Doctor' }, 403: { description: 'Admin only' }, 404: { description: 'Not found' } },
      },
      patch: {
        tags: ['Admin'],
        summary: 'Update doctor',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  isActive: { type: 'boolean' },
                  title: { type: 'string' },
                  titleAr: { type: 'string' },
                  titleIt: { type: 'string' },
                  specialization: { type: 'string' },
                  specializationAr: { type: 'string' },
                  specializationIt: { type: 'string' },
                  bio: { type: 'string' },
                  bioAr: { type: 'string' },
                  bioIt: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Updated' }, 403: { description: 'Admin only' }, 404: { description: 'Not found' } },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Soft delete doctor',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Deactivated' }, 403: { description: 'Admin only' }, 404: { description: 'Not found' } },
      },
    },

    // Community
    '/community/stats': {
      get: {
        tags: ['Community'],
        summary: 'Community stats (members, your posts, followers)',
        security: [],
        responses: { 200: { description: 'membersCount, myPostsCount (if auth), followersCount (if auth)' } },
      },
    },
    '/community/posts': {
      get: {
        tags: ['Community'],
        summary: 'Feed (list posts)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'items, total, page, limit; each post has author, likesCount, commentsCount, sharesCount, liked (if auth)' } },
      },
      post: {
        tags: ['Community'],
        summary: 'Create post',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: {
                  content: { type: 'string' },
                  imageUrl: { type: 'string', format: 'uri' },
                  badge: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Post created' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/community/posts/{id}': {
      get: {
        tags: ['Community'],
        summary: 'Get single post',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Post with author, counts, liked' }, 404: { description: 'Not found' } },
      },
      patch: {
        tags: ['Community'],
        summary: 'Update own post',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { content: { type: 'string' }, imageUrl: { type: 'string' }, badge: { type: 'string' } } } } } },
        responses: { 200: { description: 'Updated' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } },
      },
      delete: {
        tags: ['Community'],
        summary: 'Delete own post',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Deleted' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } },
      },
    },
    '/community/posts/{id}/comments': {
      get: {
        tags: ['Community'],
        summary: 'List comments on post',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'items, total' }, 404: { description: 'Post not found' } },
      },
      post: {
        tags: ['Community'],
        summary: 'Add comment',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['content'], properties: { content: { type: 'string' } } } } } },
        responses: { 201: { description: 'Comment added' }, 401: { description: 'Unauthorized' }, 404: { description: 'Post not found' } },
      },
    },
    '/community/comments/{commentId}': {
      patch: {
        tags: ['Community'],
        summary: 'Update own comment',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'commentId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['content'], properties: { content: { type: 'string' } } } } } },
        responses: { 200: { description: 'Updated' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } },
      },
      delete: {
        tags: ['Community'],
        summary: 'Delete own comment',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'commentId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Deleted' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } },
      },
    },
    '/community/posts/{id}/like': {
      post: {
        tags: ['Community'],
        summary: 'Toggle like (like/unlike)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: '{ liked: true|false }' }, 401: { description: 'Unauthorized' }, 404: { description: 'Post not found' } },
      },
    },
    '/community/posts/{id}/share': {
      post: {
        tags: ['Community'],
        summary: 'Share post (increments share count)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: '{ shared: true, sharesCount }' }, 401: { description: 'Unauthorized' }, 404: { description: 'Post not found' } },
      },
    },
    '/community/users/{userId}/follow': {
      post: {
        tags: ['Community'],
        summary: 'Follow user',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: '{ followed: true }' }, 400: { description: 'Cannot follow yourself' }, 401: { description: 'Unauthorized' }, 404: { description: 'User not found' } },
      },
      delete: {
        tags: ['Community'],
        summary: 'Unfollow user',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Unfollowed' }, 401: { description: 'Unauthorized' } },
      },
    },

    // Chat (patient ↔ assigned doctor)
    '/chat/conversations': {
      get: {
        tags: ['Chat'],
        summary: 'My conversations (patient: one with doctor; doctor: all with patients)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'items, total' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/chat/conversations/me': {
      get: {
        tags: ['Chat'],
        summary: 'Get or create my conversation with my doctor (patient only)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Single conversation' }, 400: { description: 'No doctor assigned' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/chat/conversations/{id}': {
      get: {
        tags: ['Chat'],
        summary: 'Get conversation by id (must be participant)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Conversation' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } },
      },
    },
    '/chat/conversations/{id}/messages': {
      get: {
        tags: ['Chat'],
        summary: 'List messages (paginated)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'before', in: 'query', schema: { type: 'string', format: 'date-time' }, description: 'Cursor: messages before this date' },
        ],
        responses: { 200: { description: 'items, total, page, limit' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } },
      },
      post: {
        tags: ['Chat'],
        summary: 'Send message (text and/or attachment)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  content: { type: 'string' },
                  attachmentUrl: { type: 'string', format: 'uri' },
                  attachmentName: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Message sent' }, 400: { description: 'Content or attachment required' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } },
      },
    },

    // Channels (دردشة جماعية)
    '/channels': {
      get: {
        tags: ['Channels'],
        summary: 'List channels',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'items, total, page, limit' } },
      },
    },
    '/channels/{id}': {
      get: {
        tags: ['Channels'],
        summary: 'Get channel by id',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Channel' }, 404: { description: 'Not found' } },
      },
    },
    '/channels/{id}/messages': {
      get: {
        tags: ['Channels'],
        summary: 'List channel messages',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'before', in: 'query', schema: { type: 'string', format: 'date-time' } },
        ],
        responses: { 200: { description: 'items, total, page, limit' }, 401: { description: 'Unauthorized' }, 404: { description: 'Not found' } },
      },
      post: {
        tags: ['Channels'],
        summary: 'Send message to channel (user or doctor)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  content: { type: 'string' },
                  attachmentUrl: { type: 'string', format: 'uri' },
                  attachmentName: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Message sent' }, 400: { description: 'Content or attachment required' }, 401: { description: 'Unauthorized' }, 404: { description: 'Not found' } },
      },
    },
    '/admin/channels': {
      post: {
        tags: ['Admin', 'Channels'],
        summary: 'Create channel (admin only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  nameAr: { type: 'string' },
                  nameIt: { type: 'string' },
                  description: { type: 'string' },
                  descriptionAr: { type: 'string' },
                  descriptionIt: { type: 'string' },
                  icon: { type: 'string', description: 'e.g. emoji 💪' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Channel created' }, 400: { description: 'Validation error' }, 401: { description: 'Unauthorized' }, 403: { description: 'Admin only' } },
      },
    },
    '/admin/channels/{id}': {
      patch: {
        tags: ['Admin', 'Channels'],
        summary: 'Update channel (admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  nameAr: { type: 'string' },
                  nameIt: { type: 'string' },
                  description: { type: 'string' },
                  descriptionAr: { type: 'string' },
                  descriptionIt: { type: 'string' },
                  icon: { type: 'string' },
                  isActive: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Channel updated' }, 403: { description: 'Admin only' }, 404: { description: 'Not found' } },
      },
      delete: {
        tags: ['Admin', 'Channels'],
        summary: 'Delete channel (admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Channel deleted' }, 403: { description: 'Admin only' }, 404: { description: 'Not found' } },
      },
    },

    // ——— Admin: Packages & Subscriptions ———
    '/admin/packages': {
      get: {
        tags: ['Admin'],
        summary: 'List subscription packages (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'activeOnly', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: { 200: { description: 'items, total' }, 401: { description: 'Unauthorized' }, 403: { description: 'Admin only' } },
      },
      post: {
        tags: ['Admin'],
        summary: 'Create subscription package (admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'durationMonths', 'listPrice', 'payPrice'],
                properties: {
                  name: { type: 'string' },
                  durationMonths: { type: 'integer', enum: [1, 3, 6, 12] },
                  listPrice: { type: 'string', example: '199.00' },
                  payPrice: { type: 'string', example: '199.00' },
                  currency: { type: 'string', example: 'EGP' },
                  isActive: { type: 'boolean', default: true },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Created' }, 401: { description: 'Unauthorized' }, 403: { description: 'Admin only' } },
      },
    },
    '/admin/packages/{id}': {
      patch: {
        tags: ['Admin'],
        summary: 'Update subscription package (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { 200: { description: 'Updated' }, 401: { description: 'Unauthorized' }, 403: { description: 'Admin only' } },
      },
    },
    '/admin/subscriptions/{userId}/assign-package': {
      post: {
        tags: ['Admin'],
        summary: 'Assign/renew package for user (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['packageId'], properties: { packageId: { type: 'string' } } } } } },
        responses: { 200: { description: 'Updated subscription' }, 401: { description: 'Unauthorized' }, 403: { description: 'Admin only' } },
      },
    },
    '/admin/referrals/settings': {
      get: {
        tags: ['Admin', 'Referrals'],
        summary: 'Get referral discount settings (admin)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'discountPercentPerReferral, maxDiscountPercent' }, 401: { description: 'Unauthorized' }, 403: { description: 'Admin only' } },
      },
      patch: {
        tags: ['Admin', 'Referrals'],
        summary: 'Update referral discount settings (admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  discountPercentPerReferral: { type: 'integer', example: 10 },
                  maxDiscountPercent: { type: 'integer', example: 50 },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Updated settings' }, 401: { description: 'Unauthorized' }, 403: { description: 'Admin only' } },
      },
    },

    // ——— Banners ———
    '/banners': {
      get: {
        tags: ['Banners'],
        summary: 'List active banners (public)',
        security: [],
        responses: {
          200: {
            description: 'items[]',
          },
        },
      },
    },
    '/banners/admin': {
      get: {
        tags: ['Admin', 'Banners'],
        summary: 'List banners (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
        ],
        responses: { 200: { description: 'items, total, page, limit' }, 401: { description: 'Unauthorized' }, 403: { description: 'Admin only' } },
      },
      post: {
        tags: ['Admin', 'Banners'],
        summary: 'Create banner (admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['imageUrl'],
                properties: {
                  title: { type: 'string', nullable: true },
                  titleAr: { type: 'string', nullable: true },
                  titleIt: { type: 'string', nullable: true },
                  description: { type: 'string', nullable: true },
                  descriptionAr: { type: 'string', nullable: true },
                  descriptionIt: { type: 'string', nullable: true },
                  imageUrl: { type: 'string', example: '/uploads/banner.jpg' },
                  link: { type: 'string', nullable: true },
                  order: { type: 'integer', default: 0 },
                  isActive: { type: 'boolean', default: true },
                  startsAt: { type: 'string', format: 'date-time', nullable: true },
                  endsAt: { type: 'string', format: 'date-time', nullable: true },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Created' }, 400: { description: 'Validation error' }, 401: { description: 'Unauthorized' }, 403: { description: 'Admin only' } },
      },
    },
    '/banners/admin/{id}': {
      patch: {
        tags: ['Admin', 'Banners'],
        summary: 'Update banner (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string', nullable: true },
                  titleAr: { type: 'string', nullable: true },
                  titleIt: { type: 'string', nullable: true },
                  description: { type: 'string', nullable: true },
                  descriptionAr: { type: 'string', nullable: true },
                  descriptionIt: { type: 'string', nullable: true },
                  imageUrl: { type: 'string' },
                  link: { type: 'string', nullable: true },
                  order: { type: 'integer' },
                  isActive: { type: 'boolean' },
                  startsAt: { type: 'string', format: 'date-time', nullable: true },
                  endsAt: { type: 'string', format: 'date-time', nullable: true },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Updated' }, 400: { description: 'Validation error' }, 401: { description: 'Unauthorized' }, 403: { description: 'Admin only' }, 404: { description: 'Not found' } },
      },
      delete: {
        tags: ['Admin', 'Banners'],
        summary: 'Delete banner (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Deleted' }, 401: { description: 'Unauthorized' }, 403: { description: 'Admin only' }, 404: { description: 'Not found' } },
      },
    },

    // ——— Meals (الوجبات) ———
    '/meals': {
      get: {
        tags: ['Meals'],
        summary: 'List meals (filter by mealType)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'mealType', in: 'query', schema: { type: 'string', enum: ['BREAKFAST', 'SNACK', 'LUNCH', 'DINNER'] } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'items, total' }, 401: { description: 'Unauthorized' } },
      },
      post: {
        tags: ['Meals'],
        summary: 'Create meal (Admin/Doctor only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'mealType', 'prepTimeMinutes', 'calories', 'proteinG', 'carbsG', 'fatsG'],
                properties: {
                  name: { type: 'string' },
                  nameAr: { type: 'string' },
                  nameIt: { type: 'string' },
                  imageUrl: { type: 'string', format: 'uri' },
                  mealType: { type: 'string', enum: ['BREAKFAST', 'SNACK', 'LUNCH', 'DINNER'] },
                  prepTimeMinutes: { type: 'integer' },
                  calories: { type: 'integer' },
                  proteinG: { type: 'integer' },
                  carbsG: { type: 'integer' },
                  fatsG: { type: 'integer' },
                  dietaryTags: { type: 'array', items: { type: 'string' } },
                  ingredients: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, quantity: { type: 'string' }, unit: { type: 'string' }, order: { type: 'integer' } } } },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Meal created' }, 400: { description: 'Validation error' }, 401: { description: 'Unauthorized' }, 403: { description: 'Admin/Doctor only' } },
      },
    },
    '/meals/ingredients/available': {
      get: {
        tags: ['Meals'],
        summary: 'Get available ingredients (for AI suggest)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'List of ingredient names' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/meals/suggest': {
      get: {
        tags: ['Meals'],
        summary: 'Suggest meals (query: ingredients, mealType)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'ingredients', in: 'query', schema: { type: 'string' } },
          { name: 'mealType', in: 'query', schema: { type: 'string', enum: ['BREAKFAST', 'SNACK', 'LUNCH', 'DINNER'] } },
        ],
        responses: { 200: { description: 'Suggested meals' }, 401: { description: 'Unauthorized' } },
      },
      post: {
        tags: ['Meals'],
        summary: 'Suggest meals (body: ingredientNames, mealType)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  ingredientNames: { type: 'array', items: { type: 'string' } },
                  mealType: { type: 'string', enum: ['BREAKFAST', 'SNACK', 'LUNCH', 'DINNER'] },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Suggested meals' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/meals/eaten': {
      post: {
        tags: ['Meals'],
        summary: 'Log meal as eaten (mark as eaten)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['mealId'],
                properties: {
                  mealId: { type: 'string' },
                  eatenAt: { type: 'string', format: 'date-time' },
                  planSlotId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Meal logged' }, 400: { description: 'Validation error' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/meals/my/logs': {
      get: {
        tags: ['Meals'],
        summary: 'My meal logs (date range)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: { 200: { description: 'Logs' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/meals/my/stats': {
      get: {
        tags: ['Meals'],
        summary: 'My nutrition stats (date range)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: { 200: { description: 'Stats' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/meals/my/stats/daily': {
      get: {
        tags: ['Meals'],
        summary: 'My daily stats (date range)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: { 200: { description: 'Daily stats' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/meals/{id}': {
      get: {
        tags: ['Meals'],
        summary: 'Get meal by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Meal' }, 401: { description: 'Unauthorized' }, 404: { description: 'Not found' } },
      },
      patch: {
        tags: ['Meals'],
        summary: 'Update meal (Admin/Doctor only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  nameAr: { type: 'string' },
                  nameIt: { type: 'string' },
                  imageUrl: { type: 'string', format: 'uri' },
                  mealType: { type: 'string', enum: ['BREAKFAST', 'SNACK', 'LUNCH', 'DINNER'] },
                  prepTimeMinutes: { type: 'integer' },
                  calories: { type: 'integer' },
                  proteinG: { type: 'integer' },
                  carbsG: { type: 'integer' },
                  fatsG: { type: 'integer' },
                  dietaryTags: { type: 'array', items: { type: 'string' } },
                  ingredients: { type: 'array' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Meal updated' }, 400: { description: 'Validation error' }, 401: { description: 'Unauthorized' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } },
      },
      delete: {
        tags: ['Meals'],
        summary: 'Delete meal (Admin/Doctor only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Meal deleted' }, 401: { description: 'Unauthorized' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } },
      },
    },

    // ——— Nutrition Plan ———
    '/nutrition-plan/my/plan': {
      get: {
        tags: ['Nutrition Plan'],
        summary: 'My active nutrition plan (optional date)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'date', in: 'query', schema: { type: 'string', format: 'date' } }],
        responses: { 200: { description: 'Plan or null' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/nutrition-plan/my/plans': {
      get: {
        tags: ['Nutrition Plan'],
        summary: 'My nutrition plans list',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'date', in: 'query', schema: { type: 'string', format: 'date' } }],
        responses: { 200: { description: 'plans' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/nutrition-plan/my/today-slots': {
      get: {
        tags: ['Nutrition Plan'],
        summary: "Today's meal slots (with completed status)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'date', in: 'query', schema: { type: 'string', format: 'date' } }],
        responses: { 200: { description: 'plan, slots' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/nutrition-plan/my/today-progress': {
      get: {
        tags: ['Nutrition Plan'],
        summary: "Today's progress (consumed vs targets)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'date', in: 'query', schema: { type: 'string', format: 'date' } }],
        responses: { 200: { description: 'hasPlan, consumed, targets' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/nutrition-plan/my/weekly-adherence': {
      get: {
        tags: ['Nutrition Plan'],
        summary: 'Weekly adherence (per day)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: { 200: { description: 'plan, days' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/nutrition-plan/my-created': {
      get: {
        tags: ['Nutrition Plan'],
        summary: 'Plans I created (Doctor/Admin)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'plans' }, 401: { description: 'Unauthorized' }, 403: { description: 'Doctor/Admin only' } },
      },
    },
    '/nutrition-plan/patient/{userId}/plans': {
      get: {
        tags: ['Nutrition Plan'],
        summary: 'Plans for patient (Doctor/Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'plans' }, 401: { description: 'Unauthorized' }, 403: { description: 'Doctor/Admin only' } },
      },
    },
    '/nutrition-plan/doctor/{doctorId}/plans': {
      get: {
        tags: ['Nutrition Plan'],
        summary: 'Plans by doctor (Doctor/Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'doctorId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'plans' }, 401: { description: 'Unauthorized' }, 403: { description: 'Doctor/Admin only' } },
      },
    },
    '/nutrition-plan': {
      post: {
        tags: ['Nutrition Plan'],
        summary: 'Create nutrition plan (Doctor/Admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId', 'startDate', 'endDate', 'dailyCalorieTarget', 'dailyProteinTarget', 'dailyCarbsTarget', 'dailyFatsTarget'],
                properties: {
                  userId: { type: 'string' },
                  startDate: { type: 'string', format: 'date' },
                  endDate: { type: 'string', format: 'date' },
                  dailyCalorieTarget: { type: 'integer' },
                  dailyProteinTarget: { type: 'integer' },
                  dailyCarbsTarget: { type: 'integer' },
                  dailyFatsTarget: { type: 'integer' },
                  doctorId: { type: 'string' },
                  slots: { type: 'array', items: { type: 'object', properties: { date: { type: 'string', format: 'date' }, slotType: { type: 'string', enum: ['BREAKFAST', 'SNACK', 'LUNCH', 'DINNER'] }, time: { type: 'string' }, mealId: { type: 'string' } } } },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Plan created' }, 400: { description: 'Validation error' }, 401: { description: 'Unauthorized' }, 403: { description: 'Doctor/Admin only' } },
      },
    },
    '/nutrition-plan/{id}': {
      get: {
        tags: ['Nutrition Plan'],
        summary: 'Get plan by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Plan' }, 401: { description: 'Unauthorized' }, 404: { description: 'Not found' } },
      },
      patch: {
        tags: ['Nutrition Plan'],
        summary: 'Update plan (Doctor/Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  startDate: { type: 'string', format: 'date' },
                  endDate: { type: 'string', format: 'date' },
                  dailyCalorieTarget: { type: 'integer' },
                  dailyProteinTarget: { type: 'integer' },
                  dailyCarbsTarget: { type: 'integer' },
                  dailyFatsTarget: { type: 'integer' },
                  slots: { type: 'array' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Plan updated' }, 400: { description: 'Validation error' }, 401: { description: 'Unauthorized' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } },
      },
      delete: {
        tags: ['Nutrition Plan'],
        summary: 'Delete plan (Doctor/Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Plan deleted' }, 401: { description: 'Unauthorized' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } },
      },
    },

    // ——— Exercises (التمارين) ———
    '/exercises': {
      get: {
        tags: ['Exercises'],
        summary: 'List exercises (search, pagination)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'offset', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'items, total' }, 401: { description: 'Unauthorized' } },
      },
      post: {
        tags: ['Exercises'],
        summary: 'Create exercise (Admin/Doctor only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  nameAr: { type: 'string' },
                  nameIt: { type: 'string' },
                  imageUrl: { type: 'string', description: 'URL or path e.g. /uploads/xxx.jpg' },
                  description: { type: 'string' },
                  descriptionAr: { type: 'string' },
                  descriptionIt: { type: 'string' },
                  targetMuscles: { type: 'array', items: { type: 'string' } },
                  equipmentNeeded: {
                    type: 'array',
                    description: 'متطلبات التمرين (المعدات) — كل عنصر: name (EN), nameAr (AR), nameIt (IT)',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string', example: 'Dumbbells' },
                        nameAr: { type: 'string', example: 'دمبل' },
                        nameIt: { type: 'string', example: 'Manubri' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Exercise created' }, 400: { description: 'Validation error' }, 401: { description: 'Unauthorized' }, 403: { description: 'Admin/Doctor only' } },
      },
    },
    '/exercises/{id}': {
      get: {
        tags: ['Exercises'],
        summary: 'Get exercise by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Exercise' }, 401: { description: 'Unauthorized' }, 404: { description: 'Not found' } },
      },
      patch: {
        tags: ['Exercises'],
        summary: 'Update exercise (Admin/Doctor only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  nameAr: { type: 'string' },
                  nameIt: { type: 'string' },
                  imageUrl: { type: 'string', description: 'URL or path e.g. /uploads/xxx.jpg' },
                  description: { type: 'string' },
                  descriptionAr: { type: 'string' },
                  descriptionIt: { type: 'string' },
                  targetMuscles: { type: 'array', items: { type: 'string' } },
                  equipmentNeeded: {
                    type: 'array',
                    description: 'متطلبات التمرين (المعدات) — كل عنصر: name, nameAr, nameIt',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        nameAr: { type: 'string' },
                        nameIt: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Exercise updated' }, 400: { description: 'Validation error' }, 401: { description: 'Unauthorized' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } },
      },
      delete: {
        tags: ['Exercises'],
        summary: 'Delete exercise (Admin/Doctor only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Exercise deleted' }, 401: { description: 'Unauthorized' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } },
      },
    },

    // ——— Workout Plan (الخطة الأسبوعية) ———
    '/workout-plan/my/current-week': {
      get: {
        tags: ['Workout Plan'],
        summary: 'My current week plan (This Week)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'date', in: 'query', schema: { type: 'string', format: 'date' } }],
        responses: { 200: { description: 'plan, progress' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/workout-plan/my/day-detail': {
      get: {
        tags: ['Workout Plan'],
        summary: "Today's workout detail (exercises, sets, reps)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'date', in: 'query', schema: { type: 'string', format: 'date' } }],
        responses: { 200: { description: 'plan, day' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/workout-plan/my/plans': {
      get: {
        tags: ['Workout Plan'],
        summary: 'My weekly workout plans',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'plans' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/workout-plan/my/progress/{planId}': {
      get: {
        tags: ['Workout Plan'],
        summary: 'Weekly progress (completed days)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'planId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'completedCount, totalDays, days' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/workout-plan/doctor/{doctorId}/plans': {
      get: {
        tags: ['Workout Plan'],
        summary: 'Plans by doctor (Doctor/Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'doctorId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'plans' }, 401: { description: 'Unauthorized' }, 403: { description: 'Doctor/Admin only' } },
      },
    },
    '/workout-plan': {
      post: {
        tags: ['Workout Plan'],
        summary: 'Create weekly plan for user (Doctor/Admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId', 'weekStart', 'weekEnd'],
                properties: {
                  userId: { type: 'string' },
                  weekStart: { type: 'string', format: 'date' },
                  weekEnd: { type: 'string', format: 'date' },
                  doctorId: { type: 'string' },
                  days: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        date: { type: 'string', format: 'date' },
                        exerciseId: { type: 'string' },
                        sets: { type: 'integer' },
                        repMin: { type: 'integer' },
                        repMax: { type: 'integer' },
                        order: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Plan created' }, 400: { description: 'Validation error' }, 401: { description: 'Unauthorized' }, 403: { description: 'Doctor/Admin only' } },
      },
    },
    '/workout-plan/{id}': {
      get: {
        tags: ['Workout Plan'],
        summary: 'Get plan by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Plan' }, 401: { description: 'Unauthorized' }, 404: { description: 'Not found' } },
      },
      patch: {
        tags: ['Workout Plan'],
        summary: 'Update plan (Doctor/Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  weekStart: { type: 'string', format: 'date' },
                  weekEnd: { type: 'string', format: 'date' },
                  days: { type: 'array' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Plan updated' }, 400: { description: 'Validation error' }, 401: { description: 'Unauthorized' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } },
      },
      delete: {
        tags: ['Workout Plan'],
        summary: 'Delete plan (Doctor/Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Plan deleted' }, 401: { description: 'Unauthorized' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } },
      },
    },

    // ——— Workout Sessions ———
    '/workout-sessions': {
      get: {
        tags: ['Workout Sessions'],
        summary: 'My workout sessions list',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'offset', in: 'query', schema: { type: 'integer' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['IN_PROGRESS', 'COMPLETED', 'ABANDONED'] } },
        ],
        responses: { 200: { description: 'items, total' }, 401: { description: 'Unauthorized' } },
      },
      post: {
        tags: ['Workout Sessions'],
        summary: 'Start workout session',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userWeeklyPlanDayId'],
                properties: {
                  userWeeklyPlanDayId: { type: 'string', description: 'ID of the plan day to start (must have an exercise)' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Session started' }, 400: { description: 'Validation error' }, 401: { description: 'Unauthorized' }, 404: { description: 'Template not found' } },
      },
    },
    '/workout-sessions/complete-set/{sessionExerciseId}': {
      post: {
        tags: ['Workout Sessions'],
        summary: 'Complete a set (log actual reps)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'sessionExerciseId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['setNumber', 'actualReps'],
                properties: {
                  setNumber: { type: 'integer' },
                  actualReps: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Session with updated sets' }, 400: { description: 'Validation error' }, 401: { description: 'Unauthorized' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } },
      },
    },
    '/workout-sessions/{id}': {
      get: {
        tags: ['Workout Sessions'],
        summary: 'Get session by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Session with exercises and sets' }, 401: { description: 'Unauthorized' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } },
      },
    },
    '/workout-sessions/{id}/end': {
      patch: {
        tags: ['Workout Sessions'],
        summary: 'End workout session',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['COMPLETED', 'ABANDONED'] },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Session ended' }, 400: { description: 'Session already ended' }, 401: { description: 'Unauthorized' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } },
      },
    },

    // ——— Measurements (قياسات الجسم / Progress) ———
    '/measurements': {
      get: {
        tags: ['Measurements'],
        summary: 'My measurements list (optional date range)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'offset', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'items, total' }, 401: { description: 'Unauthorized' } },
      },
      post: {
        tags: ['Measurements'],
        summary: 'Add measurement (Save Measurement)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['weight'],
                properties: {
                  weight: { type: 'number', description: 'kg' },
                  bodyFat: { type: 'number', description: '%' },
                  muscleMass: { type: 'number', description: 'kg' },
                  water: { type: 'number', description: '%' },
                  waist: { type: 'number', description: 'cm' },
                  source: { type: 'string', enum: ['MANUAL', 'BIA_SCALE'], default: 'MANUAL' },
                  measuredAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Measurement saved' }, 400: { description: 'Validation error' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/measurements/progress': {
      get: {
        tags: ['Measurements'],
        summary: 'Progress (current, start, targetWeight, changes, chartData)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'period', in: 'query', schema: { type: 'string', enum: ['1M', '3M', '6M', '1Y'], default: '3M' } },
        ],
        responses: {
          200: {
            description: 'current, start, targetWeight (from profile), changes (weight/bodyFat/muscleMass/water), chartData[]',
          },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/measurements/baseline': {
      get: {
        tags: ['Measurements'],
        summary: 'Get my baseline (start) values',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Baseline (start) snapshot or null' }, 401: { description: 'Unauthorized' } },
      },
      put: {
        tags: ['Measurements'],
        summary: 'Create/update my baseline (start) values',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['weight'],
                properties: {
                  weight: { type: 'number' },
                  bodyFat: { type: 'number', nullable: true },
                  muscleMass: { type: 'number', nullable: true },
                  water: { type: 'number', nullable: true },
                  waist: { type: 'number', nullable: true },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Baseline saved' }, 400: { description: 'Validation error' }, 401: { description: 'Unauthorized' } },
      },
      delete: {
        tags: ['Measurements'],
        summary: 'Delete my baseline (start) values',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Deleted' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/measurements/goal': {
      get: {
        tags: ['Measurements'],
        summary: 'Get my goal values',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Goal snapshot or null' }, 401: { description: 'Unauthorized' } },
      },
      put: {
        tags: ['Measurements'],
        summary: 'Create/update my goal values',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['weight'],
                properties: {
                  weight: { type: 'number' },
                  bodyFat: { type: 'number', nullable: true },
                  muscleMass: { type: 'number', nullable: true },
                  water: { type: 'number', nullable: true },
                  waist: { type: 'number', nullable: true },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Goal saved' }, 400: { description: 'Validation error' }, 401: { description: 'Unauthorized' } },
      },
      delete: {
        tags: ['Measurements'],
        summary: 'Delete my goal values',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Deleted' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/measurements/progress/summary': {
      get: {
        tags: ['Measurements'],
        summary: 'Progress summary using baseline + latest measurement + goal (with progressPercent)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'baseline, current, goal, metrics{...}' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/measurements/{id}': {
      get: {
        tags: ['Measurements'],
        summary: 'Get measurement by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Measurement' }, 401: { description: 'Unauthorized' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } },
      },
      delete: {
        tags: ['Measurements'],
        summary: 'Delete measurement',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Measurement deleted' }, 401: { description: 'Unauthorized' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } },
      },
    },

    // ——— Referrals ———
    '/referrals/my-status': {
      get: {
        tags: ['Referrals'],
        summary: 'My referral status (code, friends joined, discount earned)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'referralCode, friendsJoined, discountPerReferral, discountEarned, discountToApplyOnNextRenewal',
          },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/referrals/list': {
      get: {
        tags: ['Referrals'],
        summary: 'List my referred friends',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'referrals[] (id, name, joinedAt)' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/referrals/me': {
      get: {
        tags: ['Referrals'],
        summary: 'Referrals screen payload (mobile/dashboard)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'referralCode, friendsJoined, discountEarned, mySubscription, referrals[]' },
          401: { description: 'Unauthorized' },
        },
      },
    },

    // ——— Subscription (Premium) ———
    '/subscription/my': {
      get: {
        tags: ['Subscription'],
        summary: 'My subscription (plan, endsAt, discount to apply)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'plan (FREE/PREMIUM), endsAt, discountPercentToApply, isPremium' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/subscription/upgrade': {
      post: {
        tags: ['Subscription'],
        summary: 'Upgrade to Premium (by packageId or durationMonths)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  packageId: { type: 'string', description: 'Preferred: upgrade by package' },
                  durationMonths: { type: 'integer', default: 1, description: 'Legacy fallback' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Updated subscription' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/subscription/packages': {
      get: {
        tags: ['Subscription'],
        summary: 'List active subscription packages',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'items[] (name, durationMonths, listPrice, payPrice, currency)' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/subscription/apply-discount': {
      post: {
        tags: ['Subscription'],
        summary: 'Apply referral discount on renewal (resets discount)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Discount applied' }, 401: { description: 'Unauthorized' } },
      },
    },

    // ——— Grocery List ———
    '/grocery': {
      get: {
        tags: ['Grocery'],
        summary: 'My grocery list',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'items[]' }, 401: { description: 'Unauthorized' } },
      },
      post: {
        tags: ['Grocery'],
        summary: 'Add grocery item',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  quantity: { type: 'string' },
                  checked: { type: 'boolean', default: false },
                  order: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Item added' }, 400: { description: 'Validation error' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/grocery/{id}': {
      get: {
        tags: ['Grocery'],
        summary: 'Get grocery item by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Item' }, 401: { description: 'Unauthorized' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } },
      },
      patch: {
        tags: ['Grocery'],
        summary: 'Update grocery item',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  quantity: { type: 'string' },
                  checked: { type: 'boolean' },
                  order: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Item updated' }, 400: { description: 'Validation error' }, 401: { description: 'Unauthorized' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } },
      },
      delete: {
        tags: ['Grocery'],
        summary: 'Delete grocery item',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Item deleted' }, 401: { description: 'Unauthorized' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } },
      },
    },
    '/grocery/{id}/toggle': {
      patch: {
        tags: ['Grocery'],
        summary: 'Toggle item checked',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['checked'], properties: { checked: { type: 'boolean' } } },
            },
          },
        },
        responses: { 200: { description: 'Updated' }, 400: { description: 'Validation error' }, 401: { description: 'Unauthorized' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } },
      },
    },

    // ——— Doctor Notes ———
    '/doctor-notes/my/latest': {
      get: {
        tags: ['Doctor Notes'],
        summary: 'Latest note from my doctor (or last chat message if no note)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'note (content, createdAt, doctor) or null' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/doctor-notes': {
      post: {
        tags: ['Doctor Notes'],
        summary: 'Add note for patient (Doctor/Admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['patientId', 'content'],
                properties: {
                  patientId: { type: 'string' },
                  content: { type: 'string' },
                  doctorId: { type: 'string', description: 'Admin: optional, use patient\'s doctor if omitted' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Note added' }, 400: { description: 'Validation error' }, 401: { description: 'Unauthorized' }, 403: { description: 'Doctor/Admin only' }, 404: { description: 'Patient/Doctor not found' } },
      },
    },
    '/doctor-notes/my': {
      get: {
        tags: ['Doctor Notes'],
        summary: 'List my doctor notes',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'notes[]' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/doctor-notes/patient/{patientId}': {
      get: {
        tags: ['Doctor Notes'],
        summary: 'List notes for patient (Doctor/Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'patientId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'notes[]' }, 401: { description: 'Unauthorized' }, 403: { description: 'Forbidden' } },
      },
    },

    // ——— Dashboard (Home) ———
    '/dashboard': {
      get: {
        tags: ['Dashboard'],
        summary: 'Home dashboard: body composition, weekly adherence (nutrition + workouts), goal progress, today summary, doctor note',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'date', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Optional date for "today"' }],
        responses: {
          200: {
            description: 'bodyComposition (current, changes), weeklyAdherence (nutrition, workouts, overallPercent), goalProgress (currentWeightKg, targetWeightKg, remainingKg, estimatedReachDate, weeklyTrendKg), todaySummary (date, calories, workouts), doctorNote (content, createdAt, doctor, source)',
          },
          401: { description: 'Unauthorized' },
        },
      },
    },
  },
};

module.exports = swaggerDocument;
