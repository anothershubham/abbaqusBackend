const async = require('asyncawait/async');
const await = require('asyncawait/await');
const recommendService = require('../services/recommendService');
const userService = require('../services/userService');
const followService = require('../services/followService');
const Async = require('async');
const paperUploadService = require('../services/paperUploadService');
const ObjectID = require('mongodb').ObjectID;

// api for recommending
exports.recommend = async(function(req,res,next){
	try{
		var userId=req.body.userId;
		var recommended = req.body.recommended;
		var recommendTypes = req.body.recommendType;
		const checkUserExist = await(userService.checkuserExist(userId))
		if(checkUserExist){
			const checkAlreadyRecommended = await(recommendService.alreadyrecommended(req.body))
			if(checkAlreadyRecommended.length!=0){
				return res.json({status:500,message:'Already recommended'})
			}
			else{
				const recommendedByUser = await(recommendService.recommendByUserSave(req.body))
				if(recommendedByUser.length!==0){
					const addrecommendedUserId = await(recommendService.addingRecommendedId(recommendedByUser))
					if(addrecommendedUserId){
						return res.json({status:200,message:'Success'})
					}
					else{
						return res.json({status:500,message:'Error occured while recommending'})
					}
				}
				else{
					return res.json({status:500,message:'Error occured while recommending'})
				}
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
// end

// api for Unrecommend
exports.unrecommend = async(function(req,res,next){
	try{
		var userId = req.body.userId;
		var recommendType = req.body.recommendType;
		var recommeded = req.body.recommended;
		const checkUserExist = await(recommendService.checkuserExist(userId))
		if(checkUserExist.length!==0){
			const checkUserRecommended = await(recommendService.alreadyrecommendedbyUser(req.body))
			if(checkUserRecommended.length!=0){
				const removeRecommended = await(recommendService.userRemoveRecommended(req.body))
				if(removeRecommended){
					const removeFromPaperFeedsQuestion = await(recommendService.removeRecommendedId(req.body))
					if(removeFromPaperFeedsQuestion){
						return res.json({status:200,message:'Success'})
					}
					else{
						return res.json({status:500,message:'Error occured while unrecommending'})
					}
				}
				else{
					return res.json({status:500,message:'Error occured while unrecommending'})
				}
			}
			else{
				return res.json({status:500,message:'User has not recommended'})
			}
		}
		else{
			return res.json({status:500,message:'User does not exist'})
		}
	}
	catch(err){
		// console.log("err",err)
		return res.json({status:500,message:'Error occured',err:err})
	}
})
// end

// api  for recommendation to users by his admired people
exports.reccomendationsToUsers = async(function(req,res,next){
	try{
		var userId = req.body.userId;
		var page = req.body.page;
		var pageSize = req.body.pageSize;
		const fetchFollowers = await(recommendService.followedAllUsers(userId))
		if(fetchFollowers){
			var FollowedUsers = fetchFollowers.map(follow =>{return follow.following;})
			const recommendedPaperFeedsQuestion = await(recommendService.paperQuestfeedsrecommended(FollowedUsers,page,pageSize))
			if(recommendedPaperFeedsQuestion.length!=0){
				var recommmendedallId = recommendedPaperFeedsQuestion.map(function(recommeded){
					return recommeded._id;
				})
				// console.log("recommmendedId",recommmendedallId)
				const fetchPopulatedFeedspaperQuestion = await(recommendService.allpapersfeedsquetion(recommmendedallId))
				if(fetchPopulatedFeedspaperQuestion.length!=0){
					const checkUserrecommended = await(recommendService.userrecommends(userId))
					var userrecommendedId = checkUserrecommended.map(function(recommededId){
						return ({_id:recommededId.recommended});
					})
					if(userrecommendedId.length!=0){
						const matchRecommeded = await(matchrecommendedall(fetchPopulatedFeedspaperQuestion,userrecommendedId))
						const checkBookmarked = await(recommendService.bookmarks(userId));
						// console.log("checkBookmarked",checkBookmarked)
						if(checkBookmarked.length!=0){
							const mathbookmarkedData = await(matchbookmarkedall(matchRecommeded,checkBookmarked))
							return res.json({status:200,message:'Success',result:mathbookmarkedData})
						}
						else{
							return res.json({status:200,message:'Success',result:matchRecommeded})
						}
					}
					else{
						const checkBookmarked = await(recommendService.bookmarks(userId));
						// console.log("checkBookmarked",checkBookmarked)
						if(checkBookmarked.length!=0){
							const mathbookmarkedData = await(matchbookmarkedall(fetchPopulatedFeedspaperQuestion,checkBookmarked))
							return res.json({status:200,message:'Success',result:mathbookmarkedData})
						}
						else{
							return res.json({status:200,message:'Success',result:fetchPopulatedFeedspaperQuestion})
						}
					}
				}
				else{
					return res.json({status:300,message:'Error occured while fetching recommended feeds paper question'})
				}
			}
			else{
				return res.json({status:500,message:'Admired user have not recommended anything'})
			}
		}
		else{
			return res.json({status:500,message:'Admire users to get recommendations'})
		}
	}
	catch(err){
		// console.log("err",err)
		return res.json({status:500,message:'Error occured',err:err})
	}
})
//

// api for top recommendations
exports.topRecommendation = async(function(req,res,next){
	try{
		var userId = req.body.userId;
		var page = req.body.page;
		var pagesize = req.body.pagesize;
		const fetchallFollowers = await(recommendService.followedAllUsers(userId))
		if(fetchallFollowers.length!=0){
			var FollowerId = fetchallFollowers.map(function(follow){
				return follow.following;
			})
			// console.log("FollowerId",FollowerId)
			const fetchToprecommends = await(recommendService.toprecommends(FollowerId,page,pagesize)) 
			if(fetchToprecommends.length!=0){
				// console.log("fetchToprecommends",fetchToprecommends.length)
				var recommmendedallId = fetchToprecommends.map(function(recommeded){
					return recommeded.rec_id;
				})
				const fetchPopulatedFeedspaperQuestion = await(recommendService.fetchallPapersrecommended(recommmendedallId))
				if(fetchPopulatedFeedspaperQuestion.length!=0){
					const checkUserrecommended = await(recommendService.userrecommends(userId))
					// console.log("checkUserrecommended",checkUserrecommended)
					var userrecommendedId = checkUserrecommended.map(function(recommededId){
						return ({_id:recommededId.recommended});
					})
					if(userrecommendedId.length!=0){
						const matchRecommeded = await(matchrecommendedall(fetchPopulatedFeedspaperQuestion,userrecommendedId))
						const checkBookmarked = await(recommendService.bookmarks(userId));
						// console.log("checkBookmarked",checkBookmarked)
						if(checkBookmarked.length!=0){
							const mathbookmarkedData = await(matchbookmarkedall(matchRecommeded,checkBookmarked))
							return res.json({status:200,message:'Success',result:mathbookmarkedData})
						}
						else{
							return res.json({status:200,message:'Success',result:matchRecommeded})
						}
					}
					else{
						const checkBookmarked = await(recommendService.bookmarks(userId));
						// console.log("checkBookmarked",checkBookmarked)
						if(checkBookmarked.length!=0){
							const mathbookmarkedData = await(matchbookmarkedall(fetchPopulatedFeedspaperQuestion,checkBookmarked))
							return res.json({status:200,message:'Success',result:mathbookmarkedData})
						}
						else{
							return res.json({status:200,message:'Success',result:fetchPopulatedFeedspaperQuestion})
						}
					}
				}
				else{
					return res.json({status:500,message:'Error occured while fetching recommended feeds paper question'})
				}
			}
			else{
				const fetchToprecommendsnextweek = await(recommendService.toprecommendsnextWeek(FollowerId,page,pagesize))
				if(fetchToprecommendsnextweek.length!=0){
					var recommmendedallId = fetchToprecommendsnextweek.map(function(recommeded){
					return recommeded.rec_id;
					})					
					const fetchPopulatedFeedspaperQuestion = await(recommendService.fetchallPapersrecommended(recommmendedallId))
					if(fetchPopulatedFeedspaperQuestion.length!=0){
						const checkUserrecommended = await(recommendService.userrecommends(userId))
						// console.log("checkUserrecommended",checkUserrecommended)
						var userrecommendedId = checkUserrecommended.map(function(recommededId){
							return ({_id:recommededId.recommended});
						})
						// console.log("userrecommendedId",userrecommendedId)
						if(userrecommendedId.length!=0){
							const matchRecommeded = await(matchrecommendedall(fetchPopulatedFeedspaperQuestion,userrecommendedId))
							const checkBookmarked = await(recommendService.bookmarks(userId));
							// console.log("checkBookmarked",checkBookmarked)
							if(checkBookmarked.length!=0){
								const mathbookmarkedData = await(matchbookmarkedall(matchRecommeded,checkBookmarked))
								return res.json({status:200,message:'Success',result:mathbookmarkedData})
							}
							else{
								return res.json({status:200,message:'Success',result:matchRecommeded})
							}
						}
						else{
							const checkBookmarked = await(recommendService.bookmarks(userId));
							// console.log("checkBookmarked",checkBookmarked)
							if(checkBookmarked.length!=0){
								const mathbookmarkedData = await(matchbookmarkedall(fetchPopulatedFeedspaperQuestion,checkBookmarked))
								return res.json({status:200,message:'Success',result:mathbookmarkedData})
							}
							else{
								return res.json({status:200,message:'Success',result:fetchPopulatedFeedspaperQuestion})
							}
						}
					}
					else{
						return res.json({status:500,message:'Error occured while fetching recommended feeds paper question'})
					}
				}
				else{
					const fetchToprecommendsLasttime = await(recommendService.toprecommendslast(FollowerId,page,pagesize))
					if(fetchToprecommendsLasttime.length!==0){
						var recommmendedallId = fetchToprecommendsLasttime.map(function(recommeded){
						return recommeded.rec_id;
						})
						const fetchPopulatedFeedspaperQuestion = await(recommendService.fetchallPapersrecommended(recommmendedallId))
						if(fetchPopulatedFeedspaperQuestion.length!=0){
							const checkUserrecommended = await(recommendService.userrecommends(userId))
							// console.log("checkUserrecommended",checkUserrecommended)
							var userrecommendedId = checkUserrecommended.map(function(recommededId){
								return ({_id:recommededId.recommended});
							})
							// console.log("userrecommendedId",userrecommendedId)
							if(userrecommendedId.length!=0){
								const matchRecommeded = await(matchrecommendedall(fetchPopulatedFeedspaperQuestion,userrecommendedId))
								const checkBookmarked = await(recommendService.bookmarks(userId));
								// console.log("checkBookmarked",checkBookmarked)
								if(checkBookmarked.length!=0){
									const mathbookmarkedData = await(matchbookmarkedall(matchRecommeded,checkBookmarked))
									return res.json({status:200,message:'Success',result:mathbookmarkedData})
								}
								else{
									return res.json({status:200,message:'Success',result:matchRecommeded})
								}
							}
							else{
								const checkBookmarked = await(recommendService.bookmarks(userId));
								// console.log("checkBookmarked",checkBookmarked)
								if(checkBookmarked.length!=0){
									const mathbookmarkedData = await(matchbookmarkedall(fetchPopulatedFeedspaperQuestion,checkBookmarked))
									return res.json({status:200,message:'Success',result:mathbookmarkedData})
								}
								else{
									return res.json({status:200,message:'Success',result:fetchPopulatedFeedspaperQuestion})
								}
							}
						}
						else{
							return res.json({status:500,message:'Error occured while fetching recommended feeds paper question'})
						}
					}
					else{
						return res.json({status:500,message:'There are no recommendation'})
					}
				}
			}
		}
		else{
			return res.json({status:500,message:'User has not admired anyone yet'})
		}
	}
	catch(err){
		// console.log("erre",err)
		return res.json({status:500,message:'Error occured',err:err})
	}
})
// end

//api for single user referring feed
exports.fetchUserRecommendedData = async(function(req,res,next){
	try{
		var userId = req.body.userId;
		const fetchUserRecommendedFeeds = await(recommendService.userRecommendedFeeds(userId))
		const fetchUserRecommendedPapers = await(recommendService.userRecommendedPapers(userId))
		const fetchUserRecommendedQuestions = await(recommendService.userRecommendedQuestion(userId))

		var resultfeedsId =  fetchUserRecommendedFeeds.map(function(feeds){
			return ({_id:feeds.feedsId})
		})

		var resultpaperId =  fetchUserRecommendedPapers.map(function(paper){
			return ({_id:paper.paperId})
		})

		var resultquestionId =  fetchUserRecommendedQuestions.map(function(question){
			return ({_id:question.questionId})
		})

		var finalResult = resultfeedsId.concat(resultpaperId,resultquestionId)
		if(finalResult){
			return res.json({finalResult})
		}
		else{
			console.log("errror");
		}

	}
	catch(err){
		return res.json({status:500,message:'Error occured',err:err})
	}
})
// end

function matchrecommendedall(resultall,allrecommeded){
	allrecommeded.forEach((item) => {
		var matchedobj = resultall.find(({recommended}) => ObjectID(item._id).equals(ObjectID(recommended._id)));
		if(matchedobj) {
		  	 matchedobj.recommended.isrecommended= true;
		  }
	})
	  return resultall;
}

function matchbookmarkedall(resultall,allrecommeded){
	allrecommeded.forEach((item) => {
		var matchedobj = resultall.find(({recommended}) => ObjectID(item._id).equals(ObjectID(recommended._id)));
		if(matchedobj) {
			 // console.log("my",matchedobj._id.isrecommended)
		  	 matchedobj.recommended.isbookmarked= true;
		  }
	})
	  return resultall;
}