var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongoosastic = require('mongoosastic')
var uniqueValidator = require('mongoose-unique-validator');

var Paperupload=new Schema({
	userId:{
		type:  mongoose.Schema.Types.ObjectId,
		ref:'users',  
		es_indexed:true,
		es_select: '_id firstname lastname profileImg role designation organization',
		default:null
	},
	papertitle :{
		type:String,
		es_type:'text', 
		es_indexed:true
	},
	paperRsstitle :{
		type:String,
		unique: true,
		es_type:'text', 
		es_indexed:true
	},
	recommended: [{ type: mongoose.Schema.Types.ObjectId,ref: 'users',default:null,es_indexed: true,es_select: 'profileImg'}],
	paperabstract :{
		type:String, 
		es_type:'text',
		es_indexed:true
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
	paperType :{ 
		type: String,
		default:null,
		es_indexed:true
	},
	citations:{
		type: Number,
		Default: 0
	},
	doi :{
		type:String,
		default:null,
		es_indexed:true,
	},
	publicationVenue :{
		type:String, 
		es_type:'text',
		es_indexed:true,
		default:null
	},
	downloadPapers:{
		type: Number,
		es_indexed:true,
	},
	tags :{
		type: Array, 
		es_indexed:true,
		default:null
	},
	coauthors:{
		type:Array, 
		Default:null,
		es_indexed:true,
		default:null
	},
	uploadBy:{
		type:String,
		es_indexed: true,
		default:null
	},
	uploadpdf:{ 
		type:String,
		es_indexed: true,
		default:null
	},
	paperSourceLink:{
		type:String,
		es_indexed: true,
		default:null
	},
	paperLink:{
		type:String,
		es_indexed: true,
		default:null
	}, 
	paperLogo:{
		type:String,
		es_indexed: true,
		default:null
	}, 
  	topics:[{type:  mongoose.Schema.Types.ObjectId, ref: 'topic',default:null, es_indexed: true,es_select: 'topic_name'}],
	views:{
		type: Number,
		es_indexed: true,
		Default: 0
	},
	publicationname:{
		type:String,
		Default:null,
		es_type:'text', 
		es_indexed:true,
		default:null
	},
	publicationdate:{ 
		type : String
	},
	istype:{
		type:String,
		default:'paper',
		es_type:'text', 
		es_indexed:true
	},	
	downloadsviews:[{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'viewsdownloads',
		default:null
	}],
	paperUploadedId:{
		type:String,
		es_type:'text', 
		es_indexed:true,
		default:null
	},
	isDeleted:{
		type:Boolean,
		es_type:'text',
		es_indexed:true,
		default:false
	},
	createdAt: {type:Date, es_type:'date', es_indexed: true},
  	updatedAt: {type:Date, es_type:'date', es_indexed: true}
	},
	{ 
	  timestamps: true 
	});

 Paperupload.plugin(uniqueValidator);

Paperupload.plugin(mongoosastic,{
  populate: [
    {path: 'userId', select: '_id firstname lastname profileImg role designation organization'},
    {path: 'topics', select: 'topic_name'}, 
    {path:'recommended', select:'profileImg'}
  ], 
hosts: [
    'https://search-abbaqus-6apxkeoweigazbzscibl3s5sqq.ap-south-1.es.amazonaws.com'
  ]

}); 

var paper=mongoose.model('paperupload',Paperupload)
  , stream = paper.synchronize({}, {saveOnSynchronize: true})
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

module.exports = paper;

// Paperupload.index({papertitle:"text",paperabstract:"text"})

// module.exports = mongoose.model('paperupload', Paperupload);

