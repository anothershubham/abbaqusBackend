var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var questionViews=new Schema({
	vieweduserId:[{
		type: Schema.Types.ObjectId,
		ref: 'users',
		default:null
	}], 
	questionId: {
		 type: Schema.Types.ObjectId,
		 ref: 'questions'
	}
},
{ 
	  timestamps: true
});

module.exports = mongoose.model('questionViews', questionViews);