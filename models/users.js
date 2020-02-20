var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongoosastic = require('mongoosastic')

var UserSchema=new Schema({
	firstname:{
		type:String, 
		es_indexed:true
	},
	lastname:{
		type:String, 
		es_indexed:true
	},
	email:{
		type:String,
		unique:true, 
		es_indexed:true
	},
	password:{
		type:String,
		required:true
	},
	role:{
		type:String, 
		es_indexed:true
	},
	organization:{
		type:String,
		Default:null, 
		es_indexed:true
	},
	designation:{
		type:String,
		Default:null, 
		es_indexed:true
	},
	OtherDesignation:{
		type:String,
		Default:null,
		es_indexed:true
	},
	industry:{
		type:String,
		Default:null, 
		es_indexed:true
	},
	university:{
		type:String,
		Default:null, 
		es_indexed:true
	},
	degree:{
		type:String,
		Default:null, 
		es_indexed:true
	}, 
	other:{
		type:String,
		Default:null, 
		es_indexed:true
	},
	otp:{
		type:String
	},
	otpVerified:{
		type:Boolean,
		default:false,
		es_indexed:true
	},
	dob:{
		type:Date, 
		es_type:'date',
		es_indexed:true
	},
	profileImg:{type:String, 
		es_indexed:true
	},
	isfollowed:{
		type:Boolean,
		default:false,
		es_indexed:true
	},
	count:{type:Number,Default:0},
	topics:[{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'topic',
		es_indexed:true
	}],
	subtopics:[{
		subtopicName:{
			type:String,
			es_indexed:true
		},
		topic:{
			type: mongoose.Schema.Types.ObjectId,
			ref:'topic',
			es_indexed:true
		}
	}],
	maindiscpline: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'maindiscpline', 
		es_indexed:true
	}],
	location:{
		type:String, 
		es_indexed:true
	},
	question:[{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'questions', 
		es_indexed:true
	}],
	paper: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'paperupload', 
		es_indexed:true
	}],
	graph: {
		type:mongoose.Schema.Types.ObjectId,
		ref: 'graphData' ,  
		// es_indexed:true,
		es_select: '_id snapshots papers createdAt updatedAt userData'
	},
	createdAt: {type:Date, es_type:'date', es_indexed: true},
  	updatedAt: {type:Date, es_type:'date', es_indexed: true}
},
	{
		timestamps: true
	});
// UserSchema.index({firstname: 1, lastname: 1,email:1});4
UserSchema.plugin(mongoosastic,{
	populate: [
    {path: 'graph' ,es_select: '_id snapshots papers createdAt updatedAt userData'}
  ],
hosts: [
    'https://search-abbaqus-6apxkeoweigazbzscibl3s5sqq.ap-south-1.es.amazonaws.com'
    
  ]

}); 
// Questions.index({questionText:"text"});

var user=mongoose.model('users',UserSchema)
  , stream = user.synchronize({}, {saveOnSynchronize: true})
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


module.exports = user;
// module.exports = mongoose.model('users', UserSchema);