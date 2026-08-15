const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Do not expose password hash in queries by default
    },
    role: {
      type: String,
      enum: ['customer', 'manager', 'admin'],
      default: 'customer',
    },
    profileImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notificationPreferences: {
      emailBookingConfirmation: { type: Boolean, default: true },
      emailPaymentUpdates: { type: Boolean, default: true },
      emailCancellationUpdates: { type: Boolean, default: true },
      emailManagerBookingUpdates: { type: Boolean, default: true },
      inAppBookingUpdates: { type: Boolean, default: true },
      inAppPaymentUpdates: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
