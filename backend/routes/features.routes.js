const router = require('express').Router();
const auth   = require('../middleware/auth.middleware');
const ctrl   = require('../controllers/features.controller');

// Bookmarks (auth required)
router.post('/bookmarks/:problemId', auth, ctrl.toggleBookmark);
router.get('/bookmarks',             auth, ctrl.getBookmarks);

// Daily challenge (public)
router.get('/problems/daily', ctrl.getDailyChallenge);

// Discussions (auth to post/vote)
router.get( '/problems/:id/discussions',          ctrl.getDiscussions);
router.post('/problems/:id/discussions',    auth,  ctrl.postDiscussion);
router.post('/problems/:id/discussions/:dId/vote', auth, ctrl.voteDiscussion);

module.exports = router;
