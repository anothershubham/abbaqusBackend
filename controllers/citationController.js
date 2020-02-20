const citationService = require('../services/citation');
const userService = require('../services/userService');
const Graph = require('../models/graph');
const User = require('../models/users');
const Async = require('async');
const async = require('asyncawait/async');
const await = require('asyncawait/await');
var Promise = require('promise');
var _ = require('lodash');

exports.getCitation = function (req, res, next) {
    citationService.getCitationDetails('10.1016/j.reseneeco.2013.04.004', function (err, response) {
        if (err) {
            return res.send(err);
        } else {
            return res.send(response);
        }
    })
}

//api to update views and downloads in graph table cron
exports.viewsDownloadUpdate = async(function(req,res,next){
    try{
        const fetchAllUsers = await(citationService.fetchAllUser())
        res.json({status:200,message:'Success'})
        if(fetchAllUsers.length!==0){
            const fetchUsersPapers = await(citationService.fetchUserPapers(fetchAllUsers))
        }
        else{
            return res.json({status:400,message:"User does not exist"})
        }
        }
    catch(err){
        return res.json({status:500,message:'Error occured',err:err})
    }
})
//

// api to fetch top 5 citaion in research metrics
exports.topCitationPapers = async(function(req,res,next){
    try{
        const fetchTopCitationPaper = await(citationService.fetchtopCitaionPapers(req.body));
        if(fetchTopCitationPaper.length!==0){
            return res.json({status:200,message:'Success',result:fetchTopCitationPaper})
        }
        else{
            return res.json({status:400,message:'User has no Papers'})
        }
    }
    catch(err){
        return res.json({status:500,message:'Error occured'})        
    }
})
//end

//api to calculate update citations
exports.citationUpdateCron = async(function(req,res,next){
    try{
        const fetchAllUsers = await(citationService.fetchAllUser())
         res.json({status:200,message:'Success'})
        if(fetchAllUsers.length!==0){
            const fetchUsersPapers = await(citationService.fetchUserPapersForCitation(fetchAllUsers))
        }
        else{
            return res.json({status:400,message:"User does not exist"})
        }
        }
    catch(err){
        return res.json({status:500,message:'Error occured',err:err})
    }
})
//end

//api for top 5 cited paper in month
exports.fetchTopCitedPaper = async(function(req,res,next){
	try{
		const fetchUserDetails =await(citationService.fetchUserDetails(req.body)) 
		if(fetchUserDetails.length!==0){
			// cons
			const fetchTopfiveCitedPaper = await(citationService.fetchTopCitedPaperInMonth(req.body))
			if(fetchTopfiveCitedPaper.length!==0){
				return res.json({status:200,results:fetchTopfiveCitedPaper,TotalCitations:fetchUserDetails[0].graph.userData[0].totalCitation})
			}
			else{
				return res.json({status:400,message:'User does not have any papers'})
			}
			
		}
		else{
			return res.json({status:400,message:'User does not exist'})
		}
	}
	catch(err){
		return res.json({status:500,message:'Error occured'})
	}
})
// end

exports.deleteall = async(function(req,res,next){
    try{
        const removeAllPapersSnapshot = await(citationService.removall())
        if(removeAllPapersSnapshot){
            return res.json({status:200,message:'success'})
        }
        else{
           return res.json({status:500,message:'Error occured'})
        }

    }
    catch(err){
        return res.json({status:500,message:'Error occured',err:err})
    }
})

exports.updateGraphData = function (req, res, next) {
    Graph.update({ _id: req.body.id }, {
        userData: req.body.userData,
        snapshots: req.body.snapshots,
        papers: req.body.papers
    }, { multi: true }).exec(function (err, graphFound) {

        if (err) {
            res.json({ status: 500, message: "Failure" });
        } else {
            if (graphFound) {
               // graphFound.userData = req.body.userData;
               // graphFound.snapshots = req.body.snapshots;
                // graphFound.papers = req.body.papers;
                 //graphFound.save();
                res.json({ status: 200, message: "Saved", graphFound });
            } else {
                res.json({ status: 404, message: "Graph not found" });
            }
        }
    })
}

exports.userGraphData = function (req, res, next) {
    User.findOne({ _id: req.params.id })
        .populate('graph')
        .populate({path: 'graph', populate:{path: 'papers.paperId', select: 'papertitle'}}) 
        .populate('question')
        .populate('recommended_paper')
        .populate('my_recommended_paper')
        .populate('recommended_questions')
        .populate('my_recommended_questions')
        .populate('recommended_feeds')
        .populate('my_recommended_feeds')
        .exec(function (err, userFound) {
            if (err) {
                res.json({ status: 500, message: "Failure" });
            } else {
                if (userFound) {
                    res.json({ status: 200, message: "User found", data: userFound });
                } else {
                    res.json({ status: 404, message: "User not found" });
                }
            }
        })
}

exports.graphDataCron = async((req, res, next) => {
    let citation = [];
    let paramsArr = [];
    let users = await(userService.getallUsersWithPaper());
    res.json({status:200,message:'Success'});
    for (var i = 0; i < users.length; i++) {
        let totalView = 0;
        let totalDownload = 0;
        let userId = users[i]._id;
        let userGraphId = users[i].graph._id;
        if (users[i].paper) {
            let userData = {};
            for (var j = 0; j < users[i].paper.length; j++) {
                let params = [];
                let paperID = '';
                let paperTitle = '';
                let paperDoi = '';
                let paperType = '';
                if (users[i].paper.length) {
                    paperID = users[i].paper[j];
                    paperTitle = users[i].paper[j].papertitle;
                    paperDoi = users[i].paper[j].doi;
                    paperType = users[i].paper[j].paperType;
                    totalView = totalView + users[i].paper[j].views;
                    paperViews = users[i].paper[j].views;
                    totalDownload = totalDownload + users[i].paper[j].downloadPapers;
                    paperDownloads = users[i].paper[j].downloadPapers;
                    paperPublication = users[i].paper[j].publicationname;
                    params = {
                        totalCitation: 0,
                        totalDownload: totalDownload,
                        totalView: totalView,
                        paperId: paperID._id,
                        paperDoi:paperDoi,
                        userGraphId: userGraphId,
                        paperViews:paperViews,
                        paperDownloads:paperDownloads,
                        paperTitle: paperTitle,
                        paperType: paperType,
                        paperPublication:paperPublication
                    }
                    citationService.getCitationDetails(params, function (err, response) {
                        if (response) {
                            params.totalCitation = response.message['is-referenced-by-count'];
                            paramsArr.push(params);
                        }
                    });
                }
            }
        }
    }  
    setTimeout(function(){
        citationService.saveGraphData(paramsArr)
       },50000)  
})

exports.getGraphDataById = function (req, res, next) {
    if (req.params.id == "all") {
        Graph.find({})
            .exec(function (err, found) {
                if (err) {
                    return res.json({ status: 'faliure' })
                } else {
                    return res.send(found)
                }
            })
    } else {
        Graph.findOne({ _id: req.params.id })
            .exec(function (err, found) {
                if (err) {
                    return res.json({ status: 'faliure' })
                } else {
                    return res.send(found)
                }
            })
    }
}

exports.nullGraphData = function (req, res, next) {
    Graph.update({ _id: '5b1f845aaab1f01df6209e97' }, {
        userData: [],
        snapshots: [],
        papers: []
    }, { multi: true }).exec(function (err, graphFound) {
        if (err) {
            res.json({ status: 500, message: "Failure" });
        } else {
            if (graphFound) {
                res.json({ status: 200, message: "Saved", graphFound });
            } else {
                res.json({ status: 404, message: "Graph not found" });
            }
        }
    })
}


// api for publication in research metric
exports.impactPublication = async(function(req,res,next){
    try{
        var userId = req.body.userId;
        const checkUserexist = await(citationService.checkUser(userId))
        if(checkUserexist){
            const fetchImapactFactors = await(citationService.ImpactFactorPapers(userId))
            if(fetchImapactFactors){
                     const removeNullImpact = await(removeNullImpacts(fetchImapactFactors))
                     if(removeNullImpact){
                        const fetchImpactHindex = await(citationService.fetchhindexImpact(removeNullImpact))
                        if(fetchImpactHindex.length!==0){
                            const removeDuplicates = await(removeDuplicatesinPapers(fetchImpactHindex))
                            if(removeDuplicates){
                                const sortByImpact = await(sortImpacts(removeDuplicates))
                                return res.json({status:200,message:'Success',results:sortByImpact})
                            }
                            else{
                                console.log("Error occured while removing duplicates")
                            }
                        }
                        else{
                            return res.json({status:400,message:'Failure',results:fetchImpactHindex})
                        }
                     }
                     else{
                        console.log("error occured while removing Null and Undefined")
                     }
            }
            else{
                return res.json({status:500,message:'Error occured while fetching impact factors'})
            }
        }
        else{
            return res.json({status:500,message:'User does not exist'})
        }
    }
    catch(err){
        return res.json({status:500,message:'Error occured',err:err})
    }
})
// end



function removeDuplicatesinPapers(fetchImpactHindex){
    var papers = fetchImpactHindex.reduce(function (accumulator, current) {
      if (checkIfAlreadyExist(current)) {
        return accumulator
      } else {
        return accumulator.concat([current]);
      }
      
      function checkIfAlreadyExist(currentVal) {
        return accumulator.some(function(item){
          return (item.publicationVenue === currentVal.publicationVenue);
        });
      }
    }, []);

    return papers;

}

function sortImpacts(impactData){
    var sortedResult = impactData.sort(function(a,b){
        return b.hindex - a.hindex;
    });
    return sortedResult;
}

function removeNullImpacts(Impacts){
    var notUndefinedImpact = _.reject(Impacts, ['publicationVenue', undefined]);
    var notNullImpact = _.reject(notUndefinedImpact, ['publicationVenue', null]);
    var notEmpty = _.reject(notNullImpact, ['publicationVenue', '']);
    return notEmpty;
}