const Notification = require('../models/notification');


exports.recieverExist = function(recevierId){
	return Notification.find({reciever:recevierId}).sort({createdAt: -1}).populate('sender','_id firstname lastname profileImg role designation organization').limit(10);
}


exports.notificationUpdate = function(notifications){
	return Notification.updateMany({ "_id": { "$in": notifications }}, { "$set": { isRead: true }},{new: true});
}