const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    startTime:   { type: Date,   required: true, index: true },
    endTime:     { type: Date,   required: true },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPublic:    { type: Boolean, default: true },

    // Problems in this contest with custom per-contest points
    problems: [
      {
        problem:   { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
        points:    { type: Number, default: 100 },
        order:     { type: Number, default: 0 },
      },
    ],

    // Per-wrong-attempt penalty in minutes (ICPC style)
    penaltyMinutes: { type: Number, default: 20 },

    // Computed cache
    participantCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes
contestSchema.index({ startTime: 1, endTime: 1 });
contestSchema.index({ isPublic: 1, startTime: -1 });

// Virtual: contest status
contestSchema.virtual('status').get(function () {
  const now = new Date();
  if (now < this.startTime) return 'upcoming';
  if (now > this.endTime)   return 'ended';
  return 'ongoing';
});

contestSchema.set('toJSON', { virtuals: true });
contestSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Contest', contestSchema);
