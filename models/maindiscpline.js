var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mainDiscplineSchema = new Schema({
	disciplineName :{
		type:String
	},
	},
{ 
	  timestamps: true
})

module.exports = mongoose.model('maindiscpline', mainDiscplineSchema);