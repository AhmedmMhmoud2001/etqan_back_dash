import { Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminDoctors from './pages/admin/Doctors';
import AdminMeals from './pages/admin/Meals';
import AdminExercises from './pages/admin/Exercises';
import AdminNutritionPlans from './pages/admin/NutritionPlans';
import AdminWorkoutPlans from './pages/admin/WorkoutPlans';
import AdminChannels from './pages/admin/Channels';
import AdminDoctorNotes from './pages/admin/DoctorNotes';
import AdminCommunityPosts from './pages/admin/CommunityPosts';
import AdminNotifications from './pages/admin/Notifications';
import AdminProfile from './pages/admin/Profile';
import AdminSubscriptions from './pages/admin/Subscriptions';
import AdminReferrals from './pages/admin/Referrals';
import AdminPackages from './pages/admin/Packages';
import AdminBanners from './pages/admin/Banners';
import DoctorPatients from './pages/doctor/Patients';

function ProtectedDashboard({ children }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token || (user?.role !== 'ADMIN' && user?.role !== 'DOCTOR')) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function RequireAdmin({ children }) {
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();
  if (user?.role !== 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <ProtectedDashboard>
            <SocketProvider>
              <AdminLayout />
            </SocketProvider>
          </ProtectedDashboard>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
        <Route path="doctors" element={<RequireAdmin><AdminDoctors /></RequireAdmin>} />
        <Route path="patients" element={<RequireAdmin><DoctorPatients /></RequireAdmin>} />
        <Route path="meals" element={<AdminMeals />} />
        <Route path="exercises" element={<AdminExercises />} />
        <Route path="nutrition-plans" element={<AdminNutritionPlans />} />
        <Route path="workout-plans" element={<AdminWorkoutPlans />} />
        <Route path="channels" element={<AdminChannels />} />
        <Route path="doctor-notes" element={<AdminDoctorNotes />} />
        <Route path="community-posts" element={<AdminCommunityPosts />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="subscriptions" element={<RequireAdmin><AdminSubscriptions /></RequireAdmin>} />
        <Route path="packages" element={<RequireAdmin><AdminPackages /></RequireAdmin>} />
        <Route path="referrals" element={<RequireAdmin><AdminReferrals /></RequireAdmin>} />
        <Route path="banners" element={<RequireAdmin><AdminBanners /></RequireAdmin>} />
      </Route>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

export default App;
