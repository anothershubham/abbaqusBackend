const async = require('asyncawait/async');
const await = require('asyncawait/await');
const topicService = require('../services/topicService');
const AddOrganization = require('../models/organization');
const industryDesignation = require('../models/industryDesignation');
const industryOrganization = require('../models/industryOrganization');
const Topic = require('../models/topics');
const mongoose = require('mongoose');
const excelToJson = require('convert-excel-to-json');
const userService = require('../services/userService');

exports.getSubtopics = async(function(req, res, next) {
    const { topic_id } = req.body;
    try {
        let tops = topic_id.split(",");
        const subtopics = await (topicService.getSubtopics(tops))
        return res.json({ status: 200, response: subtopics });
    } catch (error) {
        res.json({ status: 500, response: error });
    }
})
exports.insertTopics = async(function(req, res, next) {

    try {
        const topics = await (topicService.insertByAdminTopics(req.body));
        return res.json({ status: 200, response: topics });
    } catch (error) {
        res.json({ status: 500, response: error });
    }
});
exports.updateTopics = async(function(req, res, next) {
    const { topicId } = req.body;
    console.log(req.body);
    try {
        const TopicExistings = await (topicService.topicExist(topicId));
        if (TopicExistings) {
            const updateTopics = await (topicService.updateTopics(req.body));
            if (updateTopics) {
                res.json({ status: 200, message: "Success" });
            } else {
                res.json({ status: 500, message: "Failure" });
            }
        } else {
            res.json({ status: 500, message: "Topic does not Exist" });
        }

    } catch (error) {
        return res.send(error);
    }
})
exports.deleteTopics = async(function(req, res, next) {
    const { topicId } = req.body;
    try {
        const checkTopicexist = await (topicService.topicExist(topicId));
        if (checkTopicexist) {
            const deleteTopic = await (topicService.topicDelete(topicId));
            if (deleteTopic) {
                res.json({ status: 200, message: "Success" });
            } else {
                res.json({ status: 500, message: "Failure" });
            }
        } else {
            res.json({ status: 500, message: "Topic not exist" });
        }

    } catch (error) {
        return res.send(error);
    }
})
exports.getAlltopics = async(function(req, res, next) {

    try {
        const topics = await (topicService.getAlltopicsForFeeds());
        return res.json({ status: 200, response: topics });
    } catch (error) {
        res.json({ status: 500, response: error });
    }
})

exports.getAllFeedsBytopics = async(function(req, res, next) {
    console.log(req.body);
    try {
        const feeds = await (topicService.getFeeds(req.body.id));
        console.log(feeds);
        return res.json({ status: 200, response: feeds });
    } catch (error) {
        res.json({ status: 500, response: error });
    }
})

exports.fetchindustryDesig = async(function(req, res, next) {
    try {
        const fetchallDesig = await (topicService.fetchindustryDeisgnation())
        if (fetchallDesig) {
            return res.json({ status: 200, message: 'Success', result: fetchallDesig })
        } else {
            return res.json({ status: 500, message: 'Error occured file fetching industry designation' })
        }
    } catch (err) {
        return res.json({ status: 500, message: 'Error occured', err: err })
    }
})

exports.addStudentDesignation = async(function(req, res, next) {
    try {
        const designationstudent = await (topicService.addDesigStudent(req.body))
        if (designationstudent) {
            return res.json({ status: 200, message: 'Success' })
        } else {
            return res.json({ status: 500, message: 'Error occured while adding desgination' })
        }
    } catch (err) {
        return res.json({ status: 500, message: 'Error occured', err: err })
    }
})

exports.fetchStudentDesig = async(function(req, res, next) {
    try {
        const fetchallstudentDesig = await (topicService.fetchstudentDesig())
        if (fetchallstudentDesig) {
            return res.json({ status: 200, message: 'Success', result: fetchallstudentDesig })
        } else {
            return res.json({ status: 500, message: 'Error occured file fetching industry designation' })
        }
    } catch (err) {
        return res.json({ status: 500, message: 'Error occured', err: err })
    }
})

exports.fetchindustryorganization = async(function(req, res, next) {
        try {
            const fetchallDesig = await (topicService.fetchindustryOrganization())
            if (fetchallDesig) {
                return res.json({ status: 200, message: 'Success', result: fetchallDesig })
            } else {
                return res.json({ status: 500, message: 'Error occured file fetching industry designation' })
            }
        } catch (err) {
            return res.json({ status: 500, message: 'Error occured', err: err })
        }
    })
    //used same for adding designation and industry designation just change the source of excel in excelfolder
exports.addOrganization = function(req, res, next) {
    const result = excelToJson({
        sourceFile: 'excelFolder/Topics.xlsx',
        header: {
            rows: 1
        },
        columnToKey: {
            // '*': '{{columnHeader}}'
            A: 'topic_name'
        }
    });
    return Topic
        .insertMany(result.Topics)
        .then(results => {
            return res.json({ status: 200, message: 'Success' })
        })
}

exports.editSubtopics = async(function(req, res) {
    try {
        var userId = req.body.userId;
        const userExist = await (userService.checkUser(userId));
        if (userExist) {
            const removeSubtopics = await (userService.removeSubtopic(userExist.subtopics, userId))
            if (removeSubtopics) {
                const insertsubTopics = await (userService.inserSubtopics(req.body));
                if (insertsubTopics) {
                    return res.json({ status: 200, message: 'Success' });
                } else {
                    return res.json({ status: 500, message: 'Unable to add topics and subtopics' })
                }
            } else {
                return res.json({ status: 500, message: 'Unable to remove subtopics' })
            }
        } else {
            return res.json({ status: 500, message: 'User does not exist' });
        }
    } catch (err) {
        return res.json({ status: 500, message: 'Error occured' })
    }
})