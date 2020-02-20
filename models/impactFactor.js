var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var impactFactorSchema = new Schema({
	journalName:{
		type: String
	},
	type:{
		type:String
	},
	h_index:{
		type:Number
	}
	},
	{
		timestamps:true
});
module.exports = mongoose.model('impactfactor', impactFactorSchema);
	
