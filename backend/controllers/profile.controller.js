const Solution = require('../models/Solution');
const Problem = require('../models/Problem');

/**
 * GET /api/profile/stats
 * Returns aggregated stats for the logged-in user
 */
exports.getStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // All accepted solutions for this user (unique problems)
    const allAccepted = await Solution.find({
      user: userId,
      verdict: 'Accepted',
    }).populate('problem', 'name difficulty');

    // De-duplicate by problem ID (only count each problem once)
    const solvedMap = new Map();
    for (const sol of allAccepted) {
      if (sol.problem && !solvedMap.has(String(sol.problem._id))) {
        solvedMap.set(String(sol.problem._id), sol.problem);
      }
    }

    const solvedProblems = Array.from(solvedMap.values());
    const easySolved   = solvedProblems.filter((p) => p.difficulty === 'Easy').length;
    const mediumSolved = solvedProblems.filter((p) => p.difficulty === 'Medium').length;
    const hardSolved   = solvedProblems.filter((p) => p.difficulty === 'Hard').length;

    // Total problem counts per difficulty
    const [totalEasy, totalMedium, totalHard] = await Promise.all([
      Problem.countDocuments({ difficulty: 'Easy' }),
      Problem.countDocuments({ difficulty: 'Medium' }),
      Problem.countDocuments({ difficulty: 'Hard' }),
    ]);

    // Total submissions (all verdicts)
    const totalSubmissions = await Solution.countDocuments({ user: userId });

    // Acceptance rate
    const acceptedCount = allAccepted.length;
    const acceptanceRate = totalSubmissions > 0
      ? Math.round((acceptedCount / totalSubmissions) * 100)
      : 0;

    res.json({
      success: true,
      stats: {
        totalSolved:    solvedProblems.length,
        totalProblems:  totalEasy + totalMedium + totalHard,
        totalSubmissions,
        acceptanceRate,
        easy:   { solved: easySolved,   total: totalEasy },
        medium: { solved: mediumSolved, total: totalMedium },
        hard:   { solved: hardSolved,   total: totalHard },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/profile/solved
 * Returns list of problems the user has solved (Accepted, unique)
 */
exports.getSolvedProblems = async (req, res) => {
  try {
    const userId = req.user._id;

    const accepted = await Solution.find({ user: userId, verdict: 'Accepted' })
      .populate('problem', 'name difficulty')
      .sort({ submitted_at: -1 });

    // De-duplicate by problem
    const seen = new Set();
    const solved = [];
    for (const sol of accepted) {
      if (!sol.problem) continue;
      const pid = String(sol.problem._id);
      if (!seen.has(pid)) {
        seen.add(pid);
        solved.push({
          _id:         sol.problem._id,
          name:        sol.problem.name,
          difficulty:  sol.problem.difficulty,
          solvedAt:    sol.submitted_at,
          language:    sol.language,
        });
      }
    }

    res.json({ success: true, solved });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/profile/activity
 * Returns daily submission counts for the last 365 days (for heatmap)
 */
exports.getActivity = async (req, res) => {
  try {
    const userId = req.user._id;

    const since = new Date();
    since.setFullYear(since.getFullYear() - 1);
    since.setHours(0, 0, 0, 0);

    const solutions = await Solution.find({
      user: userId,
      submitted_at: { $gte: since },
    }).select('submitted_at verdict');

    // Build a map: "YYYY-MM-DD" → { count, accepted }
    const activityMap = {};
    for (const sol of solutions) {
      const d = new Date(sol.submitted_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!activityMap[key]) activityMap[key] = { count: 0, accepted: 0 };
      activityMap[key].count++;
      if (sol.verdict === 'Accepted') activityMap[key].accepted++;
    }

    res.json({ success: true, activity: activityMap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
