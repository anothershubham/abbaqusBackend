var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var myRecommendedSchema = new Schema({
    paper: { type: mongoose.Schema.Types.ObjectId,ref: 'paperupload'},
    recommendedBy: { type: mongoose.Schema.Types.ObjectId,ref: 'users'},
    recommendedFor: [{ type: mongoose.Schema.Types.ObjectId,ref: 'users'}],
    },
    {
        timestamps: true
    })

module.exports = mongoose.model('MyRecommend', myRecommendedSchema);