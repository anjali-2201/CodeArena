const router = require('express').Router();
const { submitCode, getMySubmissions, runCode } = require('../controllers/submission.controller');
const auth = require('../middleware/auth.middleware');

router.post('/',    auth, submitCode);
router.post('/run', auth, runCode);       // Run against public examples — no DB save
router.get('/my',   auth, getMySubmissions);

module.exports = router;
