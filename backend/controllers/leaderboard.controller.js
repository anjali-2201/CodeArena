const Solution = require('../models/Solution');

/**
 * GET /api/leaderboard — latest 10 submissions across all users
 */
exports.getLeaderboard = async (req, res) => {
  try {
    const submissions = await Solution.find()
      .populate('user', 'fullName userId')
      .populate('problem', 'name difficulty')
      .sort({ submitted_at: -1 })
      .limit(10);

    const leaderboard = submissions.map((sub) => ({
      _id: sub._id,
      username: sub.user?.fullName || 'Unknown',
      userId: sub.user?.userId || 'N/A',
      problemName: sub.problem?.name || 'Deleted Problem',
      difficulty: sub.problem?.difficulty || 'N/A',
      verdict: sub.verdict,
      language: sub.language,
      submittedAt: sub.submitted_at,
    }));

    res.json({
      success: true,
      leaderboard,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch leaderboard.',
    });
  }
};
