const PaperSource = require('../models/paperSourceUpload');
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const Paperupload = require('../models/paperUpload');
const paperUploadService = require('../services/paperUploadService');
const  questionUploadService= require('../services/questionUploadServices');

exports.clearSourceUrls=async(function(url, type){
	const paperSource = PaperSource.remove({});
	return paperSource;

});

exports.insertSourceUrl=async(function(url, type,name,image,website){
	const paperSource = new PaperSource;
	paperSource.url=url;
	paperSource.type='journal';
	paperSource.name=name;
	paperSource.image=image; 
	paperSource.website =website;
	paperSource.save();
	return paperSource; 
});

exports.getFeedSources=function(){  
	return PaperSource.find({'type': 'journal'}).lean();
};

// api to delete all papers
exports.deleteAllPapers = async(function(papers){
	var myArr=[];
	for(let paper of papers){
		const deletePaperInbookmarks = await(paperUploadService.deletePaperBookmarks(paper))
			if(deletePaperInbookmarks){
				const deletePaperRecommeded = await(paperUploadService.deletePaperrecommended(paper))
				if(deletePaperRecommeded){
					const deletePaperInviews = await(paperUploadService.deletePaperviews(paper))
					if(deletePaperInviews){
						const deletePaperinPapermonth = await(paperUploadService.deletePaperInPapermonthsnapshot(paper))
						if(deletePaperinPapermonth){
							const deletePaperInPaperUpload = await(paperUploadService.deletePaperInpapers(paper))
							if(deletePaperInPaperUpload){
								console.log("successfully deleted paper")
							}
							else{
								console.log("error occured while deleting paper in Paperuploads")
							}
						}
						else{
							console.log("error occured while deleting paper in Papers")
						}
					}
					else{
						console.log("error occured while deleting paper in views downloads")
					}
				}
				else{
					console.log("error occured while deleting paper in recommended")
				}
			}
			else{
				console.log("error occured while deleting paper in bookmarks")
			}	
	}
	return myArr;
})
//end

// api to delete all question
exports.deleteAllQuestions = async(function(questions){
	// console.log("question",questions)
	var myArr=[];
	for(let question of questions){
		const deleteQuestionRecommeded = await(questionUploadService.deleteQuestionrecommended(question))
		if(deleteQuestionRecommeded){
			const deleteQuestionNotification = await(questionUploadService.deleteQuestionNotified(question))
			if(deleteQuestionNotification){
				const deleteInQuestionViews = await(questionUploadService.deleteQuestionInviews(question))
				if(deleteInQuestionViews){
					const deleteInAnswer = await(questionUploadService.deleteQuestionInAnswer(question))
					if(deleteInAnswer){
						const deleteQuestion = await(questionUploadService.deleteQuestion(question))
						if(deleteQuestion){
							console.log("successfully deleted Question")
						}
						else{
							console.log("Error occured while deleting in question")
						}
					}
					else{
						console.log("Error occured while deleting question in answer")
					}
				}
				else{
					console.log("Error occured while deleting in Question Views")
				}
			}
			else{
				console.log("Error occured while deleting in notification")
			}
		}
		else{
			console.log("error occured while deleting paper in recommended")
		}	
	}
	return myArr;
})
// end