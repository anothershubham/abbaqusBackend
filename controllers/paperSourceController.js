const async = require('asyncawait/async');
const await = require('asyncawait/await');
const xlsToJson = require("xls-to-json");
const paperSourceService = require('../services/paperSourceService')

exports.excelUploadPaperSource=async (function(req,res){
	const uploadExcel = req.files.excel;

		if(uploadExcel !== null || uploadExcel !== undefined){

			    xlsToJson({
                  input: uploadExcel.path,
                  output: null,
                }, function(err, paperSourceUrls) {
                    
                    if(err) {

                      return res.json({ status_code: 500, status: 'failure', message: 'Internal Server Error.', Error: err });

                    } else {

                    	if(paperSourceUrls[0].url === ""){

                    		return res.json({status:400,message:'No Paper urls to update'});

                    	}else{

                    		// clear all urls before adding new
                    		paperSourceService.clearSourceUrls();

	                        paperSourceUrls.forEach(function(source) {
	                        	
	                            if(source.url !== "" && source.type !== ""){

	                            	
	                            	paperSourceService.insertSourceUrl(source.url, source.type, source.name,source.image,source.website);	
	                            
	                            }
	                            
	                        });

	                        res.json({staus:200,message: 'Paper source urls updated successfully'});

                    	}

                    }
                });            

		}	
		else{

			return res.json({status:500,message:'Error occured while updating feed source'});

		}
});