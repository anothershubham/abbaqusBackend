const Events = require('../models/events');
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const eventsService = require('../services/eventsService');
const moment = require('moment');
const AddOrganization = require('../models/organization');
const Designation = require('../models/designation');
const ImpactFactor = require('../models/impactFactor');
const excelToJson = require('convert-excel-to-json');
const User = require('../models/users');

exports.setEvent = async(function(req,res,next){
	var eventDate = req.body.eventdate;
	var dateEvents = moment(eventDate, "DD/MM/YYYY hh:mm a").utc().toDate();
	const createEvent = await(eventsService.setEventDate(req.body,dateEvents));
	if(createEvent.length!=0){
		res.json({status:200,message:"Event created successfully"});
	}
	else{
		res.send({status:500,message:"Failure"})
	}
});

//elastic api for events
exports.fetchUserAllEvents = function(req,res,next){
	var userId = req.body.userId;
	var from = 0;
	var size = 10000;
	User.find({_id:userId}).populate('topics')
		.then((userFound)=>{
				var topicsname =[];
				var userDet = userFound.map(function(userObj){
					userObj.topics.map(function(topicocj){
						topicsname.push(topicocj.topic_name);
					})
				})
				var topi= topicsname.map(v => v.toLowerCase());
				Events.esSearch({ from:from,
							    	size:size,
									    query:{
									    		"terms" : {
									            "topics": topi
									        	}
									    }   
							},
							function(err, results) {
								return res.json({result:results.hits.hits})
				})
		})
		.catch(err=>{
			return res.json({status:500,message:'User not found',err:err});
		})
}
// end


exports.allEvents = async(function(req,res,next){
	const today = moment(new Date()).format('YYYY-MM-DD');
	const fetchEvents = await(eventsService.fetchEventsnew(today));
	if(fetchEvents.length!= 0){
		res.json({status:200,message:"Success",result:fetchEvents});
	}
	else{
		res.json({status:500,message:"Failure"});
	}
})

exports.updateEvents = async(function(req,res,next){
	const {eventsId} = req.body;
	
	try{
		const eventExistings = await(eventsService.eventExist(eventsId));
		if(eventExistings){
			const updateEvents = await(eventsService.updateEvents(req.body));
			if(updateEvents){
				res.json({status:200,message:"Success"});
			}
			else{
				res.json({status:500,message:"Failure"});
			}
		}
		else{
			res.json({status:500,message:"Event does not Exist"});
		}

	}
	catch(error){
		return res.send(error);
	}
})

exports.deleteEvents = async(function(req,res,next){
	const {eventsId} = req.body;
	try{
		const checkeventexist = await(eventsService.eventExist(eventsId));
		if(checkeventexist){
			const deleteEvent = await(eventsService.eventDelete(eventsId));
			if(deleteEvent){
				res.json({status:200,message:"Success"});
			}
			else{
				res.json({status:500,message:"Failure"});
			}
		}
		else{
				res.json({status:500,message:"Event does not exist"});
		}

	}
	catch(error){
		return res.send(error);
	}
})


exports.addEventsExcel = function(req,res,next){
	const createEvents = new Events;
	const result = excelToJson({
    sourceFile: 'views/Events1.xlsx',
     header:{
        rows: 1
    },
     columnToKey: {
        // '*': '{{columnHeader}}'
        A: 'eventname',
        B: 'discpline',
        C:'topics',
        D:'eventvenue',
        E:'eventLink',
        F:'eventdate',
        G:'lat',
        H:'lng'
    } 
	});
	result.Sheet1.map(function(events){
		events.topics=events.topics.split(",");
		events.eventdate = moment(events.eventdate, "DD/MM/YYYY hh:mm a").utc().toDate();
	})
	 // return Events
	 Events.insertMany(result.Sheet1)
	 .then(results=>{
	 	return res.json({status:200,message:'Success'})
	 })
}

//api to Journal Impact factor excel to Impactfactor table
exports.addImpactFactor = function(req,res,next){
	const createImpactFactor = new ImpactFactor;
	const result = excelToJson({
    sourceFile: 'views/Journal and H-index.xlsx',
     header:{
        rows: 1
    },
     columnToKey: {
        // '*': '{{columnHeader}}'
        A: 'journalName',
        B: 'type',
        C:'h_index'
    } 
	});
	//  // return Events
	 ImpactFactor.insertMany(result.Sheet1)
	 .then(results=>{
	 	return res.json({status:200,message:'Success'})
	 })
}
//end

exports.fetchOrganizationList  = function(req,res,next){
	var searchText = req.body.searchtext;
	AddOrganization.esSearch({
	    "suggest": {
	        "orginaztion_suggest": {
	            "prefix" :searchText , 
	            "completion": {
	                "field": "organization",
	                "size" :  13000
	            }
	        }
	    }
	},
	 	function(err, results) {
	  	 if(err){
		  	return res.json({status:500,message:'Error occured',err:err})
		  }
		  else{
		  	return res.json({status:200,message:'Success',result:results.suggest.orginaztion_suggest})
		}
	});
}


exports.designtionExcel = function(req,res,next){
	const createEvents = new Events;
	const result = excelToJson({
    sourceFile: 'excelFolder/IndustryProfessionalDesignations.xlsx',
     header:{
        rows: 1
    },
     columnToKey: {
        // '*': '{{columnHeader}}'
        A: 'designation'
    } 
	});
	 // return Events
	 Designation.insertMany(result.sheets1)
	 .then(results=>{
	 	return res.json({status:200,message:'Success'})
	 })
}


exports.fetchDesignationList  = function(req,res,next){
	var searchText = req.body.searchtext;
	Designation.esSearch({
	    "suggest": {
	        "designation_suggest": {
	            "prefix" :searchText , 
	            "completion": {
	                "field": "designation",
	                "size" :  13000
	            }
	        }
	    }
	},
	 	function(err, results) {
	  	 if(err){
		  	return res.json({status:500,message:'Error occured',err:err})
		  }
		  else{
		  	return res.json({status:200,message:'Success',result:results.suggest.designation_suggest})
		}
	});
}