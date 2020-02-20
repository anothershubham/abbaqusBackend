const async = require('asyncawait/async');
const await = require('asyncawait/await');
const Recommend = require('../models/recommend');
const Follow = require('../models/follow');
const Paperupload = require('../models/paperUpload');
const Feeds = require('../models/feeds');
const Topics = require('../models/topics');
const User = require('../models/users');
const Questionuploads = require('../models/questionUpload');
const Bookmark = require('../models/bookmark');

exports.recommendByUserSave = function(body){
	var notRecommended = [];
	var recommended = body.recommended;
	if(typeof recommended!== 'undefined'&& recommended!== ''){
		var recommended = new Recommend;
		recommended.userId = body.userId;
		recommended.recommended = body.recommended;
		recommended.recommendType = body.recommendType;
		return recommended.save()
	}
	else{
		return notRecommended;
	}
}

exports.checkuserExist = function(userId){
	return User.find({_id:userId})
}

exports.alreadyrecommended = function(body){
	return Recommend.find({$and:[{userId:body.userId},{recommended:body.recommended}]}).lean();
}

exports.addingRecommendedId = function(recommend){
	var recommendType = recommend.recommendType;
	if(recommendType === "paperupload"){
		return Paperupload.findOneAndUpdate({_id:recommend.recommended},{$push :{recommended:recommend.userId}},{new: true});
	}
	else if(recommendType === "feeds"){
		return Feeds.findOneAndUpdate({_id:recommend.recommended},{$push :{recommended:recommend.userId}},{new: true});
	}
	else{
		return Questionuploads.findOneAndUpdate({_id:recommend.recommended},{$push :{recommended:recommend.userId}},{new: true});
	}
}

exports.alreadyrecommendedbyUser = function(body){
	return Recommend.find({$and:[{userId:body.userId},{recommended:body.recommended}]}).lean();
}

exports.userRemoveRecommended = function(body){
	return Recommend.remove({$and:[{userId:body.userId},{recommended:body.recommended}]}).lean();
}

exports.removeRecommendedId = function(body){
	var recommendType = body.recommendType;
	if(recommendType == "paperupload"){
		return Paperupload.findOneAndUpdate({_id:body.recommended},{$pull:{recommended:{$in:body.userId}}},{new: true})
	}
	else if(recommendType == "feeds"){
		return Feeds.findOneAndUpdate({_id:body.recommended},{$pull:{recommended:{$in:body.userId}}},{new: true})
	}
	else{
		return Questionuploads.findOneAndUpdate({_id:body.recommended},{$pull:{recommended:{$in:body.userId}}},{new: true})
	}
}

exports.followedAllUsers =function(userID){
	return Follow.find({userId:userID}).lean();
}

exports.allpapersfeedsquetion = function(recommededId){
	 return Recommend.find({_id:{$in:recommededId}})
	 .populate('recommended')
	 .populate({path: 'recommended', populate:{path: 'userId', select: '_id firstname lastname designation dob profileImg role organization'}})
	 .populate({path: 'recommended', populate:{path: 'recommended', select: 'profileImg'}})
	 .populate({path:'recommended',populate:{path:'topics',select:'topic_name'}})
	 .populate({path:'recommended',populate:{path:'answer',populate:{path:'userId',select:'_id firstname lastname designation profileImg role organization'}}})
	 .sort({createdAt:-1})
	 .lean();
}

exports.fetchallPapersrecommended = function(recommended){
	var recommendedAll = [];
	for(recommends of recommended){
		const fetchAllData = await(fetchallPaperquestionfeeds(recommends))
		if(fetchAllData.length!==0){
			recommendedAll.push(fetchAllData)
		}
		else{
			console.log("recommended data does not exist")
		}
	}
	return recommendedAll;
}

function fetchallPaperquestionfeeds(recommends){
	return Recommend.findOne({_id:recommends})
	 .populate('recommended')
	 .populate({path: 'recommended', populate:{path: 'userId', select: '_id firstname lastname designation dob profileImg role organization'}})
	 .populate({path: 'recommended', populate:{path: 'recommended', select: 'profileImg'}})
	 .populate({path:'recommended',populate:{path:'topics',select:'topic_name'}})
	 .populate({path:'recommended',populate:{path:'answer',populate:{path:'userId',select:'_id firstname lastname designation profileImg role organization'}}})
	 .lean();
}

exports.allpapersfeedsquetiontop = function(recommededId){
	 return Recommend.find({_id:{$in:recommededId}})
	 .populate('recommended')
	 .populate({path: 'recommended', populate:{path: 'userId', select: '_id firstname lastname designation dob profileImg role organization'}})
	 .populate({path: 'recommended', populate:{path: 'recommended', select: 'profileImg'}})
	 .populate({path:'recommended',populate:{path:'topics',select:'topic_name'}})
	 .populate({path:'recommended',populate:{path:'answer',populate:{path:'userId',select:'_id firstname lastname designation profileImg role organization'}}})
	 .lean();
}

exports.paperQuestfeedsrecommended = function(FollowedUsers,page,pageSize){
	return Recommend.aggregate([
		{ "$match": { "userId":{ "$in": FollowedUsers }}},
		{ $sort: {"createdAt": -1 } },
	    { $group: {
	        _id: "$recommended",
	        recommends: { $push: "$$ROOT" },
	        'createdAt': {'$last': '$createdAt'}
	    }},
	    { $sort: {"createdAt": -1 } },
	    { $replaceRoot: {
	        newRoot: { $arrayElemAt: ["$recommends", 0] }
	    }},
	    {$skip: page*pageSize},
 		{$limit: pageSize}
		])
}

exports.toprecommends = function(FollowedUsers,page,pageSize){
	return Recommend.aggregate([
		{$match: {$and: [{userId: {$in: FollowedUsers}}, {"createdAt" : { $lte: new Date(), $gte: new Date(new Date().setDate(new Date().getDate()-7))}}]}},
		// { "$match": { "userId":{ "$in": FollowedUsers }}},
		{ $sort: {"createdAt": -1 } },
	    { $group: {
	        _id: "$recommended",
	        count:{$sum:1},
	       	recommendType: { "$first": "$recommendType" },
	       	rec_id:{"$first": "$_id"},
	       	createdAt:{"$first": "$createdAt"}

	    }},
	    { $sort: {count: -1,createdAt: -1 } },
	    {$skip:page*pageSize},
 		{$limit: pageSize}
	])
}

exports.toprecommendsnextWeek = function(FollowedUsers,page,pageSize){
	return Recommend.aggregate([
		{$match: {$and: [{userId: {$in: FollowedUsers}}, {"createdAt" : { $lte: new Date(new Date().setDate(new Date().getDate()-7)), $gte: new Date(new Date().setDate(new Date().getDate()-14))}}]}},
		// { "$match": { "userId":{ "$in": FollowedUsers }}},
		{ $sort: {"createdAt": -1 } },
	    { $group: {
	        _id: "$recommended",
	        count:{$sum:1},
	       	recommendType: { "$first": "$recommendType" },
	       	rec_id:{"$first": "$_id"},
	       	createdAt:{"$first": "$createdAt"}

	    }},
	    { $sort: {count: -1,createdAt: -1} },
	    {$skip:page*pageSize},
 		{$limit: pageSize}
	])
}

exports.toprecommendslast = function(FollowedUsers,page,pageSize){
	return Recommend.aggregate([
		{$match: {$and: [{userId: {$in: FollowedUsers}}, {"createdAt" : { $lte:  new Date(new Date().setDate(new Date().getDate()-14)), $gte: new Date(new Date().setDate(new Date().getDate()-60))}}]}},
		// { "$match": { "userId":{ "$in": FollowedUsers }}},
		{ $sort: {"createdAt": -1 } },
	    { $group: {
	        _id: "$recommended",
	        count:{$sum:1},
	       	recommendType: { "$first": "$recommendType" },
	       	rec_id:{"$first": "$_id"},
	       	createdAt:{"$first": "$createdAt"}

	    }},
	    { $sort: {count: -1,createdAt: -1} },
	    {$skip:page*pageSize},
 		{$limit: pageSize}
	])
}

exports.userrecommends = function(userId){
	return Recommend.find({userId:userId}).lean();
}

exports.bookmarks = function(userId){
	var papersbookmarked = await(Bookmark.find({$and:[{userId:userId},{bookmarkType:"paper"}]}).lean());
	var feedsbookmarked = await(Bookmark.find({$and:[{userId:userId},{bookmarkType:"feeds"}]}).lean());
	if(papersbookmarked.length!=0 && feedsbookmarked.length!=0){
		var paperId = papersbookmarked.map(function(paper){
			return ({_id:paper.paperId})
		})
		var feedsId = feedsbookmarked.map(function(feeds){
			return ({_id:feeds.feedsId})
		})
		var finalresults = paperId.concat(feedsId);
		return finalresults;
	}
	else if(papersbookmarked.length!=0 && feedsbookmarked.length ==0){
		var paperId = papersbookmarked.map(function(paper){
			return ({_id:paper.paperId})
		})
		return paperId;
	}
	else if(papersbookmarked.length==0 && feedsbookmarked.length!=0){
		var feedsId = feedsbookmarked.map(function(feeds){
			return ({_id:feeds.feedsId})
		})
		return feedsId;
	}
	else{
		var myarr = []
		return myarr;
	}
}

// end

 
exports.addUserIdToPapers = function(paperId,userId){
	return Paperupload.findOneAndUpdate({_id:paperId},{
		$push :{recommended:userId}
	},{new: true})
}

exports.paperRemoveUserId = function(body){
	return Paperupload.findOneAndUpdate({_id:body.paperId},{
		$pull:{recommended:{$in:body.userId}}
	},{new: true})
}


exports.addUserIdToFeeds = function(feedsId,userId){
	return Feeds.findOneAndUpdate({_id:feedsId},{
		$push :{recommended:userId}
	},{new: true})
}


exports.feedRemoveUserId = function(body){
	return Feeds.findOneAndUpdate({_id:body.feedsId},{
		$pull:{recommended:{$in:body.userId}}
	},{new: true})
}


exports.addUserIdToQuestion = function(questionId,userId){
	return Questionuploads.findOneAndUpdate({_id:questionId},{
		$push :{recommended:userId}
	},{new: true})
}

exports.questionRemoveUserId = function(body){
	return Questionuploads.findOneAndUpdate({_id:body.questionId},{
		$pull:{recommended:{$in:body.userId}}
	},{new: true})
}

exports.userRecommendedFeeds = function(userId){
	return Recommend.find({userId:userId})
}


exports.bookmarkedpapers = function(userId){
	return Bookmark.find({$and:[{userId:userId},{bookmarkType:"paper"}]})
}

exports.bookmarkedfeeds = function(userId){
	return Bookmark.find({$and:[{userId:userId},{bookmarkType:"feeds"}]})
}


exports.allUserBookmarked = function(userId){
	var paperbookmarked = await(Bookmark.find({$and:[{userId:userId},{bookmarkType:"paper"}]}));
	var feedsBookmarked = await(Bookmark.find({$and:[{userId:userId},{bookmarkType:"feeds"}]}));
	if(paperbookmarked.length!=0 && feedsBookmarked.length!=0){
		var paperId = paperbookmarked.map(function(paper){
			return ({_id:paper.paperId});
		})
		var feedsId = feedsBookmarked.map(function(feeds){
			return ({_id:feeds.feedsId});
		})
		var finalResult = feedsId.concat(paperId);
		return finalResult;
	}
	else if(paperbookmarked.length!=0 && feedsBookmarked.length ==0){
		var paperId = paperbookmarked.map(function(paper){
			return ({_id:paper.paperId});
		})
		return paperId;
	}
	else if(paperbookmarked.length==0 && feedsBookmarked.length !=0){
		var feedsId = feedsBookmarked.map(function(feeds){
			return ({_id:feeds.feedsId});
		})
		return feedsId;
	}
	else{	
		var noBookmarks = [];
		return noBookmarks;
	}
}


