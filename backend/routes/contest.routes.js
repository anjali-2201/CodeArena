const router  = require('express').Router();
const ctrl    = require('../controllers/contest.controller');
const auth    = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');

// Public
router.get('/',                    ctrl.listContests);
router.get('/:id',                 ctrl.getContest);
router.get('/:id/leaderboard',     ctrl.getContestLeaderboard);

// Participant (auth required)
router.post('/:id/submit', auth,   ctrl.submitToContest);

// Admin only
router.post('/',    auth, requireRole('admin'), ctrl.createContest);
router.put('/:id',  auth, requireRole('admin'), ctrl.updateContest);

module.exports = router;
