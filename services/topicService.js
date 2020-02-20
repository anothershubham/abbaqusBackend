const Topic = require('../models/topics');
const Subtopic = require('../models/subtopics');
const AddDesignation = require('../models/designation');
const AddOrganization = require('../models/organization');
const industryDesignation = require('../models/industryDesignation');
const industryOrganization = require('../models/industryOrganization');
const StudentDesignation = require('../models/studentDesignation');
const Feed = require('../models/feeds');

exports.insertTopics = function(topic_name) {
    const topic = new Topic;
    topic.topic_name = topic_name;
    topic.save();
    return topic;
}
exports.insertByAdminTopics = function(data) {
    console.log(data);
    const topic = new Topic;
    topic.topic_name = data.topic_name;
    topic.topicContent = data.topicContent;
    topic.discpline = data.discpline;
    topic.save();
    return topic;
}
exports.updateTopics = function(updateData) {
    console.log(updateData, "update----");
    return Topic.UpdateOne({ _id: updateData.topicId }, {
        $set: {
            topic_name: updateData.topic_name,
            topicContent: updateData.topicContent
        }
    });
}

exports.topicExist = function(topicId) {
    return Topic.findOne({ _id: topicId });
}

exports.topicDelete = function(topicId) {
    return Topic.remove({ _id: topicId });
}
exports.maptopics = function(topic_id, subtopics) {
    const subtopic = new Subtopic;
    subtopic.topic_id = topic_id;
    subtopic.subtopics = subtopics.split(",");
    subtopic.save();
    return subtopic;
}

exports.getSubtopics = function(topic_id) {
    return Subtopic.find({ "topic_id": { "$in": topic_id } }).populate('topic_id')
}
exports.getFeeds = function(topic_id) {
    return Feed.find({ "topic_id": { "$eq": topic_id } }).populate('topic_id')
}
exports.getAlltopicsForFeeds = function() {
    return Topic.find();
}

exports.getAlltopics = function(discplineId) {
    return Topic.find({ discpline: discplineId });
}


exports.updateTopics = function(discplineId) {
    return Topic.update({}, { '$set': { 'discpline': discplineId } }, { multi: true, new: true });
}

exports.addingDesignation = function(body) {
    const { designation } = body;
    const designations = new AddDesignation;
    designations.designation = designation.split(",");
    designations.save();
    return designations;
}

exports.allDesignations = function() {
    return AddDesignation.find({});
}


exports.addDesigStudent = function(body) {
    const { studentdesignations } = body;
    const designation = new StudentDesignation;
    designation.studentdesignation = studentdesignations.split(",");
    designation.save();
    return designation;
}

exports.fetchstudentDesig = function() {
    return StudentDesignation.find({});
}


exports.allOrganization = function() {
    return AddOrganization.find({});
}

exports.fetchindustryDeisgnation = function() {
    return industryDesignation.find({})
}

exports.fetchindustryOrganization = function() {
    return industryOrganization.find({})
}