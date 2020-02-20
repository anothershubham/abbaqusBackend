const Paperupload = require('../models/paperUpload');
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const speakeasy = require("speakeasy");
const paperUploadService = require('../services/paperUploadService');
const viewdowloadService = require('../services/viewsdownloadService');
const config = require('../config');
const fs = require('fs');
const ejs = require('ejs');
const mail = require('../services/mail');
const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();
const uploadFile = require('../middlewares/uploadFile'); 
const User = require('../models/users');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const ObjectID = require('mongodb').ObjectID;


exports.paperViews=async(function(req,res,next){
	try{
		var paperId = req.body.paperId;
		var vieweduserId = req.body.vieweduserId; 
		const paperExists = await(paperUploadService.paperExists(paperId))
		 if(paperExists){
		 		// console.log("checkpaperViewExists",checkpaperViewExists);
		 		const checkAlreadyviewed = await(viewdowloadService.viewedAlready(vieweduserId,paperId))
		 		if(checkAlreadyviewed.length!=0){
		 			return res.json({status:500,message:'User already viewed'})
		 		}
		 		else{
		 			
			 		const checkMonthYearpaperExists = await(viewdowloadService.checkFormonth(req.body))
			 		
			 		if(checkMonthYearpaperExists.length!=0){
			 			// console.log("paperexists",checkMonthYearpaperExists)
			 			var viewsId = checkMonthYearpaperExists.map(function(views){
			 				return views._id;
			 			})
		 				var totalViews = checkMonthYearpaperExists.map(function(vie){
				 				return vie.views;
				 		})
				 			// console.log("totalViews",totalViews)
		 					// console.log("viewsId",viewsId);
			 			const checkUserAlreadyViewed = await(viewdowloadService.userViewed(vieweduserId,viewsId))
			 			// console.log("checkUserAlreadyViewed",checkUserAlreadyViewed)
			 			if(checkUserAlreadyViewed.length!=0){
			 				return res.json({status:500,message:'user already viewed'})
			 			}
			 			else{
			 				const UserIdSavedMonth = await(viewdowloadService.paperSavedInMonth(vieweduserId,viewsId))
				 			if(UserIdSavedMonth){
				 				// console.log("UserIdSavedMonth",totalViews)
				 				const IncrermentViewCount = await(viewdowloadService.viewCountIncremented(viewsId,totalViews))
				 				if(IncrermentViewCount){
									const fetchPaper = await(viewdowloadService.fetchpaper(paperId))
							 		if(fetchPaper.length!=0){
							 			const incrementInPapers =await(viewdowloadService.incrementsInPapers(paperId,fetchPaper.views))
							 			if(incrementInPapers){
							 				// console.log("here")
							 				const checkAlreadyexistspaper = await(viewdowloadService.checkInpapersId(paperId,viewsId))
							 				if(checkAlreadyexistspaper.length!=0){
								 				return res.json({status:200,message:'Success'})
							 				}
							 				else{
							 					const addViewsDownload = await(viewdowloadService.addviewsDownload(paperId,viewsId))
								 				if(addViewsDownload){
								 					return res.json({status:200,message:'Success'})
								 				}
								 				else{
								 					return res.json({status:500,message:'Error occured while updating papers downloads view'})
								 				}
							 				}
							 				// return res.json({status:200,message:'Success'})
							 			} 
							 			else{
							 				return res.json({status:500,message:'Error occured while saving paper view'})
							 			}
							 		}
							 		else{
							 			return res.json({status:500,message:'Error occured while updating view in paper'})
							 		}
				 				}
				 				else{
				 					return res.json({status:500,message:'Error occured while updating view count'})
				 				}

				 			}
				 			else{
				 				return res.json({status:500,message:'Error occured while saving user in that month'})
				 			}
			 			}
			 		}
			 		else{
			 			const savePapersnewMonth = await(viewdowloadService.addViewedPapers(req.body))
						if(savePapersnewMonth){
							const fetchPaper = await(viewdowloadService.fetchpaper(paperId))
					 		if(fetchPaper.length!=0){
					 			const incrementInPapers =await(viewdowloadService.incrementsInPapers(paperId,fetchPaper.views))
					 			if(incrementInPapers){
					 				const checkAlreadyexistspaper = await(viewdowloadService.checkInpapersId(paperId,savePapersnewMonth._id))
							 				if(checkAlreadyexistspaper.length!=0){
								 				return res.json({status:200,message:'Success'})
							 				}
							 				else{
							 					const addViewsDownload = await(viewdowloadService.addviewsDownload(paperId,savePapersnewMonth._id))
								 				if(addViewsDownload){
								 					return res.json({status:200,message:'Success'})
								 				}
								 				else{
								 					return res.json({status:500,message:'Error occured while updating papers downloads view'})
								 				}
							 				}
					 			} 
					 			else{
					 				return res.json({status:500,message:'Error occured while saving paper view'})
					 			}
					 		}
					 		else{
					 			return res.json({status:500,message:'Error occured while updating view in paper'})
					 		}
					 	}
					 	else{
					 		return res.json({status:500,message:'Error occured while viewing papers'})
					 	}
			 		}
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

exports.paperDownload=async(function(req,res,next){
	try{
		var paperId = req.body.paperId;
		var downloadeduserId = req.body.downloadeduserId;
		const paperExists = await(paperUploadService.paperExists(paperId))
		 if(paperExists){
		 		const checkAlreadyviewed = await(viewdowloadService.viewedAlreadydownloads(downloadeduserId,paperId))
		 		// console.log("checkAlreadyviewed",checkAlreadyviewed);
		 		if(checkAlreadyviewed.length!=0){
		 			// console.log("sjdashdjkashd0",checkAlreadyviewed)
		 			return res.json({status:500,message:'User already downloaded paper'})
		 		}
		 		else{
			 		const checkMonthYearpaperExists = await(viewdowloadService.checkFormonthdownloads(req.body))
			 		if(checkMonthYearpaperExists.length!=0){
			 			var viewsId = checkMonthYearpaperExists.map(function(views){
			 				return views._id;
			 			})
		 				var totaldownloads = checkMonthYearpaperExists.map(function(vie){
				 				return vie.downnload;
				 		})
			 			// console.log("paperexists",checkMonthYearpaperExists)
			 			const checkUserAlreadyViewed = await(viewdowloadService.userdownloaded(downloadeduserId,viewsId))
			 			if(checkUserAlreadyViewed.length!=0 && checkUserAlreadyViewed.length!=null){
			 				return res.json({status:500,message:'user already downloaded'})
			 			}
			 			else{
			 				const UserIdSavedMonth = await(viewdowloadService.paperSavedInMonthDownloads(downloadeduserId,viewsId))
				 			// console.log("UserIdSavedMonth",UserIdSavedMonth)
				 			if(UserIdSavedMonth){
				 				// console.log("UserIdSavedMonth",totalViews)
				 				const IncrermentViewCount = await(viewdowloadService.viewCountIncrementeddownloads(viewsId,totaldownloads))
				 				if(IncrermentViewCount){
									const fetchPaper = await(viewdowloadService.fetchpaper(paperId))
							 		if(fetchPaper.length!=0){
							 			const incrementInPapers =await(viewdowloadService.incrementsInPapersdownloads(paperId,fetchPaper.downloadPapers))
							 			if(incrementInPapers){
							 				const checkAlreadyexistspaper = await(viewdowloadService.checkInpapersId(paperId,viewsId))
							 				if(checkAlreadyexistspaper.length!=0){
								 				return res.json({status:200,message:'Success'})
							 				}
							 				else{
								 				const addViewsDownload = await(viewdowloadService.addviewsDownload(paperId,viewsId))
								 				if(addViewsDownload){
								 					return res.json({status:200,message:'Success'})
								 				}
								 				else{
								 					return res.json({status:500,message:'Error occured while updating papers downloads view'})
								 				}
							 				}
							 				// return res.json({status:200,message:'Success'})
							 			} 
							 			else{
							 				return res.json({status:500,message:'Error occured while saving paper view'})
							 			}
							 		}
							 		else{
							 			return res.json({status:500,message:'Error occured while updating view in paper'})
							 		}
				 				}
				 				else{
				 					return res.json({status:500,message:'Error occured while updating view count'})
				 				}
				 			}
				 			else{
				 				return res.json({status:500,message:'Error occured while saving user in that month'})
				 			}
			 			}
			 		}
			 		else{
			 			const savePapersnewMonth = await(viewdowloadService.adddownloadedPapers(req.body))
						if(savePapersnewMonth){
							const fetchPaper = await(viewdowloadService.fetchpaper(paperId))
			 				// console.log("fetchPaper",fetchPaper);
					 		if(fetchPaper.length!=0){
					 			const incrementInPapersdownloads = await(viewdowloadService.incrementsInPapersdownloads(paperId,fetchPaper.downloadPapers))
					 			if(incrementInPapersdownloads){

		 						const checkAlreadyexistspaper = await(viewdowloadService.checkInpapersId(paperId,savePapersnewMonth._id))
				 				if(checkAlreadyexistspaper.length!=0){
					 				return res.json({status:200,message:'Success'})
				 				}
				 				else{
					 				const addViewsDownload = await(viewdowloadService.addviewsDownload(paperId,savePapersnewMonth._id))
					 				if(addViewsDownload){
					 					return res.json({status:200,message:'Success'})
					 				}
					 				else{
					 					return res.json({status:500,message:'Error occured while updating papers downloads view'})
					 				}
				 				}
					 			} 
					 			else{
					 				return res.json({status:500,message:'Error occured while saving papers downloads'})
					 			}
					 		}
					 		else{
					 			return res.json({status:500,message:'Error occured while updating downloads in paper'})
					 		}
					 	}
					 	else{
					 		return res.json({status:500,message:'Error occured while viewing papers'})
					 	}
			 		}
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

