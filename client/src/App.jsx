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
import BookingReviewPage from './pages/BookingReviewPage';
import CustomerBookingsPage from './pages/CustomerBookingsPage';
import BookingDetailsPage from './pages/BookingDetailsPage';
import NotificationsPage from './pages/NotificationsPage';
import NotificationPreferencesPage from './pages/NotificationPreferencesPage';
import MyReviewsPage from './pages/MyReviewsPage';
import ManagerDashboardPage from './pages/ManagerDashboardPage';
import ManagerAnalyticsPage from './pages/ManagerAnalyticsPage';
import ManagerReviewsPage from './pages/ManagerReviewsPage';
import HotelFormPage from './pages/HotelFormPage';
import ManagerHotelDetailsPage from './pages/ManagerHotelDetailsPage';
import ManagerBookingsPage from './pages/ManagerBookingsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import AdminModerationPage from './pages/AdminModerationPage';
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

          {/* Protected Customer Routes */}
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings/notifications"
            element={
              <ProtectedRoute>
                <NotificationPreferencesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="my-reviews"
            element={
              <ProtectedRoute>
                <MyReviewsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="bookings/review"
            element={
              <ProtectedRoute>
                <BookingReviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="bookings"
            element={
              <ProtectedRoute>
                <CustomerBookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="bookings/:id"
            element={
              <ProtectedRoute>
                <BookingDetailsPage />
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
            path="manager/analytics"
            element={
              <ProtectedRoute allowedRoles={['manager', 'admin']}>
                <ManagerAnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="manager/reviews"
            element={
              <ProtectedRoute allowedRoles={['manager', 'admin']}>
                <ManagerReviewsPage />
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
          <Route
            path="manager/bookings"
            element={
              <ProtectedRoute allowedRoles={['manager', 'admin']}>
                <ManagerBookingsPage />
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
          <Route
            path="admin/analytics"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminAnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/moderation"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminModerationPage />
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
