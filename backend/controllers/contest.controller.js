const Contest = require('../models/Contest');
const ContestSubmission = require('../models/ContestSubmission');
const Problem = require('../models/Problem');
const { compileAndRun, normalizeOutput } = require('../services/executor');
const TestCase = require('../models/TestCase');
const ApiError = require('../utils/ApiError');
const { asyncHandler } = require('../middleware/errorHandler.middleware');
const cache = require('../services/cache.service');

/** GET /api/contests — List all public contests */
exports.listContests = asyncHandler(async (req, res) => {
  const { status } = req.query; // 'upcoming' | 'ongoing' | 'ended'
  const now = new Date();

  let query = { isPublic: true };
  if (status === 'upcoming') query = { ...query, startTime: { $gt: now } };
  else if (status === 'ongoing') query = { ...query, startTime: { $lte: now }, endTime: { $gte: now } };
  else if (status === 'ended') query = { ...query, endTime: { $lt: now } };

  const contests = await Contest.find(query)
    .select('-problems.problem') // hide problem list in listing
    .populate('createdBy', 'fullName')
    .sort({ startTime: -1 })
    .limit(50)
    .lean();

  const data = contests.map((c) => {
    const n = new Date();
    let s = 'upcoming';
    if (n >= c.startTime && n <= c.endTime) s = 'ongoing';
    else if (n > c.endTime) s = 'ended';
    return { ...c, status: s };
  });

  res.json({ success: true, contests: data });
});

/** GET /api/contests/:id — Contest detail with problems */
exports.getContest = asyncHandler(async (req, res) => {
  const contest = await Contest.findById(req.params.id)
    .populate('createdBy', 'fullName')
    .populate('problems.problem', 'name difficulty')
    .lean();

  if (!contest) throw ApiError.notFound('Contest not found');

  const now = new Date();
  let status = 'upcoming';
  if (now >= contest.startTime && now <= contest.endTime) status = 'ongoing';
  else if (now > contest.endTime) status = 'ended';

  // Hide full problem details if contest hasn't started
  if (status === 'upcoming') {
    contest.problems = contest.problems.map((p) => ({ ...p, problem: { name: '???', difficulty: '???' } }));
  }

  res.json({ success: true, contest: { ...contest, status } });
});

/** POST /api/contests/:id/submit — Submit inside a contest */
exports.submitToContest = asyncHandler(async (req, res) => {
  const { problemId, language, code } = req.body;
  const contestId = req.params.id;

  const contest = await Contest.findById(contestId);
  if (!contest) throw ApiError.notFound('Contest not found');

  const now = new Date();
  if (now < contest.startTime) throw ApiError.badRequest('Contest has not started yet');
  if (now > contest.endTime)   throw ApiError.badRequest('Contest has ended');

  const inContest = contest.problems.some((p) => String(p.problem) === problemId);
  if (!inContest) throw ApiError.badRequest('Problem is not part of this contest');

  // Judge against hidden test cases
  const testCases = await TestCase.find({ problem: problemId }).lean();
  if (!testCases.length) throw ApiError.badRequest('No test cases found for this problem');

  let verdict = 'Accepted';
  for (const tc of testCases) {
    const result = await compileAndRun(language, code, tc.input);
    if (!result.success) { verdict = result.verdict; break; }
    if (normalizeOutput(result.output) !== normalizeOutput(tc.output)) {
      verdict = 'Wrong Answer'; break;
    }
  }

  // Count wrong attempts BEFORE this submission on this problem
  const prevWrong = await ContestSubmission.countDocuments({
    contest: contestId, user: req.user._id, problem: problemId,
    verdict: { $nin: ['Accepted'] },
  });

  const alreadyAC = await ContestSubmission.exists({
    contest: contestId, user: req.user._id, problem: problemId, verdict: 'Accepted',
  });

  const elapsedMinutes = Math.floor((now - contest.startTime) / 60000);
  const penalty = verdict === 'Accepted' && !alreadyAC
    ? prevWrong * (contest.penaltyMinutes || 20)
    : 0;

  const submission = await ContestSubmission.create({
    contest: contestId, user: req.user._id, problem: problemId,
    language, code, verdict,
    wrongAttemptsBefore: prevWrong,
    penaltyMinutes: penalty,
    elapsedMinutes,
    submittedAt: now,
  });

  // Invalidate contest leaderboard cache
  await cache.del(`cache:/api/contests/${contestId}/leaderboard`);

  res.json({ success: true, verdict, submission: { _id: submission._id, verdict, language, submittedAt: now } });
});

/** GET /api/contests/:id/leaderboard — Contest rankings */
exports.getContestLeaderboard = asyncHandler(async (req, res) => {
  const contestId = req.params.id;
  const contest = await Contest.findById(contestId).lean();
  if (!contest) throw ApiError.notFound('Contest not found');

  // Aggregate per-user scores
  const rows = await ContestSubmission.aggregate([
    { $match: { contest: contest._id, verdict: 'Accepted' } },
    // De-duplicate: one AC per problem per user
    {
      $group: {
        _id: { user: '$user', problem: '$problem' },
        user: { $first: '$user' },
        problem: { $first: '$problem' },
        elapsedMinutes: { $min: '$elapsedMinutes' },
        penaltyMinutes: { $first: '$penaltyMinutes' },
      },
    },
    // Join problem points from contest
    {
      $group: {
        _id: '$user',
        problemsSolved: { $sum: 1 },
        totalPenalty:   { $sum: '$penaltyMinutes' },
        lastAC:         { $max: '$elapsedMinutes' },
      },
    },
    // Join user info
    {
      $lookup: {
        from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo',
      },
    },
    { $unwind: '$userInfo' },
    {
      $sort: { problemsSolved: -1, totalPenalty: 1, lastAC: 1 },
    },
  ]);

  const leaderboard = rows.map((r, i) => ({
    rank: i + 1,
    fullName:       r.userInfo.fullName,
    initials:       r.userInfo.fullName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2),
    problemsSolved: r.problemsSolved,
    totalPenalty:   r.totalPenalty,
    lastAC:         r.lastAC,
  }));

  res.json({ success: true, leaderboard, contest: { title: contest.title, endTime: contest.endTime } });
});

/** POST /api/admin/contests — Create contest (admin only) */
exports.createContest = asyncHandler(async (req, res) => {
  const { title, description, startTime, endTime, problems, penaltyMinutes, isPublic } = req.body;

  if (!title || !startTime || !endTime) {
    throw ApiError.badRequest('Title, startTime and endTime are required');
  }
  if (new Date(endTime) <= new Date(startTime)) {
    throw ApiError.badRequest('endTime must be after startTime');
  }

  const contest = await Contest.create({
    title, description, startTime, endTime,
    problems: problems || [],
    penaltyMinutes: penaltyMinutes || 20,
    isPublic: isPublic !== false,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, contest });
});

/** PUT /api/admin/contests/:id — Update contest (admin only) */
exports.updateContest = asyncHandler(async (req, res) => {
  const contest = await Contest.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  });
  if (!contest) throw ApiError.notFound('Contest not found');
  res.json({ success: true, contest });
});
