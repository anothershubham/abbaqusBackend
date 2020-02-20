const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var mongoosastic = require('mongoosastic')

const Designation=new Schema({
	designation:{
        type: String,
        es_type: 'completion'
    }
},
{ 
  timestamps: true 
});

Designation.plugin(mongoosastic,{
hosts: [
    'https://search-abbaqus-6apxkeoweigazbzscibl3s5sqq.ap-south-1.es.amazonaws.com'
    
  ]
});

var designation=mongoose.model('designation',Designation);
  

designation.createMapping(function(err, mapping) {
    if (err) {
        console.log('error creating mapping (you can safely ignore this)');
        console.log("err",err);
    } else {
        console.log('mapping created!');
        console.log(mapping);
    }
});

var stream = designation.synchronize(),
    count = 0;

stream.on('data', function(err, doc) {
    count++;
});
stream.on('close', function() {
    console.log('indexed ' + count + ' documents!');
});
stream.on('error', function(err) {
    console.log(err);
});

module.exports = designation;

// module.exports = mongoose.model('designation', Designation);