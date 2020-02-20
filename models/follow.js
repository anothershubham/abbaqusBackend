var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var FollowSchema = new Schema({
	userId:{
		type: Schema.Types.ObjectId,
		ref:'users'
	},
	following:{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'users'
	}
	},
	{ 
	  timestamps: true
});

module.exports = mongoose.model('follow', FollowSchema);
