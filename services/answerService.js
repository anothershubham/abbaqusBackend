const QuestionUploads = require('../models/questionUpload');
const User = require('../models/users');
const Answer = require('../models/answer')
const config = require('../config');
const bcrypt = require('bcrypt');
var mongoose    = require('mongoose');
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const Recommend = require('../models/recommend');
const Notification = require('../models/notification');

exports.userExist = function(userId){
	return User.find({_id :userId});
}

exports.questionsExist = function(questionId){
	return QuestionUploads.find({_id:questionId}).populate('userId','_id firstname lastname profileImg createdAt role designation organization');
}

exports.questionsAlreadyExist = function(questionId){
	return QuestionUploads.find({_id:questionId}).populate({path:'answer',populate:{path:'userId',select:'_id firstname lastname designation dob organization profileImg role'}}).populate('userId','_id firstname lastname profileImg createdAt role designation organization').populate('recommended','profileImg').lean();
}


exports.answerSaved = function(body){
	const{userId,questionId,answer,isMultipleQuestion} = body;
	const answerSave = new Answer;
	answerSave.userId = userId;
	answerSave.questionId = questionId;
	answerSave.answer = answer;
	answerSave.isMultipleQuestion = isMultipleQuestion;
	answerSave.save();
	return answerSave;
}

exports.multiplealreadyanswered = function(body){
	return Answer.find({$and:[{userId:body.userId},{questionId:body.questionId}]});
}

exports.allanswers = function(body){
	return Answer.find({questionId:body.questionId});
}

exports.percentageCalculator = function(body,totalusers){
	return Answer.aggregate([
        { "$match": { "questionId":  mongoose.Types.ObjectId(body.questionId) } },
        { "$group": { "_id": {"answer":  "$answer"}, "count": { "$sum": 1 }}},    
        { "$project": { 
            "count": 1, 
            "percentage": { 
                "$concat": [ { "$substr": [ { "$multiply": [ { "$divide": [ "$count", {"$literal": totalusers }] }, 100 ] }, 0,4 ] }, "", "%" ]}
            }
        }
    ])
}

exports.fetchallAnswer = function(questionId){
	return Answer.find({questionId:questionId}).populate('userId', '_id firstname lastname profileImg organization createdAt role designation').sort({createdAt:-1});
}

exports.answerInQuestion = function(answerData){
	let data = {$push:{answer:answerData}};
	var questionId = answerData.questionId;
	return QuestionUploads.findOneAndUpdate({_id:questionId},data,{new: true});
}

exports.answers = function(){
	return Answer.find({isMultipleQuestion:false}).sort({createdAt:-1}).populate('userId', '_id firstname lastname organization profileImg createdAt role designation').limit(2);;
}

exports.answeredQuestion = function(userId){
	return Answer.find({$and:[{userId:userId},{isMultipleQuestion:true}]}).sort({createdAt:-1})
}	

exports.userrecommends = function(userId){
	return Recommend.find({userId:userId}).lean();
}

exports.saveNotification = function(questionDetails,userdetails){
	var message = userdetails[0].firstname + ' ' +  userdetails[0].lastname;
	const notification = new Notification;
	notification.sender = userdetails[0]._id;
	notification.reciever = questionDetails[0].userId._id;
	notification.questionId = questionDetails[0]._id
	notification.message = message;
	notification.save();
	return notification;
}