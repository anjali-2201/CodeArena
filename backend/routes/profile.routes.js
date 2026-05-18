const router = require('express').Router();
const { getStats, getSolvedProblems, getActivity } = require('../controllers/profile.controller');
const auth = require('../middleware/auth.middleware');

// All profile routes require authentication
router.get('/stats',    auth, getStats);
router.get('/solved',   auth, getSolvedProblems);
router.get('/activity', auth, getActivity);

module.exports = router;
