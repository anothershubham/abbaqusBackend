const express     = require('express');
const app         = express();
const async = require('asyncawait/async');
const await = require('asyncawait/await');

const router = express.Router();
const topicController = require('../controllers/topicController');

router.post('/editSubtopics',topicController.editSubtopics);
router.post('/getSubtopics',topicController.getSubtopics);
router.post('/addOrganization',topicController.addOrganization);
router.get('/fetchindustrydesig',topicController.fetchindustryDesig);
router.get('/fetchindustryorganization',topicController.fetchindustryorganization);
router.post('/addStudentdesignation',topicController.addStudentDesignation);
router.get('/fetchStudentDesig',topicController.fetchStudentDesig);

module.exports = router;