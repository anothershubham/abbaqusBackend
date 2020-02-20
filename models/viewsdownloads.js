var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var viewsdownloads=new Schema({
	vieweduserId:[{
		type: Schema.Types.ObjectId,
		ref: 'users',
		default:null
	}],
	downloadeduserId:[{
		type: Schema.Types.ObjectId,
		ref: 'users',
		default:null
	}], 
	paperId: {
		 type: Schema.Types.ObjectId,
		 ref: 'paperupload'
		},
	month:{
		type:String,
		default:null
	},
	year:{
		type:String,
		default:null
	},
	views:{
		type: Number,
		default: 0
	},
	downnload:{
		type: Number,
		default: 0
	}
},
{ 
	  timestamps: true
});

module.exports = mongoose.model('viewsdownloads', viewsdownloads);