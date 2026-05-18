const Problem = require('../models/Problem');
const TestCase = require('../models/TestCase');

/**
 * GET /api/problems — list all problems
 */
exports.getAllProblems = async (req, res) => {
  try {
    const { difficulty, search } = req.query;
    const filter = {};

    if (difficulty && ['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      filter.difficulty = difficulty;
    }

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const problems = await Problem.find(filter)
      .select('name difficulty code examples constraints')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: problems.length,
      problems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch problems.',
    });
  }
};

/**
 * GET /api/problems/:id — get single problem with test cases (visible examples only)
 */
exports.getProblemById = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found.',
      });
    }

    res.json({
      success: true,
      problem,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Problem not found.',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch problem.',
    });
  }
};
