var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var FeedSource=new Schema({
	url:{type:String},
	type:{type:String},
	image:{type:String},
	name:{type:String},
	website:{type:String}
}, { timestamps: true }
);

module.exports = mongoose.model('feedSource', FeedSource);