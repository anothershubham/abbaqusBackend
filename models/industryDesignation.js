const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const	IndustryDesignation=new Schema({
	industrydesignation:[]
},
{ 
  timestamps: true
});

module.exports = mongoose.model('industrydesignation', IndustryDesignation);