const User = require('../models/User');
const { sendTokenResponse } = require('../utils/generateToken');
const auditService = require('../services/auditService');

// Common weak password list to reject during registration & password changes
const COMMON_WEAK_PASSWORDS = [
  '123456', '12345678', 'password', 'qwerty', 'admin123',
  'nestly123', 'password123', 'welcome1', '123456789', '00000000'
];

// Helper to validate password policy
const isPasswordWeak = (password) => {
  if (typeof password !== 'string' || password.length < 8) return 'Password must be at least 8 characters long';
  if (COMMON_WEAK_PASSWORDS.includes(password.toLowerCase())) {
    return 'Password is too common or easily guessable. Please choose a stronger password.';
  }
  return null;
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password || typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid string values for name, email, and password',
      });
    }

    const passwordError = isPasswordWeak(password);
    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError,
      });
    }

    // Role Escalation Detection
    if (req.body.role && req.body.role !== 'customer') {
      await auditService.logEvent({
        actor: 'anonymous',
        actorEmail: email,
        action: 'ROLE_ESCALATION_ATTEMPT',
        resourceType: 'User',
        status: 'rejected',
        req,
        metadata: { attemptedRole: req.body.role },
      });
    }

    // Check if user already exists
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists',
      });
    }

    // Security Rule: Public registration MUST force customer role
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'customer',
    });

    await auditService.logEvent({
      actor: user._id,
      actorEmail: user.email,
      action: 'USER_REGISTER',
      resourceType: 'User',
      resourceId: user._id,
      status: 'success',
      req,
    });

    sendTokenResponse(user, 201, res, 'Account registered successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid string credentials for email and password',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check for user (include password for verification)
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      await auditService.logEvent({
        actor: 'anonymous',
        actorEmail: normalizedEmail,
        action: 'USER_LOGIN_FAILED',
        resourceType: 'User',
        status: 'failed',
        req,
        metadata: { reason: 'User not found' },
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (user.isActive === false) {
      await auditService.logEvent({
        actor: user._id,
        actorEmail: user.email,
        action: 'USER_LOGIN_FAILED',
        resourceType: 'User',
        resourceId: user._id,
        status: 'rejected',
        req,
        metadata: { reason: 'Account deactivated' },
      });

      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      await auditService.logEvent({
        actor: user._id,
        actorEmail: user.email,
        action: 'USER_LOGIN_FAILED',
        resourceType: 'User',
        resourceId: user._id,
        status: 'failed',
        req,
        metadata: { reason: 'Incorrect password' },
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    await auditService.logEvent({
      actor: user._id,
      actorEmail: user.email,
      action: 'USER_LOGIN_SUCCESS',
      resourceType: 'User',
      resourceId: user._id,
      status: 'success',
      req,
    });

    sendTokenResponse(user, 200, res, 'Logged in successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / Clear authentication cookie
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res, next) => {
  try {
    const cookieName = process.env.COOKIE_NAME || 'nestly_token';
    res.cookie(cookieName, 'none', {
      expires: new Date(Date.now() + 5 * 1000), // expires in 5 seconds
      httpOnly: true,
    });

    if (req.user) {
      await auditService.logEvent({
        actor: req.user._id,
        actorEmail: req.user.email,
        action: 'USER_LOGOUT',
        resourceType: 'User',
        resourceId: req.user._id,
        status: 'success',
        req,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently logged in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update profile details (Whitelisted fields only)
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, profileImage } = req.body;

    // Detect Mass Assignment / Role Tampering Attempts
    if (req.body.role || req.body.isActive) {
      await auditService.logEvent({
        actor: req.user._id,
        actorEmail: req.user.email,
        action: 'ROLE_ESCALATION_ATTEMPT',
        resourceType: 'User',
        resourceId: req.user._id,
        status: 'rejected',
        req,
        metadata: { attemptedPayload: req.body },
      });
    }

    const fieldsToUpdate = {};
    if (name && typeof name === 'string') fieldsToUpdate.name = name.trim();
    if (profileImage && typeof profileImage === 'string') fieldsToUpdate.profileImage = profileImage.trim();

    const user = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change user password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid string values for current and new password',
      });
    }

    const passwordError = isPasswordWeak(newPassword);
    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError,
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    await auditService.logEvent({
      actor: user._id,
      actorEmail: user.email,
      action: 'PASSWORD_CHANGED',
      resourceType: 'User',
      resourceId: user._id,
      status: 'success',
      req,
    });

    sendTokenResponse(user, 200, res, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password Placeholder
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Please provide valid email address' });
    }

    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a password reset link will be sent.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password Placeholder
// @route   POST /api/auth/reset-password/:resetToken
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Password reset link verified.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};
