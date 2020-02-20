const User = require('../models/users');
const Question = require('../models/questionUpload');
const Paper = require('../models/paperUpload');
const Follow = require('../models/follow');
const Feed = require('../models/feeds');
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const Recommend = require('../models/recommend');
const Maindiscpline = require('../models/maindiscpline');
const Viewdownloads = require('../models/viewsdownloads')
const FeedViews = require('../models/feedsViews');
const QuestionViews = require('../models/questionViews');
const Notification = require('../models/notification');
const Answer = require('../models/answer')
const Bookmark = require('../models/bookmark');
const Feeds = require('../models/feeds');
const Graph = require('../models/graph');
const Events = require('../models/events');
const Topics = require('../models/topics');
const ObjectID = require('mongodb').ObjectID;
const config = require('../config');
const bcrypt = require('bcrypt');
var _ = require('lodash');


exports.findUser = function(email) {
    return User.find({ email: email });
}
exports.findOneAndUpdateSocialId = function(data) {
    console.log("dataservice---", data);
    const newGraph = new Graph();
    newGraph.save();
    return User.updateOne({ email: data.email }, {
        $push: { provider: data.provider, socialId: data.socialId },
        $set: {
            firstname: data.firstname,
            lastname: data.lastname,
            email: data.email,
            profileImg: data.profileImg,
            role: data.role,
            organization: data.organization,
            designation: data.designation,
            industry: data.industry,
            university: data.university,
            degree: data.degree,
            other: data.other,
            OtherDesignation: data.OtherDesignation,
            dob: data.dob,
            location: data.location,
            otpVerified: false,
            graph: newGraph._id
        }
    }, { upsert: true });

}
exports.checkloginPassword = function(logpassword, dbpassword) {
    var result = bcrypt.compareSync(logpassword, dbpassword);
    return result;
}

exports.userFindall = function(userId) {
    return User.find({ _id: { $ne: userId } }).select('firstname lastname role organization designation industry organization university degree OtherDesignation location profileImg isfollowed').sort({ createdAt: -1 }).limit(30);
}

exports.findallUsers = function(userId) {
    return User.find({ _id: { $ne: userId } }).select('firstname lastname role organization designation industry organization university degree OtherDesignation location profileImg  isfollowed');
}

exports.addUserIdtoGraph = function(graphId, userId) {
    return Graph.update({ _id: graphId }, { $set: { userId: userId } }, { new: true })
}

exports.findOneUser = function(email) {
    return User.findOne({ email: email });
}
exports.findOneSocialId = function(data) {
    return User.find({ $and: [{ email: data.email }, { provider: { $eq: data.provider } }, { socialId: { $eq: data.socialId } }] });
}
exports.insertUser = function(body, otp) {
    const { firstname, lastname, email, password, role, organization, designation, topics, subtopics, industry, university, degree, other, OtherDesignation, dob, location } = body;
    const newGraph = new Graph();
    newGraph.save();
    const user = new User;
    user.firstname = firstname;
    user.lastname = lastname;
    user.email = email;
    user.password = bcrypt.hashSync(password, 10);
    user.role = role;
    user.organization = organization;
    user.designation = designation;
    user.industry = industry;
    user.university = university;
    user.degree = degree;
    user.other = other;
    user.OtherDesignation = OtherDesignation;
    user.otp = otp;
    user.dob = dob;
    user.location = location;
    user.profileImg = null;
    user.otpVerified = false;
    user.graph = newGraph._id;
    user.save();

    return user;
}

exports.updateIsOtpVerified = function(email) {
    return User.update({ email: email }, { otpVerified: true })
}


exports.getallUsers = function() {
    return User.find();
}

exports.getallUsersWithPaper = function() {
    return User.find()
        .populate('paper')
        .populate('graph').lean();
}

exports.userUpdateOtp = function(userId, otp) {
    return User.findOneAndUpdate({ _id: userId }, { $set: { otp: otp } }, { new: true });
}

exports.updatePassword = function(email, password) {
    var newpassword = bcrypt.hashSync(password, 10);
    return User.findOneAndUpdate({ email: email }, { $set: { password: newpassword } }, { new: true });
}

exports.checkuserExist = function(userId) {
    return User.findOne({ _id: userId });
}

exports.userFind = function(userId) {
    return User.find({ _id: userId }).populate('topics').lean();
}

exports.userFinding = function(userId) {
    return User.findOne({ _id: userId }).select('_id maindiscpline topics').populate('topics', 'topic_name').lean();
}

exports.inserTopics = function(body) {
    return User.findOneAndUpdate({ _id: body.userId }, { $push: { topics: body.topics, subtopics: body.subtopics } }, { new: true });
}

exports.inserSubtopics = function(body) {
    return User.findOneAndUpdate({ _id: body.userId }, { $push: { subtopics: body.subtopics } }, { new: true });
}
exports.events = function(body) {
    var userTopics = body.topics;
    var userTopicsAll = [];
    var topicsAll = userTopics.map(function(topics) {
        userTopicsAll.push(topics.topic_name)
    })
    return Events.find({ $and: [{ topics: { $in: userTopicsAll } }, { discpline: { $in: body.maindiscpline } }] }).select('eventname eventvenue eventLink eventdate lat lng').lean();
}

exports.eventExist = function(eventsId) {
    return Events.findOne({ _id: eventsId });
}

exports.userExist = function(userId) {
    return User.find({ _id: userId }).populate('topics');
}

exports.userChecking = function(userId) {
    return User.findOne({ _id: userId }).select('_id graph maindiscpline firstname lastname email role organization designation industry organization university degree OtherDesignation location profileImg topics isfollowed subtopics').populate('topics');
}

exports.checkUser = function(userId) {
    return User.findOne({ _id: userId });
}

exports.userbasedTopics = function(Topics, userId) {
    return User.find({ $and: [{ _id: { $ne: userId } }, { topics: { $in: Topics } }] }).sort({ createdAt: -1 }).select('firstname lastname role organization designation industry organization university degree OtherDesignation location profileImg topics isfollowed');
}

exports.userbasedTopicsAll = function(Topics, userId) {
    return User.find({ $and: [{ _id: { $ne: userId } }, { topics: { $in: Topics } }] })
}


exports.userDetailsUpdate = function(body) {
    return User.findOneAndUpdate({ _id: body.userId }, {
        $set: {
            firstname: body.firstname,
            lastname: body.lastname,
            email: body.email,
            password: body.password,
            role: body.role,
            organization: body.organization,
            designation: body.designation,
            industry: body.industry,
            university: body.university,
            degree: body.degree,
            degree: body.degree,
            dob: body.dob,
            location: body.location
        }
    }, { new: true })
}

exports.searchTextUser = function(text) {
    return User.find({ $text: { $search: text.searchText } }).limit(20);
}

exports.searchFeeds = function(text) {
    return Feeds.find({ $text: { $search: text.searchText } }).limit(20);
}

exports.searchQuestion = function(text) {
    return Question.find({ $text: { $search: text.searchText } }).limit(20).populate('userId', '_id firstname lastname profileImg designation organization role');
}

exports.searchPaper = function(text) {
    return Paper.find({ $text: { $search: text.searchText } }).limit(20).populate('userId', '_id firstname lastname profileImg designation organization role');
}

exports.followedUsersDetail = function(userId) {
    return Follow.find({ userId: userId });
}

exports.followedQuestion = function(followedUsersId) {
    return Question.find({ userId: { $in: followedUsersId } }).populate('userId', '_id firstname lastname profileImg designation role organization').sort({ createdAt: -1 }).limit(100);;
}

exports.followedPapers = function(followedUsersId) {
    return Paper.find({ userId: { $in: followedUsersId } }).populate('userId', '_id firstname lastname profileImg designation role organization').sort({ createdAt: -1 }).limit(100);
}

exports.followedUsersData = function(userId) {
    return Follow.find({ userId: userId }).populate('following', '_id').lean();
}

exports.FeedExists = function(feedsId) {
    return Feed.find({ _id: feedsId })
}

exports.allrecommendsUser = function(userId, page, pagesize) {
    return Recommend.find({ userId: userId })
        .populate('recommended')
        .populate({ path: 'recommended', populate: { path: 'userId', select: '_id firstname lastname designation dob profileImg role organization' } })
        .populate({ path: 'recommended', populate: { path: 'recommended', select: 'profileImg' } })
        .populate({ path: 'recommended', populate: { path: 'topics', select: 'topic_name' } })
        .populate({ path: 'recommended', populate: { path: 'answer', populate: { path: 'userId', select: '_id firstname lastname designation profileImg role organization' } } })
        .sort({ createdAt: -1 })
        .skip(page * pagesize)
        .limit(pagesize)
        .lean();
}
exports.userrecommends = function(userId) {
    return Recommend.find({ userId: userId }).lean();
}

exports.bookmarks = function(userId) {
    var papersbookmarked = await (Bookmark.find({ $and: [{ userId: userId }, { bookmarkType: "paper" }] }).lean());
    var feedsbookmarked = await (Bookmark.find({ $and: [{ userId: userId }, { bookmarkType: "feeds" }] }).lean());
    if (papersbookmarked.length != 0 && feedsbookmarked.length != 0) {
        var paperId = papersbookmarked.map(function(paper) {
            return ({ _id: paper.paperId })
        })
        var feedsId = feedsbookmarked.map(function(feeds) {
            return ({ _id: feeds.feedsId })
        })
        var finalresults = paperId.concat(feedsId);
        return finalresults;
    } else if (papersbookmarked.length != 0 && feedsbookmarked.length == 0) {
        var paperId = papersbookmarked.map(function(paper) {
            return ({ _id: paper.paperId })
        })
        return paperId;
    } else if (papersbookmarked.length == 0 && feedsbookmarked.length != 0) {
        var feedsId = feedsbookmarked.map(function(feeds) {
            return ({ _id: feeds.feedsId })
        })
        return feedsId;
    } else {
        var myarr = []
        return myarr;
    }
}

function recommendsfeedsCheck(userFeeds, feedsId) {
    feedsId.forEach((item) => {
        var array1Obj = userFeeds.find(({ feedsId }) => item._id.toString() === feedsId._id.toString());
        if (array1Obj) {
            array1Obj.feedsId.isrecommended = true;
        }
    })
    return userFeeds;
}

function bookmarksfeedsCheck(userFeeds, bookmarksId) {
    bookmarksId.forEach((item) => {
        var array1Obj = userFeeds.find(({ feedsId }) => item._id.toString() === feedsId._id.toString());
        if (array1Obj) {
            array1Obj.feedsId.isbookmarked = true;
        }
    })
    return userFeeds;
}



function recommendsPaperCheck(userPapers, paperId) {
    paperId.forEach((item) => {
        var array1Obj = userPapers.find(({ paperId }) => item._id.toString() === paperId._id.toString());
        if (array1Obj) {
            array1Obj.paperId.isrecommended = true;
        }
    })
    return userPapers;
}

function bookmarksPaperCheck(userPapers, bookmarksId) {
    bookmarksId.forEach((item) => {
        var array1Obj = userPapers.find(({ paperId }) => item._id.toString() === paperId._id.toString());
        if (array1Obj) {
            array1Obj.paperId.isbookmarked = true;
        }
    })
    return userPapers;
}

function recommendsquestionCheck(userQuestion, questionId) {
    questionId.forEach((item) => {
        var array1Obj = userQuestion.find(({ questionId }) => item._id.toString() === questionId._id.toString());
        if (array1Obj) {
            array1Obj.questionId.isrecommended = true;
        }
    })
    return userQuestion;
}

exports.removetopic = function(topic, userId) {
    return User.findOneAndUpdate({ _id: userId }, { $pull: { topics: { $in: topic } } }, { new: true })
}
exports.removeSubtopic = function(subtopic, userId) {
    return User.findOneAndUpdate({ _id: userId }, { $pull: { subtopics: { $in: subtopic } } }, { new: true })
}
exports.deleteallSubtopic = function(userId) {
    var subtopic = []
    return User.update({ _id: userId }, { $set: { subtopics: subtopic } }, { new: true })
}



exports.matchedSubtopics = function(body, subtopics) {
    var topics = body.topics;
    var subtopic = [];
    for (var i = 0; i < topics.length; i++) {
        for (var j = 0; j < subtopics.length; j++) {
            if (topics[i] == subtopics[j].topic) {
                subtopic.push({ subtopicName: subtopics[j].subtopicName, topic: subtopics[j].topic })
            }
        }
    }
    return subtopic;
}

exports.updateSubtopics = function(userId, subtopics) {
    return User.findOneAndUpdate({ _id: userId }, { $push: { subtopics: subtopics } }, { new: true })
}

exports.addTopic = function(body, userId) {
    return User.findOneAndUpdate({ _id: userId }, { $push: { topics: body.topics } }, { new: true })
}

exports.addSubtopic = function(body, userId) {
    return User.findOneAndUpdate({ _id: userId }, { $push: { subtopics: body.subtopics } }, { new: true })
}


exports.getallFeeds = async(function(userTopics, size, page) {
    try {
        var resultsfeeds = [];
        for (var i = 0; i < userTopics.length; i++) {
            var feeds = await (feedsByTopicname(userTopics[i], size, page));
            for (let feed of feeds) {
                resultsfeeds.push(feed);
            }
        }
        return resultsfeeds;
    } catch (error) {
        console.log(error);
    }
});

function feedsByTopicname(userTopics, size, page) {
    try {
        let skip = 0;
        if (page != 0) {
            skip = page * size;
        }
        return Feed.find({ $text: { $search: userTopics } }).limit(size).skip(skip)
    } catch (error) {
        console.log(error);
    }
}


exports.searchFeeds = async(function(topics) {
    try {
        var feeds = await (searchforFeeds(topics));
    } catch (error) {
        console.log(error);
    }
});

exports.addMaindiscpline = function(body) {
    const { disciplineName } = body;
    const maindiscpline = new Maindiscpline;
    maindiscpline.disciplineName = disciplineName;
    maindiscpline.save();
    return maindiscpline;
}

exports.fetchallDiscpline = function() {
    return Maindiscpline.find({}).sort({ createdAt: -1 });
}

exports.adduserDiscpline = function(discplineId, userId) {
    return User.findOneAndUpdate({ _id: userId }, { $push: { maindiscpline: discplineId } }, { new: true })
}

exports.checkDiscplineIdalreadyexist = function(discplineId, userId) {
    return User.find({ $and: [{ _id: userId }, { maindiscpline: { $in: discplineId } }] })
}

exports.removemainDiscpline = function(userId) {
    return User.findOneAndUpdate({ _id: userId }, { $set: { maindiscpline: [] } })
}

exports.feedsByTopicId = function(topics) {
    return Feed.find({ topics: { $in: topics } }).populate('topics').limit(100).sort({ createdAt: -1 });
}

exports.checkPassword = function(password, dbPassword) {
    var myres = bcrypt.compare(password, dbPassword)
    return myres;
}
exports.changeUserPassword = function(body) {
    var password = bcrypt.hashSync(body.newpassword, 10);
    var userId = body.userId;
    return User.update({ _id: userId }, { $set: { password: password } }, { new: true })

}

exports.userPresent = function(userId) {
    return User.findOne({ _id: userId }).select('graph').lean();
}

exports.removeviewsPapers = function(userId) {
    return Viewdownloads.update({}, { $pull: { vieweduserId: userId } }, { multi: true })
}

exports.removedownloadsPapers = function(userId) {
    return Viewdownloads.update({}, { $pull: { downloadeduserId: userId } }, { multi: true })
}

exports.removeQuestionViews = function(userId) {
    return QuestionViews.update({}, { $pull: { vieweduserId: userId } }, { multi: true })
}

exports.removeFeedsView = function(userId) {
    return FeedViews.remove({ vieweduserId: userId });
}

exports.removeUsernotificationSender = function(userId) {
    return Notification.remove({ sender: userId });
}

exports.removeUsernotificationReciever = function(userId) {
    return Notification.remove({ reciever: userId });
}

exports.removeUserAnswer = function(userId) {
    return Answer.remove({ userId: userId });
}

exports.removeuserbookmarks = function(userId) {
    return Bookmark.remove({ userId: userId });
}

exports.removeUserRecommend = function(userId) {
    return Recommend.remove({ userId: userId });
}

exports.removeUserAdmired = function(userId) {
    return Follow.remove({ userId: userId });
}

exports.removeUserAdmiring = function(userId) {
    return Follow.remove({ following: userId });
}

exports.removeUserGraph = function(graphId) {
    return Graph.remove({ _id: graphId });
}

exports.removeUserInUser = function(userId) {
    return User.findOneAndRemove({ _id: userId })
}