var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var recommendedSchema = new Schema({
	questionId:{
		type:mongoose.Schema.Types.ObjectId,
		ref:'questions',
		default:null
	},
	userId:{
		type: mongoose.Schema.Types.ObjectId,
		ref:'users'
	},
    recommendType:{
		type:String,
		enum:["questions"]
	}
    },
    {
        timestamps: true
})

module.exports = mongoose.model('RecommendedQuestions', recommendedSchema);