var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongoosastic = require('mongoosastic')

var Questions=new Schema({
	userId:{
		type:  mongoose.Schema.Types.ObjectId,
		ref:'users', 
		es_indexed:true,
		es_select: '_id firstname lastname profileImg role designation organization'
	},
	questionText: {
		type : String, 
		es_indexed:true,
		required : true, 
		lowercase : true
	},
	isrecommended:{
		type:Boolean,
		default:false,
		es_indexed:true
	},
	isbookmarked:{
		type:Boolean,
		default:false,
		es_indexed:true
	},	
	views:{
		type:Number,
		default:0,
		es_indexed:true
	},	
  	options :{
		type: Array,
		es_indexed:true
	},
	istype:{
		type:String,
		default:'questions'
	},
	recommended: [{ type: mongoose.Schema.Types.ObjectId,ref: 'users',default:null,es_indexed: true,es_select: 'profileImg'}],
	answer:[{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'answer',
		es_indexed:true
	}],
	isMultipleQuestion:{
		type:Boolean,
		default:false,
		es_indexed:true
	} ,
	createdAt: {type:Date, es_type:'date', es_indexed: true},
  	updatedAt: {type:Date, es_type:'date', es_indexed: true}
},
{ 
  timestamps: true
});

Questions.plugin(mongoosastic,{
  populate: [
    {path: 'userId', select: '_id firstname lastname profileImg role designation organization'},
    {path:'recommended', select:'profileImg'}
  ],
hosts: [
    'https://search-abbaqus-6apxkeoweigazbzscibl3s5sqq.ap-south-1.es.amazonaws.com'
    
  ]

});
// Questions.index({questionText:"text"});

var question=mongoose.model('questions',Questions)
  , stream = question.synchronize({}, {saveOnSynchronize: true})
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

module.exports = question;

 // module.exports = mongoose.model('questions', Questions);
