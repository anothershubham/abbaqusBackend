var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongoosastic = require('mongoosastic')


var blogsSchema = new Schema({
	blogdate :{
		type:Date,
		es_indexed:true
	},
	blogTitle:{
		type:String,
		es_indexed:true
	},
	blogContent:{
		type:String,
		es_indexed:true
	},
	},
	{ 
	  timestamps: true
	})

blogsSchema.plugin(mongoosastic,{
hosts: [
    'https://search-abbaqus-6apxkeoweigazbzscibl3s5sqq.ap-south-1.es.amazonaws.com'
  ]

}); 

var blog=mongoose.model('blogs',blogsSchema)
  , stream = blog.synchronize({}, {saveOnSynchronize: true})
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

module.exports = blog;

// module.exports = mongoose.model('blogs', blogsSchema);