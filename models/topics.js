const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Topic = new Schema({
    topic_name: {
        type: String
    },
    topicContent: {
        type: String
    },
    discipline: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'maindiscipline',
        Default: null,
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('topic', Topic);