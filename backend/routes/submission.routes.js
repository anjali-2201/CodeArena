const router = require('express').Router();
const { submitCode, getMySubmissions } = require('../controllers/submission.controller');
const auth = require('../middleware/auth.middleware');

router.post('/', auth, submitCode);
router.get('/my', auth, getMySubmissions);

module.exports = router;
