const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Subtopic=new Schema({

	topic_id:{ type: mongoose.Schema.Types.ObjectId,ref: 'topic'},
	subtopics:[]
	
},
{ 
  timestamps: true
});

module.exports = mongoose.model('subtopic', Subtopic);