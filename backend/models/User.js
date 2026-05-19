const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const BADGES = [
  'first_solve', 'speed_coder', 'hard_hitter',
  'streak_7', 'streak_30', 'centurion', 'century_solver',
];

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String, default: () => uuidv4(), unique: true, index: true,
    },
    fullName: {
      type: String, required: [true, 'Full name is required'],
      trim: true, minlength: 2, maxlength: 100,
    },
    email: {
      type: String, required: [true, 'Email is required'],
      unique: true, lowercase: true, trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
    },
    password: {
      type: String, required: [true, 'Password is required'],
      minlength: 6, select: false,
    },
    dob: { type: Date, required: [true, 'Date of birth is required'] },

    // ── RBAC ──────────────────────────────────────────────────────────
    role: { type: String, enum: ['user', 'admin'], default: 'user' },

    // ── Streak tracking ───────────────────────────────────────────────
    streak:        { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastSolvedAt:  { type: Date, default: null },

    // ── Bookmarks ─────────────────────────────────────────────────────
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }],

    // ── Badges / achievements ─────────────────────────────────────────
    badges: [{ type: String, enum: BADGES }],

    // ── Preferences ───────────────────────────────────────────────────
    preferredLanguage: {
      type: String,
      enum: ['cpp', 'python', 'java', 'javascript'],
      default: 'cpp',
    },
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────
// email unique index is already enforced by the field's `unique: true`
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// ── Hash password before save ─────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance methods ──────────────────────────────────────────────────
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

/**
 * Update streak based on today's date.
 * Call this whenever a new unique problem is accepted.
 */
userSchema.methods.updateStreak = function () {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (!this.lastSolvedAt) {
    this.streak = 1;
  } else {
    const last    = new Date(this.lastSolvedAt);
    const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
    const diffMs  = today - lastDay;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 1)      this.streak += 1;
    else if (diffDays === 0) { /* same day — no change */ }
    else                     this.streak = 1;
  }

  if (this.streak > this.longestStreak) this.longestStreak = this.streak;
  this.lastSolvedAt = now;
};

/**
 * Award a badge if not already earned.
 * Returns true if newly awarded.
 */
userSchema.methods.awardBadge = function (badge) {
  if (BADGES.includes(badge) && !this.badges.includes(badge)) {
    this.badges.push(badge);
    return true;
  }
  return false;
};

// ── Strip sensitive fields from JSON ─────────────────────────────────
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
