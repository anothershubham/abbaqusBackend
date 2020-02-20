const Follow = require('../models/follow');
const Users = require('../models/users');
const QuestionUploads = require('../models/questionUpload');
const Paperupload = require('../models/paperUpload');
const Notification = require('../models/notification');
const config = require('../config');
const bcrypt = require('bcrypt');
const Recommend = require('../models/recommend');


exports.follow = function(body){
	const {userId,following} = body;
	var notabletoFolllow = [];
	var followingId = body.following;
	var userbyId = body.userId;
	if(typeof followingId !== 'undefined' && typeof userbyId!=='undefined' && followingId!== '' && userbyId!== '' ){
		const followsUsers = new Follow;
		followsUsers.userId= userId;
		followsUsers.following= following;
		followsUsers.save();
		return followsUsers;
	}
	else{
		return notabletoFolllow;
	}
	
}

exports.followExists = function(followexist){
	return Follow.find({$and : [{userId:followexist.userId},{following:followexist.following}]});
}

exports.followAllUsers =function(userID){
	return Follow.find({userId:userID}).populate('following');
}

exports.recommendedquestion =function(userID){
	return Recommend.find({$and:[{userId:userID},{recommendType:'questions'}]})
}

exports.fetchFollowedQuestions = function(followedUsersId,page,pageSize){
	return QuestionUploads.find({userId:{$in:followedUsersId}}).populate('userId','_id firstname lastname organization profileImg designation role').populate({path:'answer',populate:{path:'userId',select: '_id firstname lastname profileImg designation role organization'}}).populate('recommended','profileImg').populate().sort({createdAt:-1}).skip(page*pageSize).limit(pageSize);
	// return Follow.find({userId:userID}).populate({path:'following',model:Users,populate:{path:'question',model:QuestionUploads}})
}

exports.fetchFollowedUsers = function(userId,page,pagesize){
	var skip = page*pagesize;
	return Follow.find({userId:userId}).populate('following','_id firstname lastname profileImg organization designation role isfollowed').sort({createdAt:-1}).skip(skip).limit(pagesize).lean(); 
	// return Follow.find({userId:userId}).populate({path:'following',model:Users,populate:{path:'paper',model:Paperupload}})
}
 
exports.userfollowedPeople = function(userId){
	return Follow.find({userId:userId});
}

exports.fetchUserFollowingyou = function(userId,page,pagesize){
	var skip = page*pagesize;
	return Follow.find({following:userId}).populate('userId','_id firstname lastname profileImg organization designation role isfollowed').sort({createdAt:-1}).skip(skip).limit(pagesize).lean();
}

exports.fetchPaperUsers = function(followedUsersId){
	return Paperupload.find({userId:{$in:followedUsersId}}).populate('userId','_id firstname lastname organization profileImg role designation').sort({createdAt:-1});
}

exports.notificationDetail = function(userId){
	return Users.findOne({_id:userId});
}

exports.userExist = function(userId){
	return Users.findOne({_id:userId}).select('firstname lastname')
}

exports.saveNotificationUnfollowed = function(checkUserExist,userId,following){
	var message = checkUserExist.firstname + ' ' + checkUserExist.lastname;
	const notification = new Notification;
	notification.sender = userId;
	notification.reciever = following;
	notification.unAdmiredId = following;
	notification.message = message;
	notification.save();
	return notification;
}

exports.saveNotification = function(admireDetails,notificationDetail){
	var message = notificationDetail.firstname + ' ' +  notificationDetail.lastname;
	const notification = new Notification;
	notification.sender = admireDetails.userId;
	notification.reciever = admireDetails.following;
	notification.message = message;
	notification.save();
	return notification;
}

exports.checkFollowing = function(userId,followingId){
	return Follow.find({$and:[{userId:userId},{following:followingId}]});
}

exports.userUnfollow = function(userId,followingId){
	return Follow.remove({$and:[{userId:userId},{following:followingId}]});
}
