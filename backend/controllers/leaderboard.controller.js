const Solution = require('../models/Solution');

/**
 * GET /api/leaderboard
 *
 * Aggregation pipeline:
 * 1. Match only Accepted verdicts
 * 2. Lookup the problem to get difficulty
 * 3. De-duplicate: count each problem only once per user (unique AC)
 * 4. Score: Easy=10, Medium=20, Hard=30
 * 5. Also compute total attempts (all verdicts) per user
 * 6. Sort by score desc, then by problemsSolved desc
 * 7. Expose username/fullName only — no ObjectIds
 */
exports.getLeaderboard = async (req, res) => {
  try {
    const page     = Math.max(1, parseInt(req.query.page)  || 1);
    const pageSize = Math.min(50, parseInt(req.query.limit) || 20);
    const skip     = (page - 1) * pageSize;

    // ── Step 1: Unique accepted (user, problem) pairs with difficulty ──
    const acceptedAgg = await Solution.aggregate([
      // Only accepted submissions
      { $match: { verdict: 'Accepted' } },

      // Join problem to get difficulty
      {
        $lookup: {
          from:         'problems',
          localField:   'problem',
          foreignField: '_id',
          as:           'problemInfo',
        },
      },
      { $unwind: '$problemInfo' },

      // De-duplicate: keep one AC per (user, problem)
      {
        $group: {
          _id:        { user: '$user', problem: '$problem' },
          user:       { $first: '$user' },
          difficulty: { $first: '$problemInfo.difficulty' },
        },
      },

      // Score each solved problem
      {
        $addFields: {
          points: {
            $switch: {
              branches: [
                { case: { $eq: ['$difficulty', 'Easy']   }, then: 10 },
                { case: { $eq: ['$difficulty', 'Medium'] }, then: 20 },
                { case: { $eq: ['$difficulty', 'Hard']   }, then: 30 },
              ],
              default: 0,
            },
          },
        },
      },

      // Aggregate per user: total score, count by difficulty
      {
        $group: {
          _id:           '$user',
          score:         { $sum: '$points' },
          totalSolved:   { $sum: 1 },
          easySolved:    { $sum: { $cond: [{ $eq: ['$difficulty', 'Easy']   }, 1, 0] } },
          mediumSolved:  { $sum: { $cond: [{ $eq: ['$difficulty', 'Medium'] }, 1, 0] } },
          hardSolved:    { $sum: { $cond: [{ $eq: ['$difficulty', 'Hard']   }, 1, 0] } },
        },
      },

      // Join user info (name only — no password, no userId exposed)
      {
        $lookup: {
          from:         'users',
          localField:   '_id',
          foreignField: '_id',
          as:           'userInfo',
        },
      },
      { $unwind: '$userInfo' },

      // Sort: highest score first, then most solved
      { $sort: { score: -1, totalSolved: -1, easySolved: -1 } },
    ]);

    // ── Step 2: Total attempts per user (all verdicts) ──
    const attemptsAgg = await Solution.aggregate([
      {
        $group: {
          _id:            '$user',
          totalAttempts:  { $sum: 1 },
          totalAccepted:  { $sum: { $cond: [{ $eq: ['$verdict', 'Accepted'] }, 1, 0] } },
        },
      },
    ]);

    const attemptsMap = {};
    for (const a of attemptsAgg) {
      attemptsMap[String(a._id)] = {
        totalAttempts: a.totalAttempts,
        totalAccepted: a.totalAccepted,
      };
    }

    // ── Step 3: Build final leaderboard rows ──
    const totalUsers = acceptedAgg.length;
    const paginated  = acceptedAgg.slice(skip, skip + pageSize);

    const leaderboard = paginated.map((row, idx) => {
      const uid      = String(row._id);
      const attempts = attemptsMap[uid] || { totalAttempts: 0, totalAccepted: 0 };
      const accuracy = attempts.totalAttempts > 0
        ? Math.round((attempts.totalAccepted / attempts.totalAttempts) * 100)
        : 0;

      return {
        rank:         skip + idx + 1,
        // ✅ Never expose _id or userId — only display name
        fullName:     row.userInfo.fullName,
        initials:     row.userInfo.fullName
                        .split(' ')
                        .map((w) => w[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2),
        score:        row.score,
        totalSolved:  row.totalSolved,
        easySolved:   row.easySolved,
        mediumSolved: row.mediumSolved,
        hardSolved:   row.hardSolved,
        totalAttempts: attempts.totalAttempts,
        accuracy,
      };
    });

    res.json({
      success: true,
      leaderboard,
      pagination: {
        page,
        pageSize,
        totalUsers,
        totalPages: Math.ceil(totalUsers / pageSize),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch leaderboard.',
    });
  }
};
