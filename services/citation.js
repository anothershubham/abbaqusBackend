const request = require('request');
const config = require('../config');
const Graph = require('../models/graph');
const User = require('../models/users');
const gHI10IndexService = require('./g_h_i10Index');
const moment = require('moment');
const async = require('asyncawait/async');
const await = require('asyncawait/await');
var mongoose    = require('mongoose');
const Paperupload = require('../models/paperUpload');
const ImpactFactor = require('../models/impactFactor');
const PapermonthSnapshot = require('../models/paperMonthSnapshot')
const graphCronService = require('../services/graphCronService')
const ObjectID = require('mongodb').ObjectID;

// for fetching papers with top citation
exports.fetchtopCitaionPapers = function(userId){
    return PapermonthSnapshot.find({userId:ObjectID(userId.userId)}).select('citations my month userId paperId year').populate('paperId','papertitle');
}
// end

//for fetching the response from crossrefapi
exports.getCitationDetails = function (params, callback) {
    var doi = params.paperDoi;
    request({
        url: "https://api.crossref.org/works/"+doi,
        method: "GET",
         headers: {
            'Content-Type': 'application/json'
        }
    }, function (err, response) {
        if (err) {
            callback(err)
            //return 0;
        }
        else {
            if (response) {
                if (response.statusCode == 200) {
                    callback(null,JSON.parse(response.body))
                    // return 3;
                } 
                else if(response.body === "Resource not found."){
                    var response = {
                        "message":{
                            "is-referenced-by-count": 0
                        }
                    }
                    callback(null,response)
                }
                else {
                    callback(response)
                }
            } else {
                callback('null response from ms api')
            }
        }
    })
}
// end

exports.fetchAllUser = function(){
    return User.find({}).select('graph').lean();
}

exports.fetchUserDetails = function(user){
    return User.find({_id:user.userId}).select('graph').populate('graph','userData');
}

exports.fetchTopCitedPaperInMonth = function(user){
    var month = moment().format('MMM').toLowerCase();
    var year = moment().format('YYYY');
    var monthYear = month + "-" + year;
    return PapermonthSnapshot.find({$and:[{userId:user.userId},{my:monthYear}]}).populate('paperId','papertitle').sort({citations:-1}).limit(5)
}


exports.fetchUserPapers = async(function(users){
    for(user of users){
        const fetchPapers = await(fetchUserPaperUploaded(user))
        if(fetchPapers.length!==0){
            for(paper of fetchPapers){
                 const updateGrapData = await(graphCronService.CalculateViewsDownloads(paper))
            }
        }
        else{
            console.log("User does not have papers")
        }
    }
})

exports.fetchUserPapersForCitation = async(function(users){
    for(user of users){
        const fetchPapers = await(fetchUserPaperUploadedForCitations(user))
        if(fetchPapers.length!==0){
            for(paper of fetchPapers){
                 const updatePaperCitations= await(graphCronService.UpdatePapersCitations(paper))
            }
        }
        else{
            console.log("User does not have papers")
        }
    }

})

function fetchUserPaperUploadedForCitations(user){
    return Paperupload.find({userId:user._id}).select('_id paperUploadedId papertitle');
}
function fetchUserPaperUploaded(user){
    return Paperupload.find({userId:user._id}).select('_id userId views downloadPapers publicationVenue citations paperType publicationdate').populate('userId','graph');
}

exports.checkUser = function(userId){
    return User.findOne({_id:userId}).lean();
}

exports.fetchhindexImpact = async(function(removeNullImpact){
    for(impact of removeNullImpact){
        const fetchHindexValues = await(hindexImpactor(impact))
        if(fetchHindexValues.length!==0){
            impact.hindex = fetchHindexValues[0].h_index;
        }
        else{
            impact.hindex = 0;
        }
    }
    return removeNullImpact;
})

function hindexImpactor(impact){
    return ImpactFactor.find({journalName:impact.publicationVenue}).lean()
}

exports.ImpactFactorPapers = function(userId){
    return Paperupload.find({$and:[{userId:userId},{paperType:"Journal"}]}).select('publicationVenue').lean();
}

// api to remove cron data
exports.removall = function(){
     return Graph.update({}, { $set : {snapshots:[]}} , {multi:true} ).lean();
}
// end

exports.citationReq = function (params, callback) {
    return 'params';
}

exports.saveGraphData = async(function (paramsArr, callback) {
    paramsArr.map((params) => {
         let feeds = await(this.saveIteration(params)); 
    })
    console.log("=====completed graph paper updated==============")
    graphCaluateCron();
    console.log("===============calculation of graph completed==============")

});

function graphCaluateCron(){
    try{
        const fetchallgraphId = await(fetchallGraphId()) 
        if(fetchallgraphId.length!=0){
            const calcaulateGraphData = await(calculateGraph(fetchallgraphId))
        }
        else{
            console.log("No graphdata present")
        }
    }
    catch(err){
        console.log("error occured",err)
    }
}

exports.saveIteration = async(function(params){
    let month = moment().format('MMM').toLowerCase();
    let year = moment().format('YYYY');
    let monthYear = month + "-" + year;
    var graphIdExist = await(Graph.findOne({_id:params.userGraphId}).lean());
    if(graphIdExist){
        var checkMainSnapshotwithmonthExist = await(Graph.findOne({$and:[{_id:params.userGraphId},{ snapshots: { $elemMatch: { my: monthYear } } }]}).lean())
        if(checkMainSnapshotwithmonthExist){
            console.log("main snapshot already exists")
            //push papers
            var checkPaperexist = await(Graph.findOne({$and:[{_id:params.userGraphId},{ papers: { $elemMatch: { paperId: params.paperId } } }]}).lean())
            if(checkPaperexist){
                var checkPapersSnapshot = await(Graph.find({ "papers": { 
                                                                "$elemMatch": {
                                                                    "paperId":params.paperId ,
                                                                    "snapshots": {
                                                                        "$elemMatch": {
                                                                            "my": monthYear
                                                                        }
                                                                    }
                                                                }
                                                            }}))
                if(checkPapersSnapshot.length!=0){
                    console.log("snapshot present for papers for that month")
                }
                else{
                    //push snapshot in that papers snapshot
                    var graphPaperSnapShotPush = await(Graph.findOneAndUpdate({_id:params.userGraphId,"papers.paperId":params.paperId},{$push:{"papers.$.snapshots":{month: month,year: year,
                    my: monthYear,
                    citation: params.totalCitation,
                    views: params.paperViews,
                    downloads: params.paperDownloads}}}));
                    if(graphPaperSnapShotPush){
                        console.log("success")
                    }
                    else{
                        console.log("error occured while pushing snapshot inside papers")
                    }
                }
            }
            else{

                let paperSnapshotParams ={
                month: month,
                year: year,
                my: monthYear,
                citation: params.totalCitation,
                views: params.paperViews,
                downloads: params.paperDownloads
                };
                let paperData = {
                    name: params.paperTitle,
                    paperId: params.paperId,
                    paperType: params.paperType,
                    totalCitation: params.totalCitation,
                    totalView: params.paperViews,
                    totalDownload: params.paperDownloads,
                    paperPublication:params.paperPublication,
                    snapshots: [paperSnapshotParams]
                }

                var graphPaperpush = await(Graph.findOneAndUpdate({_id:params.userGraphId},{$push:{papers:paperData}}))
                if(graphPaperpush){
                    console.log("pushed papers success fully")
                }
                else{
                    console.log("error occured while pushing papers")
                }
                }
        }
        else{
            let newObjSnapshot = {
            month: month,
            year: year,
            my: monthYear,
            citation: 0,
            views: 0,
            downloads:0
            }
            var graphMainSnapShotPush = await(Graph.findOneAndUpdate({_id:params.userGraphId},{$push:{snapshots:newObjSnapshot}}))
            if(graphMainSnapShotPush){
                //push papers
            var checkPaperexist = await(Graph.findOne({$and:[{_id:params.userGraphId},{ papers: { $elemMatch: { paperId: params.paperId } } }]}).lean())
            if(checkPaperexist){
                console.log("paper already exist")
            }
            else{
                let paperSnapshotParams ={
                month: month,
                year: year,
                my: monthYear,
                citation: params.totalCitation,
                views: params.paperViews,
                downloads: params.paperDownloads
                };
                let paperData = {
                    name: params.paperTitle,
                    paperId: params.paperId,
                    paperType: params.paperType,
                    totalCitation: params.totalCitation,
                    totalView: params.paperViews,
                    totalDownload: params.paperDownloads,
                    paperPublication:params.paperPublication,
                    snapshots: [paperSnapshotParams]
                }

                var graphPaperSnapShotPush = await(Graph.findOneAndUpdate({_id:params.userGraphId},{$push:{papers:paperData}}))
                
                }
            }
            else{
                console.log("eror occured while pushing main snapshot")
            }
        }
    }
    else{
        console.log("error occured while fetching graphId")
    } 
})

   
function calculateGraph(graphData){
    let month = moment().format('MMM').toLowerCase();
    let year = moment().format('YYYY');
    let monthYear = month + "-" + year;
    var count = 0;
    for(var i = 0;i<graphData.length; i++){
        if(graphData[i].papers.length > 0){
            const calculateCitationViewsDownloads = await(calculateGraphateCitationsDownloads(graphData[i].papers))
            count++;
            if(calculateCitationViewsDownloads.length!=0){
                if(graphData[i].snapshots.length<=1){
                    //first time inserting Citation views downloads of all papers into main Snapshot 
                    const updateSnapShot = await(updateMainSnapshot(graphData[i]._id,calculateCitationViewsDownloads,monthYear))
                    if(updateSnapShot){
                        const updateuserData =  await(updateUserDatagraph(calculateCitationViewsDownloads,graphData[i]._id,graphData[i].userData))
                        if(updateuserData){
                            console.log("success")
                        }
                        else{
                            console.log("error occured while updating userData")
                        }
                    }
                    else{
                        console.log("error occured")
                    }
                }
                else{
                    // console.log("have to check snapshot previous month and subtract citation views and dowloads from n-1 mainSnapsot")
                    const updateSnapshotwithDifference = await(calculateDifferenceSnapshots(graphData[i]._id,graphData[i].snapshots,calculateCitationViewsDownloads,monthYear))
                    if(updateSnapshotwithDifference){
                        const updateUsergraphData = await(insertUserGraphData(calculateCitationViewsDownloads,graphData[i].userData,graphData[i].snapshots,graphData[i]._id))
                        if(updateUsergraphData){
                            console.log("success")
                        }
                        else{
                            console.log("error occured while updating user graph data differnece snapshot ")
                        }
                    }
                    else{
                        console.log("error occured while updating the difference  in snapshots")
                    }
                }
            }
            else{
                console.log("errror occured while fetching paper added citations downloads views")
            }
            // console.log("calculateCitationViewsDownloads",calculateCitationViewsDownloads)
        }
        else{
            // console.log("graphData",graphData[i]._id)
        } 
    }
}

function fetchallGraphId (){
    return Graph.find({}).lean();
}

function getCitationArray(arr) {
    return arr.map(function (obj) {
        return obj.citation;
    })
}
       
function calculateGraphateCitationsDownloads(papers){
    var papersData = [];   
    var totalCitation =0;
    var totalDownload = 0;
    var totalViews = 0;
    for(i=0;i<papers.length;i++){
        totalCitation = totalCitation+ papers[i].totalCitation;
        totalDownload = totalDownload+papers[i].totalDownload;;
        totalViews = totalViews+papers[i].totalView;
    } 
    papersData.push({totalCitation:totalCitation,totalDownload:totalDownload,totalViews,totalViews});
    return papersData;
}

function updateMainSnapshot(graphId,snapshotData,my){
    return Graph.findOneAndUpdate({_id:graphId,"snapshots.my":my},{$set:{"snapshots.$.citation":snapshotData[0].totalCitation,"snapshots.$.views":snapshotData[0].totalViews,"snapshots.$.downloads":snapshotData[0].totalDownload}})
}

function updateUserDatagraph(paperData,graphId,userdata){
    var cit= [];
    var totalCitation = paperData[0].totalCitation;
    cit.push(totalCitation);
    var fetchIndexing = await(gHI10IndexService.indexing(cit))
    // console.log("FetchIndexing",fetchIndexing)
    if(userdata.length!=0){
        return Graph.updateOne({_id:graphId,"userData.0._id":userdata._id},
        {$set:{"userData.$.totalCitation":paperData[0].totalCitation,
        "userData.$.totalView":paperData[0].totalViews,
        "userData.$.totalDownload":paperData[0].totalDownload,
        "userData.$.gIndex":fetchIndexing.gCount,
        "userData.$.hIndex":fetchIndexing.hCount,
        "userData.$.i10Index":fetchIndexing.i10Count
        }})
    }
    else{
        return Graph.findOneAndUpdate({_id:graphId},
        {$push:{"userData":{"totalCitation":paperData[0].totalCitation,
        "totalView":paperData[0].totalViews,
        "totalDownload":paperData[0].totalDownload,
        "gIndex":fetchIndexing.gCount,
        "hIndex":fetchIndexing.hCount,
        "i10Index":fetchIndexing.i10Count
        }}})
    }
}

function calculateDifferenceSnapshots(graphId,existingSnapshot,paperdata,monthYear){
    var previousSnapshot = existingSnapshot.slice(-2)[0];
    var newCitation = 0;
    var newDownloads = 0;
    var newViews = 0;
    // console.log("previousSnapshot",previousSnapshot)
    newCitation = paperdata[0].totalCitation - previousSnapshot.citation;
    newDownloads = paperdata[0].totalDownload - previousSnapshot.downloads;
    newViews = paperdata[0].totalViews - previousSnapshot.views;
    return Graph.findOneAndUpdate({_id:graphId,"snapshots.my":monthYear},{$set:{"snapshots.$.citation":newCitation,"snapshots.$.views":newDownloads,"snapshots.$.downloads":newViews}})
}

function insertUserGraphData(paperdata,userdata,snapshots,graphId){
    var cit = [];
    snapshots.map(function(snap){
        cit.push(snap.citation)
    })
    var fetchIndexing = await(gHI10IndexService.indexing(cit))
    return Graph.updateOne({_id:graphId,"userData.0._id":userdata._id},{
        $set:{"userData.$.totalCitation":paperdata[0].totalCitation,
            "userData.$.totalView":paperdata[0].totalViews,
            "userData.$.totalDownload":paperdata[0].totalDownload,
            "userData.$.gIndex":fetchIndexing.gCount,
            "userData.$.hIndex":fetchIndexing.hCount,
            "userData.$.i10Index":fetchIndexing.i10Count}
     })
}   
