var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var bookmarkSchema = new Schema({
	userId:{
		type: Schema.Types.ObjectId,
		ref:'users'
	},
	paperId:{
		type:Schema.Types.ObjectId,
		ref:'paperupload',
		default:null
	},
	feedsId:{
		type:Schema.Types.ObjectId,
		ref:'feeds',
		default:null
	},
	bookmarkType:{
		type:String,
		enum:["paper","feeds"]
	}
},
{
		timestamps: true
});

module.exports = mongoose.model('bookmark', bookmarkSchema);