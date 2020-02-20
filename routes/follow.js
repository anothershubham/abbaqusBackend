const express     = require('express');
const app         = express();
const jwt    = require('jsonwebtoken');
var config = require('../config'); // get our config file
const router = express.Router();

const follow = require('../controllers/followController');

router.post('/userFollowed',follow.userFollowed);
router.post('/unfollowUsers',follow.unfollowUser);
router.post('/admired',follow.admired);
router.post('/admiring',follow.admiring);
module.exports = router;