const Paperupload = require('../models/paperUpload');
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const speakeasy = require("speakeasy");
const paperUploadService = require('../services/paperUploadService');
const config = require('../config');
const fs = require('fs');
const ejs = require('ejs');
const mail = require('../services/mail');
const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();
const uploadFile = require('../middlewares/uploadFile'); 
// const uploadFiletoS3 = require('../middlewares/uploadFilesS3'); 
const User = require('../models/users');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const lodash = require('lodash');
const request = require('request');
const Recommend = require('../models/recommend');
const paperSourceService = require('../services/paperSourceService')
const Parser = require('rss-parser');
const moment = require('moment');
const feedService = require('../services/feedService')
const Bookmark = require('../models/bookmark');
const Follow = require('../models/follow');
const graphCronService = require('../services/graphCronService')
const _ = require('lodash');
const ObjectID = require('mongodb').ObjectID;
const gHI10IndexService = require('../services/g_h_i10Index');

// api for uploading papers
exports.uploadPapers= function(req,res,next){
	var imageUploaded = req.files.uploadpdf;
	var userId = req.body.userId;
	var paperMicrosoftId = req.body.paperUploadedId;
	User.find({_id:userId})
	.then((userfound) =>{
		if(imageUploaded != null || imageUploaded != undefined){
			if(typeof paperMicrosoftId !=='undefined' && typeof paperMicrosoftId !== ''){
				Paperupload.find({$and:[{userId:userId},{paperUploadedId:paperMicrosoftId}]})
					.then((paperAlreadyPresent)=>{
					if(paperAlreadyPresent.length!=0){
						return res.json({status:500,message:'Paper already Uploaded by user'});
					}
					else{
						let urlImage= null;
						uploadFile.uploadToS3(req.files.uploadpdf)
						.then((imageupload)=>{	
						//console.log("urlImage",urlImage);
						const {papertitle,paperabstract,username,paperType,doi,publicationVenue,publicationname,publicationdate,userId,citations,paperLink,paperUploadedId} = req.body;
						var uploadpdfFile = imageupload;
						const paperUploads = new Paperupload;
						paperUploads.papertitle = papertitle;
						paperUploads.paperabstract = paperabstract;
						paperUploads.username = username;
						paperUploads.tags = req.body.tags.split(",");
						paperUploads.coauthors = req.body.coauthors.split(","); 
						paperUploads.publicationname=publicationname;
						paperUploads.publicationdate = publicationdate;
						paperUploads.paperType = paperType;
						paperUploads.paperLink = paperLink;
						paperUploads.paperUploadedId=paperUploadedId;
						paperUploads.doi = doi; 
						paperUploads.uploadBy = 'user'; 
						paperUploads.downloadPapers = 0;
						paperUploads.views= 0; 
						paperUploads.publicationVenue = publicationVenue; 
						paperUploads.userId = userId;
						paperUploads.uploadpdf = uploadpdfFile;
						paperUploads.citations = citations;
						paperUploads.save()
						.then((papersaved) =>{
							let data = {
								$push:{paper:papersaved}
							}
							 User.update({_id:userId},data)
							 .then((resp) => {
							 	res.json({status:200,message:'Paper uploaded successfully'})
								graphCronService.calculateCitations(papersaved,userfound[0].graph)
							 })
							 .catch(err =>{
							 	// console.log(err)
							 	return res.json({status:500,message:'Error occured'})
							 })
						})
						.catch(err =>{
							// console.log(err)
							return res.json({status:500,message:'Error occured while uploading papers',err:err});
						})

						})
						.catch(err =>{
							// console.log(err)
							return res.json({status:500,message:'Error occured while uploading pdf'});
						})
					}
				})
				.catch(err=>{
					// console.log(err)
					return res.json({status:500,message:'Error occured while fetching Papers'});
				})
			}
			else{
				let urlImage= null;
				uploadFile.uploadToS3(req.files.uploadpdf)
				.then((imageupload)=>{	
				//console.log("urlImage",urlImage);
				const {papertitle,paperabstract,username,paperType,doi,publicationVenue,publicationname,publicationdate,userId,citations,paperLink} = req.body;
				var uploadpdfFile = imageupload;
				const paperUploads = new Paperupload;
				paperUploads.papertitle = papertitle;
				paperUploads.paperabstract = paperabstract;
				paperUploads.username = username;
				paperUploads.tags = req.body.tags.split(",");
				paperUploads.coauthors = req.body.coauthors.split(","); 
				paperUploads.publicationname=publicationname;
				paperUploads.publicationdate = publicationdate;
				paperUploads.paperType = paperType;
				paperUploads.paperLink = paperLink;
				paperUploads.doi = doi; 
				paperUploads.uploadBy = 'user'; 
				paperUploads.downloadPapers = 0;
				paperUploads.views= 0; 
				paperUploads.publicationVenue = publicationVenue; 
				paperUploads.userId = userId;
				paperUploads.uploadpdf = uploadpdfFile;
				paperUploads.citations = citations;
				paperUploads.save()
				.then((papersaved) =>{
					//console.log("userId:",userId)
					let data = {
						$push:{paper:papersaved}
					}
					 User.update({_id:userId},data)
					 .then((resp) => {
					 	res.json({status:200,message:'Paper uploaded successfully'})
						graphCronService.calculateCitations(papersaved,userfound[0].graph)
					 })
					 .catch(err =>{
					 	// console.log(err)
					 	return res.json({status:500,message:'Error occured'})
					 })
				})
				.catch(err =>{
					// console.log(err)
					return res.json({status:500,message:'Error occured while uploading papers',err:err});
				})

				})
				.catch(err =>{
					// console.log(err)
					return res.json({status:500,message:'Error occured while uploading pdf'});
				})
			}			
		}	 
		else{
			if(typeof paperMicrosoftId !=='undefined' && typeof paperMicrosoftId !== ''){

				Paperupload.find({$and:[{userId:userId},{paperUploadedId:paperMicrosoftId}]})
				.then((paperAlreadyPresent)=>{
					if(paperAlreadyPresent.length!=0){
						return res.json({status:500,message:'Paper already Uploaded by user'});
					}
					else{
						 
						const {papertitle,paperabstract,username,paperType,paperLink,doi,publicationVenue,publicationname,publicationdate,userId,paperUploadedId,citations} = req.body;
						// console.log("coauthors",req.body.coauthors)
						const paperUploads = new Paperupload;
						paperUploads.papertitle = papertitle;
						paperUploads.paperabstract = paperabstract;
						paperUploads.username = username;
						paperUploads.tags = req.body.tags.split(",");
						paperUploads.coauthors = req.body.coauthors.split(","); 
						paperUploads.publicationname=publicationname;
						paperUploads.publicationdate = publicationdate;
						paperUploads.paperType = paperType;
						paperUploads.doi = doi; 
						paperUploads.paperLink = paperLink;
						paperUploads.paperUploadedId=paperUploadedId;
						paperUploads.uploadBy = 'user'; 
						paperUploads.downloadPapers = 0;
						paperUploads.views= 0; 
						paperUploads.citations = citations;
						paperUploads.publicationVenue = publicationVenue; 
						paperUploads.userId = userId;
						paperUploads.save()
						.then((papersaved) =>{
							let data = {
								$push:{paper:papersaved}
							}
							 User.update({_id:userId},data)
							 .then((resp) => {
							 	 res.json({status:200,message:'Paper uploaded successfully'})
							 	 graphCronService.calculateCitations(papersaved,userfound[0].graph)
							 })
							 .catch(err =>{
							 	// console.log(err)
							 	return res.json({status:500,message:'Error occured'})
							 })
						})
						.catch(err =>{
							// console.log(err)
							return res.json({status:500,message:'Error occured while uploading papers'});
						})
					}
				})
				.catch(err=>{
					// console.log(err)
					return res.json({status:500,message:'Error occured while fetching Papers'});
				})
			}
			else{
						const {papertitle,paperabstract,paperType,doi,publicationVenue,publicationname,publicationdate,userId,citations} = req.body;
						// console.log("coauthors",req.body.coauthors)
						const paperUploads = new Paperupload;
						paperUploads.papertitle = papertitle;
						paperUploads.paperabstract = paperabstract;
						paperUploads.tags = req.body.tags.split(",");
						paperUploads.coauthors = req.body.coauthors.split(","); 
						paperUploads.publicationname=publicationname;
						paperUploads.publicationdate = publicationdate;
						paperUploads.paperType = paperType;
						paperUploads.doi = doi; 
						paperUploads.uploadBy = 'user'; 
						paperUploads.downloadPapers = 0;
						paperUploads.views= 0; 
						paperUploads.citations = citations;
						paperUploads.publicationVenue = publicationVenue; 
						paperUploads.userId = userId;
						paperUploads.save()
						.then((papersaved) =>{
							let data = {
								$push:{paper:papersaved}
							}
							 User.update({_id:userId},data)
							 .then((resp) => {
							 	 res.json({status:200,message:'Paper uploaded successfully'})
							 	 graphCronService.calculateCitations(papersaved,userfound[0].graph)
							 })
							 .catch(err =>{
							 	// console.log(err)
							 	return res.json({status:500,message:'Error occured'})
							 })
						})
						.catch(err =>{
							// console.log(err)
							return res.json({status:500,message:'Error occured while uploading papers'});
						})
			}
			
		}
	})
	.catch(err =>{
		// console.log("err",err)
		return res.json({status:500,message:'User not found'});
	})
}
//end

// api to remove duplicate topics
exports.removeTopicsDuplicate = async(function(req,res,next){
	try{
		var userId = req.body.userId;
		const fetchUser = await(paperUploadService.checkUseralready(userId))
		if(fetchUser){
			const removeDuplicates = await(paperUploadService.removeDuplicates(fetchUser.topics))
			// return res.json({removeDuplicates:removeDuplicates,topics:fetchUser.topics})
			if(removeDuplicates){
				const removeUsertopics = await(paperUploadService.removeTopics(userId))
				if(removeUsertopics){
					const updateTopics = await(paperUploadService.updateTopics(userId,removeDuplicates))
					if(updateTopics){
						return res.json({status:200,message:'Success'})
					}
					else{
						console.log("error occured while deleting topics")
					}
				}
				else{
					console.log("error occured while deleting topics in user")
				}
			}
			else{
				// console.log("no duplicates exists")
				return res.json({status:400,message:'No duplicates exist'})
			}
		}
		else{
			return res.json({status:400,message:"error occured while fetching user"})
		}
	}
	catch(err){
		// console.log("err",err)
		return res.json({status:500,message:'Error occured'})
	}
})
// end

//api for editing papers
exports.editPapers = function(req,res,next){
	var paperId = req.body.paperId;
	var tags = req.body.tags.split(",");
	var userId = req.body.userId;
	var imageUploaded = req.files.uploadpdf;

	if(imageUploaded != null || imageUploaded != undefined){
		let urlImage= null;
		uploadFile.uploadToS3(req.files.uploadpdf)
		.then((resp) => {
			urlImage = resp
			var uploadpdfFile = urlImage;
			Paperupload.find({_id:paperId})
			.then((resp) => {
				Paperupload.update({_id:paperId},{$set:{papertitle:req.body.papertitle,paperabstract:req.body.paperabstract,username:req.body.username,tags:tags,paperType:req.body.paperType,doi:req.body.doi,publicationVenue:req.body.publicationVenue,publicationname:req.body.publicationname,publicationdate:req.body.publicationdate,coauthors:req.body.coauthors,uploadpdf:uploadpdfFile}})
				.then((resp) => {
					return res.json({status:200,message:"Updated successfully"});
				})
				.catch(err =>{
					return res.json({status:500,message:"Error occured while updating papers"})
				})
			})
			.catch(err =>{
				return res.json({status:500,Message:'Uploaded paper does not exist'})
			})

		})
		.catch(err => {
			return res.json({status:500,message:"Error occured while uploading image"});
		})
	}
	else{
		Paperupload.find({_id:paperId})
			.then((resp) => {
				Paperupload.update({_id:paperId},{$set:{papertitle:req.body.papertitle,paperabstract:req.body.paperabstract,username:req.body.username,tags:tags,paperType:req.body.paperType,doi:req.body.doi,publicationVenue:req.body.publicationVenue,publicationname:req.body.publicationname,publicationdate:req.body.publicationdate,coauthors:req.body.coauthors}})
				.then((resp) => {
					return res.json({status:200,message:"Updated successfully"});
				})
				.catch(err =>{
					return res.json({status:500,message:"Error occured while updating papers"})
				})
			})
		.catch(err =>{
			return res.json({status:500,Message:'Uploaded paper does not exist'})
		})
	}
}
//end
	
// api to delete paper
exports.deletePaper = async(function(req,res,next){
	var paperId = req.body.paperId;
	try{
		const paperExist = await(paperUploadService.paperExists(paperId))
		if(paperExist){
			const deletePaper = await(paperUploadService.deletePaper(paperExist._id))
			if(deletePaper){
				// return res.json({status:200,message:'Success'});
				const deleteUserPaper = await(paperUploadService.userPaperDelete(paperExist.userId._id,paperExist._id))
				if(deleteUserPaper){
					const deletePaperInBookmark = await(paperUploadService.deletePaperInBookmark(paperExist._id))
					if(deletePaperInBookmark){
						const deletePaperInRecommend = await(paperUploadService.deletePaperInRecommend(paperExist._id))
						if(deletePaperInRecommend){
							const deleteIpaperMainSnapshot = await(paperUploadService.deletePaperInPaperMain(paperExist._id))
							if(deleteIpaperMainSnapshot){
								res.json({status:200,message:'Success'});
								const deleteUserPaperInGraph = await(graphCronService.deletePaperInGraph(paperExist._id,paperExist.userId.graph,paperExist.downloadPapers,paperExist.views,paperExist.citations,paperExist.createdAt))
							}
							else{
								console.log("Error occured while deleting in mainSnapshots")
							}
						}
						else{
							console.log("error occured while deleting paper in Recommends")
						}
					}
					else{
						console.log("error Occured while deleting paper in bookmarks")
					}
				}
				else{
					return res.json({status:500,message:'Unable to delete user paper'});
				}
			}
			else{
				return res.json({status:500,message:'Unable to delete paper'});
			}
		}
		else{
			return res.json({status:500,message:'Paper does not exist'});
		}
	}
	catch(err){
		// console.log("err",err)
		return res.json({status:500,message:'Error occured'})
	}
})
// end

exports.deletePaper1 = async(function(req,res,next){
	var paperId = req.body.paperId;	
	try{
		const paperExist = await(paperUploadService.paperExists(paperId))
		if(paperExist){
			const deletePaper = await(paperUploadService.deletePaper(paperExist._id))
			if(deletePaper){
				// return res.json({status:200,message:'Success'});
				const deleteUserPaper = await(paperUploadService.userPaperDelete(paperExist.userId._id,paperExist._id))
				if(deleteUserPaper){
					const deletePaperInBookmark = await(paperUploadService.deletePaperInBookmark(paperExist._id))
					if(deletePaperInBookmark){
						const deletePaperInRecommend = await(paperUploadService.deletePaperInRecommend(paperExist._id))
						if(deletePaperInRecommend){
							// const deleteIpaperMainSnapshot = await(paperUploadService.deletePaperInPaperMain(paperExist._id))
								res.json({status:200,message:'Success'});
								const deleteUserPaperInGraph = await(graphCronService.deletePaperInGraph1(paperExist._id,paperExist.userId.graph,paperExist.downloadPapers,paperExist.views,paperExist.citations,paperExist.createdAt))

						}
						else{
							console.log("error occured while deleting paper in Recommends")
						}
					}
					else{
						console.log("error Occured while deleting paper in bookmarks")
					}
				}
				else{
					return res.json({status:500,message:'Unable to delete user paper'});
				}
			}
			else{
				return res.json({status:500,message:'Unable to delete paper'});
			}
		}
		else{
			return res.json({status:500,message:'Paper does not exist'});
		}
	}
	catch(err){
		// console.log("err",err)
		return res.json({status:500,message:'Error occured'})
	}
})

exports.fetchPaper = async(function(req,res,next){
	var paperId = req.body.paperId;
	var userId = req.body.userId;
	try{
		const paperExists = await(paperUploadService.paperdetials(paperId));
		if(paperExists){
			const checkRecommendPapers =await(paperUploadService.recommendedpapers(userId));
			if(checkRecommendPapers){
				var paperrecomId = checkRecommendPapers.map(function(papers){
					return ({_id:papers.recommended});
				})
				 const matchRecommendeddata = await(matchPaperRecommended(paperExists,paperrecomId));
				const checkbookmarkedPapers =await(paperUploadService.bookmarkedpapers(userId));
				if(checkbookmarkedPapers){
					// console.log("checkbookmarkedPapers",checkbookmarkedPapers)
					var bookmarkedId = checkbookmarkedPapers.map(function(papers){
						return ({_id:papers.paperId});
					})
					 const matchbookmarkeddata =await(matchpaperBookmarked(matchRecommendeddata,bookmarkedId))
					 if(matchbookmarkeddata){
					 	return res.json({status:200,message:'Success',result:matchbookmarkeddata})
					 }
					 else{
					 	console.log("error occured while bookmarked matching")
					 }
				}
				else{
					return res.json({status:200,message:'Success',result:matchRecommendeddata})
				}
			}
			else{
				const checkbookmarkedPapers =await(paperUploadService.bookmarkedpapers(userId));
				if(checkbookmarkedPapers){
					// console.log("checkbookmarkedPapers",checkbookmarkedPapers)
					var bookmarkedId = checkbookmarkedPapers.map(function(papers){
						return ({_id:papers.paperId});
					})
					 const matchbookmarkeddata =await(matchpaperBookmarked(paperExists,bookmarkedId))
					 if(matchbookmarkeddata){	
					 	return res.json({status:200,message:'Success',result:matchbookmarkeddata})
					 }
					 else{
					 	console.log("error occured while bookmarked matching")
					 }
				}
				else{
					return res.json({status:200,message:'Success',result:paperExists})
				}
			}
			// return res.json({status:200,message:'Success',result:paperExists});
		}
		else{
			return res.json({status:500,message:'Failure'});
		}
	}	
	catch(err){
		return	res.json({status:500,message:'Error occured',err:err});
	}
})

//api for userUploaded papers
exports.userUploadedPapers = async(function(req,res,next){
	try{
		var userId = req.body.profileuserId;
		var page = req.body.page;
		var profileuserId = req.body.loggeduserId;
		var pagesize= req.body.pagesize; 
		// console.log("userId",userId); 
		const checkuserExists = await(paperUploadService.fetchUser(userId));
		if(checkuserExists.length!=0){
			// var graphId = checkuserExists.graph;
			// console.log("graphId",graphId)
			const paperuploaded = await(paperUploadService.useruploadPapers(userId,page,pagesize));
			// return res.json({paperuploaded})
		 	// console.log("paperuploaded",paperuploaded)
			if(paperuploaded.length!=0){
			 	const checkUserRecommended = await(paperUploadService.recommendedpapers(profileuserId))
			 	// console.log("checkUserRecommended",checkUserRecommended)
			 	if(checkUserRecommended.length!=0){
			 		var paperIds = checkUserRecommended.map(function(papers){
			 			return ({_id:papers.recommended});
			 		})	
			 		// console.log("paperId",paperIds)
			 		var matchRecommended = await(matchPaperRecommended(paperuploaded,paperIds))
			 		const checkUserBookmarks = await(paperUploadService.bookmarkedpapers(userId))
			 		if(checkUserBookmarks.length!=0){
			 			// console.log("checkUserBookmarks",checkUserBookmarks)
			 			var bookmarkedId = checkUserBookmarks.map(function(papers){
			 				return ({_id:papers.paperId});
			 			})
			 			var matchedBookmarked = await(matchpaperBookmarked(matchRecommended,bookmarkedId))
			 			return res.json({status:200,message:'Success',result:matchedBookmarked})
			 		}
			 		else{
			 			return res.json({status:200,message:'Success',result:matchRecommended})
			 		}
			 	}
			 	else{
			 		return res.json({status:200,message:'Success',result:paperuploaded});
			 	}
			}
			else{
				return res.json({status:500,message:'No papers uploaded yet'})
			}
		}
		else{
			return res.json({status:500,message:'user does not exist'})
		}
	}
	catch(err){
		return res.json({status:500,message:'Error occured'})
	}
})
// end

// oldviewcount
exports.viewCount = async(function(req,res,next){
	try{
		var paperId = req.body.paperId;
		//console.log("paperId",paperId); 
		const paperExists = await(paperUploadService.paperExists(paperId))
		 if(paperExists){
		 	var viewsCount = paperExists.views;
		 	// console.log("viewsCount",viewsCount);
		 	const incrementCount = await(paperUploadService.incrementViews(paperId,viewsCount));
		 	if(incrementCount){
		 		return res.json({status:200,message:'Success'});
		 	}
		 	else{
		 		return res.json({status:500,message:'Failure'});
		 	}
		}
		else{
			return res.json({status:500,message:'Paper does not exist'})
		}
	}
	catch(err){
		return res.json({status:500,message:'Error occured'})
	}
})
// end

exports.dowloadsCount = async(function(req,res,next){
	try{
		var paperId = req.body.paperId;
		//console.log("paperId",paperId); 
		const paperExists = await(paperUploadService.paperExists(paperId));
		 if(paperExists){
		 	var dowloadsCount = paperExists.downloadPapers;
		 	const incrementDownloads = await(paperUploadService.incrementDownloads(paperId,dowloadsCount));
		 	if(incrementDownloads){
		 		return res.json({status:200,message:'Success'});
		 	}
		 	else{
		 		return res.json({status:500,message:'Failure'});
		 	}
		}
		else{
			return res.json({status:500,message:'Paper does not exist'})
		}
	}
	catch(err){
		return res.json({status:500,message:'Error occured'})
	}
})

//api for trending paper
exports.trendingPapers = async(function(req,res,next){
	try{
		var userId = req.body.userId;
		// console.log("userId",userId)
		const userExists = await(paperUploadService.fetchUser(userId));
		if(userExists){
			// var newpapers = [];
			const fetchPapers = await(paperUploadService.trendingPapers());
			if(fetchPapers){
				const checkRecommendPapers =await(paperUploadService.recommendedpapers(userId));
				if(checkRecommendPapers){
					var paperId = checkRecommendPapers.map(function(papers){
						return ({_id:papers.recommended});
					})
					// console.log("paperId",paperId)
					const matchRecommendeddata = await(matchPaperRecommended(fetchPapers,paperId));
					const checkbookmarkedPapers =await(paperUploadService.bookmarkedpapers(userId));
					if(checkbookmarkedPapers){
						// console.log("checkbookmarkedPapers",checkbookmarkedPapers)
						var bookmarkedId = checkbookmarkedPapers.map(function(papers){
							return ({_id:papers.paperId});
						})
						 const matchbookmarkeddata =await(matchpaperBookmarked(matchRecommendeddata,bookmarkedId))
						 if(matchbookmarkeddata){
						 	// var finalpapersResults = matchbookmarkeddata.splice(0,3);
						 	return res.json({status:200,message:'Success',result:matchbookmarkeddata})
						 }
						 else{
						 	console.log("error occured while bookmarked matching")
						 }
					}
					else{
						var finalpapersResults = matchRecommendeddata.splice(0,3);
						return res.json({status:200,message:'Success',result:finalpapersResults})
					}
				}
				else{
					const checkbookmarkedPapers =await(paperUploadService.bookmarkedpapers(userId));
					if(checkbookmarkedPapers){
						// console.log("checkbookmarkedPapers",checkbookmarkedPapers)
						var bookmarkedId = checkbookmarkedPapers.map(function(papers){
							return ({_id:papers.paperId});
						})
						 const matchbookmarkeddata =await(matchpaperBookmarked(fetchPapers,bookmarkedId))
						 if(matchbookmarkeddata){
						 	// var finalpapersResults = matchbookmarkeddata.splice(0,3);
						 	return res.json({status:200,message:'Success',result:matchbookmarkeddata})
						 }
						 else{
						 	console.log("error occured while bookmarked matching")
						 }
					}
					else{
						// var finalpapersResults = sortPapers.splice(0,3);
						return res.json({status:200,message:'Success',result:fetchPapers})
					}
				}					
			}
			else{
				const fetchPapersall = await(paperUploadService.trendingAllPaper())
				if(fetchPapersall.length!==0){
					const checkRecommendPapers =await(paperUploadService.recommendedpapers(userId));
					if(checkRecommendPapers){
						var paperId = checkRecommendPapers.map(function(papers){
							return ({_id:papers.recommended});
						})
						// console.log("paperId",paperId)
						const matchRecommendeddata = await(matchPaperRecommended(fetchPapersall,paperId));
						const checkbookmarkedPapers =await(paperUploadService.bookmarkedpapers(userId));
						if(checkbookmarkedPapers){
							// console.log("checkbookmarkedPapers",checkbookmarkedPapers)
							var bookmarkedId = checkbookmarkedPapers.map(function(papers){
								return ({_id:papers.paperId});
							})
							 const matchbookmarkeddata =await(matchpaperBookmarked(matchRecommendeddata,bookmarkedId))
							 if(matchbookmarkeddata){
							 	// var finalpapersResults = matchbookmarkeddata.splice(0,3);
							 	return res.json({status:200,message:'Success',result:matchbookmarkeddata})
							 }
							 else{
							 	console.log("error occured while bookmarked matching")
							 }
						}
						else{
							var finalpapersResults = matchRecommendeddata.splice(0,3);
							return res.json({status:200,message:'Success',result:finalpapersResults})
						}
					}
					else{
						const checkbookmarkedPapers =await(paperUploadService.bookmarkedpapers(userId));
						if(checkbookmarkedPapers){
							// console.log("checkbookmarkedPapers",checkbookmarkedPapers)
							var bookmarkedId = checkbookmarkedPapers.map(function(papers){
								return ({_id:papers.paperId});
							})
							 const matchbookmarkeddata =await(matchpaperBookmarked(fetchPapersall,bookmarkedId))
							 if(matchbookmarkeddata){
							 	// var finalpapersResults = matchbookmarkeddata.splice(0,3);
							 	return res.json({status:200,message:'Success',result:matchbookmarkeddata})
							 }
							 else{
							 	console.log("error occured while bookmarked matching")
							 }
						}
						else{
							// var finalpapersResults = sortPapers.splice(0,3);
							return res.json({status:200,message:'Success',result:fetchPapersall})
						}
					}
				}
				else{
					return res.json({status:500,message:'Paper does not exist'})
				}
			}
		}
		else{
			return res.json({status:500,message:'User does not exist'})
		}
	
	}
	catch(err){
		// console.log("err",err)
		return res.json({status:500,message:'Error occured',err:err});
	}	
})
//end

// needs to be delete
exports.papers = async(function(req,res,next){
	try{
		var userId = req.body.userId;
		var page = req.body.page;
		var pageSize = req.body.pageSize;
		const userExists = await(paperUploadService.fetchUser(userId));
		if(userExists){
			// var newpapers = [];
			const fetchFollowed = await(paperUploadService.fetchFollowed(userId));
			if(fetchFollowed){	
				var followedUsers = fetchFollowed.map(function(follow){
					return follow.following;
				})		
				const fetchPapersByfollowed = await(paperUploadService.fetchFollowedpapers(followedUsers,page,pageSize))
				if(fetchPapersByfollowed){	
					// const sortPapers = await(paperUploadService.sortPaper(fetchPapersByfollowed));
					const checkRecommendPapers =await(paperUploadService.recommendedpapers(userId));
					if(checkRecommendPapers){
						var paperId = checkRecommendPapers.map(function(papers){
							return ({_id:papers.recommended});
						})
						// console.log("paperId",paperId)
						const matchRecommendeddata = await(matchPaperRecommended(fetchPapersByfollowed,paperId));
						const checkbookmarkedPapers =await(paperUploadService.bookmarkedpapers(userId));
						if(checkbookmarkedPapers){
							// console.log("checkbookmarkedPapers",checkbookmarkedPapers)
							var bookmarkedId = checkbookmarkedPapers.map(function(papers){
								return ({_id:papers.paperId});
							})
							 const matchbookmarkeddata =await(matchpaperBookmarked(matchRecommendeddata,bookmarkedId))
							 if(matchbookmarkeddata){
							 	return res.json({status:200,message:'Success',result:matchbookmarkeddata})
							 }
							 else{
							 	console.log("error occured while bookmarked matching")
							 }
						}
						else{
							return res.json({status:200,message:'Success',result:matchRecommendeddata})
						}
					}
					else{
						const checkbookmarkedPapers =await(paperUploadService.bookmarkedpapers(userId));
						if(checkbookmarkedPapers){
							// console.log("checkbookmarkedPapers",checkbookmarkedPapers)
							var bookmarkedId = checkbookmarkedPapers.map(function(papers){
								return ({_id:papers.paperId});
							})
							 const matchbookmarkeddata =await(matchpaperBookmarked(fetchPapersByfollowed,bookmarkedId))
							 if(matchbookmarkeddata){	
							 	return res.json({status:200,message:'Success',result:matchbookmarkeddata})
							 }
							 else{
							 	console.log("error occured while bookmarked matching")
							 }
						}
						else{
							return res.json({status:200,message:'Success',result:fetchPapersByfollowed})
						}
					}		
				}
				else{
					return res.json({status:500,message:'Admired user have not uploaded papers',});
				}
			}
			else{
				return res.json({status:500,message:'User have not admired anyone'})
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
//delete

exports.relatedPapers =async(function(req,res,next){
	try{
		var paperId = req.body.paperId;
		var userId = req.body.userId;
		const paperExists = await(paperUploadService.paperExists(paperId))
		if(paperExists){
			const fetchPaperBytags = await(paperUploadService.papersByTags(paperExists.tags,paperExists._id))
			// console.log("fetchPaperBytags:",fetchPaperBytags)
				if(fetchPaperBytags){
					const checkRecommendPapers =await(paperUploadService.recommendedpapers(userId));
					if(checkRecommendPapers){
						var paperId = checkRecommendPapers.map(function(papers){
									return ({_id:papers.recommended});
								})
						const matchRecommendeddata = await(matchPaperRecommended(fetchPaperBytags,paperId));
						const checkbookmarkedPapers =await(paperUploadService.bookmarkedpapers(userId));
						if(checkbookmarkedPapers){
							// console.log("checkbookmarkedPapers",checkbookmarkedPapers)
							var bookmarkedId = checkbookmarkedPapers.map(function(papers){
								return ({_id:papers.paperId});
							})
							 const matchbookmarkeddata =await(matchpaperBookmarked(matchRecommendeddata,bookmarkedId))
							 if(matchbookmarkeddata){
							 	return res.json({status:200,message:'Success',result:matchbookmarkeddata})
							 }
							 else{
							 	console.log("error occured while bookmarked matching")
							 }
						}
						else{
							return res.json({status:200,message:'Success',result:matchRecommendeddata})
						} 
					}
					else{
						const checkbookmarkedPapers =await(paperUploadService.bookmarkedpapers(userId));
						if(checkbookmarkedPapers){
							// console.log("checkbookmarkedPapers",checkbookmarkedPapers)
							var bookmarkedId = checkbookmarkedPapers.map(function(papers){
								return ({_id:papers.paperId});
							})
							 const matchbookmarkeddata =await(matchpaperBookmarked(fetchPaperBytags,bookmarkedId))
							 if(matchbookmarkeddata){	
							 	return res.json({status:200,message:'Success',result:matchbookmarkeddata})
							 }
							 else{
							 	console.log("error occured while bookmarked matching")
							 }
						}
						else{
							return res.json({status:200,message:'Success',result:fetchPaperBytags})
						}
					}
				}
				else{
					return res.json({status:500,message:'No topics with same tags'})
				}
		}
		else{
			return res.json({status:500,message:'Paper does not exist'})
		}
	}
	catch(err){
		return res.json({status:500,message:'Error occured',err:err})
	}
})

exports.fetchPdf = async(function(req,res,next){
	try{
			var paperId =req.params.id;
			const pdfDetails = await(paperUploadService.paperExists(paperId))
			if(pdfDetails){
			
				return res.json({status:200,message:'Success',url:pdfDetails.uploadpdf});
			}
			else{
				return res.json({status:500,message:'Paper does not exists'})
			}
	}
	catch(err){
		return res.json({status:500,message:'Error occured',err:err})
	}
})

exports.recentPaper = async(function(req,res){
	try{
		const recentPapers = await(paperUploadService.paperRecent())
		if(recentPapers){
			return res.json({status:200,message:'Success',result:recentPapers})
		}
		else{
			return res.json({status:500,message:'No Papers to show'})
		}
	}
	catch(err){
		return res.json({status:500,message:'Error occure',err:err})
	}
})

function matchPaperRecommended(resultpaper,paperrecommended){
	paperrecommended.forEach((item) => {
	  var matchedobj = resultpaper.find(({_id}) => ObjectID(item._id).equals(ObjectID(_id)));
	  if(matchedobj) {
	  	matchedobj.isrecommended= true;
	  }
	})
	  return resultpaper;
}

function matchpaperBookmarked(paperbookmarked,paerId){
	paerId.forEach((item) => {
		  var array1Obj = paperbookmarked.find(({_id}) => ObjectID(item._id).equals(ObjectID(_id)));
		  if(array1Obj) {
		    array1Obj.isbookmarked = true;
		  }
	})
	 return paperbookmarked;
}

exports.paperCron = async(function(req,res){
	try{
		const fetchallpapers = await(paperUploadService.fetchallPapers())
		var i=0;
		res.json({status:200});
		for(let papers of fetchallpapers){
			const fetchDoi = await(paperUploadService.fetchDoi(papers))
			i++;
			// console.log(i);
			if(fetchDoi){
				const updatePapers =await(paperUploadService.updatePapersCiataions(fetchDoi))
			}
		}
		console.log("========= generating paper citations completed =======");
	}
	catch(err){
		// console.log(err)
		return res.json({status:500,message:'Error occured',err:err})
	}
})


// api to fetch papers from rsss
exports.generatePaper=async (function(req,res){	
	res.json({status:200});
	let parser = new Parser({
	  customFields: {
			    item: ['media:thumbnail', 'media:content', 'description','date','Author','title','creator','identifier','publicationName','authors','pubDate','author']
	  }
	});

	let link = '';
	let title = '';
	let content = '';
	let contentSnippet = '';
	let categories = '';
	let media = '';
 	let pubDate =''
 	let Author= '';
	const paperSourceUrls = await(paperSourceService.getFeedSources());
	await(paperSourceUrls.forEach(singlePaper => {	
		link = '';
		title = '';
		content = '';
		contentSnippet = '';
		pubDate= '';
		Author ='';
		categories = '';
		media = '';
		try{				
			await(parser.parseURL(singlePaper.url, function(err, paper) {
				if( typeof paper !== 'undefined'){
					paper.items.forEach(item => {
						if (typeof item.link !== 'undefined') {
							link = item.link;
							// console.log("link",link)
						}
						if (typeof item.title !== 'undefined') {
							title = item.title;
							// console.log("title",title)
						}
						//content start 
						if (typeof item.description !== 'undefined') {
							content = item.description;
						}
						if (typeof item.pubDate !== 'undefined') {
							pubDate = item.pubDate;
						}
						if (typeof item.Author !== 'undefined'|| typeof item.authors !== 'undefined' ||typeof item.author !== 'undefined') {
							if(typeof item.authors !== 'undefined'){
								Author = item.authors;
							}
							else if(typeof item.author !== 'undefined'){
								Author = item.author;
							}
							else{
								Author = item.Author;
							}
							// console.log("Author",Author)
						}	
						paperUploadService.insertPaper(title, link, content,Author,pubDate,singlePaper);				
					});			
				}
			}));
		
		}catch(error){
			console.log(error);
		}		
	}));
	// console.log("completed fetching rss")
});
// end

//api to fetch tags of paper
exports.generateTags = async(function(req,res){ 
	try{
		 res.json({status:200});
		 const today = moment(new Date()).format('YYYY-MM-DD');
		const alltopics = await(paperUploadService.getAlltopicsForPapers());
		const PapersToday = await(paperUploadService.getPapersByDate(today));
		let paperTopics=[];
		var i=0;
		for(let paper of PapersToday){
			paperTopics = [];
			for(let topic of alltopics){
				const papers = await(paperUploadService.searchTopicInPaper(paper, topic));	
				if(papers == true){
					if(!lodash.find(paperTopics, {topic_name: topic.topic_name})){
						paperTopics.push(topic);
					}
				}
			}
			i++;
			// console.log(i);
			if(paperTopics){
				 // await(wait(500));
				const updatePaper = await(paperUploadService.addTopicsToPapers(paper._id, paperTopics));
			}
		}
		console.log("========= generating topics completed =======");
	}
	catch(err){
		// console.log("err",err)
		return res.json({status:500,message:'Error occured',err:err})
	}
})
// end


// api to fetchRSS papers
exports.paperRss = function(req,res,next){
	var userId = req.body.userId;
	var from = req.body.page;
	var size = req.body.pageSize;
	if(from<=0){
		User.find({_id:userId}).populate('topics')
		.then((userFound)=>{
				var topicsname =[];
				var userDet = userFound.map(function(userObj){
					userObj.topics.map(function(topicocj){
						topicsname.push(topicocj.topic_name);
					})
				})
				// console.log("topicsname:",topicsname);
				var topi= topicsname.map(v => v.toLowerCase());
				  // console.log("topi",topi)
				 Follow.find({userId:userId})
				.then((followers)=>{
					if(followers.length!=0){
						// console.log("topi",topi)
						var followersId = [];
						var followersDetail = followers.map(function(followers){
							return followers.following
						})
						Paperupload.esSearch({ 
							    
									    query:{
									    	bool:{
												"must": {
									                "bool" : { "should": [{terms : {"userId._id": followersDetail}},{terms : {"topics.topic_name": topi}}] }
									            }
									    	}
									    },		    
									    sort:{
									    	"createdAt":{
									    		"order" : "desc"
									    	}
									    }   
							},
							{
								from:from,
							    size:size,
							},
							function(err, results) {
								if(err){
									// console.log("err",err)
									return res.json({status:500,message:'Error occured while fetching papers',err:err})
								}
								else{
									//search results came in resultFound
								 var resultFound = results.hits.hits;
								 var finalResults = papersSimplified(resultFound);
									// console.log("resultFound",resultFound.length)
									 if(finalResults!=0){
									 	//checking user recommnded any feeds
									 	// console.log("userIfd",userId)
									 	Recommend.find({$and:[{userId:userId},{recommendType:'paperupload'}]})
									 	.then((papersFound)=>{
									 		// console.log("papersFound,",papersFound)
									 		//if feeds are there then changed isrecommnded:true and also checked for bookmarked any feed
									 		// if done then used converted finalRecommended(isrecommnded:true) and passed it to bookmark 
									 		// then isbookmarked:true new list is produced with both (isrecommnded:true,isbookmarked:true)
									 		if(papersFound.length!=0){
										 		var resultfeedsId =  papersFound.map(function(paper){
												return ({_id:paper.recommended})
												})	

												// console.log("resultfeedsId",resultfeedsId)
												var finalRecommended = 	recommendedchecking(finalResults,resultfeedsId);
												Bookmark.find({$and:[{userId:userId},{bookmarkType:"paper"}]})
												.then((bookmarked)=>{
													// console.log("bookmarked",bookmarked)
													if(bookmarked!=0){
														var resultbookmarked  = bookmarked.map(function(paper){
															return ({_id:paper.paperId})
														})
														var finalbookmarked = bookmarkedchecking(finalRecommended,resultbookmarked)
														if(finalbookmarked)
														{
															return res.json({status:200,message:'Success',result:finalbookmarked})
														}
														else{
															console.log("error occured while matching bookmarked")
														}
													}
													else{
														return res.json({status:200,message:'Success',result:finalRecommended})
													}
												})
												.catch(err=>{
													console.log("error while fetching bookmark")
												})
												// console.log("searchresult",finalRecommended)
									 		}
									 		else{
									 			//if user did not recommend any feeds then checked for bookma 
													Bookmark.find({$and:[{userId:userId},{bookmarkType:"paper"}]})
													.then((bookmarked)=>{
														
														if(bookmarked!=0){
															var resultbookmarked  = bookmarked.map(function(paper){
																return ({_id:paper.paperId})
															})
															var finalbookmarked = bookmarkedchecking(finalResults,resultbookmarked)
															if(finalbookmarked)
															{
																return res.json({status:200,message:'Success',result:finalbookmarked})
															}
															else{
																console.log("error occured while matching bookmarked")
															}
														}
														else{
															return res.json({status:200,message:'Success',result:finalResults})
														}
													})
													.catch(err=>{
														console.log("error while fetching bookmark")
													})									 			
									 		}
									 	})
									 	.catch(err=>{
									 		// console.log("err",err)
									 		console.log("Error occured while fetching userrecommended papers")
									 	})	
									 }
									 else{
									 	return res.json({status:500,message:'There are no papers'});	
									 }							
								}
						})
					}
					else{
						Paperupload.esSearch({ 
							    from:from,
							    size:size,
									    query:{
									    	bool:{
									            "must": {
									                "bool" : { "should": [{terms : {"topics.topic_name": topi}}] }
									            }
									    	}
									    },
									    sort:{
									    	"createdAt":{
									    		"order" : "desc"
									    	}
									    }   
							},
							function(err, results) {
								if(err){
									// console.log("err",err)
									return res.json({status:500,message:'Error occured while fetching papers',err:err})
								}
								else{
									 var resultFound = results.hits.hits;
									 var finalResults = papersSimplified(resultFound);
									 if(finalResults!=0){
									 	//checking user recommnded any feeds
									 	Recommend.find({$and:[{userId:userId},{recommendType:'paperupload'}]})
									 	.then((papersFound)=>{
									 		//if feeds are there then changed isrecommnded:true and also checked for bookmarked any feed
									 		// if done then used converted finalRecommended(isrecommnded:true) and passed it to bookmark 
									 		// then isbookmarked:true new list is produced with both (isrecommnded:true,isbookmarked:true)
									 		if(papersFound.length!=0){
										 		var resultfeedsId =  papersFound.map(function(paper){
												return ({_id:paper.recommended})
												})	
												var finalRecommended = 	recommendedchecking(finalResults,resultfeedsId);
												Bookmark.find({$and:[{userId:userId},{bookmarkType:"paperupload"}]})
												.then((bookmarked)=>{
													// console.log("bookmarked",bookmarked)
													if(bookmarked!=0){
														var resultbookmarked  = bookmarked.map(function(paper){
															return ({_id:paper.paperId})
														})
														var finalbookmarked = bookmarkedchecking(finalRecommended,resultbookmarked)
														if(finalbookmarked)
														{
															return res.json({status:200,message:'Success',result:finalbookmarked})
														}
														else{
															console.log("error occured while matching bookmarked")
														}
													}
													else{
														return res.json({status:200,message:'Success',result:finalRecommended})
													}
												})
												.catch(err=>{
													console.log("error while fetching bookmark")
												})
												// console.log("searchresult",finalRecommended)
									 		}
									 		else{
									 			//if user did not recommend any feeds then checked for bookma 
													Bookmark.find({$and:[{userId:userId},{bookmarkType:"paperupload"}]})
													.then((bookmarked)=>{
														if(bookmarked!=0){
															var resultbookmarked  = bookmarked.map(function(paper){
																return ({_id:paper.paperId})
															})
															var finalbookmarked = bookmarkedchecking(finalResults,resultbookmarked)
															if(finalbookmarked)
															{
																return res.json({status:200,message:'Success',result:finalbookmarked})
															}
															else{
																console.log("error occured while matching bookmarked")
															}
														}
														else{
															return res.json({status:200,message:'Success',result:finalResults})
														}
													})
													.catch(err=>{
														console.log("error while fetching bookmark")
													})									 			
									 		}
									 	})
									 	.catch(err=>{
									 		console.log("Error occured while fetching userrecommended papers")
									 	})	
									 }
									 else{
									 	return res.json({status:500,message:'There are no papers'});	
									 }							
								}
						})
					}
				})
				.catch(err=>{
					// console.log("rrr",err)
					return res.json({status:500,message:'followers not found',err:err});
				})
		})
		.catch(err=>{
			// console.log("rrr",err)
			return res.json({status:500,message:'User not found',err:err});
		})
	}
	else{
		User.find({_id:userId}).populate('topics')
		.then((userFound)=>{
			// console.log("userFound:",userFound);
				var topicsname =[];
				var userDet = userFound.map(function(userObj){
					userObj.topics.map(function(topicocj){
						topicsname.push(topicocj.topic_name);
					})
				})
				// console.log("topicsname:",topicsname);
				var topi= topicsname.map(v => v.toLowerCase());
				  // console.log("topi",topi)
				 Follow.find({userId:userId})
				.then((followers)=>{
					if(followers.length!=0){
						// console.log("topi",topi)
						var followersId = [];
						var followersDetail = followers.map(function(followers){
							return followers.following
						})
						Paperupload.esSearch({ 
							    
									    query:{
									    	bool:{
												"must": {
									                "bool" : { "should": [{terms : {"userId._id": followersDetail}},{terms : {"topics.topic_name": topi}}] }
									            }
									    	}
									    },		    
									    sort:{
									    	"createdAt":{
									    		"order" : "desc"
									    	}
									    }   
							},
							{
								from:((from*size)+1),
							    size:size,
							},
							function(err, results) {
								if(err){
									// console.log("err",err)
									return res.json({status:500,message:'Error occured while fetching papers',err:err})
								}
								else{
									//search results came in resultFound
								 var resultFound = results.hits.hits;
								 var finalResults = papersSimplified(resultFound);
									// console.log("resultFound",resultFound.length)
									 if(finalResults!=0){
									 	//checking user recommnded any feeds
									 	// console.log("userIfd",userId)
									 	Recommend.find({$and:[{userId:userId},{recommendType:'paperupload'}]})
									 	.then((papersFound)=>{
									 		// console.log("papersFound,",papersFound)
									 		//if feeds are there then changed isrecommnded:true and also checked for bookmarked any feed
									 		// if done then used converted finalRecommended(isrecommnded:true) and passed it to bookmark 
									 		// then isbookmarked:true new list is produced with both (isrecommnded:true,isbookmarked:true)
									 		if(papersFound.length!=0){
										 		var resultfeedsId =  papersFound.map(function(paper){
												return ({_id:paper.recommended})
												})	

												// console.log("resultfeedsId",resultfeedsId)
												var finalRecommended = 	recommendedchecking(finalResults,resultfeedsId);
												Bookmark.find({$and:[{userId:userId},{bookmarkType:"paper"}]})
												.then((bookmarked)=>{
													// console.log("bookmarked",bookmarked)
													if(bookmarked!=0){
														var resultbookmarked  = bookmarked.map(function(paper){
															return ({_id:paper.paperId})
														})
														var finalbookmarked = bookmarkedchecking(finalRecommended,resultbookmarked)
														if(finalbookmarked)
														{
															return res.json({status:200,message:'Success',result:finalbookmarked})
														}
														else{
															console.log("error occured while matching bookmarked")
														}
													}
													else{
														return res.json({status:200,message:'Success',result:finalRecommended})
													}
												})
												.catch(err=>{
													console.log("error while fetching bookmark")
												})
												// console.log("searchresult",finalRecommended)
									 		}
									 		else{
									 			//if user did not recommend any feeds then checked for bookma 
													Bookmark.find({$and:[{userId:userId},{bookmarkType:"paper"}]})
													.then((bookmarked)=>{
														if(bookmarked!=0){
															var resultbookmarked  = bookmarked.map(function(paper){
																return ({_id:paper.paperId})
															})
															var finalbookmarked = bookmarkedchecking(finalResults,resultbookmarked)
															if(finalbookmarked)
															{
																return res.json({status:200,message:'Success',result:finalbookmarked})
															}
															else{
																console.log("error occured while matching bookmarked")
															}
														}
														else{
															return res.json({status:200,message:'Success',result:finalResults})
														}
													})
													.catch(err=>{
														console.log("error while fetching bookmark")
													})									 			
									 		}
									 	})
									 	.catch(err=>{
									 		console.log("Error occured while fetching userrecommended papers")
									 	})	
									 }
									 else{
									 	return res.json({status:500,message:'There are no papers'});	
									 }							
								}
						})
					}
					else{
						Paperupload.esSearch({ 
							    from:((from*size)+1),
							    size:size,
									    query:{
									    	bool:{
									            "must": {
									                "bool" : { "should": [{terms : {"topics.topic_name": topi}}] }
									            }
									    	}
									    },
									    sort:{
									    	"createdAt":{
									    		"order" : "desc"
									    	}
									    }   
							},
							function(err, results) {
								if(err){
									// console.log("err",err)
									return res.json({status:500,message:'Error occured while fetching papers',err:err})
								}
								else{
									 var resultFound = results.hits.hits;
									 var finalResults = papersSimplified(resultFound);
									 if(finalResults!=0){
									 	//checking user recommnded any feeds
									 	Recommend.find({$and:[{userId:userId},{recommendType:'paperupload'}]})
									 	.then((papersFound)=>{
									 		//if feeds are there then changed isrecommnded:true and also checked for bookmarked any feed
									 		// if done then used converted finalRecommended(isrecommnded:true) and passed it to bookmark 
									 		// then isbookmarked:true new list is produced with both (isrecommnded:true,isbookmarked:true)
									 		if(papersFound.length!=0){
										 		var resultfeedsId =  papersFound.map(function(paper){
												return ({_id:paper.recommended})
												})	
												var finalRecommended = 	recommendedchecking(finalResults,resultfeedsId);
												Bookmark.find({$and:[{userId:userId},{bookmarkType:"paperupload"}]})
												.then((bookmarked)=>{
													// console.log("bookmarked",bookmarked)
													if(bookmarked!=0){
														var resultbookmarked  = bookmarked.map(function(paper){
															return ({_id:paper.paperId})
														})
														var finalbookmarked = bookmarkedchecking(finalRecommended,resultbookmarked)
														if(finalbookmarked)
														{
															return res.json({status:200,message:'Success',result:finalbookmarked})
														}
														else{
															console.log("error occured while matching bookmarked")
														}
													}
													else{
														return res.json({status:200,message:'Success',result:finalRecommended})
													}
												})
												.catch(err=>{
													console.log("error while fetching bookmark")
												})
												// console.log("searchresult",finalRecommended)
									 		}
									 		else{
									 			//if user did not recommend any feeds then checked for bookma 
													Bookmark.find({$and:[{userId:userId},{bookmarkType:"paperupload"}]})
													.then((bookmarked)=>{
														if(bookmarked!=0){
															var resultbookmarked  = bookmarked.map(function(paper){
																return ({_id:paper.paperId})
															})
															var finalbookmarked = bookmarkedchecking(finalResults,resultbookmarked)
															if(finalbookmarked)
															{
																return res.json({status:200,message:'Success',result:finalbookmarked})
															}
															else{
																console.log("error occured while matching bookmarked")
															}
														}
														else{
															return res.json({status:200,message:'Success',result:finalResults})
														}
													})
													.catch(err=>{
														console.log("error while fetching bookmark")
													})									 			
									 		}
									 	})
									 	.catch(err=>{
									 		console.log("Error occured while fetching userrecommended papers")
									 	})	
									 }
									 else{
									 	return res.json({status:500,message:'There are no papers'});	
									 }							
								}
						})
					}
				})
				.catch(err=>{
					// console.log("rrr",err)
					return res.json({status:500,message:'followers not found',err:err});
				})
		})
		.catch(err=>{
			// console.log("rrr",err)
			return res.json({status:500,message:'User not found',err:err});
		})
	}
	

}
// end

// api to fetch authors
exports.BulkFetchAuthorList = async(function(req,res){
	try{
		const fetchAuthors = await(paperUploadService.fetchAuthorsMircosoft(req.body))
		if(fetchAuthors.entities.length!==0){
			 // return res.json({status:200,message:'Success',result:fetchAuthors.entities})
		const removeDuplicateAuthors = await(removeDuplicateAuthorsArr(fetchAuthors.entities,req.body))
		if(removeDuplicateAuthors){
			return res.json({status:200,message:'Success',result:removeDuplicateAuthors})
		}
		else{
			console.log("error occured while removing duplicates")
		}
		}
		else{
			return res.json({status:400,message:"Author with name does not exist"})
		}
	}
	catch(err){
		// console.log("err",err)
		return res.json({status:500,message:'Error occured',err:err})
	}
})
// end

//api for authors paper
exports.BulkFetchAuthorPapers = function(req,res){
	var reqAuthors = req.body.author;
	var nameAuthor = req.body.authorName.toLowerCase();
	var filteredAuthors = reqAuthors.filter(function (item) {
      return item.AuN == nameAuthor;
	});
	var authorId =  filteredAuthors[0].AuId;
	var subscriptionKey = 'b60240e8f77e4531b13ccb8b9b922598'; 
	request({
        url: "https://api.labs.cognitive.microsoft.com/academic/v1.0/evaluate?expr=Composite(And(AA.AuN='"+nameAuthor+"',AA.AuId="+authorId+"))&model=latest&count=500&timeout:5000&attributes=Ti,Id,D,CC,AA.AuN,AA.AuId,F.FN,F.FId,J.JN,J.JId,C.CN,C.CId,E.BV,E.I,E.FP,E.S,E.FP,E.IA,E.DOI,E.VFN,E.VSN,E.PB&subscription-key="+subscriptionKey+"",
        method: "GET",
         headers: {
            'Content-Type': 'application/json'
        }
    }, function (error, response, body) {
        if (error) {
            console.log("err",error)
        }
        else {
        	 if(response && response.statusCode == 200){
        	 	// const fetchAbstractOfPapers = function fetcAbstractAll(JSON.parse(response.body);
        	 	var paperByAuthor = JSON.parse(response.body)
        	 	// console.log("paperByAuthor",paperByAuthor.entities)
        	 	if(paperByAuthor.entities!==0){
        	 		// return res.json({status:200,result:JSON.parse(response.body)});
        	 		var i=0;
        	 		for(let paper of paperByAuthor.entities){
        	 			// console.log("paper",paper.IA)
        	 			if(!("IA" in paper)){ 
								paper.description ='';
							}
							else{
								// console.log("jkshdkjhashk")
							  	var fetchPaperIA = paper.IA.InvertedIndex;
								let words = [];
								Object.getOwnPropertyNames(fetchPaperIA).forEach(propertyName =>
								  fetchPaperIA[propertyName].forEach(value => words[value] = propertyName)
								);
								const PaperAbstract = words.join(' ');
								paper.description =PaperAbstract; 
							}
        	 			i++;
        	 		}
        	 		 return res.json({status:200,result:paperByAuthor.entities});
        	 	}
        	 	else{
        	 		return res.json({status:200,result:JSON.parse(response.body)});
        	 	}
        	 }
        	 else if (response && response.statusCode == 500){
        	 	return res.json({status:500,result:JSON.parse(response.body)})
        	 }
        	 else if(response && response.statusCode == 400){
        	 	return res.json({status:400,result:JSON.parse(response.body)})
        	 }
        	 else if(response && response.statusCode == 401){
        	 	return res.json({status:401,result:JSON.parse(response.body)})
        	 }
        	 else if(response && response.statusCode == 404){
        	 	return res.json({status:404,result:JSON.parse(response.body)})
        	 }
        	 else{
        	 	return res.json({status:403,result:JSON.parse(response.body)})
        	 }
        }
    })
}
//end

// api for paperUploadBulk
exports.BulkPapersSave = async(function(req,res){
	try{
		const checkUserExist = await(paperUploadService.checkUseralready(req.body.userId))
		if(checkUserExist){
			res.json({staus:200,message:'Success'})
			const saveBulkpapers = await(paperUploadService.bulkSavePapers(req.body,checkUserExist.graph,checkUserExist._id))
			if(saveBulkpapers){
				// return res.json({staus:200,result:saveBulkpapers,message:'Failure'})
				console.log("updated successfully1")
			}
			else{
				console.log("updated successfully")
				// return res.json({staus:200,message:'Success',result:saveBulkpapers})
			}
		}
		else{
			return res.json({status:400,message:'User does not exist'})
		}
	}
	catch(err){
		// console.log("err",err)
		return res.json({status:500,message:'Error occured',err:err})
	}
})
// end

exports.singlePaperMicrosoftList = async(function(req,res){
	try{
		const fetchTitle = await(paperUploadService.fetchPaperMicrosoft(req.body))
		// console.log("fetchTitle",fetchTitle) 
		if(fetchTitle.length!=0){
			if(fetchTitle.entities.length!=0){
				return res.json({staus:200,message:'Success',result:fetchTitle})
			}
			else{
				return res.json({status:200,message:'Success',result:fetchTitle})
			}	
		}
		else{
			return res.json({status:500,message:'Failure',result:fetchTitle})
		}
	}
	catch(err){
		// console.log("err",err)
		return res.json({status:500,message:'Error occured'})
	}
})


exports.singlePaperMicrosoftDetails = async(function(req,res){
	try{
		const fetchTitle = await(paperUploadService.fetchPaperMicrosoftDetails(req.body))
		// console.log("fetchTitle",fetchTitle) 
		if(fetchTitle.length!=0){
			if(fetchTitle.entities.length!=0){
				const fetchAbstract = await(paperUploadService.fetchAbstract(fetchTitle.entities))
				return res.json({staus:200,message:'Success',result:fetchTitle.entities,description:fetchAbstract})
			}
			else{
				return res.json({status:200,message:'Success',result:fetchTitle})
			}	
		}
		else{
			return res.json({status:500,message:'Failure',result:fetchTitle})
		}
	}
	catch(err){
		// console.log("err",err)
		return res.json({status:500,message:'Error occured'})
	}
})


exports.deletePapersRss = async(function(req,res){
	try{
		const removePapers = await(paperUploadService.removePapersRSS())
		if(removePapers)
		{
			return res.json({message:'success'})
		}
		else{
			return res.json({message:'Failure'})
		}
	}
	catch(err){
		// console.log(err)
		return res.json({status:500,message:'Error occured',err:err})
	}
}) 


function papersSimplified(Papers){
	var newPapers = Papers.map(function(item) {
	  var obj = item._source;
	  for (var o in item) {
	    if (o != "_source") obj[o] = item[o];
	  }
	  return obj;
	})
	return newPapers;
}

function recommendedchecking(searchresult,resultfeedsId){
	//console.log("resultFound",resultFound);
	resultfeedsId.forEach((item) => {
	  var array1Obj = searchresult.find(({_id}) => ObjectID(item._id).equals(ObjectID(_id)));
	  if(array1Obj) {
	    array1Obj.isrecommended = true;
	  }
	})
	 return searchresult;
}

function bookmarkedchecking(feedrecommended,resultbookmarked){
	resultbookmarked.forEach((item) => {
		  var array1Obj = feedrecommended.find(({_id}) => ObjectID(item._id).equals(ObjectID(_id)));
		  if(array1Obj) {
		    array1Obj.isbookmarked = true;
		  }
	}) 
	 return feedrecommended;
}

function removeDuplicateAuthorsArr(authors,name){
	var authorName = name.author;
	var lowerAuthorName = authorName.toLowerCase();
	if(/[-]/.test(lowerAuthorName)){
		var authorSearchName =lowerAuthorName.replace(/-/g, "");
		var finalauthor = authorSearchName.replace(/[^A-Z0-9]/ig, " ")
		var trimAuthor = finalauthor.trim();
		const map = new Map(authors.reverse().map(obj => 
	    [obj.AA.find(({AuN}) => AuN == trimAuthor).AuId, obj]
		));
		const filtered = Array.from(map.values()).reverse();
		return filtered;
	}
	else{
		var authorSearchName =lowerAuthorName.replace(/[\. ,:-]+/g, " ")
		var finalauthor = authorSearchName.replace(/[^A-Z0-9]/ig, " ")
		var trimAuthor = finalauthor.trim();
		const map = new Map(authors.reverse().map(obj => 
		    [obj.AA.find(({AuN}) => AuN == trimAuthor).AuId, obj]
		));
		const filtered = Array.from(map.values()).reverse();
		return filtered;
	}  
}


//api to delete user papers all
exports.deleteAllUserPapers = async(function(req,res,next){
	try{
		var userId = req.body.userId;
		const fetchAllPapers = await(paperUploadService.fetchAllPaperstodelete(userId))
		if(fetchAllPapers.length!==0){
			const deleteAllPapers = await(paperSourceService.deleteAllPapers(fetchAllPapers))
			return res.json({status:200,message:'all papers deleted'})
		}
		else{
			return res.json({status:400,message:'There are no papers for this user'})
		}
	}
	catch(err){
		// console.log("err",err)
		return res.json({status:500,message:'Error occured'})
	}
})
//end
exports.paperByTopicMatchId = async(function(req, res, next) {
	console.log("req.body",req.params.id);
	const paperFeeds = await (paperUploadService.feedsByTopicId(req.params.id));
	console.log("data",paperFeeds);
    if (paperFeeds) {
        res.json({ status: 200, message: "Success", result: paperFeeds });
    } else {
        res.json({ status: 500, message: "Failure" });
    }
})
