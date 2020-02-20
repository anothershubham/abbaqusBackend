const express     = require('express');
const app         = express();
const jwt    = require('jsonwebtoken');
var config = require('../config'); // get our config file
const router = express.Router();

const admin = require('../controllers/adminController');

router.post('/adminSignup',admin.signUp);
router.post('/login',admin.login);

module.exports = router;