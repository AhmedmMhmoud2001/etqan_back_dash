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

function ProtectedAdmin({ children }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token || user?.role !== 'ADMIN') {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <ProtectedAdmin>
            <SocketProvider>
              <AdminLayout />
            </SocketProvider>
          </ProtectedAdmin>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="doctors" element={<AdminDoctors />} />
        <Route path="meals" element={<AdminMeals />} />
        <Route path="exercises" element={<AdminExercises />} />
        <Route path="nutrition-plans" element={<AdminNutritionPlans />} />
        <Route path="workout-plans" element={<AdminWorkoutPlans />} />
        <Route path="channels" element={<AdminChannels />} />
        <Route path="doctor-notes" element={<AdminDoctorNotes />} />
        <Route path="community-posts" element={<AdminCommunityPosts />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

export default App;
