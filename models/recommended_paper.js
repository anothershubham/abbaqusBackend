var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var recommendedSchema = new Schema({
	paperId:{
		type:mongoose.Schema.Types.ObjectId,
		ref:'paperupload',
		default:null
	},
	userId:{
		type: mongoose.Schema.Types.ObjectId,
		ref:'users'
	},
    recommendType:{
		type:String,
		enum:["paper"]
	}
    },
    {
        timestamps: true
})

module.exports = mongoose.model('RecommendedPaper', recommendedSchema);