const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema(
  {
    input: {
      type: String,
      required: [true, 'Test case input is required'],
    },
    output: {
      type: String,
      required: [true, 'Test case expected output is required'],
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('TestCase', testCaseSchema);
