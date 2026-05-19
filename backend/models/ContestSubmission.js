const mongoose = require('mongoose');

const contestSubmissionSchema = new mongoose.Schema(
  {
    contest: {
      type: mongoose.Schema.Types.ObjectId, ref: 'Contest',
      required: true, index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId, ref: 'User',
      required: true, index: true,
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId, ref: 'Problem',
      required: true,
    },
    language: {
      type: String,
      enum: ['cpp', 'python', 'java', 'javascript'],
      required: true,
    },
    code:    { type: String, required: true, select: false },
    verdict: {
      type: String,
      enum: ['Pending', 'Accepted', 'Wrong Answer', 'Compilation Error', 'Runtime Error', 'Time Limit Exceeded', 'Memory Limit Exceeded'],
      default: 'Pending',
    },
    // Number of wrong attempts on this problem BEFORE the first AC
    wrongAttemptsBefore: { type: Number, default: 0 },
    // Penalty in minutes = wrongAttemptsBefore * contest.penaltyMinutes
    penaltyMinutes:      { type: Number, default: 0 },
    // Elapsed minutes since contest start when this was submitted
    elapsedMinutes:      { type: Number, default: 0 },
    submittedAt:         { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Compound index for leaderboard aggregation
contestSubmissionSchema.index({ contest: 1, user: 1, problem: 1 });
contestSubmissionSchema.index({ contest: 1, verdict: 1 });

module.exports = mongoose.model('ContestSubmission', contestSubmissionSchema);
