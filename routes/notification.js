const express     = require('express');
const app         = express();
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const router = express.Router();
const Notification = require('../models/notification');
const NotificationController = require('../controllers/notificationController');

router.post('/allnotifications',NotificationController.notifications);
router.post('/isRead',NotificationController.viewed);


module.exports = router;