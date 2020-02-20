const FeedSource = require('../models/feedSource');
const async = require('asyncawait/async');
const await = require('asyncawait/await');

exports.getFeedSources=async(function(){
	
	const feedSource = FeedSource.find({'type': 'universitiesResearch'});
	return feedSource;
});

exports.clearSourceUrls=async(function(url, type){

	const feedSource = FeedSource.remove({});
	return feedSource;

});

exports.insertSourceUrl=async(function(url, type,name,image,website){

	const feedSource = new FeedSource;
	feedSource.url=url;
	feedSource.type='universitiesResearch';
	feedSource.name=name;
	feedSource.image=image;
	feedSource.website =website;
	feedSource.save();

	return feedSource;

});




