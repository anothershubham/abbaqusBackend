const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var mongoosastic = require('mongoosastic')

const Oraganization=new Schema({
	organization:{
        type: String,
        es_type: 'completion'
	}
},
{ 
  timestamps: true
});

Oraganization.plugin(mongoosastic,{
hosts: [
    'https://search-abbaqus-6apxkeoweigazbzscibl3s5sqq.ap-south-1.es.amazonaws.com'
    
  ]
});

var orgnization=mongoose.model('organization',Oraganization);
  

orgnization.createMapping(function(err, mapping) {
    if (err) {
        console.log('error creating mapping (you can safely ignore this)');
        console.log("err",err);
    } else {
        console.log('mapping created!');
        console.log(mapping);
    }
});

var stream = orgnization.synchronize(),
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

module.exports = orgnization;


// module.exports = mongoose.model('organization', Oraganization);