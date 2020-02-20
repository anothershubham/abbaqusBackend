const Feeds = require('../models/feeds');
const User = require('../models/users');
const Paper = require('../models/paperUpload');
const Questions = require('../models/questionUpload');
const async = require('asyncawait/async');
const Async = require('async');
const await = require('asyncawait/await');
const Parser = require('rss-parser');
const moment = require('moment');
const feedService = require('../services/feedService')
const recommendService = require('../services/recommendService');
const feedSourceService = require('../services/feedSourceService')
const Recommendfeed = require('../models/recommended_feeds');
const Bookmark = require('../models/bookmark');
const Recommendpaper = require('../models/recommended_paper');
const Recommendquestion = require('../models/recommended_questions');
const topicService = require('../services/topicService');
const Recommend = require('../models/recommend');
const userService = require('../services/userService');
const uploadFile = require('../middlewares/uploadFile'); 
const lodash = require('lodash');
const urlMetadata = require('url-metadata')	
const ObjectID = require('mongodb').ObjectID;

exports.getAllFeeds = async(function(req, res){
	const {queryType} = req.body;
	const {topic} = req.body;
	const {subTopic} = req.body;
	const {size} = req.body;
	const {page} = req.body;
	
	let feeds = await( feedService.getFeeds(queryType, topic, subTopic, size, page));
	
	if(feeds.length == 0){
		res.json({ status:201, message: "no feeds to display" });
	}else{
		res.json({ status:200, message: "success", feeds: feeds });	
	}
});

exports.userFeeds = async(function(req,res){
	const{userId} = req.body;
	const {size} = req.body;
	const {page} = req.body;
	try{
		let checkUser  = await(feedService.userExists(userId));
		if(checkUser.length == 0){
				res.json({status:500,message:'User does not exists'})
		}
		else{
			var topicsname =[];
			for(var i=0;i<checkUser.length;i++){
			  for(var j=0;j<checkUser[i].topics.length;j++){
			    topicsname.push(checkUser[i].topics[j].topic_name);
			  }
			}
			if(topicsname!=0){
				let feeds = await( feedService.getallFeeds(topicsname, size, page));
				if(feeds.length == 0){
					res.json({ status:201, message: "no feeds to display" });
				}else{
					res.json({ status:200, message: "success", feeds: feeds, count: feeds.length });	
				}
			}
			else{
				res.json({ status:500, message: "No topics found for this user", });	
			}
		}
	}catch(error){
		res.json({ status:400, message: "error"});	
	}
})

exports.testTopics=async (function(req,res){
	const today = moment(new Date()).format('YYYY-MM-DD');
	const feedsToday = await(feedService.getFeedsByDate(today));
	const alltopics = await(topicService.getAlltopicsForFeeds());
		for(let topic of alltopics){
			
			const feeds = await(feedService.searchTopicInFeed(feedsToday[0], topic));	
			if(feeds == true){
				// console.log(feeds);
				console.log(topic.topic_name);				
			}
		}
	res.json({status:200});
})

let wait = ms => new Promise(resolve => setTimeout(resolve, ms));

exports.generateTopics=async (function(req,res){
	
	res.json({status:200});
	 const today = moment(new Date()).format('YYYY-MM-DD');
	const alltopics = await(topicService.getAlltopicsForFeeds());
	const feedsToday = await(feedService.getFeedsByDate(today));
	let feedTopics=[];
	var i=0;
	for(let feed of feedsToday){
		feedTopics = [];
		for(let topic of alltopics){
			const feeds = await(feedService.searchTopicInFeed(feed, topic));	
			if(feeds == true){
				if(!lodash.find(feedTopics, {topic_name: topic.topic_name})){
					feedTopics.push(topic);
				}
			}
		}
		i++;
		// console.log(i);
		if(feedTopics){
			await(wait(500));
			const updateFeed = await(feedService.addTopicsToFeeds(feed._id, feedTopics));
		}
	}
	console.log("========= generating topics completed =======");
})

exports.generatefeeds=async (function(req,res){	
	let parser = new Parser({
	  customFields: {
			    item: ['media:thumbnail', 'media:content', 'description']
	  }
	});

	let link = '';
	let title = '';
	let content = '';
	let contentSnippet = '';
	let categories = '';
	let media = '';
 
	const feedSourceUrls = await(feedSourceService.getFeedSources());
		
	res.json({status:200});

	await(feedSourceUrls.forEach(singleFeed => {	

		link = '';
		title = '';
		content = '';
		contentSnippet = '';
		categories = '';
		media = '';
			
			if( singleFeed.url == ("http://ucsdnews.ucsd.edu/archives/category/sci_eng" ||  "http://newsroom.ucla.edu/topics/science" ) ){
				console.log("error = "+singleFeed.url);

			}else{

				try{							
					
					await(parser.parseURL(singleFeed.url, function(err, feed) {												

						if( typeof feed !== 'undefined'){
						
							feed.items.forEach(item => {
								
								if (typeof item.link !== 'undefined') {

									link = item.link;

								}
								if (typeof item.title !== 'undefined') {

									title = item.title;

								}
								//content start 
								if (typeof item.description !== 'undefined') {

									content = item.description;

								}		
								if (typeof item.content !== 'undefined') {

									let itemContent = item['content'].replace(/<\/?[^>]+(>|$)/g, "");

									content = itemContent;

								}
								if (typeof item['content:encoded'] !== 'undefined') {
									
									let encodedContent = item['content:encoded'].replace(/<\/?[^>]+(>|$)/g, "");

									content = encodedContent;

								}
							
								if (typeof item.contentSnippet !== 'undefined') {
							
									contentSnippet = item.contentSnippet;

								}
								//content end 		
								if (typeof item.categories !== 'undefined') {
							
									categories = item.categories;

								}
								// media start
								if (typeof item.enclosure !== 'undefined') {
							
									if(typeof item.enclosure.url !== 'undefined'){

										media = item.enclosure.url;
									}

								}
								if (typeof item['media:thumbnail'] !== 'undefined') {
							
									
									if(typeof item['media:thumbnail']['$'] !== 'undefined'){
									
										if(typeof item['media:thumbnail']['$']['url'] !== 'undefined'){
											
											media = item['media:thumbnail']['$']['url'];

										}
										
									}else{
										if(typeof item['media:thumbnail']['url'] !== 'undefined'){
											
											media = item['media:thumbnail']['url'];

										}
									}			

								}
								if (typeof item['media:content'] !== 'undefined') {
															
									if(typeof item['media:content']['$'] !== 'undefined'){
									
										if(typeof item['media:content']['$']['url'] !== 'undefined'){

											media = item['media:content']['$']['url'];
		
										}
									}			

								}

								feedService.insertFeed(title, link, content, contentSnippet, categories, media,singleFeed);				
							
							});			

						}
						  

					}));
				
				}catch(error){
				
					console.log(error);
				
				}
	
			}
	
	
	}));
});

exports.trendingFeeds = async(function(req,res){
	try{
		var userId = req.params.id;
		const checkUserExist = await(feedService.checkExists(userId))
		if(checkUserExist){
			var topics = checkUserExist.topics;	
			const trendingNews = await(feedService.trendingfeeds(topics));
			if(trendingNews.length!=0){
				const feedsRecommended = await(recommendService.userRecommendedFeeds(userId))
				if(feedsRecommended.length!=0){
					var feedsId = feedsRecommended.map(function(feeds){
						return ({_id:feeds.recommended});
					})
					const chechkFeedsRecommendedtrue = await(recommendedchecking(trendingNews,feedsId))
					const feedsBookmarked = await(recommendService.bookmarkedfeeds(userId))
					if(feedsBookmarked.length!=0){
						var feedsBookmarkedId = feedsBookmarked.map(function(feeds){
							return ({_id:feeds.feedsId});
						})
						const checkBookmarkedTrue = await(bookmarkedchecking(chechkFeedsRecommendedtrue,feedsBookmarkedId))
						return res.json({status:200,message:'Success',result:checkBookmarkedTrue})
					}
					else{
						return res.json({status:200,message:'Success',result:chechkFeedsRecommendedtrue})
					}
				}
				else{
					const feedsBookmarked = await(recommendService.bookmarkedfeeds(userId))
					if(feedsBookmarked.length!=0){
						var feedsBookmarkedId = feedsBookmarked.map(function(feeds){
							return ({_id:feeds.feedsId});
						})
						const checkBookmarkedTrue = await(bookmarkedchecking(trendingNews,feedsBookmarkedId))

						return res.json({status:200,message:'Success',result:checkBookmarkedTrue})
					}
					else{
						return res.json({status:200,message:'Success',result:trendingNews})
					}
				}
			}
			else{
				const fetchallTrendingNews = await(feedService.trendingFeedsAll(topics))
				if(fetchallTrendingNews.length!==0){
					const feedsRecommended = await(recommendService.userRecommendedFeeds(userId))
				if(feedsRecommended.length!=0){
					var feedsId = feedsRecommended.map(function(feeds){
						return ({_id:feeds.recommended});
					})
					const chechkFeedsRecommendedtrue = await(recommendedchecking(fetchallTrendingNews,feedsId))
					const feedsBookmarked = await(recommendService.bookmarkedfeeds(userId))
					if(feedsBookmarked.length!=0){
						var feedsBookmarkedId = feedsBookmarked.map(function(feeds){
							return ({_id:feeds.feedsId});
						})
						const checkBookmarkedTrue = await(bookmarkedchecking(chechkFeedsRecommendedtrue,feedsBookmarkedId))

						return res.json({status:200,message:'Success',result:checkBookmarkedTrue})
					}
					else{
						return res.json({status:200,message:'Success',result:chechkFeedsRecommendedtrue})
					}
				}
				else{
					const feedsBookmarked = await(recommendService.bookmarkedfeeds(userId))
					if(feedsBookmarked.length!=0){
						var feedsBookmarkedId = feedsBookmarked.map(function(feeds){
							return ({_id:feeds.feedsId});
						})
						const checkBookmarkedTrue = await(bookmarkedchecking(fetchallTrendingNews,feedsBookmarkedId))

						return res.json({status:200,message:'Success',result:checkBookmarkedTrue})
					}
					else{
						return res.json({status:200,message:'Success',result:fetchallTrendingNews})
					}
				}
				}
				else{
					return res.json({status:500,message:'Feeds does not exist'})
				}
			}
		}
		else{
			return res.json({status:500,message:'User does not exist'})
		}
		
	}
	catch(err){
		return res.json({status:500,message:'Error occured',err:err})
	}
})

exports.recentPosts = async(function(req,res){
	try{
		const recentPosts = await(feedService.recentPost());
		if(recentPosts){
			return res.json({status:200,message:'Success',result:recentPosts})
		}
		else{
			return res.json({status:500,message:'No post to show'})
		}
	}
	catch(err){
		return res.json({status:500,message:'Error occured',err:err})
	}
})

exports.replytoPost = async(function(req,res){
	try{
		var feedsId = req.body.feedsId;
		const feedsExists = await(feedService.feedExists(feedsId))
		if(feedsExists){
			const replyTofeeds = await(feedService.reply(req.body))
			if(replyTofeeds){
				return res.json({status:200,message:'commented successfully'})
			}
			else{
				return res.json({status:500,message:'Unable to comment'})
			}
		}
		else{
			return res.json({status:500,message:'Feeds does not exist'})
		}
	}
	catch(err){
		return res.json({status:500,message:'Error occured',err:err})
	}
})


// Get all replies
exports.feedReplies = async(function(req,res,next){
	try{
		var feedId = req.body.feedId;
		const checkfeedExists = await(feedService.feedExists(feedId))
		if(checkfeedExists){
			return res.json({status:200,message:'Success',result:checkfeedExists});
		}
		else{
			return res.json({status:500,message:'User not found'});
		}
	}
	catch(err){
		return res.json({status:500,message:'Error occured',err:err});
	}
})

// Elastic search for news Articles
exports.searchInArticles = function(req,res,next){
		var userId = req.body.userId;
		var from = req.body.from;
		var size = req.body.size;
		User.find({_id:userId}).populate('topics')
		.then((userFound)=>{
				var topicsname =[];
				var userDet = userFound.map(function(userObj){
					userObj.topics.map(function(topicocj){
						topicsname.push(topicocj.topic_name);
					})
				})
				var topi= topicsname.map(v => v.toLowerCase());
				Feeds.esSearch({ 
							    from:from,
							    size:size,
									    query:{
									    		"terms" : {
									            "content": topi
									        	}
									    },
									    sort:{
									    	"createdAt":{
									    		"order" : "desc"
									    	}
									    }   
							},
							function(err, results) {
								if(err){
									return res.json({status:500,message:'Error occured while fetching news and articles',err:err})
								}
								else{
									//search results came in resultFound
									 var resultFound = results.hits.hits;
									 var finalResults = newsArticleSimplified(resultFound);
									 if(finalResults!=0){
									 	//checking user recommnded any feeds
									 	Recommend.find({$and:[{userId:userId},{recommendType:'feeds'}]})
									 	.then((feedsFound)=>{
									 		//if feeds are there then changed isrecommnded:true and also checked for bookmarked any feed
									 		// if done then used converted finalRecommended(isrecommnded:true) and passed it to bookmark 
									 		// then isbookmarked:true new list is produced with both (isrecommnded:true,isbookmarked:true)
									 		if(feedsFound!=0){
										 		var resultfeedsId =  feedsFound.map(function(feeds){
												return ({_id:feeds.recommended})
												})	

												// console.log("resultfeedsId",resultfeedsId)
												var finalRecommended = 	recommendedchecking(finalResults,resultfeedsId);
												Bookmark.find({$and:[{userId:userId},{bookmarkType:"feeds"}]})
												.then((bookmarked)=>{
													// console.log("bookmarked",bookmarked)
													if(bookmarked!=0){
														var resultbookmarked  = bookmarked.map(function(feeds){
															return ({_id:feeds.feedsId})
														})
														var finalbookmarked = bookmarkedchecking(finalRecommended,resultbookmarked)
														if(finalbookmarked)
														{
															return res.json({status:200,message:'Success',result:finalbookmarked})
														}
														else{
															console.log("error occured while matching bookmarked")
														}
													}
													else{
														return res.json({status:200,message:'Success',result:finalRecommended})
													}
												})
												.catch(err=>{
													console.log("error while fetching bookmark")
												})
												// console.log("searchresult",finalRecommended)
												// return res.json({status:200,message:'Success',result:finalRecommended});							 			
									 		}
									 		else{
									 			//if user did not recommend any feeds then checked for bookma 
													Bookmark.find({$and:[{userId:userId},{bookmarkType:"feeds"}]})
													.then((bookmarked)=>{
														// console.log("bookmarked",bookmarked)
														if(bookmarked!=0){
															var resultbookmarked  = bookmarked.map(function(feeds){
																return ({_id:feeds.feedsId})
															})
															var finalbookmarked = bookmarkedchecking(finalResults,resultbookmarked)
															if(finalbookmarked)
															{
																return res.json({status:200,message:'Success',result:finalbookmarked})
															}
															else{
																console.log("error occured while matching bookmarked")
															}
														}
														else{
															return res.json({status:200,message:'Success',result:finalResults})
														}
													})
													.catch(err=>{
														console.log("error while fetching bookmark")
													})									 			
									 		}
									 	})
									 	.catch(err=>{
									 		console.log("Error occured while fetching userrecommended feeds")
									 	})	
									 }
									 else{
									 	return res.json({status:500,message:'There are no news article'});	
									 }							
								}
				})
		})
		.catch(err=>{
			return res.json({status:500,message:'User not found',err:err});
		})
}

//Api for elastic Search latest
exports.Search = function(req,res,next){
	var searchText = req.body.searchText;
	var from  = req.body.from;
	var userId = req.body.userId;
	var size = req.body.size;
	var yearEnd = req.body.yearEnd;
	var yearStart = req.body.yearStart
	Async.series([
		function (callback) {
			User.esSearch({ 
					from:from,
				    size:size,
					query:{
						bool:{
							must:{
								query_string:{
										query: searchText  
								}
							},
							filter:[{
									range: {
			                		createdAt: {
				                		lte: yearEnd,
					                    gte: yearStart,
					                    format: "yyyy-MM-dd HH:mm:ss"
			                }
			            }	
						}]
						}	
					}
					},
					function(err, results){
						if(err){
							callback(err)
						}
						else{
							var resultUsers = results.hits.hits;
							var noUser = [];
							if(resultUsers.length!==0){
								callback(null,resultUsers)
							}
							else{
								callback(null,noUser)
							}
							// console.log("results",resultUsers)
						}
			})
		},
		function(callback){
			Paper.esSearch({ 
					from:from,
				    size:size,
					query:{
						bool:{
							must:{
								    multi_match: {
										fields : [ "papertitle","paperRsstitle","paperabstract","coauthors", "topics.topic_name","userId.designation","userId.firstname","userId.lastname","userId.organization","userId.role" ],
								      query: searchText,
								      "type": "phrase"
								    }
							
							},
							filter:[{
									range: {
			                		createdAt: {
				                		lte: yearEnd,
					                    gte: yearStart,
					                    format: "yyyy-MM-dd HH:mm:ss"
			                }
			            }	
						}]
						}	
					}
					},
					function(err, results){
						if(err){
							callback(err)
						}
						else{
							var resultPapers = results.hits.hits;
							var nopapers = [];
							if(resultPapers.length!==0){
								Recommend.find({$and:[{userId:userId},{recommendType:'paperupload'}]})
								.exec(function(err,recommendedpapers){
										if(err){
											callback(err)
										}
										else{
											// console.log("recommendedpapers",recommendedpapers)
											if(recommendedpapers.length!=0){
												var paperId = recommendedpapers.map(function(papers){
													return ({_id:papers.recommended});
												})
												var matchpapers = recommededByUser(resultPapers,paperId);
												// console.log("matchpapers",matchpapers)
												Bookmark.find({$and:[{userId:userId},{bookmarkType:"paper"}]})
													.exec(function(err,bookmarkedfound){
														if(err){
														callback(err)
													}
													else{
														if(bookmarkedfound.length!=0){
															var bookmarkedId = bookmarkedfound.map(function(paper){
																return ({_id:paper.paperId})
															})
															var matchbookmarks = bookmarkschecking(matchpapers,bookmarkedId)
															callback(null,matchbookmarks)
														}
														else{
															callback(null,matchpapers)
														}
													}
												})
											}
											else{
												Bookmark.find({$and:[{userId:userId},{bookmarkType:"paper"}]})
												.exec(function(err,bookmarkedfound){
												if(err){
													callback(err)
												}
												else{
													if(bookmarkedfound.length!=0){
														var bookmarkedId = bookmarkedfound.map(function(paper){
															return ({_id:paper.paperId})
														})
														var matchbookmarks = bookmarkschecking(resultPapers,bookmarkedId)
														callback(null,matchbookmarks)
													}
													else{
														callback(null,resultPapers)
													}
												}
												})
											}
										}
								})
							}
							else{
								callback(null,nopapers)
							}
						}
			})
		},
		function(callback){
			Feeds.esSearch({ 
					from:from,
				    size:size,
					query:{
						bool:{
							must:{
								    multi_match: {
									fields : [ "content","title", "topics.topic_name" ],
								      query: searchText,
								      "type": "phrase"
								    }
							
							},
							filter:[{
									range: {
			                		createdAt: {
				                		lte: yearEnd,
					                    gte: yearStart,
					                    format: "yyyy-MM-dd HH:mm:ss"
			                }
			            }	
						}]
						}	
					}
					},
					function(err, results){
						if(err){
							callback(err)
						}
						else{
							var resultFeeds = results.hits.hits;
							var nofeeds = [];
							// console.log("results",resultFeeds)
							if(resultFeeds.length!==0){
								Recommend.find({$and:[{userId:userId},{recommendType:'feeds'}]})
								.exec(function(err,recommendedpapers){
										if(err){
											callback(err)
										}
										else{
											// console.log("recommendedpapers",recommendedpapers)
											if(recommendedpapers.length!=0){
												var feedsId = recommendedpapers.map(function(feeds){
													return ({_id:feeds.recommended});
												})
												var matchfeeds = recommededByUser(resultFeeds,feedsId);
												// console.log("matchpapers",matchpapers)
												Bookmark.find({$and:[{userId:userId},{bookmarkType:"feeds"}]})
													.exec(function(err,bookmarkedfound){
														if(err){
														callback(err)
													}
													else{
														if(bookmarkedfound.length!=0){
															var bookmarkedId = bookmarkedfound.map(function(feeds){
																return ({_id:feeds.feedsId})
															})
															var matchbookmarks = bookmarkschecking(matchfeeds,bookmarkedId)
															callback(null,matchbookmarks)
														}
														else{
															callback(null,matchfeeds)
														}
													}
												})
											}
											else{
												Bookmark.find({$and:[{userId:userId},{bookmarkType:"feeds"}]})
												.exec(function(err,bookmarkedfound){
													if(err){
														callback(err)
													}
													else{
														if(bookmarkedfound.length!=0){
															var bookmarkedId = bookmarkedfound.map(function(feeds){
																return ({_id:feeds.feedsId})
															})
															var matchbookmarks = bookmarkschecking(resultFeeds,bookmarkedId)
															callback(null,matchbookmarks)
														}
														else{
															callback(null,resultFeeds)
														}
													}
												})
											}
										}
								})
							}
							else{
								callback(null,nofeeds)
							}
						}
			})
		},
		function(callback){
			Questions.esSearch({ 
					from:from,
				    size:size,
					query:{
						bool:{
							must:{
								    multi_match: {
									fields : ["answer","options","questionText","userId.designation","userId.firstname","userId.lastname","userId.organization","userId.role"],
								      query: searchText,
								      "type": "phrase"
								    }
							
							},
							filter:[{
									range: {
			                		createdAt: {
				                		lte: yearEnd,
					                    gte: yearStart,
					                    format: "yyyy-MM-dd HH:mm:ss"
			                }
			            }	
						}]
						}	
					}
					},
					function(err, results){
						if(err){
							callback(err)
						}
						else{
							var resultQuestion= results.hits.hits;
							var noQuestions = [];
							if(resultQuestion.length!==0){
								Recommend.find({$and:[{userId:userId},{recommendType:'questions'}]})
								.exec(function(err,recommendedpapers){
										if(err){
											callback(err)
										}
										else{
											// console.log("recommendedpapers",recommendedpapers)
											if(recommendedpapers.length!=0){
												var questionsId = recommendedpapers.map(function(questions){
													return ({_id:questions.recommended});
												})
												var matchQuesions= recommededByUser(resultQuestion,questionsId);
												// console.log("matchpapers",matchpapers)
												callback(null,matchQuesions)
											}
											else{
												callback(null,resultQuestion)
											}
										}
								})
							}
							else{
								callback(null,noQuestions)
							}
						}
			})
		}
		],
		function(err,Allresults){
			if(err){
				res.send({ status: 400, err: err });
			}
			else{
				 var flattened = Allresults.reduce(( accumulator, currentValue ) => accumulator.concat(currentValue),[]);
				 var dateSortedresults = sortResultsBydate(flattened);
				return res.json({status:200,message:'Success',result:dateSortedresults})
			}
		}
		)
}
//end

exports.feedsViewsCount = async(function(req,res){
	try{
		var userId = req.body.userId;
		var feedId = req.body.feedsId;
		const feedExists = await(feedService.feedExists(feedId));
		var feedCount = feedExists.viewCount;
		// console.log(feedCount)
		if(feedExists){
			const checkAlreadyViewed = await(feedService.alreadyFeedViewed(feedId,userId))
			if(checkAlreadyViewed){
				return res.json({status:500,message:"Already viewed"})
			}
			else{
				const feedViewIncremnet = await(feedService.feedViewIncremnet(feedId,userId));
				if(feedViewIncremnet){
					const UpdateViewCount = await(feedService.updatedView(feedViewIncremnet.feedId,feedCount))
					if(UpdateViewCount){
						 return res.json({status:200,message:'Success'});
					}
					else{
						return res.json({status:500,message:'Error occured while updating views'});
					}
				}
				else{
					return res.json({status:500,message:'Unable to increment feeds'});
				}
			}
			
		}
		else{
			return res.json({status:500,message:'Feeds do not exists'})
		}
		
	}
	catch(err){
		return res.json({status:500,message:'Failure',err:err})
	}
})

// api to delete todays feeds
exports.deleteTodaysFeeds = async(function(req,res){
	try{
		const deletefeeds = await(feedService.deleteFeeds())
		if(deletefeeds){
			return res.json({message:'Success'})
		}
		else{
			return res.json({message:"error occured"})
		}
	}
	catch(err){
		return res.json({status:500,message:'Error occured',err:err})
	}
})
//end

// api for deleting replies
exports.deleteReply = async(function(req,res){
	try{
		const deletefeeds = await(feedService.deleteReplies())
		if(deletefeeds){
			return res.json({message:'Success'})
		}
		else{
			return res.json({message:"error occured"})
		}
	}
	catch(err){
		return res.json({status:500,message:'Error occured',err:err})
	}
})
// end

// api to fetching url image
exports.fetchUrlofData = async(function(req,res,next){
	try{ 
		var targetUrl = 'https://www.euractiv.com/section/health-consumers/news/discussion-heats-up-over-stockpiling-of-generic-drugs-under-patent-protection/'; 
		const fetcbDataTarget = await(feedService.fetchDatatarget(targetUrl))
		if(fetcbDataTarget){
			return res.json({fetcbDataTarget:fetcbDataTarget.image})
		}
		else{
			return res.json({message:'error occured'})
		}
	}
	catch(err){
		return res.json({status:500,message:"Error occured",err:err})
	}
})
// end

function recommendedchecking(searchresult,resultfeedsId){
	resultfeedsId.forEach((item) => {
	  var array1Obj = searchresult.find(({_id}) => ObjectID(item._id).equals(ObjectID(_id)));
	  if(array1Obj) {
	    array1Obj.isrecommended = true;
	  }
	})
	 return searchresult;
}


function bookmarkedchecking(feedrecommended,resultbookmarked){
	resultbookmarked.forEach((item) => {
		  var array1Obj = feedrecommended.find(({_id}) => ObjectID(item._id).equals(ObjectID(_id)));
		  if(array1Obj) {
		    array1Obj.isbookmarked = true;
		  }
	})
	 return feedrecommended;
}

function newsArticleSimplified(feeds){
	var newfeeds = feeds.map(function(item) {
	  var obj = item._source;
	  for (var o in item) {
	    if (o != "_source") obj[o] = item[o];
	  }
	  return obj;
	})
	return newfeeds;
}

function recommededByUser(searchresult,recommeded){
	recommeded.forEach((item)=>{
		 var array1Obj = searchresult.find(({_id}) => ObjectID(item._id).equals(ObjectID(_id)));
		  if(array1Obj) {
		    array1Obj._source.isrecommended = true;
		  }
	})
	return searchresult;
}

function bookmarkschecking(recommendedresult,bookmarkedId){
	bookmarkedId.forEach((item)=>{
		 var array1Obj = recommendedresult.find(({_id}) => ObjectID(item._id).equals(ObjectID(_id)));
		  if(array1Obj) {
		    array1Obj._source.isbookmarked = true;
		  }
	})
	return recommendedresult;
}


function sortResultsBydate(result){
	var sortedResult = result.sort(function(a,b){
  		return new Date(b._source.createdAt) - new Date(a._source.createdAt);
	});
	return sortedResult;
}
exports.feedsByTopicMatchId = async(function(req, res, next) {
	console.log("req.body",req.params.id);
	const fetchFeeds = await (feedService.feedByTopicId(req.params.id));
	console.log("data",fetchFeeds);
    if (fetchFeeds) {
        res.json({ status: 200, message: "Success", result: fetchFeeds });
    } else {
        res.json({ status: 500, message: "Failure" });
    }
})

