var mongoose = require('mongoose'); 
var Schema = mongoose.Schema;
var mongoosastic = require('mongoosastic')
var uniqueValidator = require('mongoose-unique-validator');

var Feeds=new Schema({
	title:{type:String, unique: true,es_indexed: true},
	link:{type:String,es_indexed: true},
	content:{type:String, es_indexed: true},
	content_snippet:{type:String, es_indexed: true},
	categories:{type:String,es_indexed: true },
	media:{type:String,es_type:'string',es_indexed: true},
	viewCount:{type:Number,default:0,es_indexed: true},
  istype:{type:String,default:'feeds',es_indexed: true}, 
  topics:[{type: mongoose.Schema.Types.ObjectId, ref: 'topic',default:null, es_indexed: true,es_select: 'topic_name'}],
  createdAt: {type:Date, es_type:'date', es_indexed: true},
  updatedAt: {type:Date, es_type:'date', es_indexed: true},
  feedsSourceUrl:{type:String,es_indexed: true},
  feedSource:{type:String,es_indexed: true},
  feedSourceImage:{type:String,es_indexed:true},
  feedsWebsite:{type:String,es_indexed:true},
  recommended: [{ type: mongoose.Schema.Types.ObjectId,ref: 'users',default:null,es_indexed: true,es_select: 'profileImg'}],
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
  reply:[{
          repliedBy:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            es_indexed:true,
            es_select:'_id firstname lastname profileImg role designation' 
          },
          comment:{
            type:String,
            default:null,
            es_indexed:true
          },
          dateAt:{
            type:String,
            es_indexed:true
          }
        }]
},
{ 
  timestamps: true
}); 
 // Feeds.index({title: 'text', link: 'text', content: 'text', content_snippet: 'text'});
Feeds.plugin(uniqueValidator);

Feeds.plugin(mongoosastic,{
    populate: [
    {path: 'topics', select: 'topic_name'},
    {path:'recommended', select:'profileImg'}
  ],
hosts: [
    'https://search-abbaqus-6apxkeoweigazbzscibl3s5sqq.ap-south-1.es.amazonaws.com'
     ]

}); 

var Feed=mongoose.model('feeds', Feeds)
  , stream = Feed.synchronize({}, {saveOnSynchronize: true})
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

module.exports = Feed;

//module.exports = mongoose.model('feeds', Feeds);