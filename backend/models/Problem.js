const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Problem name is required'],
      trim: true,
      unique: true,
    },
    statement: {
      type: String,
      required: [true, 'Problem statement is required'],
    },
    code: {
      type: String,
      default: '',
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      required: [true, 'Difficulty is required'],
    },
    examples: [
      {
        input: String,
        output: String,
        explanation: String,
      },
    ],
    constraints: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Problem', problemSchema);
