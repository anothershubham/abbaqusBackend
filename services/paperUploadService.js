const Paperupload = require('../models/paperUpload');
const QuestionUploads = require('../models/questionUpload');
const Viewdownloads = require('../models/viewsdownloads')
const Users = require('../models/users');
const Follow = require('../models/follow');
const uploadFile = require('../middlewares/uploadFile');
const config = require('../config');
const bcrypt = require('bcrypt');
const Bookmark = require('../models/bookmark');
const Recommendpaper = require('../models/recommended_paper');
const Recommend = require('../models/recommend');
const Graph = require('../models/graph');
const r2 = require('r2');
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const moment = require('moment');
const mongoose = require('mongoose');
const Topic = require('../models/topics');
const graphCronService = require('../services/graphCronService')
const PapermonthSnapshot = require('../models/paperMonthSnapshot')
var _ = require('lodash');


exports.checkUseralready = function(userId){
	return Users.findOne({_id:userId});
}

exports.removeDuplicates = function(topics){
	var uniqueTopics = topics.filter(function(elem, index, self) {
        return index == self.indexOf(elem);
    });
    return uniqueTopics;
}

exports.removeTopics = function(userId){
	return Users.findOneAndUpdate({_id:userId},{ $set : {topics:[]}} , {multi:true} )
}


exports.updateTopics = function(userId,topics){
	return Users.findOneAndUpdate({_id:userId},{ $set : {topics:topics}} , {multi:true} )
}

exports.paperExists = function(paperId){
	return Paperupload.findOne({_id:paperId}).populate('userId','graph');
}

exports.paperdetials = function(paperId){
	return Paperupload.find({_id:paperId}).populate('userId','_id firstname lastname profileImg organization role designation').populate('recommended','profileImg');
}

exports.userExists = function(userId){
	return Paperupload.find({userId:userId});
}

exports.getAlltopicsForPapers=function(){
	return Topic.find().lean();
}

exports.searchTopicInPaper = async(function(paper, topic){
	const title = paper.paperRsstitle; 
	const content = paper.paperabstract;
	const topic_name = topic.topic_name;
	const lowerTitle = title.toLowerCase();
	const lowerContent = content.toLowerCase();
	const lowerTopicname = topic_name.toLowerCase();
		if( (lowerContent.indexOf(lowerTopicname) >= 0) || (lowerTitle.indexOf(lowerTopicname) >= 0)) {
			return true;
		}
		else{
			return false;
		}
	
})

exports.deletePaperInBookmark = async(function(paperId){
	var checkPaperExist = await(Bookmark.find({paperId:paperId}).lean())
	if(checkPaperExist.length!==0){
		return Bookmark.deleteMany({paperId:paperId});
	}
	else{
		return true;
	}
})

exports.deletePaperInRecommend = async(function(paperId){
	var checkpaperExist = await(Recommend.find({recommended:paperId}).lean())
	if(checkpaperExist.length!==0){
		return Recommend.deleteMany({recommended:paperId})
	}
	else{
		return true;
	}
	
})

exports.deletePaperInPaperMain = async(function(paperId){
	var checkpaperExist = await(PapermonthSnapshot.find({paperId:paperId}).lean())
	if(checkpaperExist.length!==0){
		return PapermonthSnapshot.remove({paperId:paperId})
	}
	else{
		return true;
	}
})

exports.addTopicsToPapers = function(paperId, topics){
	return Paperupload.findOneAndUpdate({_id:paperId},{$set:{topics: topics}},{new: true});
}

exports.getPapersByDate = function(date){
	// const allPapers = await(Paperupload.find({$and:[{'createdAt': {$gte : date}},{uploadBy:'rssupload'}]}).lean());
	return Paperupload.find({$and:[{'createdAt': {$gte : date}},{uploadBy:'rssupload'}]}).limit(9000).lean();
}

exports.useruploadPapers = function(userId,page,pagesize){ 
	var skip = page*pagesize;
	return Paperupload.find({userId:userId}).populate('userId','_id firstname lastname profileImg organization role designation').populate('downloadsviews').populate('recommended','profileImg').sort({createdAt:-1}).skip(skip).limit(pagesize);
}

exports.fetchallPapers = function(){
	return 	Paperupload.find({uploadBy:"user"});
}

exports.incrementDownloads = function(paperId,dowloadsCount){
	var newDownloadscount = dowloadsCount+1;
	return Paperupload.findOneAndUpdate({_id:paperId},{$set:{downloadPapers:newDownloadscount}},{new: true});
}

exports.fetchUser = function(userId){
	return Users.findOne({_id:userId});
}

exports.trendingPapers = function(){
	return Paperupload.find({ "createdAt" : { $lte: new Date(), $gte: new Date(new Date().setDate(new Date().getDate()-2))}}).sort({views:-1,createdAt:-1}).limit(3).populate('userId','_id firstname lastname role designation dob profileImg organization').populate('recommended','profileImg');
	 	// return Paperupload.find({}).sort({views:-1,createdAt:-1}).limit(3).populate('userId','_id firstname lastname role designation dob profileImg organization').populate('recommended','profileImg');
	 // return Users.find({topics:{ $in :topicdata}}).populate({path: 'paper', populate:{path: 'userId', select: '_id firstname lastname designation dob profileImg organization role'}}).populate({path: 'paper', populate:{path: 'recommended', select: 'profileImg'}});
}

exports.trendingAllPaper = function(){
	return Paperupload.find({}).sort({views:-1,createdAt:-1}).limit(3).populate('userId','_id firstname lastname role designation dob profileImg organization').populate('recommended','profileImg');
}

exports.fetchFollowedpapers = function(followedUsers,page,pageSize){
	return Paperupload.find({userId:{ $in :followedUsers}}).sort({createdAt:-1}).populate('userId','_id firstname lastname role designation dob profileImg organization').populate('recommended','profileImg').skip(page*pageSize).limit(pageSize);
}

exports.recommendedpapers = function(userId){
	return Recommend.find({$and:[{userId:userId},{recommendType:'paperupload'}]})
}

exports.bookmarkedpapers = function(userId){
	return Bookmark.find({$and:[{userId:userId},{bookmarkType:"paper"}]})
}

exports.papersByTags = function(tags,paperId){
 return Paperupload.find({$and:[{tags:{$in:tags}},{_id:{$nin:paperId}}]}).populate('userId','_id firstname lastname role designation dob profileImg organization').populate('recommended','profileImg').sort({createdAt:-1}).limit(5);
}

exports.deletePaper = function(paperId){
	return Paperupload.findOneAndRemove({_id:paperId});
}

exports.fetchPaperMicrosoft = function(paperDetails){
	var title = paperDetails.title.toLowerCase();
	var removeSpclchar = title.replace(/[^A-Z0-9]/ig, " ")
	var finalPaperTitle = removeSpclchar.replace(/\s+/g,' ').trim();
	var subscriptionKey = 'b60240e8f77e4531b13ccb8b9b922598';
	let headers = {'Content-Type': 'application/json'}
	var params = "?expr=Ti=='"+finalPaperTitle+"'&model=latest&count=10&offset=0&attributes=Id,Ti,Id,D,CC,AA.AuN,AA.AuId,AA.AfN,AA.AfId,AA.S,F.FN,F.FId,J.JN,J.JId,C.CN,C.CId,W,E.DN,E.S,E.V,E.BV,E.I,E.FP,E.FP,E.IA,E.DOI,E.VFN,E.VSN,E.PB,&subscription-key="+subscriptionKey+"" ;
	var url = 'https://api.labs.cognitive.microsoft.com/academic/v1.0/evaluate'+params;
	let results = await (r2(url, {headers}).json);
	return results;
}


exports.fetchPaperMicrosoftDetails = function(paperdata){
	var title = paperdata.title.toLowerCase();
	var removeSpclchar = title.replace(/[^A-Z0-9]/ig, " ")
	var finalPaperTitle = removeSpclchar.replace(/\s+/g,' ').trim();
	var paperId = paperdata.paperId;
	var subscriptionKey = 'b60240e8f77e4531b13ccb8b9b922598';
	let headers = {'Content-Type': 'application/json'}
	var params = "?expr=And(Id="+paperId+",Ti=='"+finalPaperTitle+"')&model=latest&count=10&offset=0&attributes=Id,Ti,Id,D,CC,AA.AuN,AA.AuId,AA.AfN,AA.AfId,AA.S,F.FN,F.FId,J.JN,J.JId,C.CN,C.CId,W,E.DN,E.S,E.V,E.BV,E.I,E.FP,E.FP,E.IA,E.DOI,E.VFN,E.VSN,E.PB,&subscription-key="+subscriptionKey+"" ;
	var url = 'https://api.labs.cognitive.microsoft.com/academic/v1.0/evaluate'+params;
	let results = await (r2(url, {headers}).json);
	return results;
}

exports.fetchAuthorsMircosoft = function(authorName){
	var authorName = authorName.author;
	var lowerAuthorName = authorName.toLowerCase();
	if(/[-]/.test(lowerAuthorName)){
		var authorSearchName =lowerAuthorName.replace(/-/g, "");
		var authorSearchNamenew =lowerAuthorName.replace(/[\. ,:-]+/g, " ")
		var finalauthor = authorSearchName.replace(/[^A-Z0-9]/ig, " ")
		var trimAuthor = finalauthor.trim();
		var subscriptionKey = 'b60240e8f77e4531b13ccb8b9b922598';
		let headers = {'Content-Type': 'application/json'}
		var params = "?expr=Composite(AA.AuN=='"+trimAuthor+"')&model=latest&count=10&offset=0&attributes=Id,Ti,D,CC,AA.AuN,AA.AuId,E.DN,E.BV,J.JN,C.CN,E.VFN,E.PB&subscription-key="+subscriptionKey+"" ;
		var url = 'https://api.labs.cognitive.microsoft.com/academic/v1.0/evaluate'+params;
		const resultAuthors = await(r2(url,{headers}).json);
		return resultAuthors;
	}
	else{
		var authorSearchName =lowerAuthorName.replace(/[\. ,:-]+/g, " ")
		var finalauthor = authorSearchName.replace(/[^A-Z0-9]/ig, " ")
		var trimAuthor = finalauthor.trim();
		var subscriptionKey = 'b60240e8f77e4531b13ccb8b9b922598';
		let headers = {'Content-Type': 'application/json'}
		var params = "?expr=Composite(AA.AuN=='"+trimAuthor+"')&model=latest&count=10&offset=0&attributes=Id,Ti,D,CC,AA.AuN,AA.AuId,E.DN,E.BV,J.JN,C.CN,E.VFN,E.PB&subscription-key="+subscriptionKey+"" ;
		var url = 'https://api.labs.cognitive.microsoft.com/academic/v1.0/evaluate'+params;
		const resultAuthors = await(r2(url,{headers}).json);
		return resultAuthors;
	
	}   
}


exports.bulkSavePapers = async(function(papersAll,userGraphId,UserId){
	var userId=papersAll.userId;
	var papers = papersAll.paper;
	var count = 0;
	for(let paper of papers){
		const checkPaperExists = await(checkPaperExistsperID(paper,UserId))
		if(checkPaperExists.length!=0){
			// paperPush.push(checkPaperExists)
			count =count +1;
		}
		else{
		const savePapers = await(savePapersAuthors(paper,userId))
		if(savePapers)		{
			const pushPaperId = await(saveUserPaperId(savePapers))
			if(pushPaperId){
				var pushGraphdata = await(graphCronService.calculateCitations(savePapers,userGraphId))
				console.log("saved to papers to")
			}
			else{
				console.log("error occured while updating user papers")
			}
		}
		else{
			console.log("error occured while saving papers")
		}
		}
	}
	return count;
})


function savePapersAuthors(paper,userId){
	var paperUploads = new Paperupload;
	if(paper.hasOwnProperty('AA')){
		var coauthors = paper.AA.map(function(paperdetails){ return paperdetails.AuN})
		if(paper.hasOwnProperty('F')){
			var  tags= paper.F.map(function(paperdetails){return paperdetails.FN})
			if(paper.hasOwnProperty('C')){
				if(paper.hasOwnProperty('S')){
					paperUploads.papertitle = paper.Ti;
					paperUploads.paperabstract = paper.description;
					paperUploads.tags = tags;
					paperUploads.coauthors = coauthors; 
					paperUploads.publicationname=paper.PB;
					paperUploads.publicationdate = paper.D;
					paperUploads.paperLink = paper.S[0].U;
					paperUploadedId=paper.Id;
					paperUploads.paperType ='Conference';
					paperUploads.doi = paper.DOI; 
					paperUploads.paperUploadedId=paper.Id;
					paperUploads.uploadBy = 'user'; 
					paperUploads.downloadPapers = 0;
					paperUploads.views= 0; 
					paperUploads.citations = paper.CC;
					paperUploads.publicationVenue = paper.VFN; 
					paperUploads.userId = userId;
					// console.log("paperUploads",paperUploads)
					return paperUploads.save()
				}
				else{
					paperUploads.papertitle = paper.Ti;
					paperUploads.paperabstract = paper.description;
					paperUploads.tags = tags;
					paperUploads.coauthors = coauthors; 
					paperUploads.publicationname=paper.PB;
					paperUploads.publicationdate = paper.D;
					paperUploadedId=paper.Id;
					paperUploads.paperType ='Conference';
					paperUploads.doi = paper.DOI; 
					paperUploads.paperUploadedId=paper.Id;
					paperUploads.uploadBy = 'user'; 
					paperUploads.downloadPapers = 0;
					paperUploads.views= 0; 
					paperUploads.citations = paper.CC;
					paperUploads.publicationVenue = paper.VFN; 
					paperUploads.userId = userId;
					// console.log("paperUploads",paperUploads)
					return paperUploads.save()
				}
			}
			else if(paper.hasOwnProperty('J')){
				if(paper.hasOwnProperty('S')){
					paperUploads.paperLink = paper.S[0].U;
					paperUploads.papertitle = paper.Ti;
					paperUploads.paperabstract = paper.description;
					paperUploads.tags = tags;
					paperUploads.coauthors = coauthors; 
					paperUploads.publicationname=paper.PB;
					paperUploads.publicationdate = paper.D;
					paperUploadedId=paper.Id;
					paperUploads.paperType ='Journal';
					paperUploads.doi = paper.DOI; 
					paperUploads.paperUploadedId=paper.Id;
					paperUploads.uploadBy = 'user'; 
					paperUploads.downloadPapers = 0;
					paperUploads.views= 0; 
					paperUploads.citations = paper.CC;
					paperUploads.publicationVenue = paper.VFN; 
					paperUploads.userId = userId;
					// console.log("paperUploads",paperUploads)
					return paperUploads.save()
				}
				else{
					paperUploads.papertitle = paper.Ti;
					paperUploads.paperabstract = paper.description;
					paperUploads.tags = tags;
					paperUploads.coauthors = coauthors; 
					paperUploads.publicationname=paper.PB;
					paperUploads.publicationdate = paper.D;
					paperUploadedId=paper.Id;
					paperUploads.paperType ='Journal';
					paperUploads.doi = paper.DOI; 
					paperUploads.paperUploadedId=paper.Id;
					paperUploads.uploadBy = 'user'; 
					paperUploads.downloadPapers = 0;
					paperUploads.views= 0; 
					paperUploads.citations = paper.CC;
					paperUploads.publicationVenue = paper.VFN; 
					paperUploads.userId = userId;
					// console.log("paperUploads",paperUploads)
					return paperUploads.save()
				}
			}
			else{
				if(paper.hasOwnProperty('S')){
					paperUploads.paperLink = paper.S[0].U;
					paperUploads.papertitle = paper.Ti;
					paperUploads.paperabstract = paper.description;
					paperUploads.tags = tags;
					paperUploads.coauthors = coauthors; 
					paperUploads.publicationname=paper.PB;
					paperUploads.publicationdate = paper.D;
					paperUploadedId=paper.Id;
					paperUploads.paperType ='Journal';
					paperUploads.doi = paper.DOI; 
					paperUploads.paperUploadedId=paper.Id;
					paperUploads.uploadBy = 'user'; 
					paperUploads.downloadPapers = 0;
					paperUploads.views= 0; 
					paperUploads.citations = paper.CC;
					paperUploads.publicationVenue = paper.VFN; 
					paperUploads.userId = userId;
					// console.log("paperUploads",paperUploads)
					return paperUploads.save()
				}
				else{
					paperUploads.papertitle = paper.Ti;
					paperUploads.paperabstract = paper.description;
					paperUploads.tags = tags;
					paperUploads.coauthors = coauthors; 
					paperUploads.publicationname=paper.PB;
					paperUploads.publicationdate = paper.D;
					paperUploadedId=paper.Id;
					paperUploads.paperType ='Journal';
					paperUploads.doi = paper.DOI; 
					paperUploads.paperUploadedId=paper.Id;
					paperUploads.uploadBy = 'user'; 
					paperUploads.downloadPapers = 0;
					paperUploads.views= 0; 
					paperUploads.citations = paper.CC;
					paperUploads.publicationVenue = paper.VFN; 
					paperUploads.userId = userId;
					// console.log("paperUploads",paperUploads)
					return paperUploads.save()
				}
			}
		}
		else{
			if(paper.hasOwnProperty('C')){
				if(paper.hasOwnProperty('S')){
					paperUploads.papertitle = paper.Ti;
					paperUploads.paperabstract = paper.description;
					paperUploads.coauthors = coauthors; 
					paperUploads.publicationname=paper.PB;
					paperUploads.publicationdate = paper.D;
					paperUploadedId=paper.Id;
					paperUploads.paperLink = paper.S[0].U;
					paperUploads.paperType ='Conference';
					paperUploads.doi = paper.DOI; 
					paperUploads.paperUploadedId=paper.Id;
					paperUploads.uploadBy = 'user'; 
					paperUploads.downloadPapers = 0;
					paperUploads.views= 0; 
					paperUploads.citations = paper.CC;
					paperUploads.publicationVenue = paper.VFN; 
					paperUploads.userId = userId;
					// console.log("paperUploads",paperUploads)
					return paperUploads.save()
				}
				else{
					paperUploads.papertitle = paper.Ti;
					paperUploads.paperabstract = paper.description;
					paperUploads.coauthors = coauthors; 
					paperUploads.publicationname=paper.PB;
					paperUploads.publicationdate = paper.D;
					paperUploadedId=paper.Id;
					paperUploads.paperType ='Conference';
					paperUploads.doi = paper.DOI; 
					paperUploads.paperUploadedId=paper.Id;
					paperUploads.uploadBy = 'user'; 
					paperUploads.downloadPapers = 0;
					paperUploads.views= 0; 
					paperUploads.citations = paper.CC;
					paperUploads.publicationVenue = paper.VFN; 
					paperUploads.userId = userId;
					// console.log("paperUploads",paperUploads)
					return paperUploads.save()
				}
			}
			else if(paper.hasOwnProperty('J')){
				if(paper.hasOwnProperty('S')){
					paperUploads.papertitle = paper.Ti;
					paperUploads.paperabstract = paper.description;
					paperUploads.coauthors = coauthors; 
					paperUploads.publicationname=paper.PB;
					paperUploads.publicationdate = paper.D;
					paperUploads.paperLink = paper.S[0].U;
					paperUploadedId=paper.Id;
					paperUploads.paperType ='Journal';
					paperUploads.doi = paper.DOI; 
					paperUploads.paperUploadedId=paper.Id;
					paperUploads.uploadBy = 'user'; 
					paperUploads.downloadPapers = 0;
					paperUploads.views= 0; 
					paperUploads.citations = paper.CC;
					paperUploads.publicationVenue = paper.VFN; 
					paperUploads.userId = userId;
					// console.log("paperUploads",paperUploads)
					return paperUploads.save()
				}	
				else{
					paperUploads.papertitle = paper.Ti;
					paperUploads.paperabstract = paper.description;
					paperUploads.coauthors = coauthors; 
					paperUploads.publicationname=paper.PB;
					paperUploads.publicationdate = paper.D;
					paperUploadedId=paper.Id;
					paperUploads.paperType ='Journal';
					paperUploads.doi = paper.DOI; 
					paperUploads.paperUploadedId=paper.Id;
					paperUploads.uploadBy = 'user'; 
					paperUploads.downloadPapers = 0;
					paperUploads.views= 0; 
					paperUploads.citations = paper.CC;
					paperUploads.publicationVenue = paper.VFN; 
					paperUploads.userId = userId;
					// console.log("paperUploads",paperUploads)
					return paperUploads.save()
				}
			}
			else{
				if(paper.hasOwnProperty('S')){
					paperUploads.papertitle = paper.Ti;
					paperUploads.paperabstract = paper.description;
					paperUploads.coauthors = coauthors; 
					paperUploads.publicationname=paper.PB;
					paperUploads.publicationdate = paper.D;
					paperUploadedId=paper.Id;
					paperUploads.paperType ='Journal';
					paperUploads.paperLink = paper.S[0].U;
					paperUploads.doi = paper.DOI; 
					paperUploads.paperUploadedId=paper.Id;
					paperUploads.uploadBy = 'user'; 
					paperUploads.downloadPapers = 0;
					paperUploads.views= 0; 
					paperUploads.citations = paper.CC;
					paperUploads.publicationVenue = paper.VFN; 
					paperUploads.userId = userId;
					// console.log("paperUploads",paperUploads)
					return paperUploads.save()
				}
				else{
					paperUploads.papertitle = paper.Ti;
					paperUploads.paperabstract = paper.description;
					paperUploads.coauthors = coauthors; 
					paperUploads.publicationname=paper.PB;
					paperUploads.publicationdate = paper.D;
					paperUploadedId=paper.Id;
					paperUploads.paperType ='Journal';
					paperUploads.doi = paper.DOI; 
					paperUploads.paperUploadedId=paper.Id;
					paperUploads.uploadBy = 'user'; 
					paperUploads.downloadPapers = 0;
					paperUploads.views= 0; 
					paperUploads.citations = paper.CC;
					paperUploads.publicationVenue = paper.VFN; 
					paperUploads.userId = userId;
					// console.log("paperUploads",paperUploads)
					return paperUploads.save()
				}
			}
		}	
	}
	else if(paper.hasOwnProperty('F')) {
		var  tags= paper.F.map(function(paperdetails){ paperdetails.FN})
		if(paper.hasOwnProperty('AA')){
			var coauthors = paper.AA.map(function(paperdetails){ return paperdetails.AuN})
			if(paper.hasOwnProperty('C')){
				if(paper.hasOwnProperty('S')){
					paperUploads.papertitle = paper.Ti;
					paperUploads.paperabstract = paper.description;
					paperUploads.tags = tags;
					paperUploads.coauthors = coauthors; 
					paperUploads.publicationname=paper.PB;
					paperUploads.publicationdate = paper.D;
					paperUploadedId=paper.Id;
					paperUploads.paperType ='Conference';
					paperUploads.doi = paper.DOI; 
					paperUploads.paperLink = paper.S[0].U;
					paperUploads.paperUploadedId=paper.Id;
					paperUploads.uploadBy = 'user'; 
					paperUploads.downloadPapers = 0;
					paperUploads.views= 0; 
					paperUploads.citations = paper.CC;
					paperUploads.publicationVenue = paper.VFN; 
					paperUploads.userId = userId;
					// console.log("paperUploads",paperUploads)
					return paperUploads.save()
				}
				else{
					paperUploads.papertitle = paper.Ti;
					paperUploads.paperabstract = paper.description;
					paperUploads.tags = tags;
					paperUploads.coauthors = coauthors; 
					paperUploads.publicationname=paper.PB;
					paperUploads.publicationdate = paper.D;
					paperUploadedId=paper.Id;
					paperUploads.paperType ='Conference';
					paperUploads.doi = paper.DOI; 
					paperUploads.paperUploadedId=paper.Id;
					paperUploads.uploadBy = 'user'; 
					paperUploads.downloadPapers = 0;
					paperUploads.views= 0; 
					paperUploads.citations = paper.CC;
					paperUploads.publicationVenue = paper.VFN; 
					paperUploads.userId = userId;
					// console.log("paperUploads",paperUploads)
					return paperUploads.save()
				}
			}
			else if(paper.hasOwnProperty('J')){
				if(paper.hasOwnProperty('S')){
					paperUploads.papertitle = paper.Ti;
					paperUploads.paperabstract = paper.description;
					paperUploads.tags = tags;
					paperUploads.coauthors = coauthors; 
					paperUploads.publicationname=paper.PB;
					paperUploads.publicationdate = paper.D;
					paperUploadedId=paper.Id;
					paperUploads.paperType ='Journal';
					paperUploads.doi = paper.DOI; 
					paperUploads.paperUploadedId=paper.Id;
					paperUploads.paperLink = paper.S[0].U;
					paperUploads.uploadBy = 'user'; 
					paperUploads.downloadPapers = 0;
					paperUploads.views= 0; 
					paperUploads.citations = paper.CC;
					paperUploads.publicationVenue = paper.VFN; 
					paperUploads.userId = userId;
					// console.log("paperUploads",paperUploads)
					return paperUploads.save()
				}
				else{
					paperUploads.papertitle = paper.Ti;
					paperUploads.paperabstract = paper.description;
					paperUploads.tags = tags;
					paperUploads.coauthors = coauthors; 
					paperUploads.publicationname=paper.PB;
					paperUploads.publicationdate = paper.D;
					paperUploadedId=paper.Id;
					paperUploads.paperType ='Journal';
					paperUploads.doi = paper.DOI; 
					paperUploads.paperUploadedId=paper.Id;
					paperUploads.uploadBy = 'user'; 
					paperUploads.downloadPapers = 0;
					paperUploads.views= 0; 
					paperUploads.citations = paper.CC;
					paperUploads.publicationVenue = paper.VFN; 
					paperUploads.userId = userId;
					// console.log("paperUploads",paperUploads)
					return paperUploads.save()
				}
			}
			else{
				if(paper.hasOwnProperty('S')){
					paperUploads.papertitle = paper.Ti;
					paperUploads.paperabstract = paper.description;
					paperUploads.tags = tags;
					paperUploads.coauthors = coauthors; 
					paperUploads.publicationname=paper.PB;
					paperUploads.publicationdate = paper.D;
					paperUploadedId=paper.Id;
					paperUploads.paperType ='Journal';
					paperUploads.doi = paper.DOI; 
					paperUploads.paperLink = paper.S[0].U;
					paperUploads.paperUploadedId=paper.Id;
					paperUploads.uploadBy = 'user'; 
					paperUploads.downloadPapers = 0;
					paperUploads.views= 0; 
					paperUploads.citations = paper.CC;
					paperUploads.publicationVenue = paper.VFN; 
					paperUploads.userId = userId;
					// console.log("paperUploads",paperUploads)
					return paperUploads.save()
				}
				else{
					paperUploads.papertitle = paper.Ti;
					paperUploads.paperabstract = paper.description;
					paperUploads.tags = tags;
					paperUploads.coauthors = coauthors; 
					paperUploads.publicationname=paper.PB;
					paperUploads.publicationdate = paper.D;
					paperUploadedId=paper.Id;
					paperUploads.paperType ='Journal';
					paperUploads.doi = paper.DOI; 
					paperUploads.paperUploadedId=paper.Id;
					paperUploads.uploadBy = 'user'; 
					paperUploads.downloadPapers = 0;
					paperUploads.views= 0; 
					paperUploads.citations = paper.CC;
					paperUploads.publicationVenue = paper.VFN; 
					paperUploads.userId = userId;
					// console.log("paperUploads",paperUploads)
					return paperUploads.save()
				}
			}
		}
		else{
			if(paper.hasOwnProperty('S')){
				paperUploads.papertitle = paper.Ti;
				paperUploads.paperabstract = paper.description;
				paperUploads.publicationname=paper.PB;
				paperUploads.publicationdate = paper.D;
				paperUploadedId=paper.Id;
				paperUploads.tags = tags;
				paperUploads.paperType ='Journal';
				paperUploads.paperLink = paper.S[0].U;
				paperUploads.doi = paper.DOI; 
				paperUploads.paperUploadedId=paper.Id;
				paperUploads.uploadBy = 'user'; 
				paperUploads.downloadPapers = 0;
				paperUploads.views= 0; 
				paperUploads.citations = paper.CC;
				paperUploads.publicationVenue = paper.VFN; 
				paperUploads.userId = userId;
				// console.log("paperUploads",paperUploads)
				return paperUploads.save()
			}
			else{
				paperUploads.papertitle = paper.Ti;
				paperUploads.paperabstract = paper.description;
				paperUploads.publicationname=paper.PB;
				paperUploads.publicationdate = paper.D;
				paperUploadedId=paper.Id;
				paperUploads.tags = tags;
				paperUploads.paperType ='Journal';
				paperUploads.doi = paper.DOI; 
				paperUploads.paperUploadedId=paper.Id;
				paperUploads.uploadBy = 'user'; 
				paperUploads.downloadPapers = 0;
				paperUploads.views= 0; 
				paperUploads.citations = paper.CC;
				paperUploads.publicationVenue = paper.VFN; 
				paperUploads.userId = userId;
				// console.log("paperUploads",paperUploads)
				return paperUploads.save()
			}
		}
	}
	else{
		if(paper.hasOwnProperty('C')){
			if(paper.hasOwnProperty('S')){
				paperUploads.papertitle = paper.Ti;
				paperUploads.paperabstract = paper.description;
				paperUploads.publicationname=paper.PB;
				paperUploads.publicationdate = paper.D;
				paperUploadedId=paper.Id;
				paperUploads.paperType ='Conference';
				paperUploads.doi = paper.DOI; 
				paperUploads.paperUploadedId=paper.Id;
				paperUploads.paperLink = paper.S[0].U;
				paperUploads.uploadBy = 'user'; 
				paperUploads.downloadPapers = 0;
				paperUploads.views= 0; 
				paperUploads.citations = paper.CC;
				paperUploads.publicationVenue = paper.VFN; 
				paperUploads.userId = userId;
				// console.log("paperUploads",paperUploads)
				return paperUploads.save()
			}
			else{
				paperUploads.papertitle = paper.Ti;
				paperUploads.paperabstract = paper.description;
				paperUploads.publicationname=paper.PB;
				paperUploads.publicationdate = paper.D;
				paperUploadedId=paper.Id;
				paperUploads.paperType ='Conference';
				paperUploads.doi = paper.DOI; 
				paperUploads.paperUploadedId=paper.Id;
				paperUploads.uploadBy = 'user'; 
				paperUploads.downloadPapers = 0;
				paperUploads.views= 0; 
				paperUploads.citations = paper.CC;
				paperUploads.publicationVenue = paper.VFN; 
				paperUploads.userId = userId;
				// console.log("paperUploads",paperUploads)
				return paperUploads.save()
			}
		}
		else if(paper.hasOwnProperty('J')){
			if(paper.hasOwnProperty('S')){
				paperUploads.papertitle = paper.Ti;
				paperUploads.paperabstract = paper.description;
				paperUploads.publicationname=paper.PB;
				paperUploads.publicationdate = paper.D;
				paperUploadedId=paper.Id;
				paperUploads.paperType ='Journal';
				paperUploads.doi = paper.DOI; 
				paperUploads.paperUploadedId=paper.Id;
				paperUploads.paperLink = paper.S[0].U;
				paperUploads.uploadBy = 'user'; 
				paperUploads.downloadPapers = 0;
				paperUploads.views= 0; 
				paperUploads.citations = paper.CC;
				paperUploads.publicationVenue = paper.VFN; 
				paperUploads.userId = userId;
				// console.log("paperUploads",paperUploads)
				return paperUploads.save()
			}
			else{
					paperUploads.papertitle = paper.Ti;
					paperUploads.paperabstract = paper.description;
					paperUploads.publicationname=paper.PB;
					paperUploads.publicationdate = paper.D;
					paperUploadedId=paper.Id;
					paperUploads.paperType ='Journal';
					paperUploads.doi = paper.DOI; 
					paperUploads.paperUploadedId=paper.Id;
					paperUploads.uploadBy = 'user'; 
					paperUploads.downloadPapers = 0;
					paperUploads.views= 0; 
					paperUploads.citations = paper.CC;
					paperUploads.publicationVenue = paper.VFN; 
					paperUploads.userId = userId;
					// console.log("paperUploads",paperUploads)
					return paperUploads.save()
			}
		}
		else{
			if(paper.hasOwnProperty('S')){
				paperUploads.papertitle = paper.Ti;
				paperUploads.paperabstract = paper.description;
				paperUploads.publicationname=paper.PB;
				paperUploads.publicationdate = paper.D;
				paperUploadedId=paper.Id;
				paperUploads.paperType ='Journal';
				paperUploads.paperLink = paper.S[0].U;
				paperUploads.doi = paper.DOI; 
				paperUploads.paperUploadedId=paper.Id;
				paperUploads.uploadBy = 'user'; 
				paperUploads.downloadPapers = 0;
				paperUploads.views= 0; 
				paperUploads.citations = paper.CC;
				paperUploads.publicationVenue = paper.VFN; 
				paperUploads.userId = userId;
				// console.log("paperUploads",paperUploads)
				return paperUploads.save()
			}
			else{
				paperUploads.papertitle = paper.Ti;
				paperUploads.paperabstract = paper.description;
				paperUploads.publicationname=paper.PB;
				paperUploads.publicationdate = paper.D;
				paperUploadedId=paper.Id;
				paperUploads.paperType ='Journal';
				paperUploads.doi = paper.DOI; 
				paperUploads.paperUploadedId=paper.Id;
				paperUploads.uploadBy = 'user'; 
				paperUploads.downloadPapers = 0;
				paperUploads.views= 0; 
				paperUploads.citations = paper.CC;
				paperUploads.publicationVenue = paper.VFN; 
				paperUploads.userId = userId;
				// console.log("paperUploads",paperUploads)
				return paperUploads.save()
			}
		}
	} 
}

function checkPaperExistsperID(paper,userID){
	return Paperupload.find({$and:[{paperUploadedId:paper.Id},{userId:userID}]}).lean();
}

function saveUserPaperId(papers){
	return Users.updateOne({_id:papers.userId},{$push:{paper:papers._id}})
}


exports.fetchAbstract = function(paperDetails){
	var paperObjDetails = paperDetails[0];
	if(!("IA" in paperObjDetails)){
		var paperContentDesc='';
		return paperContentDesc;
	}
	else{
	  	var fetchPaperIA = paperDetails[0].IA.InvertedIndex;
		let words = [];
		Object.getOwnPropertyNames(fetchPaperIA).forEach(propertyName =>
		  fetchPaperIA[propertyName].forEach(value => words[value] = propertyName)
		);
		const PaperAbstract = words.join(' ');
		return PaperAbstract;
	}
}

exports.fetchFollowed = function(userId){
	return Follow.find({userId:userId})
}

exports.userPaperDelete = function(userId,paperId){
	return Users.findOneAndUpdate({_id:userId},{ $pull : { "paper" : paperId  } },{new: true});
}


exports.paperRecent = function(){
	return Paperupload.find({uploadBy:"user"}).populate('userId','_id firstname lastname profileImg role organization').sort({createdAt:-1}).limit(1);
}

//old incrementing paper view count
exports.incrementViews = function(paperId,viewsCount){
	var newCount = viewsCount+1;
	return Paperupload.findOneAndUpdate({_id:paperId},{$set:{views:newCount}},{new: true});
}
//end

exports.fetchDoi = async(function(papers){
	var paperDoi = [];
	if(papers.doi!=null){
		var doi =papers.doi;
		var url= "https://api.crossref.org/works/"+doi;
		let headers = {'Content-Type': 'application/json'};
		let results = await (r2(url, {headers}).json);
		paperDoi.push({citations:results.message['is-referenced-by-count'],paperId:papers._id})
		return paperDoi;
	}
	else{
		paperDoi.push({citations:0,paperId:papers._id})
		return paperDoi;
	}
})



exports.updatePapersCiataions = function(citaionDetails){
	return Paperupload.findOneAndUpdate({_id:mongoose.Types.ObjectId(citaionDetails[0].paperId)},{$set:{citations: citaionDetails[0].citations}},{upsert: true, new: true});
}

exports.removePapersRSS = function(){
	return  Graph.update({_id:'5cb9a79cbcd9fa1819e6c01d'}, { $set : {papers:[]}} , {multi:true} ).lean();
}

exports.insertPaper=async(function(title, link, content,author,pubDate,singlePaper){
	var description = content.replace(/<[^>]*>/g, ' ');
	var newDescription = description.substring(description.indexOf('Abstract') + 11);
	var paperTitlenew = title.substring(title.indexOf(":") + 1);
	var finalTitle = paperTitlenew.replace(/<(.|\n)*?>/g, ' ');
	var paperUploads = new Paperupload;
	paperUploads.paperRsstitle = finalTitle;
	paperUploads.paperabstract = newDescription; 
	paperUploads.coauthors = author.split(","); 
	paperUploads.publicationname=singlePaper.name;
	paperUploads.publicationdate = pubDate;
	paperUploads.paperType = singlePaper.type;
	paperUploads.downloadPapers = 0;
	paperUploads.uploadBy = "rssupload";
	paperUploads.views= 0; 
	paperUploads.views= 0;
	paperUploads.paperLogo = singlePaper.image;
	paperUploads.paperSourceLink = singlePaper.website;
	paperUploads.paperLink = link;
	paperUploads.save(function(err, newFamily) {
		if(err){
			console.log("duplicate error");
		}
		else{
			return paperUploads;			
		}
	})
})



exports.fetchAllPaperstodelete = function(userId){
	return Paperupload.find({userId:userId}).select('_id');
}


exports.deletePaperBookmarks = function(paper){
	return Bookmark.remove({paperId:paper._id})
}

exports.deletePaperrecommended = function(paper){
	return Recommend.remove({recommended:paper._id})
}

exports.deletePaperviews = function(paper){
	return Viewdownloads.remove({paperId:paper._id})
}

exports.deletePaperInPapermonthsnapshot = function(paper){
	return PapermonthSnapshot.remove({paperId:paper._id})
}

exports.deletePaperInpapers = function(paper){
	return Paperupload.findOneAndRemove({_id:paper._id})
}
exports.feedsByTopicId = async(function(id) {
    console.log("in servicce",id)
    return Paperupload.find({ topics: {$eq: mongoose.Types.ObjectId(id)}}).populate('topics').sort({createdAt:-1}).limit(100);
})