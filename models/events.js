var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongoosastic = require('mongoosastic')


var eventsSchema = new Schema({
	eventdate :{
		type:Date,
		es_indexed:true
	},
	topics:{
		type:Array,
		es_indexed:true
	},
	discpline: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'maindiscpline',
		es_indexed:true
	}],
	eventname:{
		type:String,
		es_indexed:true,
		Default:null
	},
	eventvenue:{
		type:String,
		es_indexed:true,
		Default:null
	},
	eventLink:{
		type:String,
		es_indexed:true,
		Default:null
	},
	lat:{
		type:String,
		es_indexed:true,
		Default:null
	},
	lng:{
		type:String,
		es_indexed:true,
		Default:null
	},
	 isExpired:{
      type: Boolean,
      es_indexed:true,
      default: false
    }
	},
	{ 
	  timestamps: true
	})

eventsSchema.plugin(mongoosastic,{
hosts: [
    'https://search-abbaqus-6apxkeoweigazbzscibl3s5sqq.ap-south-1.es.amazonaws.com'
  ]

}); 

var event=mongoose.model('events',eventsSchema)
  , stream = event.synchronize({}, {saveOnSynchronize: true})
  , count = 0; 

  stream.on('data', function(err, doc){
  count++;
  });

stream.on('close', function(){
  console.log('indexed ' + count + ' documents!');
});

stream.on('error', function(err){
  console.log(err); 
});

module.exports = event;

// module.exports = mongoose.model('events', eventsSchema);