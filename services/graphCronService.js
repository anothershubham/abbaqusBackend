const gHI10IndexService = require('./g_h_i10Index');
const moment = require('moment');
const async = require('asyncawait/async');
const await = require('asyncawait/await');
var mongoose    = require('mongoose');
const Graph = require('../models/graph');
const PapermonthSnapshot = require('../models/paperMonthSnapshot')
const Paperupload = require('../models/paperUpload');
const Viewdownloads = require('../models/viewsdownloads')
const ObjectID = require('mongodb').ObjectID;
const r2 = require('r2');

exports.calculateCitations = async(function(paper,userGraphId){
	var month = moment().format('MMM').toLowerCase();
    var year = moment().format('YYYY');
    var monthYear = month + "-" + year;
    // let monthYear = "may-2019";
	var graphIdExist = await(Graph.findOne({_id:userGraphId}).lean());
	if(graphIdExist){
        var checkMainSnapshotwithmonthExist = await(Graph.find({$and:[{_id:userGraphId},{ snapshots: { $elemMatch: { my: monthYear } } }]}).lean())
        if(checkMainSnapshotwithmonthExist.length!==0){
             var checkPaperexist = await(Graph.findOne({$and:[{_id:userGraphId},{ papers: { $elemMatch: { paperId: paper._id } } }]}).lean())
                if(checkPaperexist){
                    console.log("paper already exists")
                }
                else{ 
                    let paperData = {
                        name: paper.paperTitle,
                        paperId: paper._id,
                        paperType: paper.paperType,
                        totalCitation: paper.citations,
                        totalView: paper.views,
                        totalDownload: paper.downloadPapers,
                        paperPublication:paper.publicationVenue
                    }
                    //paper push
                    var graphPaperSnapShotPush = await(Graph.findOneAndUpdate({_id:userGraphId},{$push:{papers:paperData}}))
                    if(graphPaperSnapShotPush){
                        // update papermonthsnapshot
                            const paperSnapshotParams ={
                                userId:paper.userId,
                                paperId:paper.id,
                                citations:paper.citations,
                                views: paper.views,
                                downloads: paper.downloadPapers,
                                month: month,
                                publicationDate:paper.publicationdate,
                                year: year,
                                my: monthYear 
                                };
                            //update the existing paperMainsnapshot in papermonthsnapshot table
                            var updateInPapermainsnapshot = await(PapermonthSnapshot.create(paperSnapshotParams))
                            if(updateInPapermainsnapshot){
                                    //begin calculations
                            var checkMainSnapshotwithmonthExist = await(Graph.find({$and:[{_id:userGraphId},{ snapshots: { $elemMatch: { my: monthYear } } }]}).lean())         
                            if(checkMainSnapshotwithmonthExist){
                                const fetchMonthsSnapshotValues = await( fetchCurrentMonthSnapshots(checkMainSnapshotwithmonthExist,monthYear))
                                if(fetchMonthsSnapshotValues){
                                    //update main Snapshot citations views downloads
                                    var UpdatedCitation=fetchMonthsSnapshotValues[0].citation + paper.citations;
                                    var updatedViews = fetchMonthsSnapshotValues[0].views + paper.views;
                                    var updatedDownloads = fetchMonthsSnapshotValues[0].downloads + paper.downloadPapers;
                                    var snapShotId = fetchMonthsSnapshotValues[0]._id;
                                    var graphMainSnapshotUpdate = await(Graph.update({_id:ObjectID(userGraphId),"snapshots._id":ObjectID(snapShotId)},{$set:{"snapshots.$.citation":UpdatedCitation,"snapshots.$.views":updatedViews,"snapshots.$.downloads":updatedDownloads}},{new: true}));
                                    if(graphMainSnapshotUpdate){
                                        //check and add all the previous months Main snapshot citations to user data for overall citations
                                        var fetchpreviousMonthsMainSnapshot = await(Graph.aggregate([{$match: {_id: userGraphId} },{$unwind: '$snapshots'},{$group:{ _id: null,"totalCitations": {$sum: "$snapshots.citation" },"totalViews":{$sum:"$snapshots.views"},"totalDownloads":{$sum:"$snapshots.downloads"}}}]))
                                        const fetchUpdatedGraphData = await(Graph.findOne({_id:userGraphId}).lean())
                                        const calcaulateZindexHindex =await(calaulateGindexHindex(fetchUpdatedGraphData))
                                        if(calcaulateZindexHindex.length!==0){
                                            var fetchGindexHindexIindex = await(gHI10IndexService.indexing(calcaulateZindexHindex));
                                            var updateUserData = await(Graph.findOneAndUpdate({_id:userGraphId},{$set:{"userData":{"totalCitation":fetchpreviousMonthsMainSnapshot[0].totalCitations,"totalView":fetchpreviousMonthsMainSnapshot[0].totalViews,"totalDownload":fetchpreviousMonthsMainSnapshot[0].totalDownloads,"gIndex":fetchGindexHindexIindex.gCount,"hIndex":fetchGindexHindexIindex.hCount,"i10Index":fetchGindexHindexIindex.i10Count}}}))
                                            console.log("grap data updated successfully")
                                        }
                                        else{
                                            console.log("error occured while fetching citations")
                                        }
                                    }
                                    else{
                                        console.log("error occured while updating main snap shots")
                                    }
                                }
                                else{
                                    console.log("Error occured while fetching snapshot of this month for updating values")
                                }
                            } 
                            else{
                                console.log("error occured while fetching particular month snap shot")
                            }
                            }
                            else{
                                console.log("error occured while updating in paperMainSnapshot")
                            }
                    }
                    else{
                        console.log("error occured while adding paper")
                    }
                }
        }
        else{
            //push main snap shot
        	let newObjSnapshot = {
                month: month,
                year: year,
                my: monthYear,
                citation: 0,
                views: 0,
                downloads:0
                }
             var graphMainSnapShotPush = await(Graph.findOneAndUpdate({_id:userGraphId},{$push:{snapshots:newObjSnapshot}}))
            if(graphMainSnapShotPush){
                //check paper already pushed
                var checkPaperexist = await(Graph.findOne({$and:[{_id:userGraphId},{ papers: { $elemMatch: { paperId: paper._id } } }]}).lean())
                if(checkPaperexist){
                    console.log("paper already exists")
                }
                else{
                    let paperData = {
                        name: paper.paperTitle,
                        paperId: paper._id,
                        paperType: paper.paperType,
                        totalCitation: paper.citations,
                        totalView: paper.views,
                        totalDownload: paper.downloadPapers,
                        paperPublication:paper.publicationVenue
                    }
                    //paper push
                    var graphPaperSnapShotPush = await(Graph.findOneAndUpdate({_id:userGraphId},{$push:{papers:paperData}}))
                    if(graphPaperSnapShotPush){
                        const paperSnapshotParams ={
                                userId:paper.userId,
                                paperId:paper.id,
                                citations:paper.citations,
                                views: paper.views,
                                downloads: paper.downloadPapers,
                                month: month,
                                publicationDate:paper.publicationdate,
                                year: year,
                                my: monthYear    
                        };
                        // console.log("paperSnapshotParams",paperSnapshotParams)
                        var updateInPapermainsnapshot = await(PapermonthSnapshot.create(paperSnapshotParams))
                            if(updateInPapermainsnapshot){
                                // console.log ("updateInPapermainsnapshot done successfully")
                            //begin calculations
                            var checkMainSnapshotwithmonthExist = await(Graph.find({$and:[{_id:userGraphId},{ snapshots: { $elemMatch: { my: monthYear } } }]}).lean())         
                            if(checkMainSnapshotwithmonthExist){
                                const fetchMonthsSnapshotValues = await( fetchCurrentMonthSnapshots(checkMainSnapshotwithmonthExist,monthYear))
                                // console.log("fetchMonthsSnapshotValues",fetchMonthsSnapshotValues)
                                if(fetchMonthsSnapshotValues){
                                    //update main Snapshot citations views downloads
                                    var UpdatedCitation=fetchMonthsSnapshotValues[0].citation + paper.citations;
                                    // console.log("UpdatedCitation",UpdatedCitation)
                                    var updatedViews = fetchMonthsSnapshotValues[0].views + paper.views;
                                    var updatedDownloads = fetchMonthsSnapshotValues[0].downloads + paper.downloadPapers;
                                    var snapShotId = fetchMonthsSnapshotValues[0]._id;
                                    var graphMainSnapshotUpdate = await(Graph.update({_id:ObjectID(userGraphId),"snapshots._id":ObjectID(snapShotId)},{$set:{"snapshots.$.citation":UpdatedCitation,"snapshots.$.views":updatedViews,"snapshots.$.downloads":updatedDownloads}},{new: true}));
                                    if(graphMainSnapshotUpdate){
                                        //check and add all the previous months Main snapshot citations to user data for overall citations
                                        var fetchpreviousMonthsMainSnapshot = await(Graph.aggregate([{$match: {_id: userGraphId} },{$unwind: '$snapshots'},{$group:{ _id: null,"totalCitations": {$sum: "$snapshots.citation" },"totalViews":{$sum:"$snapshots.views"},"totalDownloads":{$sum:"$snapshots.downloads"}}}]))
                                        const fetchUpdatedGraphData = await(Graph.findOne({_id:userGraphId}).lean())
                                        const calcaulateZindexHindex =await(calaulateGindexHindex(fetchUpdatedGraphData))
                                        if(calcaulateZindexHindex.length!==0){
                                            var fetchGindexHindexIindex = await(gHI10IndexService.indexing(calcaulateZindexHindex));
                                            var updateUserData = await(Graph.findOneAndUpdate({_id:userGraphId},{$set:{"userData":{"totalCitation":fetchpreviousMonthsMainSnapshot[0].totalCitations,"totalView":fetchpreviousMonthsMainSnapshot[0].totalViews,"totalDownload":fetchpreviousMonthsMainSnapshot[0].totalDownloads,"gIndex":fetchGindexHindexIindex.gCount,"hIndex":fetchGindexHindexIindex.hCount,"i10Index":fetchGindexHindexIindex.i10Count}}}))
                                            console.log("grap data updated successfully")
                                        }
                                        else{
                                            console.log("error occured while fetching citations")
                                        }
                                    }
                                    else{
                                        console.log("error occured while updating main snap shots")
                                    }
                                }
                                else{
                                    console.log("Error occured while fetching snapshot of this month for updating values")
                                }
                            } 
                            else{
                                console.log("error occured while fetching particular month snap shot")
                            }
                            }
                            else{
                                console.log("error occured while creating Snapshot in papermainsnapshot table")
                            }
                    }
                    else{
                        console.log("error occured while adding paper")
                    }
                }
            }
            else{
                console.log("not able to push main snap shots for the first time")
             }
        }
    }
	else{
		console.log("graphId does not exists")
	}
})

exports.CalculateViewsDownloads = async(function(paper){
    var month = moment().format('MMM').toLowerCase();   
    var year = moment().format('YYYY');
    var monthYear = month + "-" + year;
    var graphIdExist = await(Graph.findOne({_id:paper.userId.graph}).lean());
    if(graphIdExist.length!==0){
        // console.log("paper",paper)
        var checkMainSnapshotwithmonthExist = await(Graph.find({$and:[{_id:paper.userId.graph},{ snapshots: { $elemMatch: { my: monthYear } } }]}).lean())
        if(checkMainSnapshotwithmonthExist.length!==0){
            // mainSnapshot already exists in graph table
            var checkPaperexist = await(Graph.findOne({$and:[{_id:paper.userId.graph},{ papers: { $elemMatch: { paperId: paper._id } } }]}).lean())
                if(checkPaperexist){
                    // paper already exists
                    const updatePapersViewsCitations = await(Graph.update({_id:paper.userId.graph,"papers.paperId":paper._id},{$set:{"papers.$.totalView":paper.views,"papers.$.totalCitation":paper.citations,"papers.$.totalDownload":paper.downloadPapers}}).lean())
                    if(updatePapersViewsCitations){
                        const checkPaperSnapshottableForMonths = await(PapermonthSnapshot.find({$and:[{my:monthYear},{userId:paper.userId._id},{paperId:paper._id}]}))
                        if(checkPaperSnapshottableForMonths.length!==0){
                            const updatePaperInPaperMainSnapshotTable = await(PapermonthSnapshot.update({paperId:paper._id,userId:paper.userId._id,my:monthYear},{$set:{citations:paper.citations,views:paper.views,downloads:paper.downloadPapers,publicationDate:paper.publicationdate}}))
                            if(updatePaperInPaperMainSnapshotTable){
                                const fetchMonthSnapshot = await(Graph.findOne({_id:paper.userId.graph}).lean())
                                    if(fetchMonthSnapshot.length!==0){
                                        // console.log("fetchMonthSnapshot",fetchMonthSnapshot)
                                        const calculateCitationViews = await(calculateViewsCitations(fetchMonthSnapshot))
                                        if(calculateCitationViews){
                                            var todaysDate = moment()
                                            var previousMonth =  moment(todaysDate).subtract(1, "month").startOf("month").format('MMM').toLowerCase();
                                            var yearMinusOneName =  moment(todaysDate).subtract(1, "month").startOf("month").format('YYYY').toLowerCase();
                                            var lastmonthYear = previousMonth + "-" + yearMinusOneName;
                                            var previousMonthSnapshots = await(Graph.find({$and:[{_id:paper.userId.graph},{ snapshots: { $elemMatch: { my: lastmonthYear } } }]}).lean())
                                            if(previousMonthSnapshots.length!==0){
                                                const fetchtotalDifferenceVCD = await(fetchDifference(previousMonthSnapshots,calculateCitationViews,lastmonthYear))
                                                if(fetchtotalDifferenceVCD){
                                                    var graphMainSnapshotUpdate = await(Graph.update({_id:ObjectID(paper.userId.graph),"snapshots.my":monthYear},{$set:{"snapshots.$.citation":fetchtotalDifferenceVCD.differenceCitation,"snapshots.$.views":fetchtotalDifferenceVCD.differnceViews,"snapshots.$.downloads":fetchtotalDifferenceVCD.differncesDownloads}},{new: true}));
                                                    if(graphMainSnapshotUpdate){
                                                        const fetchUpdatedGraphData = await(Graph.findOne({_id:paper.userId.graph}).lean())
                                                        const calcaulateZindexHindex =await(calaulateGindexHindex(fetchUpdatedGraphData))
                                                        if(calcaulateZindexHindex.length!==0){
                                                            var fetchGindexHindexIindex = await(gHI10IndexService.indexing(calcaulateZindexHindex));
                                                            var updateUserData = await(Graph.findOneAndUpdate({_id:paper.userId.graph},{$set:{"userData":{"totalCitation":calculateCitationViews[0].totalCitations,"totalView":calculateCitationViews[0].totalViews,"totalDownload":calculateCitationViews[0].totalDownloads,"gIndex":fetchGindexHindexIindex.gCount,"hIndex":fetchGindexHindexIindex.hCount,"i10Index":fetchGindexHindexIindex.i10Count}}}))
                                                            console.log("grap data updated successfully")
                                                        }
                                                        else{
                                                            console.log("error occured while fetching citations")
                                                        }
                                                    }
                                                    else{
                                                        console.log("error occured while updating main snap shot")
                                                    }
                                                }
                                                else{
                                                    console.log("error occured while fetching difference")
                                                }
                                            }
                                            else{
                                                var graphMainSnapshotUpdate = await(Graph.update({_id:ObjectID(paper.userId.graph),"snapshots.my":monthYear},{$set:{"snapshots.$.citation":calculateCitationViews[0].totalCitations,"snapshots.$.views":calculateCitationViews[0].totalViews,"snapshots.$.downloads":calculateCitationViews[0].totalDownloads}},{new: true}));
                                                // var updateUserData = await(Graph.findOneAndUpdate({_id:graphId},{$set:{"userData":{"totalCitation":calculateCitationViews[0].totalCitations,"totalView":calculateCitationViews[0].totalViews,"totalDownload":calculateCitationViews[0].totalDownloads}}}))
                                                if(graphMainSnapshotUpdate){
                                                    const fetchUpdatedGraphData = await(Graph.findOne({_id:paper.userId.graph}).lean())
                                                    const calcaulateZindexHindex =await(calaulateGindexHindex(fetchUpdatedGraphData))
                                                    if(calcaulateZindexHindex.length!==0){
                                                        var fetchGindexHindexIindex = await(gHI10IndexService.indexing(calcaulateZindexHindex));
                                                        var updateUserData = await(Graph.findOneAndUpdate({_id:paper.userId.graph},{$set:{"userData":{"totalCitation":calculateCitationViews[0].totalCitations,"totalView":calculateCitationViews[0].totalViews,"totalDownload":calculateCitationViews[0].totalDownloads,"gIndex":fetchGindexHindexIindex.gCount,"hIndex":fetchGindexHindexIindex.hCount,"i10Index":fetchGindexHindexIindex.i10Count}}}))
                                                        console.log("grap data updated successfully")
                                                    }
                                                    else{
                                                        console.log("error occured while fetching citations")
                                                    }
                                                }
                                                else{
                                                    console.log("error occured while updating main snap shot")
                                                }
                                            } 
                                        }
                                        else{
                                            console.log("error occured while fetching total views")
                                        }
                                    }
                                    else{
                                        console.log("error occured while fetching updated graph details")
                                    }
                            }
                            else{
                                console.log('Error occured while updating papermainsnapshot table')
                            }
                        }
                        else{
                            var paperMainsnaphotnewmonth={
                                    userId:paper.userId._id,
                                    paperId:paper.id,
                                    citations:paper.citations,
                                    views: paper.views,
                                    downloads: paper.downloadPapers,
                                    publicationDate:paper.publicationdate,
                                    month: month,
                                    year: year,
                                    my: monthYear
                            }
                            const addPaperdetailInPaperMainsnapshot = await(PapermonthSnapshot.create(paperMainsnaphotnewmonth))
                            if(addPaperdetailInPaperMainsnapshot){
                                const fetchMonthSnapshot = await(Graph.findOne({_id:paper.userId.graph}).lean())
                                    if(fetchMonthSnapshot.length!==0){
                                        // console.log("fetchMonthSnapshot",fetchMonthSnapshot)
                                        const calculateCitationViews = await(calculateViewsCitations(fetchMonthSnapshot))
                                        if(calculateCitationViews){
                                            var todaysDate = moment()
                                            var previousMonth =  moment(todaysDate).subtract(1, "month").startOf("month").format('MMM').toLowerCase();
                                            var yearMinusOneName =  moment(todaysDate).subtract(1, "month").startOf("month").format('YYYY').toLowerCase();
                                            var lastmonthYear = previousMonth + "-" + yearMinusOneName;
                                            var previousMonthSnapshots = await(Graph.find({$and:[{_id:paper.userId.graph},{ snapshots: { $elemMatch: { my: lastmonthYear } } }]}).lean())
                                            if(previousMonthSnapshots.length!==0){
                                                const fetchtotalDifferenceVCD = await(fetchDifference(previousMonthSnapshots,calculateCitationViews,lastmonthYear))
                                                if(fetchtotalDifferenceVCD){
                                                    var graphMainSnapshotUpdate = await(Graph.update({_id:ObjectID(paper.userId.graph),"snapshots.my":monthYear},{$set:{"snapshots.$.citation":fetchtotalDifferenceVCD.differenceCitation,"snapshots.$.views":fetchtotalDifferenceVCD.differnceViews,"snapshots.$.downloads":fetchtotalDifferenceVCD.differncesDownloads}},{new: true}));
                                                    if(graphMainSnapshotUpdate){
                                                        const fetchUpdatedGraphData = await(Graph.findOne({_id:paper.userId.graph}).lean())
                                                        const calcaulateZindexHindex =await(calaulateGindexHindex(fetchUpdatedGraphData))
                                                        if(calcaulateZindexHindex.length!==0){
                                                            var fetchGindexHindexIindex = await(gHI10IndexService.indexing(calcaulateZindexHindex));
                                                            var updateUserData = await(Graph.findOneAndUpdate({_id:paper.userId.graph},{$set:{"userData":{"totalCitation":calculateCitationViews[0].totalCitations,"totalView":calculateCitationViews[0].totalViews,"totalDownload":calculateCitationViews[0].totalDownloads,"gIndex":fetchGindexHindexIindex.gCount,"hIndex":fetchGindexHindexIindex.hCount,"i10Index":fetchGindexHindexIindex.i10Count}}}))
                                                            console.log("grap data updated successfully")
                                                        }
                                                        else{
                                                            console.log("error occured while fetching citations")
                                                        }
                                                    }
                                                    else{
                                                        console.log("error occured while updating main snap shot")
                                                    }
                                                }
                                                else{
                                                    console.log("error occured while fetching difference")
                                                }
                                            }
                                            else{
                                                var graphMainSnapshotUpdate = await(Graph.update({_id:ObjectID(paper.userId.graph),"snapshots.my":monthYear},{$set:{"snapshots.$.citation":calculateCitationViews[0].totalCitations,"snapshots.$.views":calculateCitationViews[0].totalViews,"snapshots.$.downloads":calculateCitationViews[0].totalDownloads}},{new: true}));
                                                // var updateUserData = await(Graph.findOneAndUpdate({_id:graphId},{$set:{"userData":{"totalCitation":calculateCitationViews[0].totalCitations,"totalView":calculateCitationViews[0].totalViews,"totalDownload":calculateCitationViews[0].totalDownloads}}}))
                                                if(graphMainSnapshotUpdate){
                                                    const fetchUpdatedGraphData = await(Graph.findOne({_id:paper.userId.graph}).lean())
                                                    const calcaulateZindexHindex =await(calaulateGindexHindex(fetchUpdatedGraphData))
                                                    if(calcaulateZindexHindex.length!==0){
                                                        var fetchGindexHindexIindex = await(gHI10IndexService.indexing(calcaulateZindexHindex));
                                                        var updateUserData = await(Graph.findOneAndUpdate({_id:paper.userId.graph},{$set:{"userData":{"totalCitation":calculateCitationViews[0].totalCitations,"totalView":calculateCitationViews[0].totalViews,"totalDownload":calculateCitationViews[0].totalDownloads,"gIndex":fetchGindexHindexIindex.gCount,"hIndex":fetchGindexHindexIindex.hCount,"i10Index":fetchGindexHindexIindex.i10Count}}}))
                                                        console.log("grap data updated successfully")
                                                    }
                                                    else{
                                                        console.log("error occured while fetching citations")
                                                    }
                                                }
                                                else{
                                                    console.log("error occured while updating main snap shot")
                                                }
                                            } 
                                        }
                                        else{
                                            console.log("error occured while fetching total views")
                                        }
                                    }
                                    else{
                                        console.log("error occured while fetching updated graph details")
                                    }
                            }
                            else{
                                console.log("error occured while adding new snapshots to papersnapshot table")
                            }
                        }
                    }
                    else{
                        console.log("error occured while updating paper")
                    }
                }
                else{
                    let paperData = {
                            paperId: paper._id,
                            paperType: paper.paperType,
                            totalCitation: paper.citations,
                            totalView: paper.views,
                            totalDownload: paper.downloadPapers,
                            paperPublication:paper.publicationVenue
                        }
                        var addPaperToGraph = await(Graph.findOneAndUpdate({_id:paper.userId.graph},{$push:{papers:paperData}}))
                        if(addPaperToGraph){
                            let paperMainsnaphot={
                                    userId:paper.userId._id,
                                    paperId:paper.id,
                                    citations:paper.citations,
                                    views: paper.views,
                                    downloads: paper.downloadPapers,
                                    publicationDate:paper.publicationdate,
                                    month: month,
                                    year: year,
                                    my: monthYear
                            }
                            const addPaperdetailInPaperMainsnapshot = await(PapermonthSnapshot.create(paperMainsnaphot))
                            if(addPaperdetailInPaperMainsnapshot){
                                const fetchMonthSnapshot = await(Graph.findOne({_id:paper.userId.graph}).lean())
                                if(fetchMonthSnapshot.length!==0){
                                    const calculateCitationViews = await(calculateViewsCitations(fetchMonthSnapshot))
                                    if(calculateCitationViews){
                                        var todaysDate = moment()
                                        var previousMonth =  moment(todaysDate).subtract(1, "month").startOf("month").format('MMM').toLowerCase();
                                        var yearMinusOneName =  moment(todaysDate).subtract(1, "month").startOf("month").format('YYYY').toLowerCase();
                                        var lastmonthYear = previousMonth + "-" + yearMinusOneName;
                                        var previousMonthSnapshots = await(Graph.find({$and:[{_id:paper.userId.graph},{ snapshots: { $elemMatch: { my: lastmonthYear } } }]}).lean())
                                        if(previousMonthSnapshots.length!==0){
                                            const fetchtotalDifferenceVCD = await(fetchDifference(previousMonthSnapshots,calculateCitationViews,lastmonthYear))
                                            if(fetchtotalDifferenceVCD){
                                                var graphMainSnapshotUpdate = await(Graph.update({_id:ObjectID(paper.userId.graph),"snapshots.my":monthYear},{$set:{"snapshots.$.citation":fetchtotalDifferenceVCD.differenceCitation,"snapshots.$.views":fetchtotalDifferenceVCD.differnceViews,"snapshots.$.downloads":fetchtotalDifferenceVCD.differncesDownloads}},{new: true}));
                                                if(graphMainSnapshotUpdate){
                                                    const fetchUpdatedGraphData = await(Graph.findOne({_id:paper.userId.graph}).lean())
                                                    const calcaulateZindexHindex =await(calaulateGindexHindex(fetchUpdatedGraphData))
                                                    if(calcaulateZindexHindex.length!==0){
                                                        var fetchGindexHindexIindex = await(gHI10IndexService.indexing(calcaulateZindexHindex));
                                                        var updateUserData = await(Graph.findOneAndUpdate({_id:paper.userId.graph},{$set:{"userData":{"totalCitation":calculateCitationViews[0].totalCitations,"totalView":calculateCitationViews[0].totalViews,"totalDownload":calculateCitationViews[0].totalDownloads,"gIndex":fetchGindexHindexIindex.gCount,"hIndex":fetchGindexHindexIindex.hCount,"i10Index":fetchGindexHindexIindex.i10Count}}}))
                                                        console.log("grap data updated successfully")
                                                    }
                                                    else{
                                                        console.log("error occured while fetching citations")
                                                    }
                                                }
                                                else{
                                                    console.log("error occured while updating main snap shot")
                                                }
                                            }
                                            else{
                                                console.log("error occured while fetching difference")
                                            }
                                        }
                                        else{
                                            var graphMainSnapshotUpdate = await(Graph.update({_id:ObjectID(paper.userId.graph),"snapshots.my":monthYear},{$set:{"snapshots.$.citation":calculateCitationViews[0].totalCitations,"snapshots.$.views":calculateCitationViews[0].totalViews,"snapshots.$.downloads":calculateCitationViews[0].totalDownloads}},{new: true}));
                                            // var updateUserData = await(Graph.findOneAndUpdate({_id:graphId},{$set:{"userData":{"totalCitation":calculateCitationViews[0].totalCitations,"totalView":calculateCitationViews[0].totalViews,"totalDownload":calculateCitationViews[0].totalDownloads}}}))
                                            if(graphMainSnapshotUpdate){
                                                const fetchUpdatedGraphData = await(Graph.findOne({_id:paper.userId.graph}).lean())
                                                const calcaulateZindexHindex =await(calaulateGindexHindex(fetchUpdatedGraphData))
                                                if(calcaulateZindexHindex.length!==0){
                                                    var fetchGindexHindexIindex = await(gHI10IndexService.indexing(calcaulateZindexHindex));
                                                    var updateUserData = await(Graph.findOneAndUpdate({_id:paper.userId.graph},{$set:{"userData":{"totalCitation":calculateCitationViews[0].totalCitations,"totalView":calculateCitationViews[0].totalViews,"totalDownload":calculateCitationViews[0].totalDownloads,"gIndex":fetchGindexHindexIindex.gCount,"hIndex":fetchGindexHindexIindex.hCount,"i10Index":fetchGindexHindexIindex.i10Count}}}))
                                                    console.log("grap data updated successfully")
                                                }
                                                else{
                                                    console.log("error occured while fetching citations")
                                                }
                                            }
                                            else{
                                                console.log("error occured while updating main snap shot")
                                            }
                                        }
                                    }
                                    else{
                                        console.log("error occured while fetching total views")
                                    }
                                }
                                else{
                                    console.log("error occured while fetching updated graph details")
                                }
                            }
                            else{
                                console.log("error occured while pushing data to paper main snapshot table")
                            }
                        }
                        else{
                            console.log("error occured while pushin paper in to graph table")
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
             var graphMainSnapShotPush = await(Graph.findOneAndUpdate({_id:paper.userId.graph},{$push:{snapshots:newObjSnapshot}}))
             if(graphMainSnapShotPush){
                var checkPaperexist = await(Graph.findOne({$and:[{_id:paper.userId.graph},{ papers: { $elemMatch: { paperId: paper._id } } }]}).lean())
                if(checkPaperexist){
                    // paper already exists
                    const updatePapersViewsCitations = await(Graph.update({_id:paper.userId.graph,"papers.paperId":paper._id},{$set:{"papers.$.totalView":paper.views,"papers.$.totalCitation":paper.citations,"papers.$.totalDownload":paper.downloadPapers}}).lean())
                    if(updatePapersViewsCitations){
                        const checkPaperSnapshottableForMonths = await(PapermonthSnapshot.find({$and:[{my:monthYear},{userId:paper.userId._id},{paperId:paper._id}]}))
                        if(checkPaperSnapshottableForMonths.length!==0){
                            const updatePaperInPaperMainSnapshotTable = await(PapermonthSnapshot.update({paperId:paper._id,userId:paper.userId._id,my:monthYear},{$set:{citations:paper.citations,views:paper.views,downloads:paper.downloadPapers,publicationDate:paper.publicationdate,}}))
                            if(updatePaperInPaperMainSnapshotTable){
                                const fetchMonthSnapshot = await(Graph.findOne({_id:paper.userId.graph}).lean())
                                    if(fetchMonthSnapshot.length!==0){
                                        // console.log("fetchMonthSnapshot",fetchMonthSnapshot)
                                        const calculateCitationViews = await(calculateViewsCitations(fetchMonthSnapshot))
                                        if(calculateCitationViews){
                                            var todaysDate = moment()
                                            var previousMonth =  moment(todaysDate).subtract(1, "month").startOf("month").format('MMM').toLowerCase();
                                            var yearMinusOneName =  moment(todaysDate).subtract(1, "month").startOf("month").format('YYYY').toLowerCase();
                                            var lastmonthYear = previousMonth + "-" + yearMinusOneName;
                                            // console.log("lastmonthYear",lastmonthYear)
                                            var previousMonthSnapshots = await(Graph.find({$and:[{_id:paper.userId.graph},{ snapshots: { $elemMatch: { my: lastmonthYear } } }]}).lean())
                                            // console.log("previousMonthSnapshots",previousMonthSnapshots)
                                            if(previousMonthSnapshots.length!==0){
                                                const fetchtotalDifferenceVCD = await(fetchDifference(previousMonthSnapshots,calculateCitationViews,lastmonthYear))
                                                if(fetchtotalDifferenceVCD){
                                                    var graphMainSnapshotUpdate = await(Graph.update({_id:ObjectID(paper.userId.graph),"snapshots.my":monthYear},{$set:{"snapshots.$.citation":fetchtotalDifferenceVCD.differenceCitation,"snapshots.$.views":fetchtotalDifferenceVCD.differnceViews,"snapshots.$.downloads":fetchtotalDifferenceVCD.differncesDownloads}},{new: true}));
                                                    if(graphMainSnapshotUpdate){
                                                        const fetchUpdatedGraphData = await(Graph.findOne({_id:paper.userId.graph}).lean())
                                                        const calcaulateZindexHindex =await(calaulateGindexHindex(fetchUpdatedGraphData))
                                                        if(calcaulateZindexHindex.length!==0){
                                                            var fetchGindexHindexIindex = await(gHI10IndexService.indexing(calcaulateZindexHindex));
                                                            var updateUserData = await(Graph.findOneAndUpdate({_id:paper.userId.graph},{$set:{"userData":{"totalCitation":calculateCitationViews[0].totalCitations,"totalView":calculateCitationViews[0].totalViews,"totalDownload":calculateCitationViews[0].totalDownloads,"gIndex":fetchGindexHindexIindex.gCount,"hIndex":fetchGindexHindexIindex.hCount,"i10Index":fetchGindexHindexIindex.i10Count}}}))
                                                            console.log("grap data updated successfully")
                                                        }
                                                        else{
                                                            console.log("error occured while fetching citations")
                                                        }
                                                    }
                                                    else{
                                                        console.log("error occured while updating main snap shot")
                                                    }
                                                }
                                                else{
                                                    console.log("error occured while fetching difference")
                                                }
                                            }
                                            else{
                                                var graphMainSnapshotUpdate = await(Graph.update({_id:ObjectID(paper.userId.graph),"snapshots.my":monthYear},{$set:{"snapshots.$.citation":calculateCitationViews[0].totalCitations,"snapshots.$.views":calculateCitationViews[0].totalViews,"snapshots.$.downloads":calculateCitationViews[0].totalDownloads}},{new: true}));
                                                // var updateUserData = await(Graph.findOneAndUpdate({_id:graphId},{$set:{"userData":{"totalCitation":calculateCitationViews[0].totalCitations,"totalView":calculateCitationViews[0].totalViews,"totalDownload":calculateCitationViews[0].totalDownloads}}}))
                                                if(graphMainSnapshotUpdate){
                                                    const fetchUpdatedGraphData = await(Graph.findOne({_id:paper.userId.graph}).lean())
                                                    const calcaulateZindexHindex =await(calaulateGindexHindex(fetchUpdatedGraphData))
                                                    if(calcaulateZindexHindex.length!==0){
                                                        var fetchGindexHindexIindex = await(gHI10IndexService.indexing(calcaulateZindexHindex));
                                                        var updateUserData = await(Graph.findOneAndUpdate({_id:paper.userId.graph},{$set:{"userData":{"totalCitation":calculateCitationViews[0].totalCitations,"totalView":calculateCitationViews[0].totalViews,"totalDownload":calculateCitationViews[0].totalDownloads,"gIndex":fetchGindexHindexIindex.gCount,"hIndex":fetchGindexHindexIindex.hCount,"i10Index":fetchGindexHindexIindex.i10Count}}}))
                                                        console.log("grap data updated successfully")
                                                    }
                                                    else{
                                                        console.log("error occured while fetching citations")
                                                    }
                                                }
                                                else{
                                                    console.log("error occured while updating main snap shot")
                                                }
                                            }
                                        }
                                        else{
                                            console.log("error occured while fetching total views")
                                        }
                                    }
                                    else{
                                        console.log("error occured while fetching updated graph details")
                                    }
                            }
                            else{
                                console.log('Error occured while updating papermainsnapshot table')
                            }
                        }
                        else{
                            // console.log("new push")
                            var paperMainsnaphotnewmonth={
                                    userId:paper.userId._id,
                                    paperId:paper.id,
                                    citations:paper.citations,
                                    views: paper.views,
                                    downloads: paper.downloadPapers,
                                    publicationDate:paper.publicationdate,
                                    month: month,
                                    year: year,
                                    my: monthYear
                            }
                            const addPaperdetailInPaperMainsnapshot = await(PapermonthSnapshot.create(paperMainsnaphotnewmonth))
                            if(addPaperdetailInPaperMainsnapshot){
                                const fetchMonthSnapshot = await(Graph.findOne({_id:paper.userId.graph}).lean())
                                    if(fetchMonthSnapshot.length!==0){
                                        // console.log("fetchMonthSnapshot",fetchMonthSnapshot)
                                        const calculateCitationViews = await(calculateViewsCitations(fetchMonthSnapshot))
                                        if(calculateCitationViews){
                                            var todaysDate = moment()
                                            var previousMonth =  moment(todaysDate).subtract(1, "month").startOf("month").format('MMM').toLowerCase();
                                            var yearMinusOneName =  moment(todaysDate).subtract(1, "month").startOf("month").format('YYYY').toLowerCase();
                                            var lastmonthYear = previousMonth + "-" + yearMinusOneName;
                                            // console.log("lastmonthYear",lastmonthYear)
                                            var previousMonthSnapshots = await(Graph.find({$and:[{_id:paper.userId.graph},{ snapshots: { $elemMatch: { my: lastmonthYear } } }]}).lean())
                                            // console.log("previousMonthSnapshots",previousMonthSnapshots)
                                            if(previousMonthSnapshots.length!==0){
                                                const fetchtotalDifferenceVCD = await(fetchDifference(previousMonthSnapshots,calculateCitationViews,lastmonthYear))
                                                if(fetchtotalDifferenceVCD){
                                                    var graphMainSnapshotUpdate = await(Graph.update({_id:ObjectID(paper.userId.graph),"snapshots.my":monthYear},{$set:{"snapshots.$.citation":fetchtotalDifferenceVCD.differenceCitation,"snapshots.$.views":fetchtotalDifferenceVCD.differnceViews,"snapshots.$.downloads":fetchtotalDifferenceVCD.differncesDownloads}},{new: true}));
                                                    if(graphMainSnapshotUpdate){
                                                        const fetchUpdatedGraphData = await(Graph.findOne({_id:paper.userId.graph}).lean())
                                                        const calcaulateZindexHindex =await(calaulateGindexHindex(fetchUpdatedGraphData))
                                                        if(calcaulateZindexHindex.length!==0){
                                                            var fetchGindexHindexIindex = await(gHI10IndexService.indexing(calcaulateZindexHindex));
                                                            var updateUserData = await(Graph.findOneAndUpdate({_id:paper.userId.graph},{$set:{"userData":{"totalCitation":calculateCitationViews[0].totalCitations,"totalView":calculateCitationViews[0].totalViews,"totalDownload":calculateCitationViews[0].totalDownloads,"gIndex":fetchGindexHindexIindex.gCount,"hIndex":fetchGindexHindexIindex.hCount,"i10Index":fetchGindexHindexIindex.i10Count}}}))
                                                            console.log("grap data updated successfully")
                                                        }
                                                        else{
                                                            console.log("error occured while fetching citations")
                                                        }
                                                    }
                                                    else{
                                                        console.log("error occured while updating main snap shot")
                                                    }
                                                }
                                                else{
                                                    console.log("error occured while fetching difference")
                                                }
                                            }
                                            else{
                                                var graphMainSnapshotUpdate = await(Graph.update({_id:ObjectID(paper.userId.graph),"snapshots.my":monthYear},{$set:{"snapshots.$.citation":calculateCitationViews[0].totalCitations,"snapshots.$.views":calculateCitationViews[0].totalViews,"snapshots.$.downloads":calculateCitationViews[0].totalDownloads}},{new: true}));
                                                // var updateUserData = await(Graph.findOneAndUpdate({_id:graphId},{$set:{"userData":{"totalCitation":calculateCitationViews[0].totalCitations,"totalView":calculateCitationViews[0].totalViews,"totalDownload":calculateCitationViews[0].totalDownloads}}}))
                                                if(graphMainSnapshotUpdate){
                                                    const fetchUpdatedGraphData = await(Graph.findOne({_id:paper.userId.graph}).lean())
                                                    const calcaulateZindexHindex =await(calaulateGindexHindex(fetchUpdatedGraphData))
                                                    if(calcaulateZindexHindex.length!==0){
                                                        var fetchGindexHindexIindex = await(gHI10IndexService.indexing(calcaulateZindexHindex));
                                                        var updateUserData = await(Graph.findOneAndUpdate({_id:paper.userId.graph},{$set:{"userData":{"totalCitation":calculateCitationViews[0].totalCitations,"totalView":calculateCitationViews[0].totalViews,"totalDownload":calculateCitationViews[0].totalDownloads,"gIndex":fetchGindexHindexIindex.gCount,"hIndex":fetchGindexHindexIindex.hCount,"i10Index":fetchGindexHindexIindex.i10Count}}}))
                                                        console.log("grap data updated successfully")
                                                    }
                                                    else{
                                                        console.log("error occured while fetching citations")
                                                    }
                                                }
                                                else{
                                                    console.log("error occured while updating main snap shot")
                                                }
                                            }
                                        }
                                        else{
                                            console.log("error occured while fetching total views")
                                        }
                                    }
                                    else{
                                        console.log("error occured while fetching updated graph details")
                                    }
                            }
                            else{
                                console.log("error occured while adding new snapshots to papersnapshot table")
                            }
                        }
                    }
                    else{
                        console.log("error occured while updating paper")
                    }
                }
                else{
                    // console.log("inserting paper into graph table")
                    let paperData = {
                            paperId: paper._id,
                            paperType: paper.paperType,
                            totalCitation: paper.citations,
                            totalView: paper.views,
                            totalDownload: paper.downloadPapers,
                            paperPublication:paper.publicationVenue
                        }
                        var addPaperToGraph = await(Graph.findOneAndUpdate({_id:paper.userId.graph},{$push:{papers:paperData}}))
                        if(addPaperToGraph){
                            let paperMainsnaphot={
                                    userId:paper.userId._id,
                                    paperId:paper.id,
                                    citations:paper.citations,
                                    views: paper.views,
                                    downloads: paper.downloadPapers,
                                    publicationDate:paper.publicationdate,
                                    month: month,
                                    year: year,
                                    my: monthYear
                            }
                            const addPaperdetailInPaperMainsnapshot = await(PapermonthSnapshot.create(paperMainsnaphot))
                            if(addPaperdetailInPaperMainsnapshot){
                                const fetchMonthSnapshot = await(Graph.findOne({_id:paper.userId.graph}).lean())
                                if(fetchMonthSnapshot.length!==0){
                                    // console.log("fetchMonthSnapshot",fetchMonthSnapshot)
                                    const calculateCitationViews = await(calculateViewsCitations(fetchMonthSnapshot))
                                    if(calculateCitationViews){
                                        // console.log("section 7")
                                        var todaysDate = moment()
                                        var previousMonth =  moment(todaysDate).subtract(1, "month").startOf("month").format('MMM').toLowerCase();
                                        var yearMinusOneName =  moment(todaysDate).subtract(1, "month").startOf("month").format('YYYY').toLowerCase();
                                        var lastmonthYear = previousMonth + "-" + yearMinusOneName;
                                        // console.log("lastmonthYear",lastmonthYear)
                                        var previousMonthSnapshots = await(Graph.find({$and:[{_id:paper.userId.graph},{ snapshots: { $elemMatch: { my: lastmonthYear } } }]}).lean())
                                        // console.log("previousMonthSnapshots",previousMonthSnapshots)
                                        if(previousMonthSnapshots.length!==0){
                                            const fetchtotalDifferenceVCD = await(fetchDifference(previousMonthSnapshots,calculateCitationViews,lastmonthYear))
                                            if(fetchtotalDifferenceVCD){
                                                var graphMainSnapshotUpdate = await(Graph.update({_id:ObjectID(paper.userId.graph),"snapshots.my":monthYear},{$set:{"snapshots.$.citation":fetchtotalDifferenceVCD.differenceCitation,"snapshots.$.views":fetchtotalDifferenceVCD.differnceViews,"snapshots.$.downloads":fetchtotalDifferenceVCD.differncesDownloads}},{new: true}));
                                                if(graphMainSnapshotUpdate){
                                                    const fetchUpdatedGraphData = await(Graph.findOne({_id:paper.userId.graph}).lean())
                                                    const calcaulateZindexHindex =await(calaulateGindexHindex(fetchUpdatedGraphData))
                                                    if(calcaulateZindexHindex.length!==0){
                                                        var fetchGindexHindexIindex = await(gHI10IndexService.indexing(calcaulateZindexHindex));
                                                        var updateUserData = await(Graph.findOneAndUpdate({_id:paper.userId.graph},{$set:{"userData":{"totalCitation":calculateCitationViews[0].totalCitations,"totalView":calculateCitationViews[0].totalViews,"totalDownload":calculateCitationViews[0].totalDownloads,"gIndex":fetchGindexHindexIindex.gCount,"hIndex":fetchGindexHindexIindex.hCount,"i10Index":fetchGindexHindexIindex.i10Count}}}))
                                                        console.log("grap data updated successfully")
                                                    }
                                                    else{
                                                        console.log("error occured while fetching citations")
                                                    }
                                                }
                                                else{
                                                    console.log("error occured while updating main snap shot")
                                                }
                                            }
                                            else{
                                                console.log("error occured while fetching difference")
                                            }
                                        }
                                        else{
                                            var graphMainSnapshotUpdate = await(Graph.update({_id:ObjectID(paper.userId.graph),"snapshots.my":monthYear},{$set:{"snapshots.$.citation":calculateCitationViews[0].totalCitations,"snapshots.$.views":calculateCitationViews[0].totalViews,"snapshots.$.downloads":calculateCitationViews[0].totalDownloads}},{new: true}));
                                            // var updateUserData = await(Graph.findOneAndUpdate({_id:graphId},{$set:{"userData":{"totalCitation":calculateCitationViews[0].totalCitations,"totalView":calculateCitationViews[0].totalViews,"totalDownload":calculateCitationViews[0].totalDownloads}}}))
                                            if(graphMainSnapshotUpdate){
                                                const fetchUpdatedGraphData = await(Graph.findOne({_id:paper.userId.graph}).lean())
                                                const calcaulateZindexHindex =await(calaulateGindexHindex(fetchUpdatedGraphData))
                                                if(calcaulateZindexHindex.length!==0){
                                                    var fetchGindexHindexIindex = await(gHI10IndexService.indexing(calcaulateZindexHindex));
                                                    var updateUserData = await(Graph.findOneAndUpdate({_id:paper.userId.graph},{$set:{"userData":{"totalCitation":calculateCitationViews[0].totalCitations,"totalView":calculateCitationViews[0].totalViews,"totalDownload":calculateCitationViews[0].totalDownloads,"gIndex":fetchGindexHindexIindex.gCount,"hIndex":fetchGindexHindexIindex.hCount,"i10Index":fetchGindexHindexIindex.i10Count}}}))
                                                    console.log("grap data updated successfully")
                                                }
                                                else{
                                                    console.log("error occured while fetching citations")
                                                }
                                            }
                                            else{
                                                console.log("error occured while updating main snap shot")
                                            }
                                        }   
                                    }
                                    else{
                                        console.log("error occured while fetching total views")
                                    }
                                }
                                else{
                                    console.log("error occured while fetching updated graph details")
                                }
                            }
                            else{
                                console.log("error occured while pushing data to paper main snapshot table")
                            }
                        }
                        else{
                            console.log("error occured while pushin paper in to graph table")
                        }
                }
             }
             else{
                console.log("Error occured in pushing graphs snapshot")
             }
        }
    }
    else{
        console.log("Graph does not exist")
    }
})

exports.deletePaperInGraph = async(function(paperId,graphId,downloads,views,citations,createdDate){
    let month = moment().format('MMM').toLowerCase();
    let year = moment().format('YYYY');
    let monthYear = month + "-" + year;
    var graphIdExist = await(Graph.findOne({_id:graphId}).lean());
    if(graphIdExist.length!==0){
        // console.log("graphIdExist",graphIdExist)
        var checkPaperexist = await(Graph.findOne({$and:[{_id:graphId},{ papers: { $elemMatch: { paperId: paperId } } }]}).lean())
        if(checkPaperexist.length!==0){
            var removePaper = await(Graph.update({_id:graphId},{$pull:{papers:{paperId:paperId}}}).lean())
            if(removePaper){
                // console.log("deleted successfully")
                //check wheather paper is created today
                var todaydate = moment();
                var compareDate = moment(createdDate).isSame(todaydate, 'day');
                var compareMonth = moment(createdDate).isSame(todaydate, 'month');
                if(compareDate){
                    var fetchDifferenceCitations =await(fetchdiffenceInday(graphIdExist,citations))
                    if(fetchDifferenceCitations){
                        var graphMainSnapshotUpdate = await(Graph.update({_id:ObjectID(graphId),"snapshots.my":monthYear},{$set:{"snapshots.$.citation":fetchDifferenceCitations.differenceCitation}},{new: true}));
                        if(graphMainSnapshotUpdate){
                            const removeInviewsDownloads = await(Viewdownloads.remove({paperId:paperId}))
                            // console.log("removeInviewsDownloads",removeInviewsDownloads)
                            const removeFromPapermaintable = await(PapermonthSnapshot.findOneAndRemove({paperId:paperId}))
                            const fetchMonthSnapshot = await(Graph.findOne({_id:graphId}).lean())
                            const calculateCitationViews = await(calculateViewsCitations(fetchMonthSnapshot))
                            if(calculateCitationViews){
                                const fetchUpdatedGraphData = await(Graph.findOne({_id:graphId}).lean())
                                const calcaulateZindexHindex =await(calaulateGindexHindex(fetchUpdatedGraphData))
                                if(calcaulateZindexHindex.length!==0){
                                    var fetchGindexHindexIindex = await(gHI10IndexService.indexing(calcaulateZindexHindex));
                                    var updateUserData = await(Graph.findOneAndUpdate({_id:graphId},{$set:{"userData":{"totalCitation":calculateCitationViews[0].totalCitations,"totalView":calculateCitationViews[0].totalViews,"totalDownload":calculateCitationViews[0].totalDownloads,"gIndex":fetchGindexHindexIindex.gCount,"hIndex":fetchGindexHindexIindex.hCount,"i10Index":fetchGindexHindexIindex.i10Count}}}))
                                    console.log("grap data updated successfully")
                                }
                                else{
                                    console.log("error occured while fetching citations")
                                }
                            }
                            else{
                                console.log("error occured while fetching paper total view downloads")
                            }
                        }
                        else{
                            console.log("error occured while updating graph month snap shot");
                        }
                    }
                    else{
                        console.log("error occured while fetching difference in citation in a day")
                    }
                }
                else if(monthYear){
                    // console.log("it is same month")
                    var fetchDifferenceCitations =await(fetchdiffenceInSamemonth(graphIdExist,citations,downloads,views))
                    if(fetchDifferenceCitations){
                        var graphMainSnapshotUpdate = await(Graph.update({_id:ObjectID(graphId),"snapshots.my":monthYear},{$set:{"snapshots.$.citation":fetchDifferenceCitations.differenceCitation,"snapshots.$.views":fetchDifferenceCitations.differenceviews,"snapshots.$.downloads":fetchDifferenceCitations.differencedownloads}},{new: true}));
                        if(graphMainSnapshotUpdate){
                            const removeInviewsDownloads = await(Viewdownloads.remove({paperId:paperId}))
                            // console.log("removeInviewsDownloads",removeInviewsDownloads)
                            const removeFromPapermaintable = await(PapermonthSnapshot.findOneAndRemove({paperId:paperId}))
                            const fetchMonthSnapshot = await(Graph.findOne({_id:graphId}).lean())
                            const calculateCitationViews = await(calculateViewsCitations(fetchMonthSnapshot))
                            if(calculateCitationViews){
                                const fetchUpdatedGraphData = await(Graph.findOne({_id:graphId}).lean())
                                const calcaulateZindexHindex =await(calaulateGindexHindex(fetchUpdatedGraphData))
                                if(calcaulateZindexHindex.length!==0){
                                    var fetchGindexHindexIindex = await(gHI10IndexService.indexing(calcaulateZindexHindex));
                                    var updateUserData = await(Graph.findOneAndUpdate({_id:graphId},{$set:{"userData":{"totalCitation":calculateCitationViews[0].totalCitations,"totalView":calculateCitationViews[0].totalViews,"totalDownload":calculateCitationViews[0].totalDownloads,"gIndex":fetchGindexHindexIindex.gCount,"hIndex":fetchGindexHindexIindex.hCount,"i10Index":fetchGindexHindexIindex.i10Count}}}))
                                    console.log("grap data updated successfully")
                                }
                                else{
                                    console.log("error occured while fetching citations")
                                }
                            }
                            else{
                                console.log("error occured while fetching paper total view downloads")
                            }
                        }
                        else{
                            console.log("error occured while updating graph month snap shot");
                        }
                    }
                    else{
                        console.log("error occured while fetching difference in citation in a day")
                    }
                    //paper is older and older months exist needs to be chekced and view and downloads needs to be decremented accordingly
                } 
                else{
                    var fetchDifferenceCitations =await(fetchdiffenceInSamemonth(graphIdExist,citations,downloads,views))
                    if(fetchDifferenceCitations){
                        var graphMainSnapshotUpdate = await(Graph.update({_id:ObjectID(graphId),"snapshots.my":monthYear},{$set:{"snapshots.$.citation":fetchDifferenceCitations.differenceCitation,"snapshots.$.views":fetchDifferenceCitations.differenceviews,"snapshots.$.downloads":fetchDifferenceCitations.differencedownloads}},{new: true}));
                        if(graphMainSnapshotUpdate){
                            const removeInviewsDownloads = await(Viewdownloads.remove({paperId:paperId}))
                            // console.log("removeInviewsDownloads",removeInviewsDownloads)
                            const removeFromPapermaintable = await(PapermonthSnapshot.findOneAndRemove({paperId:paperId}))
                            const fetchMonthSnapshot = await(Graph.findOne({_id:graphId}).lean())
                            const calculateCitationViews = await(calculateViewsCitations(fetchMonthSnapshot))
                            if(calculateCitationViews){
                                const fetchUpdatedGraphData = await(Graph.findOne({_id:graphId}).lean())
                                const calcaulateZindexHindex =await(calaulateGindexHindex(fetchUpdatedGraphData))
                                if(calcaulateZindexHindex.length!==0){
                                    var fetchGindexHindexIindex = await(gHI10IndexService.indexing(calcaulateZindexHindex));
                                    var updateUserData = await(Graph.findOneAndUpdate({_id:graphId},{$set:{"userData":{"totalCitation":calculateCitationViews[0].totalCitations,"totalView":calculateCitationViews[0].totalViews,"totalDownload":calculateCitationViews[0].totalDownloads,"gIndex":fetchGindexHindexIindex.gCount,"hIndex":fetchGindexHindexIindex.hCount,"i10Index":fetchGindexHindexIindex.i10Count}}}))
                                    console.log("grap data updated successfully")
                                }
                                else{
                                    console.log("error occured while fetching citations")
                                }
                            }
                            else{
                                console.log("error occured while fetching paper total view downloads")
                            }
                        }
                        else{
                            console.log("error occured while updating graph month snap shot");
                        }
                    }
                    else{
                        console.log("error occured while fetching difference in citation in a day")
                    }
                    console.log("month is older")
                } 
            }
            else{
                console.log("Erro occured while removing paper")
            }
        }
        else{
            console.log("paper does not exist")
        }
    }
    else{
        console.log("Graph Id does not exists")
    }
})

exports.UpdatePapersCitations = async(function(papers){
    const checkPaperExist = await(Paperupload.find({_id:papers._id}))
    if(checkPaperExist.length!==0){
        const fetchCiataionValues = await(fetchPaperCitation(papers))
        if(fetchCiataionValues.length!=0){
            // console.log("fetchCiataionValues",fetchCiataionValues)
            if(fetchCiataionValues[0].hasOwnProperty('CC')){
                 const updatePapercitations = await(Paperupload.findOneAndUpdate({_id:papers._id},{$set:{citations:fetchCiataionValues[0].CC}}))
                console.log("citations updated successfully")
            }
            else{
                console.log("citaion does not exist")
            }
        }
        else{
            console.log("paper has no citations")
        }
    }
    else{
        console.log("paper does not exist")
    }

})

function fetchPaperCitation(papers){
    var title = papers.papertitle.toLowerCase();
    var paperId = papers.paperUploadedId;
    var subscriptionKey = 'b60240e8f77e4531b13ccb8b9b922598';
    let headers = {'Content-Type': 'application/json'}
    var params = "?expr=And(Id="+paperId+",Ti=='"+title+"')&model=latest&count=10&offset=0&attributes=Id,Ti,Id,CC,&subscription-key="+subscriptionKey+"" ;
    // var params = "?expr=Id='"+paperId+"'&model=latest&count=10&offset=0&attributes=Ti,Id,CC&subscription-key="+subscriptionKey+"" ;
    var url = 'https://api.labs.cognitive.microsoft.com/academic/v1.0/evaluate'+params;
    // console.log("url",url)
    var papernotpresent = [];
    var results = await (r2(url, {headers}).json);
    if(results.hasOwnProperty('Error')){
        return papernotpresent;
    }
    else if(results.hasOwnProperty('expr')){
        if(results.entities.length!=0){
            return results.entities;
        }
        else{
            return papernotpresent;
        } 
    }
    else{
        return papernotpresent
    }
}

function fetchCurrentMonthSnapshots(checkMainSnapshotwithmonthExist,monthYear){
    var mainSnapshot=[];
    const UpdateMain = checkMainSnapshotwithmonthExist.map(function(main){
            main.snapshots.map(function(snapshots){
                mainSnapshot.push(snapshots)
            })
    });
    var filterMonthsSnapshot = mainSnapshot.filter(function(snap){
         return snap.my == monthYear;
    })
    return filterMonthsSnapshot;
}

function calculateViewsCitations(fetchMonthSnapshot){
    var totalCitations =0;
    var totalViews = 0;
    var totalDownloads = 0;
    var allPapers =fetchMonthSnapshot.papers;
    var totalCount = [];
    // console.log("papers",fetchMonthSnapshot.papers)
    for (papers of allPapers ){
        totalDownloads=totalDownloads+papers.totalDownload;
        totalViews = totalViews+papers.totalView;
        totalCitations = totalCitations+papers.totalCitation;
    }
    totalCount.push({totalDownloads:totalDownloads,totalViews:totalViews,totalCitations})
    // console.log("totalCount",totalCount)
    return totalCount;
}

function calaulateGindexHindex(graph){
    var cit =[];
    var fetchallPapers = graph.papers;
    var fetchallCitations = fetchallPapers.map(function(paper){
        cit.push(paper.totalCitation)
    })
    // console.log("cit",cit)
    return cit;
}

function checkPaperMonthSnapshotExist(papers,month,paperId) {
    var allPapers = papers.papers;
    var myPaper = [];
    var fetchPaper = allPapers.filter(function(paper){
        if (paper.paperId.equals(paperId)) {
            myPaper.push(paper)
        }
    })
    // console.log("month",month)
    // console.log("myPaper",myPaper)
    var snapshots = myPaper[0].snapshots;
    // console.log("fetchPaper",snapshots)
    var monthSnapshot = [];
    var filterMonthSnapshtots = snapshots.filter(function(snapshots){
        if(snapshots.my === month){
            monthSnapshot.push(snapshots)
        }
    })
    // console.log("monthSnapshot",monthSnapshot)
    return monthSnapshot
}

function fetchDifference(graph,totalviewdownloadcitation,monthYear){
    var snapshots = graph[0].snapshots;
    var findSnapshot = snapshots.filter(function(snap){
        return snap.my == monthYear
    })
    // console.log("findSnapshot",findSnapshot)
    // console.log("totalviewdownloadcitation",totalviewdownloadcitation)
    var differenceCitation = totalviewdownloadcitation[0].totalCitations-findSnapshot[0].citation;
    var differnceViews = totalviewdownloadcitation[0].totalViews-findSnapshot[0].views;
    var differncesDownloads = totalviewdownloadcitation[0].totalDownloads-findSnapshot[0].downloads;
    var differnceArr = {differenceCitation:differenceCitation,differnceViews:differnceViews,differncesDownloads:differncesDownloads};
    // console.log("differnceArr",differnceArr)
    return differnceArr;
}

function calculateDeleted(graph,downloads,views,citations,createdDate){
    var snapshots = graph.snapshots;
    var mymoth = moment(createdDate).format('MMM').toLowerCase();
    var myYear = moment(createdDate).format('YYYY').toLowerCase();
    var monthYear = mymoth + "-" + myYear;
    // console.log("mymoth",monthYear)

     // console.log("snapshots",snapshots)
    var findSnapshot = snapshots.filter(function(snap){
        return snap.my == monthYear
    })
    // console.log("findSnapshot",findSnapshot)
    // console.log("totalviewdownloadcitation",totalviewdownloadcitation)
    var differenceCitation =findSnapshot[0].citation-citations;
    var differnceViews = findSnapshot[0].views-views;
    var differncesDownloads = findSnapshot[0].downloads-downloads;
    var deletedArr = {differenceCitation:differenceCitation,differnceViews:differnceViews,differncesDownloads:differncesDownloads};
    // console.log("deletedArr",deletedArr)
    return deletedArr;
}


function fetchdiffenceInday(graph,citations){
    var snapshots = graph.snapshots;
    var mymoth = moment().format('MMM').toLowerCase();
    var myYear = moment().format('YYYY').toLowerCase();
    var monthYear = mymoth + "-" + myYear;

    var findSnapshot = snapshots.filter(function(snap){
        return snap.my == monthYear
    })

    var differenceCitation =findSnapshot[0].citation-citations;
    var differnceInDayCitaion = {differenceCitation:differenceCitation} 
    // console.log("differnceInDayCitaion",differnceInDayCitaion)
    return differnceInDayCitaion;
}

function fetchdiffenceInSamemonth(graph,citations,downloads,views){
    var snapshots = graph.snapshots;
    var mymoth = moment().format('MMM').toLowerCase();
    var myYear = moment().format('YYYY').toLowerCase();
    var monthYear = mymoth + "-" + myYear;

    var findSnapshot = snapshots.filter(function(snap){
        return snap.my == monthYear
    })

    var differenceCitation =findSnapshot[0].citation-citations;
    var differenceviews =findSnapshot[0].views-views;
    var differencedownloads =findSnapshot[0].downloads-downloads;
    var differnceInmonthCitaion = {differenceCitation:differenceCitation,differenceviews:differenceviews,differencedownloads:differencedownloads} 
    // console.log("differnceInmonthCitaion",differnceInmonthCitaion)
    return differnceInmonthCitaion;
}
