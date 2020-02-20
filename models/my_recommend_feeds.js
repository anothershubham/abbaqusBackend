var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var myRecommendedSchema = new Schema({
    feeds: { type: mongoose.Schema.Types.ObjectId,ref: 'feeds'},
    recommendedBy: { type: mongoose.Schema.Types.ObjectId,ref: 'users'},
    recommendedFor: [{ type: mongoose.Schema.Types.ObjectId,ref: 'users'}],
    },
    {
        timestamps: true
    })

module.exports = mongoose.model('MyRecommendFeeds', myRecommendedSchema);