const Events = require('../models/events');


exports.setEventDate = function(body,bodydate){
	const {eventtime,eventname,eventvenue,eventLink,topics,discpline,latitude,longitude} = body;
	const createEvents = new Events;
	 createEvents.eventdate = bodydate;
	// createEvents.eventtime = eventtime;
	createEvents.eventname = eventname; 
	createEvents.eventvenue = eventvenue;
	createEvents.eventLink = eventLink;
	createEvents.topics = topics;
	createEvents.discpline = discpline;
	createEvents.lat = latitude;
	createEvents.lng = longitude;
	createEvents.save();
	return createEvents;
}

exports.fetchAllEvents = function(){
	return Events.find({}).sort({createdAt:-1});
}

exports.fetchEventsnew = function(date){
	return Events.find({'eventdate': {$gt : date}}).sort({eventdate:1}).limit(3); 
}

exports.updateEvents = function(updateData){
	return Events.findOneAndUpdate({_id:updateData.eventsId},
		{
			$set:{ 
					// eventtime: updateData.eventtime,
					eventdate: updateData.eventdate,
					eventname: updateData.eventname,
					eventvenue: updateData.eventvenue,
					eventLink:updateData.eventLink,
					topics:updateData.topics,
					lat:updateData.latitude,
					lng:updateData.longitude
			}
		});
}

exports.eventExist = function(eventId){
	return Events.findOne({_id:eventId});
}

exports.eventDelete = function(eventId){
	return Events.remove({_id:eventId});
}