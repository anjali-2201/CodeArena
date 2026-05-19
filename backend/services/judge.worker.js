const Solution  = require('../models/Solution');
const Problem   = require('../models/Problem');
const TestCase  = require('../models/TestCase');
const User      = require('../models/User');
const { compileAndRun, normalizeOutput } = require('./executor');
const { logger } = require('../utils/logger');

/**
 * Core judge logic — shared by both inline execution and BullMQ worker.
 * Accepts a job data object: { submissionId, language, code, problemId, userId }
 */
async function judgeSubmission({ submissionId, language, code, problemId, userId }) {
  const [testCases, problem] = await Promise.all([
    TestCase.find({ problem: problemId }).lean(),
    Problem.findById(problemId).select('difficulty').lean(),
  ]);

  if (!testCases.length) {
    await Solution.findByIdAndUpdate(submissionId, { verdict: 'Runtime Error' });
    return;
  }

  let verdict     = 'Accepted';
  let failedMsg   = '';

  for (let i = 0; i < testCases.length; i++) {
    const tc     = testCases[i];
    const result = await compileAndRun(language, code, tc.input);

    if (!result.success) {
      verdict   = result.verdict;
      failedMsg = result.output || '';
      break;
    }

    const expected = normalizeOutput(tc.output);
    const actual   = normalizeOutput(result.output);
    if (actual !== expected) {
      verdict   = 'Wrong Answer';
      failedMsg = `Test Case ${i + 1}:\nExpected:\n${expected}\n\nGot:\n${actual}`;
      break;
    }
  }

  // Persist verdict
  await Solution.findByIdAndUpdate(submissionId, { verdict, message: failedMsg });

  // On first-time AC: update user streak + award badges
  if (verdict === 'Accepted' && userId) {
    try {
      await _handleFirstAccepted(userId, problemId, problem?.difficulty);
    } catch (err) {
      logger.error('[Judge] Streak/badge update error:', err.message);
    }
  }

  return { verdict, message: failedMsg };
}

async function _handleFirstAccepted(userId, problemId, difficulty) {
  // Check if this is the first AC for this user on this problem
  const prevAC = await Solution.countDocuments({
    user: userId, problem: problemId, verdict: 'Accepted',
  });
  if (prevAC > 1) return; // Already solved before — don't double-count

  const user = await User.findById(userId);
  if (!user) return;

  user.updateStreak();

  // Badges
  const totalSolved = await Solution.distinct('problem', { user: userId, verdict: 'Accepted' });
  if (totalSolved.length === 1)   user.awardBadge('first_solve');
  if (totalSolved.length >= 100)  user.awardBadge('century_solver');
  if (user.streak >= 7)           user.awardBadge('streak_7');
  if (user.streak >= 30)          user.awardBadge('streak_30');

  const hardSolved = await Solution.distinct('problem', {
    user: userId, verdict: 'Accepted',
  });
  // Count hard problems solved — rough check
  if (difficulty === 'Hard') {
    const hardCount = await Problem.countDocuments({
      _id: { $in: hardSolved }, difficulty: 'Hard',
    });
    if (hardCount >= 5) user.awardBadge('hard_hitter');
  }

  const totalSubmissions = await Solution.countDocuments({ user: userId });
  if (totalSubmissions >= 100) user.awardBadge('centurion');

  await user.save();
}

/**
 * BullMQ worker processor function.
 * Signature required by BullMQ: async (job) => any
 */
async function processJob(job) {
  logger.info(`[Worker] Processing job ${job.id} — problem ${job.data.problemId}`);
  return judgeSubmission(job.data);
}

module.exports = { judgeSubmission, processJob };
