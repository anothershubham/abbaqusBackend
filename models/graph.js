var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var graphSchema = new Schema({
	snapshots: [{
		month:{type:String},
		year:{type:String},
		my:{type:String},
		citation:{type:Number},
		views:{type:Number},
		downloads:{type:Number} 
	}],
	papers: [{
		name:{type:String},
		paperId:{type: mongoose.Schema.Types.ObjectId,
            	ref: 'paperupload'},
        paperType:{type:String},
        paperPublication:{type:String},
        totalCitation:{type:Number},
        totalView:{type:Number},
        totalDownload:{type:Number},
        snapshots:[{
        	month:{type:String},
			year:{type:String},
			my:{type:String},
			citation:{type:Number},
			views:{type:Number},
			downloads:{type:Number},
        }]
	}],
	userData: [{
		totalCitation:{type:Number},
        totalView:{type:Number},
        totalDownload:{type:Number},
        gIndex:{type:Number},
        hIndex:{type:Number},
        i10Index:{type:Number}
	}],
	userId:{
		type:  mongoose.Schema.Types.ObjectId,
		ref:'users'
	},
	__v: { type: Number, select: false }
}, 
	{
		timestamps: true
	}, { versionKey: false })

module.exports = mongoose.model('graphData', graphSchema);