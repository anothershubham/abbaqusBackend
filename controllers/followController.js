const Follow = require('../models/follow');
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const Async = require('async');
const Notification = require('../models/notification');
const followService = require('../services/followService');
const push = require('../middlewares/pusher');
const User = require('../models/users');
const paperUploadService = require('../services/paperUploadService');
const ObjectID = require('mongodb').ObjectID;

exports.followers = async(function (req, res, next) {
	const { following } = req.body;
	var userId = req.body.userId;
	var followingId = req.body.following;
	try {
		if(ObjectID(userId).equals(ObjectID(following))){
			return res.json({status:500,message:'user cannot follow this user'})
		}
		else{
			
			const followExists = await(followService.followExists(req.body));
			if (followExists.length != 0) {
				res.json({ status: 500, message: 'You are already follwing this user' });
			}
			else {
				const admire = await(followService.follow(req.body));
				if (admire.length!==0) {
					const notificationDetail = await(followService.notificationDetail(userId));
					if (notificationDetail) {
						const saveNotification = await(followService.saveNotification(admire, notificationDetail));
						if (saveNotification) {
							res.json({ status: 200, message: "Success" });
							return push.notification(followingId, saveNotification);
						}
						else {
							return res.json({ status: 500, message: 'Error occured while sending notification' });
						}
					}
					else {
						return res.json({ status: 500, message: "Error occured while sending Notification" })
					}
				}
				else {
					res.json({ status: 500, message: 'Error Occured while Following user' });
				}
			}
		}
		
	}
	catch (error) {
		return res.send(error);
	}
});

exports.allFollowers = async(function (req, res, next) {
	const followallUsers = await(followService.followAllUsers(req.params.id));
	try {
		if (followallUsers.length == 0) {
			res.json({ status: 500, message: 'Failure' });
		}
		else {
			res.send({ status: 200, message: 'Succesfull', result: followallUsers });
		}
	}
	catch (error) {
		return res.send(error);
	}
})

exports.questionForFollwing = async(function (req, res, next) {
	var userId = req.body.userId;
	var page = req.body.page;
	var pageSize = req.body.pageSize;
	const followedUsers = await(followService.fetchFollowedUsers(userId));
	if (followedUsers) {
		var followedUsersId = followedUsers.map(function(userData){
			return userData.following;
		})
		const questionOfFollowed = await(followService.fetchFollowedQuestions(followedUsersId,page,pageSize))
		if(questionOfFollowed){
			const checkRecommendquestion =await(followService.recommendedquestion(userId))
			if(checkRecommendquestion){
				var questionId = checkRecommendquestion.map(function(question){
									return ({_id:question.recommended});
								});
				const questionmatched = await(matchQuestionRecommended(questionOfFollowed,questionId));
				if(questionmatched){
					res.json({ status: 200, message: 'Success', result:questionmatched});
				}
				else{
					console.log("error occured while mathching question")
				}
			}
			else{
				res.json({ status: 200, message: 'Success', result:questionOfFollowed});
			}
		}
		else{
			res.json({ status: 500, message: 'Admired users have not uploaded any questionds'});
		}
		//res.json({ status: 200, message: 'Success', result: followers });
	}
	else {
		res.json({ status: 500, message: 'Failure' });
	}
})

// done it in papers will delete this
exports.papersForFollowing = async(function (req, res, next) {
	const fetchFollowedUsers = await(followService.fetchFollowedUsers(req.params.id));
	if (fetchFollowedUsers) {
		var followedUsersId = fetchFollowedUsers.map(function(userData){
			return userData.following;
		})
		const paperOfFollowed = await(followService.fetchPaperUsers(followedUsersId));
		if(paperOfFollowed){
			res.json({ status: 200, message: 'Success', result:paperOfFollowed});
		}
		else{
			res.json({ status: 200, message: 'Admired users have not uploaded any papers '});
		}
	}
	else {
		res.json({ status: 500, message: 'Failure' });
	}
})
// end


exports.userFollowed =async(function(req,res,next){
	try{
		var userId = req.body.userId
		const fetchallFollowed =await(followService.fetchFollowedUsers(userId));
		const fetchfollowing = await(followService.fetchUserFollowingyou(userId));
		if(fetchallFollowed || fetchfollowing){
			return res.json({status:200,message:'Success',Admired:fetchallFollowed.length,Admiring:fetchfollowing.length});
		}
		else{
			return res.json({status:500,message:'User has not admired any user'})
		}
	}
	catch(err){
		return res.json({status:500,message:'Error occured',err:err})
	}
})

exports.unfollowUser = async(function(req,res,next){
	try{
		var followingId = req.body.followingId;
		var userId = req.body.userId;
		const checkUserExist = await(followService.userExist(userId))
		if(checkUserExist){
			const checkFollowingId = await(followService.checkFollowing(userId,followingId))
			if(checkFollowingId){
				const unfollow  = await(followService.userUnfollow(userId,followingId));
				if(unfollow){
					// const saveNotificationtoUnfollowed = await(followService.saveNotificationUnfollowed(checkUserExist, userId,followingId));
					// 	if (saveNotificationtoUnfollowed) {
					// 		console.log("saveNotificationtoUnfollowed", saveNotificationtoUnfollowed)
					// 		res.json({ status: 200, message: "Success" });
					// 		return push.notification(followingId, saveNotificationtoUnfollowed);
					// 	}
					// 	else {
					// 		return res.json({ status: 500, message: 'Error occured while sending notification' });
					// 	}
					return res.json({status:200,message:'Success'})
				}
				else{
					return res.json({status:500,message:'Unable to unfollow'})
				}
			}	
			else{
				return res.json({status:500,message:'User not admired'})
			}
		}
		else{
			return res.json({status:500,message:'User does not exist'})
		}
	}
	catch(err){
		return res.json({status:500,message:'Error occured',err:err});
	}
})

exports.admired = async(function(req,res,next){
	try{
		var userId = req.body.profileuserId;
		var loggeduserId = req.body.loggeduserId;
		var page = req.body.page;
		var pagesize = req.body.pagesize;
		const fetchallFollowed =await(followService.fetchFollowedUsers(userId,page,pagesize));
		if(fetchallFollowed){
			 const fetchuserFollowed = await(followService.userfollowedPeople(loggeduserId))
			 if(fetchuserFollowed.length!=0){
			 	var followedId = fetchuserFollowed.map(function(follow){
			 		return ({_id:follow.following})
			 	})
			 	const matchfollowed = await(matchFollowing(fetchallFollowed,followedId))
			  	return res.json({status:200,message:'Success',result:matchfollowed})
			 }
			 else{
			 	return res.json({status:200,message:'Success',result:fetchallFollowed})
			 }
		}
		else{
			return res.json({status:500,message:'No user admired the user'})
		}
	}
	catch(err){
		return res.json({status:500,message:'Error occured',err:err})
	}
})

exports.admiring = async(function(req,res,next){
	try{
		var userId = req.body.profileuserId;
		var loggeduserId = req.body.loggeduserId;
		var page = req.body.page;
		var pagesize = req.body.pagesize;
		const fetchfollowing = await(followService.fetchUserFollowingyou(userId,page,pagesize));
		if(fetchfollowing.length!=0){
			const fetchuserFollowed = await(followService.userfollowedPeople(loggeduserId))
			 if(fetchuserFollowed.length!=0){
			 	var followedId = fetchuserFollowed.map(function(follow){
			 		return ({_id:follow.following})
			 	})
			 	const matchfollowed = await(matchFollowinginfollows(fetchfollowing,followedId))
			 	return res.json({status:200,message:'Success',result:matchfollowed})
			 }
			 else{
			 	return res.json({status:200,message:'Success',result:fetchfollowing})
			 }
		}
		else{
			return res.json({status:500,message:'User not admired any user'})
		}
	}
	catch(err){
		return res.json({status:500,message:'Error occured',err:err})
	}
})


function matchQuestionRecommended(resultquestion,questionrecommended){
	questionrecommended.forEach((item) => {
	  var matchedobj = resultquestion.find(({_id}) => ObjectID(item._id).equals(ObjectID(_id)));
	  if(matchedobj) {
	  	matchedobj.isrecommended= true;
	  }
	})
	  return resultquestion;
}

function matchFollowing(resultfollowed,followedId){
	followedId.forEach((item) => {
	  var matchedobj = resultfollowed.find(({following}) => ObjectID(item._id).equals(ObjectID(following._id)));
	  if(matchedobj) {
	  	matchedobj.following.isfollowed= true;
	  }
	})
	  return resultfollowed;
}

function matchFollowinginfollows(resultfollowerd,followedId){
	followedId.forEach((item) => {
	  var matchedobj = resultfollowerd.find(({userId}) => ObjectID(item._id).equals(ObjectID(userId._id)));
	  if(matchedobj) {
	  	matchedobj.userId.isfollowed= true;
	  }
	})
	  return resultfollowerd;
}
