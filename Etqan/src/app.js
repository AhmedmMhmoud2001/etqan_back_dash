const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./config/swagger');
const swaggerMobileDocument = require('./config/swagger.mobile');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const doctorRoutes = require('./routes/doctor.routes');
const adminRoutes = require('./routes/admin.routes');
const profileRoutes = require('./routes/profile.routes');
const otpRoutes = require('./routes/otp.routes');
const communityRoutes = require('./routes/community.routes');
const chatRoutes = require('./routes/chat.routes');
const channelsRoutes = require('./routes/channels.routes');
const mealsRoutes = require('./routes/meals.routes');
const nutritionPlanRoutes = require('./routes/nutritionPlan.routes');
const exercisesRoutes = require('./routes/exercises.routes');
const userWeeklyPlanRoutes = require('./routes/userWeeklyPlan.routes');
const workoutSessionRoutes = require('./routes/workoutSession.routes');
const measurementsRoutes = require('./routes/measurements.routes');
const referralsRoutes = require('./routes/referrals.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const groceryRoutes = require('./routes/grocery.routes');
const doctorNoteRoutes = require('./routes/doctorNote.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const notificationRoutes = require('./routes/notification.routes');
const uploadRoutes = require('./routes/upload.routes');
const bannersRoutes = require('./routes/banners.routes');
const { errorHandler, notFound } = require('./middlewares/error.middleware');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Swagger API docs
// NOTE: swagger-ui-express shares one global swagger-ui-init.js when using swaggerUi.serve twice.
// Use serveFiles() per mount so each URL gets the correct spec (see swagger-ui-express source: swaggerInit).
// - /api-docs: mobile spec (swagger.mobile.js)
// - /api-docs-admin: full spec including admin
const swaggerNoCache = (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
};
const swaggerUiMobileOpts = {
  customSiteTitle: 'Etqan API Docs (Mobile)',
  customCss: '.swagger-ui .topbar { display: none }',
};
const swaggerUiAdminOpts = {
  customSiteTitle: 'Etqan API Docs (Admin)',
  customCss: '.swagger-ui .topbar { display: none }',
};
app.use(
  '/api-docs',
  swaggerNoCache,
  ...swaggerUi.serveFiles(swaggerMobileDocument, swaggerUiMobileOpts),
  swaggerUi.setup(swaggerMobileDocument, swaggerUiMobileOpts)
);
app.use(
  '/api-docs-admin',
  swaggerNoCache,
  ...swaggerUi.serveFiles(swaggerDocument, swaggerUiAdminOpts),
  swaggerUi.setup(swaggerDocument, swaggerUiAdminOpts)
);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/channels', channelsRoutes);
app.use('/api/meals', mealsRoutes);
app.use('/api/nutrition-plan', nutritionPlanRoutes);
app.use('/api/exercises', exercisesRoutes);
app.use('/api/workout-plan', userWeeklyPlanRoutes);
app.use('/api/workout-sessions', workoutSessionRoutes);
app.use('/api/measurements', measurementsRoutes);
app.use('/api/referrals', referralsRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/grocery', groceryRoutes);
app.use('/api/doctor-notes', doctorNoteRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/banners', bannersRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
