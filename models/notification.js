var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var notificationSchema = new Schema({
	sender:{
		type: Schema.Types.ObjectId,
		ref:'users'
	},
	reciever:{
		type: Schema.Types.ObjectId,
		ref:'users'
	},
	questionId:{
		type: Schema.Types.ObjectId,
		ref:'questions',
		Default:null,
	},
	unAdmiredId:{
		type: Schema.Types.ObjectId,
		ref:'users',
		Default:null,
	},
	message:{
		type:String
	},
	isRead:{
		type:Boolean,
		default:false
	}
	},
	{ 
  		timestamps: true
});

module.exports = mongoose.model('notification', notificationSchema);