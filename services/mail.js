const config = require('../config');
var ses = require('node-ses')
client = ses.createClient({ key:config.AmazonSESKeyID, secret:config.AmazonSessecretKey });

async function sendMail(msg, callback) {
    client.sendEmail(msg, function (error, data, res) {
        if (error != null) {
            // console.log('error', error);
            callback(error);
        }
        else {
            callback(null, data);
        }
    });
}

module.exports = {
    sendMail
}