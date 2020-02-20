// get the packages we need ============
// =======================
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var cors = require('cors');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
var config = require('./config'); // get our config file
var path = require('path');

// use body parser so we can get info from POST and/or URL parameters
app.use(cors());
app.use(bodyParser.json({ limit: "50mb", strict: false }))
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, pramaterLimit: 50000 }))
app.use(morgan('dev'));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


app.set('views', path.join(__dirname, 'views'), { maxAge: 31557600 });
app.set('view engine', 'jade');



// connect app to database
mongoose.connect(config.dbUrl);


var swaggerUi = require('swagger-ui-express'),
    swaggerDocument = require('./swagger.json');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// app.use('/api/v1', app);

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log('database connected');

});



//Load user routes
var users = require('./routes/user');
var feeds = require('./routes/feeds');
var main = require('./routes/main');
var topics = require('./routes/subtopic');
var paperUpload = require('./routes/paperUpload');
var questionUpload = require('./routes/questionUpload');
var follow = require('./routes/follow');
//var answer = require('./routes/answer');
var feedSource = require('./routes/feedSource');
var citation = require('./routes/citation');
var notification = require('./routes/notification');
var bookmark = require('./routes/bookmark');
var admin = require('./routes/admin');
var viewsdownloads = require('./routes/viewsdownloads');

app.use('/user', users);
app.use('/', main);
app.use('/feeds', feeds);
app.use('/topics', topics);
app.use('/paperUpload', paperUpload);
app.use('/questionUpload', questionUpload);
app.use('/follow', follow);
app.use('/admin', admin);
//app.use('/answer',answer);
app.use('/notification', notification)
app.use('/feedSource', feedSource);
app.use('/citation', citation);
app.use('/bookmark', bookmark);
app.use('/viewsdownloads', viewsdownloads);
app.use(morgan('combined'))

if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);

    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    //Check if work id is died
    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
    });

} else {
    // This is Workers can share any TCP connection
    // It will be initialized using express
    console.log(`Worker ${process.pid} started`);

    app.get('/cluster', (req, res) => {
        let worker = cluster.worker.id;
        res.send(`Running on worker with id ==> ${worker}`);
    });



}
var server = app.listen(3000, function() {
    var host = server.address().address
    var port = server.address().port
    console.log("Example app listening at http://", host, port)
})