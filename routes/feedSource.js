const express     = require('express');
const app         = express();
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const router = express.Router();
const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();

const feedSourceController = require('../controllers/feedSourceController');

router.post('/excel-upload-feeds-source', multipartMiddleware, feedSourceController.excelUploadFeedsSource);

module.exports = router;