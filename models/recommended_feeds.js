var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var recommendedSchema = new Schema({
   	feedsId:{
		type:mongoose.Schema.Types.ObjectId,
		ref:'feeds',
		default:null
	},
	userId:{
		type: mongoose.Schema.Types.ObjectId,
		ref:'users'
	},
    recommendType:{
		type:String,
		enum:["feeds"]
	}
    },
    {
        timestamps: true
})

module.exports = mongoose.model('RecommendedFeeds', recommendedSchema);