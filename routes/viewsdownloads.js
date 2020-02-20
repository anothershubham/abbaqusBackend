const express     = require('express');
const app         = express();
const jwt    = require('jsonwebtoken');
var config = require('../config'); // get our config file
const router = express.Router();

const views = require('../controllers/viewsdownloadsController');

 router.post('/viewpapers',views.paperViews);
 router.post('/downloadPapers',views.paperDownload);
 // router.post('/graphviewsdownloads',views.graphdataviewsDownloads);
// router.post('/login',admin.login);

module.exports = router;