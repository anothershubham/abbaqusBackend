const express     = require('express');
const app         = express();
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const jwt    = require('jsonwebtoken');


var config = require('../config'); // get our config file
const router = express.Router();

const Bookmark = require('../controllers/bookmarkController');

router.post('/bookmarkall',Bookmark.bookmark);
router.post('/userbookmarks',Bookmark.allBookmarks);
router.post('/paperBookmark',Bookmark.paperBookmarks);
router.post('/feedsBookmark',Bookmark.feedsBookmarks);
router.post('/allbookmarked',Bookmark.allbookmarked);
router.post('/unbookmark',Bookmark.unbookmark);

module.exports = router;	