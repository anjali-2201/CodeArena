const mongoose = require('mongoose');

const solutionSchema = new mongoose.Schema(
  {
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    language: {
      type: String,
      enum: ['cpp', 'python', 'java', 'javascript'],
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    verdict: {
      type: String,
      enum: [
        'Accepted',
        'Wrong Answer',
        'Compilation Error',
        'Runtime Error',
        'Time Limit Exceeded',
      ],
      required: true,
    },
    submitted_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Solution', solutionSchema);
