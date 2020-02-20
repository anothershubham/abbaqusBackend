const Paperupload = require('../models/paperUpload');
const Viewdownloads = require('../models/viewsdownloads')
const Users = require('../models/users');
const uploadFile = require('../middlewares/uploadFile');
const config = require('../config');
const bcrypt = require('bcrypt');
var mongoose    = require('mongoose');
const async = require('asyncawait/async');
const await = require('asyncawait/await');

exports.paperExists = function(paperId){
	return Paperupload.findOne({_id:paperId});
}

exports.existingView = function(paperId){
	return Viewdownloads.find({paperId:paperId});
}

exports.addViewedPapers = function(body){
	const {vieweduserId,paperId,month,year} = body;
	const viewsUpload = new Viewdownloads;
	viewsUpload.paperId= paperId;
	viewsUpload.vieweduserId = vieweduserId;
	viewsUpload.month= month;
	viewsUpload.year= year;
	viewsUpload.views= 1;
	viewsUpload.save();
	return viewsUpload;
}
exports.adddownloadedPapers = function(body){
	const {downloadeduserId,paperId,month,year} = body;
	const viewsUpload = new Viewdownloads;
	viewsUpload.paperId= paperId;
	viewsUpload.downloadeduserId = downloadeduserId;
	viewsUpload.month= month;
	viewsUpload.year= year;
	viewsUpload.downnload = 1;
	viewsUpload.save();
	return viewsUpload;
}

exports.checkFormonth = function(body){
	return Viewdownloads.find({paperId:body.paperId,month:body.month,year:body.year});
}
exports.checkFormonthdownloads = function(body){
	return Viewdownloads.find({paperId:body.paperId,month:body.month,year:body.year});
}

exports.userdownloaded = function(userId,monthId){
	return Viewdownloads.find({ $and: [ { _id:monthId }, { downloadeduserId: {  $in :userId } } ] })
}
exports.userViewed = function(userId,monthId){
	return Viewdownloads.find({ $and: [ { _id:monthId }, { vieweduserId: {  $in :userId } } ] })
}

exports.paperSavedInMonth = function(viweduserId,viewsId){
	return Viewdownloads.findOneAndUpdate({_id:viewsId},{$push:{vieweduserId:viweduserId}},{new: true})
}
exports.paperSavedInMonthDownloads = function(downloadeduserId,viewsId){
	return Viewdownloads.findOneAndUpdate({_id:viewsId},{$push:{downloadeduserId:downloadeduserId}},{new: true})
}

exports.viewCountIncremented = function(viewsId,totalViews){
	var totalviwed = totalViews[0];
	var increment = totalviwed+1;
	return Viewdownloads.findOneAndUpdate({_id:viewsId},{views:increment},{new: true});
}

exports.viewCountIncrementeddownloads = function(viewsId,totaldownloads){
	var increment = totaldownloads[0]+1;
	return Viewdownloads.findOneAndUpdate({_id:viewsId},{downnload:increment},{new: true});
}

exports.viewedAlready = function(viweduserId,paperId){
	return Viewdownloads.find({ $and: [ {paperId:paperId }, { vieweduserId: {  $in :viweduserId } } ] })
}

exports.fetchpaper = function(paperId){
	return Paperupload.findOne({_id:paperId});
}

exports.incrementsInPapers = function(paperId,views){
	var totalcViews = views+1;
	return Paperupload.findOneAndUpdate({_id:paperId},{views:totalcViews},{new: true});
}

exports.incrementsInPapersdownloads = function(paperId,downloads){
	var totaldownloads = downloads+1;
	return Paperupload.findOneAndUpdate({_id:paperId},{downloadPapers:totaldownloads},{new: true});
}

exports.viewedAlreadydownloads = function(downloadeduserId,paperId){
	return Viewdownloads.find({ $and: [ {paperId:paperId }, { downloadeduserId: {  $in :downloadeduserId } } ] })
}

exports.addviewsDownload = function(paperId,savedViewId){
	return Paperupload.findOneAndUpdate({_id:paperId},{$push:{downloadsviews:savedViewId}},{new: true})
}

exports.checkInpapersId = function(paperId,savedId){
	return Paperupload.find({ $and: [ {_id:paperId }, { downloadsviews: {  $in :savedId } } ] })
}


