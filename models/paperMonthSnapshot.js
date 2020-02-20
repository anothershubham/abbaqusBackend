var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var paperMonthSnapshotSchema = new Schema({
	userId:{
		type: mongoose.Schema.Types.ObjectId,
		ref:'users'
	},
	paperId:{
		type:mongoose.Schema.Types.ObjectId,
		ref:'paperupload'
	},
	citations:{
		type:Number,
		default:0
	},
	views:{
		type:Number,
		default:0
	},
	publicationDate : {
		type:String,
		default:null
	},
	downloads:{
		type:Number,
		default:0
	},
	month:{
		type:String,
		default:0
	},
	year:{
		type:Number
	},
	my:{
		type:String,
		default:null
	}
},
{
		timestamps: true
});

module.exports = mongoose.model('paperMonthSnaphsot', paperMonthSnapshotSchema);