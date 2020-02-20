var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var FeedsViews = new Schema({
	vieweduserId:{
		type: Schema.Types.ObjectId,
		ref: 'users',
		default:null
	},
	feedId :{
		type: Schema.Types.ObjectId,
		ref: 'feeds',
		default:null
	}
},
{ 
	  timestamps: true
})

module.exports = mongoose.model('feedsviews', FeedsViews);