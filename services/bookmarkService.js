const async = require('asyncawait/async');
const await = require('asyncawait/await');
const Bookmark = require('../models/bookmark');
const User = require('../models/users');
const Feed = require('../models/feeds');
const Paper = require('../models/paperUpload');
const QuestionUploads = require('../models/questionUpload');
const RecommendedFeedsToUser = require('../models/recommended_feeds');
const RecommendedPaperToUser = require('../models/recommended_paper');
const Recommend = require('../models/recommend');

exports.userExist = function(userId){
	return User.findOne({_id:userId});
}

exports.bookmark = function(body){
	var notabletoBookmark =[];
	const {userId,paperId,feedsId,bookmarkType}= body;
	if(body.bookmarkType === 'paper'){
		if(typeof body.userId !=='undefined' && typeof body.paperId!== 'undefined'&& body.userId!== '' &&  body.paperId !== ''){
			const bookmarkpaper = new Bookmark;
			bookmarkpaper.userId = userId;
			bookmarkpaper.paperId = paperId;
			bookmarkpaper.bookmarkType = bookmarkType;
			return bookmarkpaper.save();
		}
		else{
			return notabletoBookmark;
		}
	}
	else if(body.bookmarkType === 'feeds'){
		if(typeof body.userId !=='undefined' && typeof body.feedsId!== 'undefined'&& body.userId!== '' &&  body.feedsId !== ''){
			const bookmark = new Bookmark;
			bookmark.userId = userId;
			bookmark.feedsId = feedsId;
			bookmark.bookmarkType = bookmarkType;
			return bookmark.save();
		}
		else{
			return notabletoBookmark;
		}
	}
	else{
		return notabletoBookmark;
	}
}

exports.bookmarkedAlready = function(body){
	var bookmarkType=body.bookmarkType;
	if(bookmarkType == "paper"){
		return Bookmark.findOne({$and:[{userId:body.userId},{paperId:body.paperId}]})
	}
	else if(bookmarkType == "feeds"){
		return Bookmark.findOne({$and:[{userId:body.userId},{feedsId:body.feedsId}]})
	}
}

exports.userBookmarks = function(userId){
	return Bookmark.find({userId:userId}).populate({path: 'paperId', populate:{path: 'userId', select: '_id firstname lastname organization designation organization dob profileImg role'}}).populate('feedsId');
}

exports.papersBookmarked = function(userId){
	return Bookmark.find({$and:[{userId:userId},{bookmarkType:"paper"}]}).populate({path: 'paperId', populate:{path: 'userId', select: '_id firstname lastname organization designation dob profileImg role'}});
}

exports.feedsBookmarked = function(userId){
	return Bookmark.find({$and:[{userId:userId},{bookmarkType:"feeds"}]}).populate({path: 'feedsId', populate:{path: 'topics', select: 'topic_name'}});
}

exports.removeBookmark = function(body){
	var bookmarkType=body.bookmarkType;
	if(bookmarkType == "paper"){
		return Bookmark.remove({$and:[{paperId:body.paperId},{userId:body.userId}]});
	}
	else if(bookmarkType == "feeds"){
		return Bookmark.remove({$and:[{feedsId:body.feedsId},{userId:body.userId}]});
	}
}

exports.allbookmarked = function(userId,profileuserId,page,pagesize){
	var skip = page*pagesize;
	var feedsBookmarked = await(Bookmark.find({$and:[{userId:userId},{bookmarkType:"feeds"}]}).sort({"createdAt":-1}).populate({path: 'feedsId', populate:{path: 'topics', select: 'topic_name'}}).skip(skip).limit(pagesize));
	var paperRecommended =await(Bookmark.find({$and:[{userId:userId},{bookmarkType:"paper"}]}).sort({"createdAt":-1}).populate({path: 'paperId', populate:{path: 'userId', select: '_id firstname lastname designation dob organization profileImg role'}}).populate({path: 'paperId', populate:{path: 'topics', select: 'topic_name'}}).skip(skip).limit(pagesize));
	if(feedsBookmarked.length!=0 && paperRecommended.length!=0){
		var checkRecommendeFeedsByviewedUser = await(checkfeedsrecommededBookmark(feedsBookmarked,profileuserId))
		 var checkRecommendePaperByviewedUser = await(checkpapersrecommededBookmark(paperRecommended,profileuserId))
		 var finalresult = checkRecommendeFeedsByviewedUser.concat(checkRecommendePaperByviewedUser);
		 return finalresult;
	}
	else if(feedsBookmarked.length!=0 &&  paperRecommended.length==0){
		var checkRecommendeFeedsByviewedUser = await(checkfeedsrecommededBookmark(feedsBookmarked,profileuserId))
		return checkRecommendeFeedsByviewedUser;
	}
	else if(feedsBookmarked.length==0 && paperRecommended.length!=0){
		var checkRecommendePaperByviewedUser = await(checkpapersrecommededBookmark(paperRecommended,profileuserId))
		return checkRecommendePaperByviewedUser;
	}
	else{
		var myarr = [];
		return myarr;
	}
}

function checkpapersrecommededBookmark(userPapers,viewedRecommended){
	var userRecommendedPapers = await(Recommend.find({$and:[{userId:viewedRecommended},{recommendType:'paperupload'}]}))
	if(userRecommendedPapers.length!=0){
		var paperId = userRecommendedPapers.map(function(paper){
			return ({_id:paper.recommended});
		})
		const checkRecommeds = await(recommendsPaperCheck(userPapers,paperId))
		const userbookmarkedPapers = await(Bookmark.find({$and:[{userId:viewedRecommended},{bookmarkType:"paper"}]}))
		if(userbookmarkedPapers.length!=0){
			var bookmarksId = userbookmarkedPapers.map(function(paper){
					return ({_id:paper.paperId});
				})
			 const checkBookmarks = await(bookmarksPaperCheck(checkRecommeds,bookmarksId))
				return checkBookmarks;
		}	
		else{
			return checkRecommeds;
		}
	}
	else{
			const userbookmarkedPapers = await(Bookmark.find({$and:[{userId:viewedRecommended},{bookmarkType:"paper"}]}))
			if(userbookmarkedPapers.length!=0){
				var bookmarksId = userbookmarkedPapers.map(function(paper){
					return ({_id:paper.paperId});
				})
				const checkBookmarks = await(bookmarksPaperCheck(userPapers,bookmarksId))
				return checkBookmarks
			}
			else{
				return userPapers;
			}
	}
}

function checkfeedsrecommededBookmark(userFeeds,viewedRecommended){
	var userRecommendedFeeds = await(Recommend.find({$and:[{userId:viewedRecommended},{recommendType:'feeds'}]}))
	if(userRecommendedFeeds.length!=0){
		var feedsId = userRecommendedFeeds.map(function(feeds){
			return ({_id:feeds.recommended});
		})
		const checkRecommeds = await(recommendsfeedsCheck(userFeeds,feedsId))
		 const userbookmarkedFeeds = await(Bookmark.find({$and:[{userId:viewedRecommended},{bookmarkType:"feeds"}]}))
		if(userbookmarkedFeeds.length!=0){
			var bookmarksId = userbookmarkedFeeds.map(function(feeds){
					return ({_id:feeds.feedsId});
				})
			  const checkBookmarks = await(bookmarksfeedsCheck(checkRecommeds,bookmarksId))
				return checkBookmarks;
		}	
		else{
			 return checkRecommeds;
		}
	}
	else{
			const userbookmarkedFeeds = await(Bookmark.find({$and:[{userId:viewedRecommended},{bookmarkType:"feeds"}]}))
			if(userbookmarkedFeeds.length!=0){
				var bookmarksId = userbookmarkedFeeds.map(function(feeds){
					return ({_id:feeds.feedsId});
				})
				const checkBookmarks = await(bookmarksfeedsCheck(userFeeds,bookmarksId))
				return checkBookmarks
			}
			else{
				return userFeeds;
			}
	}
}

function recommendsfeedsCheck(userFeeds,feedsId){
		feedsId.forEach((item) => {
		  var array1Obj = userFeeds.find(({feedsId}) => item._id.toString() === feedsId._id.toString());
		  if(array1Obj) {
		     array1Obj.feedsId.isrecommended = true;
		  }
		})
	 return userFeeds;
}

function bookmarksfeedsCheck(userFeeds,bookmarksId){
	bookmarksId.forEach((item) => {
		  var array1Obj = userFeeds.find(({feedsId}) => item._id.toString() === feedsId._id.toString());
		  if(array1Obj) {
		    array1Obj.feedsId.isbookmarked = true;
		  }
		})
	 	return userFeeds;
}



function recommendsPaperCheck(userPapers,paperId){
		paperId.forEach((item) => {
		  var array1Obj = userPapers.find(({paperId}) => item._id.toString() === paperId._id.toString());
		  if(array1Obj) {
		     array1Obj.paperId.isrecommended = true;
		  }
		})
	 return userPapers;
}

function bookmarksPaperCheck(userPapers,bookmarksId){
	bookmarksId.forEach((item) => {
		  var array1Obj = userPapers.find(({paperId}) => item._id.toString() === paperId._id.toString());
		  if(array1Obj) {
		    array1Obj.paperId.isbookmarked = true;
		  }
		})
	 	return userPapers;
}