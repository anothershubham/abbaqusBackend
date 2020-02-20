const Follow = require('../models/answer');
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const answerService = require('../services/answerService');
const push = require('../middlewares/pusher');
const ObjectID = require('mongodb').ObjectID;

// api to Save answer
exports.answerByUser = async(function(req,res,next){
	var userId = req.body.userId;
	var questionId = req.body.questionId;
	var isMultipleQuestion = req.body.isMultipleQuestion;
	try{
		const checkuserExists = await(answerService.userExist(userId));
		if(checkuserExists){
			const checkquestionExist = await(answerService.questionsExist(questionId))
			if(checkquestionExist.length!=0){
				if(isMultipleQuestion == "true"){
					const isalreadyAnswered = await(answerService.multiplealreadyanswered(req.body))
					if(isalreadyAnswered.length != 0){
						return res.json({status:500,message:'You have already answered to the question'})
					}
					else{
							const saveAnswer = await(answerService.answerSaved(req.body))
							if(saveAnswer){
								const saveAnwerInQuestion = await(answerService.answerInQuestion(saveAnswer))
								if(saveAnwerInQuestion){
									res.json({status:200,message:'Success'});
									if(userId.toString() == checkquestionExist[0].userId._id.toString()){
										console.log("Answered question uploaded by you")
									}
									else{
										const saveNotification = await(answerService.saveNotification(checkquestionExist,checkuserExists))
										if(saveNotification){
											var recieverId = saveNotification.reciever;
											push.notification(recieverId, saveNotification);
										}
										else{
											console.log("error occured while saving notification details")
										}
									}
								}
								else{
									return res.json({status:500,message:'Error occured while updating'});
								}
							}
							else{
								return res.json({status:500,message:'Error occured while saving'})
							}
					}
				}
				else{
						const saveAnswer = await(answerService.answerSaved(req.body))
						if(saveAnswer){
	
							const saveAnwerInQuestion = await(answerService.answerInQuestion(saveAnswer))
							if(saveAnwerInQuestion){
								 res.json({status:200,message:'Success'});
								if(userId.toString() == checkquestionExist[0].userId._id.toString()){
									console.log("Answered question uploaded by you")
								}
								else{
									const saveNotification = await(answerService.saveNotification(checkquestionExist,checkuserExists))
									if(saveNotification){
										var recieverId = saveNotification.reciever;
										push.notification(recieverId, saveNotification);
									}
									else{
										console.log("error occured while saving notification details")
									}
								}
							}
							else{
								return res.json({status:500,message:'Error occured while updating'});
							}
								
						}
						else{
							return res.json({status:500,message:'Error occured while saving'})
						}
				}
			}
			else
			{
				return res.json({status:500,message:'Question does not exist'})
			}
		}
		else{
			return res.json({status:500,message:'user does not exist'})
		}
	}
	catch(err){
		return res.json({status:500,message:'Error occured',err:err})
	}
});
//end

exports.totalAnswers = async(function(req,res,next){
	const getallusers = await(answerService.allanswers(req.body));
	if(getallusers){
		var ismultiple = req.body.isMultipleQuestion;
		var totalUsers = getallusers.length;
		if(ismultiple == "true"){
			const percentageOfAnswers = await(answerService.percentageCalculator(req.body,totalUsers));
			if(percentageOfAnswers){
				return res.json({status:200,message:'Success',result:percentageOfAnswers});
			}
		}
		else{
			return res.json({status:"500",message:'Error occured'});
		}
	}
	else{
		return res.json({status:"500",message:'Error occured'});
	}	
});

//api for fetching all answer to single question
exports.fetchAnswertoSingle = async(function(req,res,next){
	var userId = req.body.userId;
	var questionId = req.body.questionId;
	const questionsExist = await(answerService.questionsAlreadyExist(questionId));
	if(questionsExist.length!=0){
		// return res.json({status:200,message:'Success',result:questionsExist})
		const checkUserrecommended = await(answerService.userrecommends(userId))
		var userrecommendedId = checkUserrecommended.map(function(recommededId){
			return ({_id:recommededId.recommended});
		})
		if(userrecommendedId.length!=0){
			const matchRecommeded = await(matchanswerrecommendedall(questionsExist,userrecommendedId))
			return res.json({status:200,message:'Success',result:matchRecommeded})
		}
		else{
			return res.json({status:200,message:'Success',result:questionsExist})
		}

	}
	else{
		return res.json({status:500,message:'Question does not exist'})
	}
});

// end

exports.recentAnswer = async(function(req,res,next){
	try{
		const answer = await(answerService.answers());
		if(answer){
			return res.json({status:200,message:'Success',result:answer});
		}
		else{
			return res.json({status:500,message:'No question was answered'})
		}
	}
	catch(err){
		return res.json({status:500,message:'Error occured',err:err})
	}
})

exports.answerList = async(function(req,res,next){
	try{	
		var userId = req.body.userId;
		const userAnsweredList = await(answerService.answeredQuestion(userId))
		if(userAnsweredList){
			return res.json({status:200,message:'Success',result:userAnsweredList})
		}
		else{
			return res.json({status:200,message:'Success',result:userAnsweredList})
		}
	}
	catch(err){
		return res.json({status:500,message:'Error occured',err:err})
	}
})

function matchanswerrecommendedall(resultall,allrecommeded){
	allrecommeded.forEach((item) => {
		var matchedobj = resultall.find(({_id}) => ObjectID(item._id).equals(ObjectID(_id)));
		if(matchedobj) {
			 // console.log("my",matchedobj._id.isrecommended)
		  	 matchedobj.isrecommended= true;
		  }
	})
	  return resultall;
}


