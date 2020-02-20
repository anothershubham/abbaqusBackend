const fs = require('fs');
var exports = module.exports = {};
const config = require('../config');

exports.uploadToS3 = function (file) {
    return new Promise(function(resolve, reject) {
        let this_uploadFile = file;
        let originalFilename = Date.now() + '' + file.originalFilename;
        let userFolder = 'elasticbeanstalk-us-east-2-981790547314';
        let AWS = require('aws-sdk');
        let s3Client = new AWS.S3({
            signatureVersion: 'v2'
        });
    
        AWS.config.update({ 
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
            region : 'us-east-2'
        });
    
        let bucket = new AWS.S3({
            params: {
                Bucket: userFolder
            }
        });
    
        let contentToPost = {
            Key: originalFilename, 
            Body: fs.createReadStream(this_uploadFile.path), 
            ContentEncoding: 'base64',
            ContentType: 'multipart/form-data',
            ServerSideEncryption: 'AES256',
            ACL: 'public-read',
        };

    
        bucket.upload(contentToPost, function (error, data) {
            //console.log("data:", data);
            if (error) {
                reject(error)
            }
            else {
                resolve(data.Location)
            }  
        })
    })
};