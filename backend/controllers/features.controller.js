const Problem = require('../models/Problem');
const User    = require('../models/User');
const ApiError = require('../utils/ApiError');
const { asyncHandler } = require('../middleware/errorHandler.middleware');

/** POST /api/bookmarks/:problemId — Toggle bookmark */
exports.toggleBookmark = asyncHandler(async (req, res) => {
  const { problemId } = req.params;

  const problem = await Problem.findById(problemId);
  if (!problem) throw ApiError.notFound('Problem not found');

  const user = await User.findById(req.user._id);
  const idx  = user.bookmarks.indexOf(problemId);

  let bookmarked;
  if (idx === -1) {
    user.bookmarks.push(problemId);
    bookmarked = true;
  } else {
    user.bookmarks.splice(idx, 1);
    bookmarked = false;
  }
  await user.save();

  res.json({ success: true, bookmarked });
});

/** GET /api/bookmarks — Get my bookmarks */
exports.getBookmarks = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('bookmarks', 'name difficulty')
    .lean();

  res.json({ success: true, bookmarks: user.bookmarks || [] });
});

/** GET /api/problems/daily — Daily challenge (deterministic by date) */
exports.getDailyChallenge = asyncHandler(async (req, res) => {
  const problems = await Problem.find({}, '_id name difficulty').lean();
  if (!problems.length) throw ApiError.notFound('No problems available');

  const now     = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  const daily   = problems[dayOfYear % problems.length];

  // Fetch full problem
  const problem = await Problem.findById(daily._id).lean();
  res.json({ success: true, problem });
});

/** GET /api/problems/:id/discussions — List discussions */
exports.getDiscussions = asyncHandler(async (req, res) => {
  const Discussion = require('../models/Discussion');
  const discussions = await Discussion.find({
    problem: req.params.id, isDeleted: false, parent: null,
  })
    .populate('user', 'fullName')
    .sort({ upvotes: -1, createdAt: -1 })
    .limit(50)
    .lean();

  res.json({ success: true, discussions });
});

/** POST /api/problems/:id/discussions — Post a comment */
exports.postDiscussion = asyncHandler(async (req, res) => {
  const Discussion = require('../models/Discussion');
  const { content, parentId } = req.body;
  if (!content || content.trim().length < 10) {
    throw ApiError.badRequest('Comment must be at least 10 characters');
  }

  const discussion = await Discussion.create({
    problem: req.params.id,
    user:    req.user._id,
    content: content.trim(),
    parent:  parentId || null,
  });

  const populated = await discussion.populate('user', 'fullName');
  res.status(201).json({ success: true, discussion: populated });
});

/** POST /api/problems/:id/discussions/:dId/vote — Upvote/downvote */
exports.voteDiscussion = asyncHandler(async (req, res) => {
  const Discussion = require('../models/Discussion');
  const { type } = req.body; // 'up' | 'down'
  if (!['up', 'down'].includes(type)) throw ApiError.badRequest('Vote type must be up or down');

  const discussion = await Discussion.findById(req.params.dId);
  if (!discussion) throw ApiError.notFound('Discussion not found');

  const uid = req.user._id;

  if (type === 'up') {
    if (discussion.upvotedBy.includes(uid)) {
      // Undo upvote
      discussion.upvotedBy.pull(uid);
      discussion.upvotes = Math.max(0, discussion.upvotes - 1);
    } else {
      discussion.upvotedBy.push(uid);
      discussion.upvotes += 1;
      // Remove downvote if exists
      if (discussion.downvotedBy.includes(uid)) {
        discussion.downvotedBy.pull(uid);
        discussion.downvotes = Math.max(0, discussion.downvotes - 1);
      }
    }
  } else {
    if (discussion.downvotedBy.includes(uid)) {
      discussion.downvotedBy.pull(uid);
      discussion.downvotes = Math.max(0, discussion.downvotes - 1);
    } else {
      discussion.downvotedBy.push(uid);
      discussion.downvotes += 1;
      if (discussion.upvotedBy.includes(uid)) {
        discussion.upvotedBy.pull(uid);
        discussion.upvotes = Math.max(0, discussion.upvotes - 1);
      }
    }
  }

  await discussion.save();
  res.json({ success: true, upvotes: discussion.upvotes, downvotes: discussion.downvotes });
});
