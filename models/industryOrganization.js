const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const IndustryOraganization=new Schema({
	industryorganization:[]
},
{ 
  timestamps: true
});

module.exports = mongoose.model('industryorganization', IndustryOraganization);