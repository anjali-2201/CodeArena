const router = require('express').Router();
const { getAllProblems, getProblemById } = require('../controllers/problem.controller');

router.get('/', getAllProblems);
router.get('/:id', getProblemById);

module.exports = router;
