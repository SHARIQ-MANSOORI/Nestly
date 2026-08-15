import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import HotelListingPage from './pages/HotelListingPage';
import HotelDetailsPage from './pages/HotelDetailsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import ManagerDashboardPage from './pages/ManagerDashboardPage';
import HotelFormPage from './pages/HotelFormPage';
import ManagerHotelDetailsPage from './pages/ManagerHotelDetailsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {/* Public Customer Routes */}
          <Route index element={<HomePage />} />
          <Route path="hotels" element={<HotelListingPage />} />
          <Route path="hotels/:id" element={<HotelDetailsPage />} />
          <Route path="search" element={<HotelListingPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />

          {/* Protected User Routes */}
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Protected Manager Routes */}
          <Route
            path="manager"
            element={
              <ProtectedRoute allowedRoles={['manager', 'admin']}>
                <ManagerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="manager/hotels"
            element={
              <ProtectedRoute allowedRoles={['manager', 'admin']}>
                <ManagerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="manager/hotels/new"
            element={
              <ProtectedRoute allowedRoles={['manager', 'admin']}>
                <HotelFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="manager/hotels/:id"
            element={
              <ProtectedRoute allowedRoles={['manager', 'admin']}>
                <ManagerHotelDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="manager/hotels/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['manager', 'admin']}>
                <HotelFormPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Routes */}
          <Route
            path="admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
