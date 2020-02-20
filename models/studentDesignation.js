const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StudentDesignation=new Schema({
	studentdesignation:[]
},
{ 
  timestamps: true
});

module.exports = mongoose.model('studentdesignation', StudentDesignation);