var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var myRecommendedSchema = new Schema({
    questions: { type: mongoose.Schema.Types.ObjectId,ref: 'questions'},
    recommendedBy: { type: mongoose.Schema.Types.ObjectId,ref: 'users'},
    recommendedFor: [{ type: mongoose.Schema.Types.ObjectId,ref: 'users'}],
    },
    {
        timestamps: true
    })

module.exports = mongoose.model('MyRecommendQuestions', myRecommendedSchema);