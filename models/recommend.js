var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var recommendSchema = new Schema({
	userId:{
		type: Schema.Types.ObjectId,
		ref:'users'
	},
	recommended:{
		type: Schema.Types.ObjectId,
		refPath: 'recommendType'
	},
	recommendType:{
		type:String,
		enum: ['paperupload', 'feeds','questions']
	}
},
{
		timestamps: true
});

module.exports = mongoose.model('recommend', recommendSchema);
