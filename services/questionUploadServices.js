const QuestionUploads = require('../models/questionUpload');
const QuestionViews = require('../models/questionViews')
const Answer =require('../models/answer');
const Notification = require('../models/notification');
const User = require('../models/users');
const config = require('../config');
const bcrypt = require('bcrypt');
const Recommend = require('../models/recommend');

exports.Questionupload = function(body){
	const {userId,questionText,options,isMultipleQuestion,answerTomultiple} = body;
	const uploadsQuest = new QuestionUploads;
	uploadsQuest.userId= userId;
	uploadsQuest.questionText= questionText;
	uploadsQuest.options= options;
	uploadsQuest.isMultipleQuestion = isMultipleQuestion;
	uploadsQuest.save()
	return uploadsQuest;
}

exports.checkExistsQuestion = function(body){
	return  QuestionUploads.find({_id:body.questionId})
}

exports.questionAlreadyViewed =function(body){
	return QuestionViews.find({$and:[{questionId:body.questionId},{vieweduserId:{$in:body.userId}}]})
}

exports.questionFind = function(body){
	return QuestionViews.find({questionId:body.questionId})
}

exports.createQuestionViews = function(body){
	const {userId,questionId} = body;
	const uploadViews = new QuestionViews;
	uploadViews.questionId = questionId;
	uploadViews.vieweduserId = userId;
	uploadViews.save()
	return uploadViews;
}

exports.updateViewCountInQuestion = function(body,views){
	var updateViews = views+1;
	return QuestionUploads.findOneAndUpdate({_id:body.questionId},{$set:{views:updateViews}})
}


exports.questionViewsUpdate = function(body){
	return QuestionViews.update({questionId:body.questionId},{$push:{vieweduserId:body.userId}})
}

exports.uploadtoUser = function(questionToUpload,userId){
	return User.findOneAndUpdate({_id:userId},{$push:{question:questionToUpload}},{new: true})
}

exports.userRecommendedQuestion = function(userId){
	return Recommend.find({userId:userId}).lean();
}

exports.recommendedquestion = function(userId){
	return Recommend.find({$and:[{userId:userId},{recommendType:"questions"}]}).lean();
}

exports.userExist = function(userId){
	return User.findOne({_id:userId})
}

exports.questionExist = function(questionId){
	return QuestionUploads.find({_id:questionId});
}

exports.editQuestion = function(body){
	var questionId = body.questionId;
	return QuestionUploads.findOneAndUpdate({_id:questionId},{$set:{questionText:body.questionText,isMultipleQuestion:body.isMultipleQuestion,options:body.options}},{new: true});
}

exports.questionDelete = function(body){
	var questionId = body.questionId;
	return QuestionUploads.findOneAndRemove({_id: questionId});
}

exports.userDeletequestion = function(body){
	var questionId = body.questionId;
	var userId = body.userId;
	return User.findOneAndUpdate({_id:userId},{ $pull : { "question" : questionId  } },{new: true});
}

exports.deleteInAnswers = function(body){
	var questionId = body.questionId;
	return Answer.deleteMany({questionId:questionId})
}
exports.userQuestion = function(userId,page,pagesize){
	var skip = page*pagesize;
	return QuestionUploads.find({userId:userId}).populate('userId','_id firstname role lastname profileImg organization createdAt designation').populate('recommended','profileImg').sort({createdAt:-1}).skip(skip).limit(pagesize);
}

exports.trendingAllQuestion = function(){
	return QuestionUploads.find({"createdAt" : { $lte: new Date(), $gte: new Date(new Date().setDate(new Date().getDate()-2))}}).sort({views:-1,createdAt:-1}).limit(3).populate('userId','_id firstname lastname role designation dob profileImg organization').populate('recommended','profileImg');
}

exports.trendingAllQuestiondoes = function(){
	return QuestionUploads.find({}).sort({views:-1,createdAt:-1}).limit(3).populate('userId','_id firstname lastname role designation dob profileImg organization').populate('recommended','profileImg');
}

exports.checkquestionExist = function(questionId){
	return QuestionUploads.find({_id:questionId}).populate('recommended','profileImg').populate({path: 'answer', populate:{path: 'userId', select: '_id firstname lastname designation dob organization profileImg role'}}).populate('userId','_id firstname lastname profileImg createdAt role designation organization');
}

exports.questionRecent = function(){
	return QuestionUploads.find({isMultipleQuestion:false}).populate('userId','_id firstname role lastname profileImg organization createdAt designation').sort({createdAt:-1}).limit(1).lean();
}

exports.fetchAllQuestionstodelete = function(userId){
	return QuestionUploads.find({userId:userId}).select('_id');
}

exports.deleteQuestionrecommended = function(question){
	return Recommend.remove({recommended:question._id});
}

exports.deleteQuestionNotified = function(question){
	return Notification.remove({questionId:question._id});
}

exports.deleteQuestionInviews = function(question){
	return QuestionViews.remove({questionId:question._id});
}

exports.deleteQuestionInAnswer = function(question){
	return Answer.remove({questionId:question._id});
}

exports.deleteQuestion = function(question){
	return QuestionUploads.findOneAndRemove({_id:question._id});
}



