import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Building2, Menu, X, Compass, Home, MapPin, User, LogOut, Shield, Settings, LayoutDashboard, Calendar, BedDouble, Bell, CheckCircle2, BarChart3 } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import notificationService from '../services/notificationService';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsDropdownOpen, setNotificationsDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationService.getUnreadCount();
      setUnreadCount(res.unreadCount || 0);
    } catch (e) {
      // Quiet fail if network error
    }
  };

  const fetchRecentNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationService.getNotifications(1, 5);
      setRecentNotifications(res.data || []);
    } catch (e) {
      // Quiet fail
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000); // 30s poll
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, location.pathname]);

  const handleToggleNotifications = () => {
    setProfileDropdownOpen(false);
    if (!notificationsDropdownOpen) {
      fetchRecentNotifications();
    }
    setNotificationsDropdownOpen(!notificationsDropdownOpen);
  };

  const isActive = (path) => {
    return location.pathname === path ? 'text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900';
  };

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    setNotificationsDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const roleLabels = {
    customer: 'Customer',
    manager: 'Manager',
    admin: 'Admin',
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-md group-hover:bg-blue-700 transition-colors">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-slate-900 font-sans">Nestly</span>
            <span className="text-[10px] tracking-wider uppercase font-medium text-slate-500">Hotels & Stays</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className={`flex items-center gap-1.5 text-sm transition-colors ${isActive('/')}`}>
            <Home className="w-4 h-4" />
            Home
          </Link>
          <Link to="/hotels" className={`flex items-center gap-1.5 text-sm transition-colors ${isActive('/hotels')}`}>
            <Compass className="w-4 h-4" />
            Explore Hotels
          </Link>
          {isAuthenticated && (
            <Link to="/bookings" className={`flex items-center gap-1.5 text-sm transition-colors ${isActive('/bookings')}`}>
              <Calendar className="w-4 h-4" />
              My Bookings
            </Link>
          )}
        </nav>

        {/* Action Buttons & Auth Dropdown */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={handleToggleNotifications}
                  className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors relative"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white font-bold text-[10px] rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Preview */}
                {notificationsDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 space-y-2 animate-fadeIn z-50">
                    <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">Notifications</h4>
                      <Link
                        to="/notifications"
                        onClick={() => setNotificationsDropdownOpen(false)}
                        className="text-[11px] font-bold text-blue-700 hover:underline"
                      >
                        View All
                      </Link>
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                      {recentNotifications.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-6">No notifications yet</p>
                      ) : (
                        recentNotifications.map((n) => (
                          <Link
                            key={n._id}
                            to="/notifications"
                            onClick={() => setNotificationsDropdownOpen(false)}
                            className={`block p-3 hover:bg-slate-50 transition-colors text-xs ${!n.isRead ? 'bg-blue-50/40' : ''}`}
                          >
                            <span className="font-bold text-slate-900 block truncate">{n.title}</span>
                            <span className="text-[11px] text-slate-500 line-clamp-2">{n.message}</span>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </Link>
                        ))
                      )}
                    </div>

                    <div className="px-4 pt-2 border-t border-slate-100 text-center">
                      <Link
                        to="/settings/notifications"
                        onClick={() => setNotificationsDropdownOpen(false)}
                        className="text-[10px] text-slate-500 hover:text-slate-800"
                      >
                        Notification Settings
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Menu */}
              <div className="relative">
                <button
                  onClick={() => {
                    setNotificationsDropdownOpen(false);
                    setProfileDropdownOpen(!profileDropdownOpen);
                  }}
                  className="flex items-center gap-2.5 p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <img
                    src={user?.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'}
                    alt={user?.name}
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                  <div className="text-left hidden sm:block pr-1">
                    <span className="text-xs font-bold text-slate-900 block leading-tight">{user?.name}</span>
                    <span className="text-[10px] text-blue-700 font-semibold uppercase">{roleLabels[user?.role] || 'User'}</span>
                  </div>
                </button>

                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 space-y-1 animate-fadeIn z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    </div>

                    <Link
                      to="/notifications"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <Bell className="w-4 h-4 text-blue-600" />
                      Notifications {unreadCount > 0 && `(${unreadCount})`}
                    </Link>

                    <Link
                      to="/bookings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <Calendar className="w-4 h-4 text-blue-600" />
                      My Reservations
                    </Link>

                    <Link
                      to="/settings/notifications"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      Notification Settings
                    </Link>

                    {(user?.role === 'manager' || user?.role === 'admin') && (
                      <>
                        <Link
                          to="/manager/analytics"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100/60 font-bold"
                        >
                          <BarChart3 className="w-4 h-4 text-emerald-600" />
                          Property Analytics
                        </Link>
                        <Link
                          to="/manager"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                        >
                          <LayoutDashboard className="w-4 h-4 text-purple-600" />
                          Manager Properties
                        </Link>
                        <Link
                          to="/manager/bookings"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                        >
                          <BedDouble className="w-4 h-4 text-purple-600" />
                          Manager Bookings
                        </Link>
                      </>
                    )}

                    {user?.role === 'admin' && (
                      <>
                        <Link
                          to="/admin/analytics"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                        >
                          <BarChart3 className="w-4 h-4 text-emerald-600" />
                          Platform Analytics
                        </Link>
                        <Link
                          to="/admin"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                        >
                          <Shield className="w-4 h-4 text-emerald-600" />
                          Admin Dashboard
                        </Link>
                      </>
                    )}

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-medium text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 font-medium"
          >
            <Home className="w-4 h-4 text-slate-500" />
            Home
          </Link>
          <Link
            to="/hotels"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 font-medium"
          >
            <Compass className="w-4 h-4 text-slate-500" />
            Explore Hotels
          </Link>

          {isAuthenticated ? (
            <>
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="px-3 py-1.5 bg-slate-50 rounded-xl">
                  <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                  <p className="text-[10px] text-blue-700 font-semibold uppercase">{roleLabels[user?.role]}</p>
                </div>

                <Link
                  to="/notifications"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 font-medium"
                >
                  <span className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-600" />
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="bg-blue-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                <Link
                  to="/bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 font-medium"
                >
                  <Calendar className="w-4 h-4 text-blue-600" />
                  My Reservations
                </Link>

                <Link
                  to="/settings/notifications"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 font-medium"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  Notification Settings
                </Link>

                {(user?.role === 'manager' || user?.role === 'admin') && (
                  <>
                    <Link
                      to="/manager/analytics"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-emerald-700 bg-emerald-50 font-bold"
                    >
                      <BarChart3 className="w-4 h-4 text-emerald-600" />
                      Property Analytics
                    </Link>
                    <Link
                      to="/manager"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-purple-700 hover:bg-purple-50 font-medium"
                    >
                      <LayoutDashboard className="w-4 h-4 text-purple-600" />
                      Manager Dashboard
                    </Link>
                    <Link
                      to="/manager/bookings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-purple-700 hover:bg-purple-50 font-medium"
                    >
                      <BedDouble className="w-4 h-4 text-purple-600" />
                      Manager Bookings
                    </Link>
                  </>
                )}

                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-emerald-700 hover:bg-emerald-50 font-medium"
                  >
                    <Shield className="w-4 h-4 text-emerald-600" />
                    Admin Dashboard
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50 font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center px-4 py-2 text-sm font-semibold text-white bg-slate-900 rounded-xl"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
