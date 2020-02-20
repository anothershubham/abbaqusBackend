const FeedSource = require('../models/feedSource');
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const xlsToJson = require("xls-to-json");
const feedSourceService = require('../services/feedSourceService')

exports.excelUploadFeedsSource=async (function(req,res){

	const uploadExcel = req.files.excel;

		if(uploadExcel !== null || uploadExcel !== undefined){

			    xlsToJson({
                  input: uploadExcel.path,
                  output: null,
                }, function(err, feedSourceUrls) {
                    
                    if(err) {

                      return res.json({ status_code: 500, status: 'failure', message: 'Internal Server Error.', Error: err });

                    } else {

                    	if(feedSourceUrls[0].url === ""){

                    		return res.json({status:400,message:'No feed urls to update'});

                    	}else{

                    		// clear all urls before adding new
                    		feedSourceService.clearSourceUrls();

	                        feedSourceUrls.forEach(function(source) {
	                        	
	                            if(source.url !== "" && source.type !== ""){

	                            	
	                            	feedSourceService.insertSourceUrl(source.url, source.type, source.name,source.image,source.website);	
	                            
	                            }
	                            
	                        });

	                        res.json({staus:200,message: 'Feed source urls updated successfully'});

                    	}

                    }
                });            

		}	
		else{

			return res.json({status:500,message:'Error occured while updating feed source'});

		}
});