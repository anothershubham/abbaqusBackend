const Feed = require('../models/feeds');
const User = require('../models/users')
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const moment = require('moment');
const topics = require('../models/topics');
const topicService = require('../services/topicService');
const recommendService = require('../services/recommendService');
const FeedViews = require('../models/feedsViews');
const Recommend = require('../models/recommend');
const urlMetadata = require('url-metadata');
const mongoose = require('mongoose');
const r2 = require('r2');
const config = require('../config');
// const metascraper = require('metascraper');
const metascraper = require('metascraper')([
    require('metascraper-image')()
])
const got = require('got');

exports.getFeedsByDate = async(function(date) {
    const allFeeds = await (Feed.find({ 'createdAt': { $gte: date } }).lean());
    return allFeeds;
});

exports.searchTopicInFeed = async(function(feed, topic) {

    const title = feed.title.toLowerCase();
    const content = feed.content.toLowerCase();
    const topic_name = topic.topic_name.toLowerCase();
    if ((content.indexOf(topic_name) >= 0) || (title.indexOf(topic_name) >= 0)) {
        return true;
    } else {
        return false;
    }

})

exports.addTopicsToFeeds = function(feedId, topics) {
    return Feed.findOneAndUpdate({ _id: feedId }, { $set: { topics: topics } }, { new: true });
}

exports.getFeeds = async(function(queryType, topic, subTopic, size, page) {
    if (queryType == "all") {
        return Feed.find().limit(size).skip(page * size);
    } else {
        return Feed.find({ $text: { $search: topic + ' ' + subTopic } }).limit(size).skip(page * size);
    }
});

exports.userExists = async(function(userId) {
    return User.find({ _id: userId }).populate('topics');
})

exports.checkExists = async(function(userId) {
    return User.findOne({ _id: userId });
})

exports.feedsByTopicId = async(function(topics) {
    return Feed.find({ topics: { $in: topics } }).populate('topics').limit(100);
})
exports.feedByTopicId = async(function(id) {
    console.log("in servicce",id)
    return Feed.find({ topics: {$eq: mongoose.Types.ObjectId(id)}}).sort({createdAt:-1}).limit(100);
})
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

exports.insertFeed = async(function(title, link, content, contentSnippet, categories, media, singlefeed) {
    const feed = new Feed;
    if (singlefeed.name === 'IEEE spectrum' && singlefeed.website === 'https://spectrum.ieee.org') {
        var UrlMedia = media.replace(/^http:\/\//i, 'https://');
        var siteUrl = 'https://spectrum.ieee.org';
        var mediaImage = siteUrl.concat(UrlMedia);
        var newDescription = content.replace(":&nbsp;", " ")
        feed.title = title;
        feed.link = link;
        feed.content = newDescription;
        feed.content_snippet = contentSnippet;
        feed.categories = categories;
        feed.media = mediaImage;
        feed.feedsSourceUrl = singlefeed.url;
        feed.feedSource = singlefeed.name;
        feed.feedSourceImage = singlefeed.image;
        feed.feedsWebsite = singlefeed.website;
        feed.save(function(err, newFamily) {
            if (err) {
                console.log("duplicate error");
            } else {
                return feed;
            }
        })
    } else if (media !== null && media !== undefined && media !== "") {
        var UrlMedia = media.replace(/^http:\/\//i, 'https://');
        var newDescription = content.replace(":&nbsp;", " ")
        feed.title = title;
        feed.link = link;
        feed.content = newDescription;
        feed.content_snippet = contentSnippet;
        feed.categories = categories;
        feed.media = UrlMedia;
        feed.feedsSourceUrl = singlefeed.url;
        feed.feedSource = singlefeed.name;
        feed.feedSourceImage = singlefeed.image;
        feed.feedsWebsite = singlefeed.website;
        feed.save(function(err, newFamily) {
            if (err) {
                console.log("duplicate error");
            } else {
                return feed;
            }
        })
    } else if (media == '' || media == null) {
        var targetUrl = link;
        const { body: html, url } = await (got(targetUrl));
        const metadata = await (metascraper({ html, url }));
        if (metadata.image !== '' && metadata.image !== 'undefined' && metadata.image !== null) {
            var newDescription = content.replace(":&nbsp;", " ")
            var imagemetadata = metadata.image;
            var UrlMedia = imagemetadata.replace(/^http:\/\//i, 'https://');
            feed.title = title;
            feed.link = link;
            feed.content = newDescription;
            feed.content_snippet = contentSnippet;
            feed.categories = categories;
            feed.media = UrlMedia;
            feed.feedsSourceUrl = singlefeed.url;
            feed.feedSource = singlefeed.name;
            feed.feedSourceImage = singlefeed.image;
            feed.feedsWebsite = singlefeed.website;
            feed.save(function(err, newFamily) {
                if (err) {
                    console.log("duplicate error");
                } else {
                    return feed;
                }
            })
        } else {
            let headers = { 'x-api-key': 'cFdFsxSeDE6TLEn912SE98uvrV4oi3oeVYTs00y8', 'x-pricing-plan': 'pro' }
            var microUrl = 'https://pro.microlink.io?url=' + targetUrl;
            let results = await (r2(microUrl, { headers }).json);
            var image = results.data.image.url;
            var UrlMedia = image.replace(/^http:\/\//i, 'https://');
            var newDescription = content.replace(":&nbsp;", " ")
            feed.title = title;
            feed.link = link;
            feed.content = newDescription;
            feed.content_snippet = contentSnippet;
            feed.categories = categories;
            feed.media = UrlMedia;
            feed.feedsSourceUrl = singlefeed.url;
            feed.feedSource = singlefeed.name;
            feed.feedSourceImage = singlefeed.image;
            feed.feedsWebsite = singlefeed.website;
            feed.save(function(err, newFamily) {
                if (err) {
                    console.log("duplicate error");
                } else {
                    return feed;
                }
            })

        }


    } else {
        var UrlMedia = media.replace(/^http:\/\//i, 'https://');
        var newDescription = content.replace(":&nbsp;", " ")
        feed.title = title;
        feed.link = link;
        feed.content = newDescription;
        feed.content_snippet = contentSnippet;
        feed.categories = categories;
        feed.media = UrlMedia;
        feed.feedsSourceUrl = singlefeed.url;
        feed.feedSource = singlefeed.name;
        feed.feedSourceImage = singlefeed.image;
        feed.feedsWebsite = singlefeed.website;
        feed.save(function(err, newFamily) {
            if (err) {
                console.log("duplicate error");
            } else {
                return feed;
            }
        })
    }

});

exports.feedExists = function(feedId) {
    return Feed.findOne({ _id: feedId }).populate('recommended', 'profileImg').populate('reply.repliedBy', '_id firstname lastname designation dob profileImg organization role').populate('topics', 'topic_name')
}


exports.alreadyFeedViewed = function(feedId, userId) {
    return FeedViews.findOne({ $and: [{ feedId: feedId }, { vieweduserId: userId }] });
}

exports.feedViewIncremnet = function(feedId, userId) {
    const viewsFeeds = new FeedViews;
    viewsFeeds.feedId = feedId;
    viewsFeeds.vieweduserId = userId;
    viewsFeeds.save();
    return viewsFeeds;
}

exports.updatedView = function(feedId, count) {
    var newCount = count + 1;
    return Feed.findOneAndUpdate({ _id: feedId }, { viewCount: newCount }, { new: true })
}


exports.trendingfeeds = async function(topics) {
    // return Feed.find({$and:[{topics:{$in:topics}}]}).populate('recommended','profileImg').sort({viewCount:-1}).limit(3);
    return Feed.find({ $and: [{ topics: { $in: topics } }, { "createdAt": { $lte: new Date(), $gte: new Date(new Date().setDate(new Date().getDate() - 2)) } }] }).populate('recommended', 'profileImg').sort({ viewCount: -1, createdAt: -1 }).limit(3);
}

exports.recentPost = async function() {
    return Feed.find({}).sort({ createdAt: -1 }).limit(1);
}

exports.reply = function(body) {
    var myDate = body.dateAt;
    var replyData = {
        repliedBy: body.repliedBy,
        comment: body.comment,
        dateAt: myDate
    };
    return Feed.findOneAndUpdate({ _id: body.feedsId }, { $push: { reply: replyData } }, { new: true });
}

exports.deleteFeeds = async function() {
    return Feed.findOneAndRemove({
        "createdAt": {
            $lt: new Date(),
            $gte: new Date(new Date().setDate(new Date().getDate() - 1))
        }
    })
}

exports.deleteReplies = async function() {
    return Feed.updateMany({}, { $set: { 'reply': [] } }, { multi: true })
}


exports.fetchDatatarget = async(function(targetUrl) {
    try {
        const { body: html, url } = await (got(targetUrl));
        const metadata = await (metascraper({ html, url }));
        return metadata;
    } catch (err) {
        console.log(err)
    }
})


exports.fetchMetaData = async(function(feeds) {
    try {
        var feedsDetails = [];
        var j = 0;
        if (feeds.media == "" || feeds.media == "undefined") {
            j++;
            var targetUrl = feeds.link;
            const { body: html, url } = await (got(targetUrl));
            const metadata = await (metascraper({ html, url }));
            var image = metadata.image;
            if (image !== null) {
                var imageUrl = image.replace(/^http:\/\//i, 'https://');
                feedsDetails.push({ media: imageUrl, feedId: feeds._id });
                return feedsDetails;
            }
        }
    } catch (err) {
        console.log(err)
    }
})

exports.fetchMetaDataByUrl = async(function(url, callback) {
    try {
        const { body } = await (got(microUrl, { json: true }))
        let image = body.data.image.url;
        callback('', image);
    } catch (err) {
        // console.log(err)
        callback(err);
    }
})
exports.addImagestoFeeds = async function(fetchImages) {
    return Feed.findOneAndUpdate({ _id: mongoose.Types.ObjectId(fetchImages[0].feedId) }, { $set: { media: fetchImages[0].media } }, { upsert: true, new: true });
}

function fetchUrlImage(targetUrl) {
    let headers = { 'x-api-key': 'cFdFsxSeDE6TLEn912SE98uvrV4oi3oeVYTs00y8' }
    var microUrl = 'https://pro.microlink.io?url=' + targetUrl;
    let results = await (r2(microUrl, { headers }).json);
    var image = results.data.image.url;
    if (results.data.image !== null) {
        var imageUrl = image.replace(/^http:\/\//i, 'https://');
        feedsDetails.push({ media: imageUrl, feedId: feeds._id });
        return feedsDetails;
    }
}