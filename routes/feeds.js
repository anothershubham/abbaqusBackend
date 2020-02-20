const express     = require('express');
const app         = express();
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const router = express.Router();
const FeedsController = require('../controllers/feedsController');

router.post('/generate-feeds',FeedsController.generatefeeds);
//router.post('/getAllFeeds',FeedsController.getAllFeeds);
router.post('/user-feeds',FeedsController.userFeeds);
router.post('/feedsViewsCount',FeedsController.feedsViewsCount);
router.get('/trendingFeed/:id',FeedsController.trendingFeeds);
router.post('/searchNewsArticles',FeedsController.searchInArticles);
router.get('/recentPost',FeedsController.recentPosts);
router.post('/reply',FeedsController.replytoPost);
router.post('/feedReplies',FeedsController.feedReplies);
router.post('/Search',FeedsController.Search);
router.post('/generate-topics',FeedsController.generateTopics);
router.post('/test-topics',FeedsController.testTopics);

//myChanges
router.post('/customFeeds',FeedsController.customFeeds);
router.get('/customFeeds',FeedsController.getCustomFeeds);

router.post('/deleteTodaysfeed',FeedsController.deleteTodaysFeeds);
router.post('/deleteReplies',FeedsController.deleteReply);
router.post('/testscarpper',FeedsController.fetchUrlofData);
router.get('/feedsByTopicMatchId/:id',FeedsController.feedsByTopicMatchId);
module.exports = router;