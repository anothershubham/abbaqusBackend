const express     = require('express');
const app         = express();
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const jwt    = require('jsonwebtoken');
const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();
var config = require('../config'); // get our config file
const router = express.Router();

const PaperUpload = require('../controllers/paperUploadController');


router.post('/paperUpload',multipartMiddleware,PaperUpload.uploadPapers);
router.post('/trendingPapers',PaperUpload.trendingPapers);
router.post('/papers',PaperUpload.papers);
router.post('/relatedPapers',PaperUpload.relatedPapers);
router.post('/deletePaper',PaperUpload.deletePaper);
router.post('/removeTopicsDuplicate',PaperUpload.removeTopicsDuplicate);
router.get('/fetchPdf/:id',PaperUpload.fetchPdf);
router.get('/recentPapers',PaperUpload.recentPaper);
router.post('/paperCron',PaperUpload.paperCron);
router.post('/SinglePaperMicrosoftList',PaperUpload.singlePaperMicrosoftList)
router.post('/singlePaperMicrosoftDetails',PaperUpload.singlePaperMicrosoftDetails)
router.post('/BulkFetchAuthorList',PaperUpload.BulkFetchAuthorList)
router.post('/BulkFetchAuthorPapers',PaperUpload.BulkFetchAuthorPapers)
router.post('/BulkPapersSave',PaperUpload.BulkPapersSave)
router.post('/fetchRssPaper',PaperUpload.generatePaper)
router.post('/genrateTagsRssPapers',PaperUpload.generateTags)

router.post('/deletePaper1',PaperUpload.deletePaper1)

router.post('/deleteAllPaper',PaperUpload.deleteAllUserPapers)
router.get('/paperByTopicMatchId/:id',PaperUpload.paperByTopicMatchId);
// for updating isrecommended and isbookmarked 
// router.post('/addFeild',PaperUpload.addFeild);
// end





module.exports = router;