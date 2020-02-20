const async = require('asyncawait/async');
const await = require('asyncawait/await');
const Bookmark = require('../models/bookmark');
const bookmarkService = require('../services/bookmarkService');
const recommendService = require('../services/recommendService');
const ObjectID = require('mongodb').ObjectID;

exports.bookmark = async(function(req,res,next){
	try{
		var userId =req.body.userId;
		const userExists = await(bookmarkService.userExist(userId))
		if(userExists){
			const alreadyBookmarked = await(bookmarkService.bookmarkedAlready(req.body));
			if(alreadyBookmarked){
				// console.log("alreadyBookmarked:",alreadyBookmarked)
				return res.json({status:500,message:'Bookmarked already'})
			}
			else{
				const bookmark = await(bookmarkService.bookmark(req.body))
				if(bookmark.length!==0){
					return res.json({status:200,message:'Success'})
				}
				else{
					return res.json({status:500,message:'Unable to bookmark'})
				}
			}
		}
		else{
			return res.json({status:500,message:'User does not exist'})
		}
 	}
	catch(err){
		console.log("err",err)
		return res.json({status:500,message:'Error occured',err:err})
	}
})

exports.allBookmarks = async(function(req,res,next){
	try{
		var userId = req.body.loggeduserId;
		var profileuserId = req.body.profileuserId;
		var page= req.body.page;
		var pagesize = req.body.pagesize;
		console.log("userId",userId);
		console.log("profileuserId",profileuserId);
		console.log("page",page);
		console.log("pagesize",pagesize);
		const bookmarkedByUser = await(bookmarkService.allbookmarked(userId,profileuserId,page,pagesize))
		if(bookmarkedByUser.length!=0){
			const sortBookmarksBydate = await(sortBookmarkBydate(bookmarkedByUser))
			if(sortBookmarksBydate){
				return res.json({status:200,message:'Success',results:sortBookmarksBydate})
			}
			else{
				console.log("error occured while bookmarking")
			}
		}
		else{
			return res.json({status:500,message:'No bookmarks to show'})
		}
	}
	catch(err){
		return res.json({status:500,message:'Error ocured',err:err})
	}
})

exports.paperBookmarks = async(function(req,res,next){	
	try{
		var userId = req.body.userId;
		const userExist = await(bookmarkService.userExist(userId));
		if(userExist){
			const papersBookmarked = await(bookmarkService.papersBookmarked(userExist._id))
			if(papersBookmarked){
				return res.json({status:200,message:'Success',result:papersBookmarked});
			}
			else{
				return res.json({status:500,message:'No papers found'});
			}
		}
		else{
			return res.json({status:500,message:'User does not exist'})
		}
	}
	catch(err){
		return res.json({status:500,message:'Error occured',err:err})
	}
})

exports.feedsBookmarks = async(function(req,res,next){	
	try{
		var userId = req.body.userId;
		const userExist = await(bookmarkService.userExist(userId));
		if(userExist){
			const feedsBookmarked = await(bookmarkService.feedsBookmarked(userExist._id))
			if(feedsBookmarked){
				return res.json({status:200,message:'Success',result:feedsBookmarked});
			}
			else{
				return res.json({status:500,message:'No papers found'});
			}
		}
		else{
			return res.json({status:500,message:'User does not exist'})
		}
	}
	catch(err){
		return res.json({status:500,message:'Error occured',err:err})
	}
})

exports.allbookmarked = async(function(req,res,next){
	try{
		var userId = req.body.userId;
		const papersBookmarked = await(bookmarkService.papersBookmarked(userId))
		const feedsBookmarked = await(bookmarkService.feedsBookmarked(userId))
		console.log("papersBookmarked:",papersBookmarked);
		console.log("feedsBookmarked:",feedsBookmarked);
		var userPaperIds = papersBookmarked.map(function(papers){
			return papers.paperId;
		})

		var userFeedsIds = feedsBookmarked.map(function(feeds){
			return feeds.feedsId;
		})
		var allFeedsPapersBookmark = userPaperIds.concat(userFeedsIds);
		if(allFeedsPapersBookmark){
			return res.json({status:200,message:'Success',result:allFeedsPapersBookmark})
		}
		else{
			return res.json({status:500,message:'No bookmarks to show'})
		}
	}
	catch(err){
		return res.json({status:500,message:'Error occured',err:err})
	}
})

exports.unbookmark = async(function(req,res,next){
	try{
		var userId =req.body.userId;
		const userExists = await(bookmarkService.userExist(userId))
		if(userExists){
			const alreadyBookmarked = await(bookmarkService.bookmarkedAlready(req.body));
			if(alreadyBookmarked){
				// console.log("alreadyBookmarked:",alreadyBookmarked)
				const deleteBookmark = await(bookmarkService.removeBookmark(req.body))
				if(deleteBookmark){
					return res.json({status:200,message:'Success'})
				}
				else{
					return res.json({status:500,message:'Error occured while deleting bookmark'})
				}
			}
			else{
				return res.json({status:500,message:'User has not bookmarked'})
			}
		}
		else{
			return res.json({status:500,message:'User does not exist'})
		}
 	}
	catch(err){
		return res.json({status:500,message:'Error occured',err:err})
	}
})

function recommendedcheckingfeeds(result,resultId){
	//console.log("resultFound",resultFound);
	resultId.forEach((item) => {
	  var array1Obj = result.find(({feedsId}) => ObjectID(item._id).equals(ObjectID(feedsId._id)));
	  if(array1Obj) {
	    array1Obj.feedsId.isrecommended = true;
	  }
	})
	 return result;
}

function recommendedcheckingpapers(result,resultId){
	resultId.forEach((item) => {
	  var array1Obj = result.find(({paperId}) =>ObjectID(item._id).equals(ObjectID(paperId._id)));
	  if(array1Obj) {
	    array1Obj.paperId.isrecommended = true;
	  }
	})
	 return result;
}

function sortBookmarkBydate(result){
	var sortedResult = result.sort(function(a,b){
  		return new Date(b.createdAt) - new Date(a.createdAt);
	});
	return sortedResult;
}