const express     = require('express');
const app         = express();
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const jwt    = require('jsonwebtoken');
var config = require('../config'); // get our config file
const router = express.Router();

const QuestionUpload = require('../controllers/questionUploadController');


router.get('/trendingQuestion/:id',QuestionUpload.trendingQuestion)
router.post('/questionUpload',QuestionUpload.uploadQuestion);
router.get('/questionSingle/:id',QuestionUpload.questionsSingle);
router.get('/recentQuestion',QuestionUpload.recentQuestion);
router.post('/questionViews',QuestionUpload.questionViews);
router.post('/deleteAllQuestion',QuestionUpload.deleteAllQuestions);

module.exports = router;