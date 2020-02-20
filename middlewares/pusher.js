var Pusher = require('pusher');
var exports = module.exports = {};
const config = require('../config');

exports.notification = function(followingId,saveNotification){
	var message=saveNotification.message;
	var dateOfFollow = saveNotification.createdAt;
	var details = {
		message: message,
		date:dateOfFollow
	};
	var pusher = new Pusher({
	  appId: config.pusherApp_id,
	  key: config.pusherAppkey,
	  secret: config.secretPusher,
	  cluster: config.clusterPusher,
	  encrypted: true
	});
	return pusher.trigger(followingId.toString(), 'my-event', {"message":details},function(error,request,response){
		console.log("error",error);
	});
}
