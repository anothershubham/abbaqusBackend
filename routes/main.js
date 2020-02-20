const express = require('express');
const app = express();
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();
var multer = require('multer')
var config = require('../config'); // get our config file
const router = express.Router();

const UserController = require('../controllers/userController');
const PaperUpload = require('../controllers/paperUploadController');
const QuestionUpload = require('../controllers/questionUploadController');
const followUser = require('../controllers/followController');
const events = require('../controllers/eventsController');
const answer = require('../controllers/answerController');
const recommendsController = require('../controllers/recommendController');
const paperSourceController = require('../controllers/paperSourceController');
const blogs = require('../controllers/blogsController');
const topic = require('../controllers/topicController');
router.post('/signup', UserController.signup);
router.post('/login', UserController.login);
router.post('/checksocialId', UserController.checksocialId);
router.post('/socialLogin', UserController.socialLogin);
router.post('/socialRegistration', UserController.socialRegistration);
router.post('/getUserDetails', UserController.getUsers);
router.post('/insertTopics', UserController.insertTopics);
router.post('/mapTopicstosubtopics', UserController.mapTopicstosubtopics);
router.post('/updateTopics', UserController.updateTopics);
router.get('/getAllTopics', topic.getAlltopics);
router.post('/addTopic', topic.insertTopics);
router.post('/updateTopic', topic.updateTopics);
router.post('/deleteTopic', topic.deleteTopics);

router.get('/getAllFeedsByTopic/:id', topic.getAllFeedsBytopics);
router.get('/getTopics/:id', UserController.getTopics);
router.get('/getallUsers', UserController.allUsers);
router.post('/paperUpload', multipartMiddleware, PaperUpload.uploadPapers);
router.post('/paperUpload/edit', multipartMiddleware, PaperUpload.editPapers);
router.post('/questionUpload', QuestionUpload.uploadQuestion);
router.post('/follow', followUser.followers);
router.get('/allFollowers/:id', followUser.allFollowers);
router.post('/setBlog', blogs.setBlog);
router.get('/fetchAllBlogs', blogs.allBlogs);
router.post('/updateBlogs', blogs.updateBlogs);
router.post('/deleteBlogs', blogs.deleteBlogs);
router.post('/setEvent', events.setEvent);
router.get('/FetchallEvents', events.allEvents);
router.post('/updateEvents', events.updateEvents);
router.post('/deleteEvents', events.deleteEvents);
router.post('/questionofFollwing', followUser.questionForFollwing);
router.get('/papersForFollwing/:id', followUser.papersForFollowing);
router.post('/answer', answer.answerByUser);
router.post('/questionUpload/edit', QuestionUpload.editQuestion);
router.post('/questionUpload/delete', QuestionUpload.deleteQuestion);
//router.post('/paperUpload/delete',PaperUpload.deletePaperUploads);
router.post('/resendotp', UserController.resendOtp);
router.post('/forgotpassword', UserController.forgotPassword);
router.post('/resetpassword', UserController.resetpassword);
router.post('/answer/percentageAnswer', answer.totalAnswers);
router.post('/answer/answertosingle', answer.fetchAnswertoSingle);
router.post('/paperUpload/count', PaperUpload.viewCount);
router.post('/paperUpload/userUploadedPapers', PaperUpload.userUploadedPapers);
router.post('/questionUpload/userUploadedQuestions', QuestionUpload.userUploadedQuestions);
router.post('/paperUpload/paperDetail', PaperUpload.fetchPaper);
router.get('/questionUpload/questionDetail/:id', QuestionUpload.fetchQuestion);
router.post('/paperUpload/downloadCount', PaperUpload.dowloadsCount);
router.post('/addTopicsUser', UserController.addTopics);
router.post('/calenderEventsList', UserController.calenderEvents);
router.post('/EventDetails', UserController.eventsDetailsbyDate);
router.post('/recommendedUser', UserController.recommendedUsers);

router.post('/editProfile', multipartMiddleware, UserController.editProfile)


router.post('/search', UserController.search);

router.post('/feedsRecommended', UserController.recommendedFeedsUser);
router.post('/papersRecommended', UserController.recommendedPaperUser);
router.post('/questionsRecommended', UserController.recommendedQuestionUser);
// router.post('/allFollowersInfo',UserController.allFollowersData);
router.post('/recommendedCount', UserController.recommendedCount);
router.post('/editUserTopics', UserController.editTopics);
router.post('/verifyOtp', UserController.verifyOtp);
router.get('/answer/recentAnswers', answer.recentAnswer);
router.post('/myrecommends', UserController.myrecommends);

router.post('/uploadFile', multipartMiddleware, UserController.uploadImage);
router.post('/answer/answeredList', answer.answerList);

router.get('/maindiscpline', UserController.fetchDiscplines);
router.post('/adddiscpline', UserController.addmaindiscpline);
router.post('/adddiscplineuser', UserController.mapDiscpline);

router.post('/addrecommendedUsers', UserController.allRecommendedUsers);
router.post('/academicdesignation', UserController.addDesignation);
router.get('/fetchAcademicDesgination', UserController.fetchDesgination)
    // router.post('/addOrganization',UserController.addOrganization);
router.get('/fetchOrgnizations', UserController.fetchOrgnizations)

// both sameApi
router.post('/all', UserController.all)

// this api to be delete
// router.post('/allRecommendsUser',UserController.allRecommendationUser);
// end

router.post('/eventsExcel', multipartMiddleware, events.addEventsExcel);

router.post('/organization', events.fetchOrganizationList);
router.post('/changepassword', UserController.changePassword);

// CR Apis
router.post('/designationExcel', events.designtionExcel)
router.post('/fetchDesigntionList', events.fetchDesignationList)
router.post('/excelUploadPaperSource', multipartMiddleware, paperSourceController.excelUploadPaperSource)
    // router.post('/fetchRssPaper',PaperUpload.generatePaper)
router.post('/deleteFeedsRssPapers', PaperUpload.deletePapersRss)
router.post('/PaperRss', PaperUpload.paperRss)
router.post('/impactFactor', events.addImpactFactor)
router.post('/EventSearch', events.fetchUserAllEvents)
router.post('/deleteUserinAll', UserController.deleteUserinAll)


// end
// RecommendApi
router.post('/recommend', recommendsController.recommend);
router.post('/unrecommend', recommendsController.unrecommend)
router.post('/userRecommendation', recommendsController.reccomendationsToUsers);
router.post('/userRecommendedAll', recommendsController.fetchUserRecommendedData);
router.post('/topRecommendadtion', recommendsController.topRecommendation)
router.post('/userDetails', UserController.userDetails)
router.post('/verifyEmail', UserController.verifyEmail)
    // end 

module.exports = router;