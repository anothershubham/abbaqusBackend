const Questionuploads = require('../models/questionUpload');
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const speakeasy = require("speakeasy");
const  questionUploadService= require('../services/questionUploadServices');
const paperSourceService = require('../services/paperSourceService')
const followService = require('../services/followService');
const recommendService = require('../services/recommendService');
const config = require('../config');
const fs = require('fs');
const ejs = require('ejs');
const mail = require('../services/mail');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const ObjectID = require('mongodb').ObjectID;

exports.uploadQuestion = async (function(req,res,next){
	var userId = req.body.userId;
	//console.log("userId",userId);
	try{
		const checkUserExist = await(questionUploadService.userExist(userId));
		// console.log("checkUserExist:",checkUserExist);
		if(checkUserExist){
			const questionToUpload = await(questionUploadService.Questionupload(req.body))
			//console.log("questionToUpload",questionToUpload);
			var userId = questionToUpload.userId;
			//console.log("userId",userId);
			if(questionToUpload){
				const questionToUser = await(questionUploadService.uploadtoUser(questionToUpload,userId))
				//res.json({status:200});
				//console.log("questionToUser:",questionToUser)
				if(questionToUser){
					res.json({status:200,message:"Question uploaded successfully"})
				}
				else{
					res.json({status:500,message:"Error occured while uploading question to paper"})
				}
			}
			else{
				res.json({status:500,message:"Error occured"});
			}
		}
		else{
			return res.json({status:500,message:'User does not exist'});
		}
	
	}
	catch(error){
		return res.send(error)
	}
})

exports.editQuestion = async(function(req,res,next){
	try{
		var questionId = req.body.questionId;
		const questionExist = await(questionUploadService.questionExist(questionId));
		if(questionExist.length != 0){	
			const editQuestions = await(questionUploadService.editQuestion(req.body));
			if(editQuestions){
				return res.json({status:200,message:'Success'});
			}
			else{
				return res.json({status:500,message:'Error occured while updating questions'});
			}
		}
		else{
			return res.json({status:500,message:'Question does not exists'});
		}
	}
	catch(err){
		return res.json({message:'Error occured'})
	}
})

exports.deleteQuestion = async(function(req,res,next){
	try{
		var questionId = req.body.questionId;
		const questionExist = await(questionUploadService.questionExist(questionId));
		if(questionExist.length != 0){	
			//console.log("here");
			const deleteQuestion = await(questionUploadService.questionDelete(req.body));
			if(deleteQuestion){
				const userDeleteQuestion  = await(questionUploadService.userDeletequestion(req.body))
				if(userDeleteQuestion){
					const deleteInAnswer = await(questionUploadService.deleteInAnswers(req.body))
					if(deleteInAnswer){
						return res.json({status:200,message:'Success'});
					}
					else{
						return res.json({status:400,message:'Error occured while deleting in answers'});
					}
				}
				else{
					return res.json({status:500,message:'Failure'});
				}
			}
			else{
				return res.json({status:500,message:'Unable to delete question'})
			}
		}
		else{
			return res.json({status:500,message:'Question does not exists'});
		}

	}
	catch(err){
		return res.json({status:500,message:'Error occcured'});
	}
})

// api for user uploaded question
exports.userUploadedQuestions = async(function(req,res,next){
	try{
		var userId = req.body.profileuserId;
		var profileuserId = req.body.loggeduserId;
		var page = req.body.page;
		var pagesize = req.body.pagesize;

		const userQuestions = await(questionUploadService.userQuestion(userId,page,pagesize));
		//console.log("userExist",userExist);
		if(userQuestions.length!=0){
			var questionRecommended  = await(questionUploadService.userRecommendedQuestion(profileuserId));
			if(questionRecommended.length!=0){
				// console.log("questionRecommended",questionRecommended)
				var questionId =  questionRecommended.map(function(ques){
						return ({_id:ques.recommended})
					})
					// console.log("questionId",questionId)
					var checkQuestionrecommended = await(matchrecommendedall(userQuestions,questionId))
					 // console.log("checkQuestionrecommended",checkQuestionrecommended)
					 return res.json({status:200,message:'Success',result:checkQuestionrecommended})
				}
			else{
				return res.json({status:200,message:'Success',result:userQuestions})
			}
		}
		else{
			return res.json({status:500,message:'User does not exist'});
		}
	}
	catch(err){
		return res.json({status:500,message:'Error occured',err:err})
	}
})
// end

//api for question views 
exports.questionViews = async(function(req,res,next){
	try{
		const checkQuestionExist = await(questionUploadService.checkExistsQuestion(req.body))
		if(checkQuestionExist.length!==0){
			const checkAlreadyViewed = await(questionUploadService.questionAlreadyViewed(req.body))
			// console.log("checkAlreadyViewed",checkAlreadyViewed)
			if(checkAlreadyViewed.length!==0){
				return res.json({status:400,message:'Question already viewed by user'})
			}
			else{
				const checkQuestionExistsInQuestionViews = await(questionUploadService.questionFind(req.body))
				// console.log("checkQuestionExistsInQuestionViews",checkQuestionExistsInQuestionViews)
				if(checkQuestionExistsInQuestionViews.length!==0){
					 const updateViewsInQuestionViews = await(questionUploadService.questionViewsUpdate(req.body))
					if(updateViewsInQuestionViews){
						const updateInQuestion = await(questionUploadService.updateViewCountInQuestion(req.body,checkQuestionExist[0].views))
						if(updateInQuestion){
							return res.json({status:200,message:'Successfully updated views'})
						}
						else{
							return res.json({status:400,message:'Error occured while updating question views'})
						}
					}
					else{
						return res.json({status:400,message:'Error occured while updating in question views'})
					}
				}
				else{
					const createQuestionViews = await(questionUploadService.createQuestionViews(req.body))
					if(createQuestionViews){
						const updateViewsCount = await(questionUploadService.updateViewCountInQuestion(req.body,checkQuestionExist[0].views))
						if(updateViewsCount){
							return res.json({status:200,message:'Successfully updated views'})
						}
						else{
							return res.json({status:400,message:'Error occured while updating views count'})
						}
					}
					else{
						return res.json({status:400,message:'Error occured while creating views in questionViews'})
					}
				}
			}
		}
		else{
			return res.json({status:400,message:'Question does not exist'})
		}
	}
	catch(err){
		// console.log(err)
		return res.json({status:500,message:'Error occured'})
	}
})
// end


exports.fetchQuestion = async(function(req,res,next){
	try{
		var questionId = req.params.id;
		const questionExist = await(questionUploadService.questionExist(questionId));
		if(questionExist){
			return res.json({status:200,message:'Success',result:questionExist});
		}
		else{
			return res.json({status:500,message:'Failure'});	
		}
	}
	catch(err){
		return res.json({status:500,message:'Error occured'})
	}
})

exports.trendingQuestion =async(function(req,res,next){
	try	{
		const allTrendingQuestion = await(questionUploadService.trendingAllQuestion())  
		// return res.json({allTrendingQuestion:allTrendingQuestion})
		if(allTrendingQuestion.length!=0){
			const checkRecommendquestion =await(questionUploadService.recommendedquestion(req.params.id))
			if(checkRecommendquestion.length!=0){
				var questionId = checkRecommendquestion.map(function(question){
									return ({_id:question.recommended});
								});
				const questionmatched = await(matchQuestionRecommended(allTrendingQuestion,questionId));
				if(questionmatched){
					res.json({ status: 200, message: 'Success', result:questionmatched});
				}
				else{
					console.log("error occured while mathching question")
				}
			}
			else{
				res.json({ status: 200, message: 'Success', result:allTrendingQuestion});
			}
		}
		else{
			const fetchAllTrendingQuestion = await(questionUploadService.trendingAllQuestiondoes())
			if(fetchAllTrendingQuestion.length!==0){
				const checkRecommendquestion =await(questionUploadService.recommendedquestion(req.params.id))
				if(checkRecommendquestion.length!=0){
					var questionId = checkRecommendquestion.map(function(question){
										return ({_id:question.recommended});
									});
					const questionmatched = await(matchQuestionRecommended(fetchAllTrendingQuestion,questionId));
					if(questionmatched){
						res.json({ status: 200, message: 'Success', result:questionmatched});
					}
					else{
						console.log("error occured while mathching question")
					}
				}
				else{
					res.json({ status: 200, message: 'Success', result:fetchAllTrendingQuestion});
				}
			}
			else{
				return res.json({status:500,message:'No trending question'});
			}
		}
	}
	catch(err){
		return res.json({status:500,message:'Error occured',err:err});
	}
})

exports.questionsSingle = async(function(req,res,next){
	try{
		var questionId = req.params.id;
		//console.log("questionId:",questionId);
		const checkQuestion = await(questionUploadService.checkquestionExist(questionId))
		//console.log("checkQuestion:",checkQuestion)
		if(checkQuestion){
			 return res.json({status:200,message:'Success',result:checkQuestion})
		}
		else{
			return res.json({status:500,message:'Question does not exists'})
		}
	}
	catch(err){
		return res.json({status:500,message:'Error occured',err:err})
	}
})

exports.recentQuestion = async(function(req,res){
	try{
		const recentQuestions = await(questionUploadService.questionRecent())
		if(recentQuestions){
			return res.json({status:200,message:'Success',result:recentQuestions})
		}
		else{
			return res.json({status:500,message:'No question to show'})
		}
	}
	catch(err){
		return res.json({status:500,message:'Error occure',err:err})
	}
})

function matchQuestionRecommended(resultquestion,questionrecommended){
	questionrecommended.forEach((item) => {
	  var matchedobj = resultquestion.find(({_id}) => ObjectID(item._id).equals(ObjectID(_id)));
	  if(matchedobj) {
	  	matchedobj.isrecommended= true;
	    // console.log("matchedobj",matchedobj)
	  }
	})
	// console.log("resultpaper",resultpaper)
	  return resultquestion;
}

function ckhematchQuestionRecommended(result,questId){
		questId.forEach((item) => {
	  var matchedobj = result.find(({_id}) => ObjectID(item._id).equals(ObjectID(_id)));
	  if(matchedobj) {
	  	matchedobj.isrecommended= true;
	    // console.log("matchedobj",matchedobj)
	  }
	})
	// console.log("resultpaper",resultpaper)
	  return result;
}

function matchrecommendedall(resultsall,allrecommeded){
	allrecommeded.forEach((item) => {
		var matchedobj = resultsall.find(({_id}) => ObjectID(item._id).equals(ObjectID(_id)));
		if(matchedobj) {
			 // console.log("my",matchedobj._id.isrecommended)
		  	 matchedobj.isrecommended= true;
		  }
	})
	  return resultsall;
}


//api to delete all userQuestion
exports.deleteAllQuestions = async(function(req,res,next){
	try{
		var userId = req.body.userId;
		const fetchAllQuestion = await(questionUploadService.fetchAllQuestionstodelete(userId))
		if(fetchAllQuestion.length!==0){
			const deleteAllQuestion= await(paperSourceService.deleteAllQuestions(fetchAllQuestion))
			return res.json({status:200,message:'all question deleted'})
		}
		else{
			return res.json({status:400,message:'There are no question for this user'})
		}
	}
	catch(err){
		// console.log("err",err)
		return res.json({status:500,message:'Error occured'})
	}
})
//end
