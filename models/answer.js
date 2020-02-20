var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var answerSchema = new Schema({
	userId:{
		type: Schema.Types.ObjectId,
		ref:'users'
	},
	questionId:{
		type:Schema.Types.ObjectId,
		ref:'questions'
	},
	isMultipleQuestion:{
		type:Boolean,
		default:false
	},
	answer:{
		type:String,
		required:true
	}
	},
	{
		timestamps:true
	
});
module.exports = mongoose.model('answer', answerSchema);
	
