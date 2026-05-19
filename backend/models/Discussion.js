const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema(
  {
    problem: {
      type: mongoose.Schema.Types.ObjectId, ref: 'Problem',
      required: true, index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId, ref: 'User',
      required: true,
    },
    content: {
      type: String, required: true,
      trim: true, minlength: 10, maxlength: 5000,
    },
    upvotes:   { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    // Users who voted (prevent double votes)
    upvotedBy:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    downvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // Threaded replies
    parent: {
      type: mongoose.Schema.Types.ObjectId, ref: 'Discussion',
      default: null,
    },
    isEdited:  { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

discussionSchema.index({ problem: 1, createdAt: -1 });
discussionSchema.index({ problem: 1, upvotes: -1 });

module.exports = mongoose.model('Discussion', discussionSchema);
