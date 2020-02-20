const async = require('asyncawait/async');
const await = require('asyncawait/await');
const Notification = require('../models/notification');
const NotificationService = require('../services/notificationService');

exports.notifications = async(function(req,res){
	try{
		var recevierId = req.body.recevierId;
		const recieverExist = await(NotificationService.recieverExist(recevierId));
		if(recieverExist){
			return res.json({status:200,message:'Success',result:recieverExist});
		}
		else{
			return res.json({status:500,message:'Does not exist'});
		}
	}
	catch(err){
		return res.json({status:500,message:err});
	}
});

exports.viewed = async(function(req,res){
	try{
		var notificationId = req.body.notificationId;
			const notificationUpdateall = await(NotificationService.notificationUpdate(notificationId));
			if(notificationUpdateall){
				return res.json({status:200,message:'Success'});
			}
			else{
				return res.json({status:500,message:'Unable to update Notification'});
			}
	}
	catch(err){
		return res.json({status:500,message:'Error occured'});
	}
})