const TestCase = require('../models/TestCase');
const Solution = require('../models/Solution');
const Problem = require('../models/Problem');
const { compileAndRun } = require('../compiler');

/**
 * Normalize output for comparison:
 * - Convert \r\n and \r to \n
 * - Strip trailing spaces from each line
 * - Trim surrounding blank lines
 * This ensures verdicts are correct regardless of OS line endings.
 */
const normalizeOutput = (str) =>
  str
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();


/**
 * POST /api/submissions — submit code for judging
 */
exports.submitCode = async (req, res) => {
  try {
    const { problemId, language, code } = req.body;

    // Validation
    if (!problemId || !language || !code) {
      return res.status(400).json({
        success: false,
        message: 'Problem ID, language, and code are required.',
      });
    }

    const validLanguages = ['cpp', 'python', 'java', 'javascript'];
    if (!validLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        message: `Invalid language. Supported: ${validLanguages.join(', ')}`,
      });
    }

    // Verify problem exists
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found.',
      });
    }

    // Step 1: Fetch hidden test cases
    const testCases = await TestCase.find({ problem: problemId });
    if (testCases.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No test cases found for this problem.',
      });
    }

    // Step 2 & 3: Compile, execute, and compare for each test case
    let verdict = 'Accepted';
    let failedOutput = '';

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const result = await compileAndRun(language, code, tc.input);

      if (!result.success) {
        // Compilation Error, Runtime Error, or TLE
        verdict = result.verdict;
        failedOutput = result.output;
        break;
      }

      // Normalize both sides before comparing — handles \r\n vs \n, trailing
      // spaces per line, and leading/trailing blank lines.
      const expectedOutput = normalizeOutput(tc.output);
      const actualOutput   = normalizeOutput(result.output);

      if (actualOutput !== expectedOutput) {
        verdict = 'Wrong Answer';
        failedOutput = `Test Case ${i + 1}:\nExpected:\n${expectedOutput}\n\nGot:\n${actualOutput}`;
        break;
      }
    }

    // Step 5: Save verdict in solutions collection
    const solution = await Solution.create({
      problem: problemId,
      user: req.user._id,
      language,
      code,
      verdict,
      submitted_at: new Date(),
    });

    // Step 6: Return verdict to frontend
    res.json({
      success: true,
      verdict,
      message:
        verdict === 'Accepted'
          ? `All ${testCases.length} test cases passed!`
          : failedOutput,
      submission: {
        _id: solution._id,
        verdict: solution.verdict,
        language: solution.language,
        submitted_at: solution.submitted_at,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Submission failed.',
    });
  }
};

/**
 * GET /api/submissions/my — get current user's submissions
 */
exports.getMySubmissions = async (req, res) => {
  try {
    const submissions = await Solution.find({ user: req.user._id })
      .populate('problem', 'name difficulty')
      .sort({ submitted_at: -1 })
      .limit(20);

    res.json({
      success: true,
      submissions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch submissions.',
    });
  }
};
