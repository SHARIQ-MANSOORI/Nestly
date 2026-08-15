import React, { useState } from 'react';
import { User, Lock, Shield, CheckCircle2, AlertCircle, Camera, Calendar } from 'lucide-react';
import useAuth from '../hooks/useAuth';

const ProfilePage = () => {
  const { user, updateProfile, changePassword } = useAuth();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'password'

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);
  const [profileError, setProfileError] = useState(null);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setProfileLoading(true);
      setProfileError(null);
      setProfileMessage(null);

      await updateProfile({ name, profileImage });
      setProfileMessage('Profile details updated successfully');
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    try {
      setPasswordLoading(true);
      setPasswordError(null);
      setPasswordMessage(null);

      await changePassword(currentPassword, newPassword);
      setPasswordMessage('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const roleBadges = {
    customer: { label: 'Customer Account', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    manager: { label: 'Hotel Manager', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    admin: { label: 'Administrator', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  };

  const currentRoleBadge = roleBadges[user?.role] || roleBadges.customer;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      
      {/* Header Profile Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="relative w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-md shrink-0">
          <img
            src={user?.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'}
            alt={user?.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="space-y-2 text-center md:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900">{user?.name}</h1>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${currentRoleBadge.color}`}>
              {currentRoleBadge.label}
            </span>
          </div>

          <p className="text-xs text-slate-500">{user?.email}</p>

          <div className="pt-2 flex items-center justify-center md:justify-start gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              Verified User
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Nestly'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'profile'
                ? 'border-blue-700 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            Edit Profile
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'password'
                ? 'border-blue-700 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Lock className="w-4 h-4" />
            Security & Password
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 md:p-8">
          
          {/* Edit Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-6 max-w-lg">
              {profileMessage && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{profileMessage}</span>
                </div>
              )}

              {profileError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Email Address (Read-only)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Avatar Image URL</label>
                <div className="relative">
                  <Camera className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="url"
                    value={profileImage}
                    onChange={(e) => setProfileImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={profileLoading}
                className="py-2.5 px-6 bg-slate-900 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm"
              >
                {profileLoading ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          )}

          {/* Security Tab */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-lg">
              {passwordMessage && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{passwordMessage}</span>
                </div>
              )}

              {passwordError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="•••••••• (min 6 characters)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="py-2.5 px-6 bg-slate-900 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm"
              >
                {passwordLoading ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
