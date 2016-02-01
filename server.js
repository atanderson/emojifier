/**
 * Creates express instance and socket. Listens to the redis channel and
 * classifies scrubbed tweets with parsed emojiif appropriate.
 */

'use strict';

var Redis = require('ioredis')
    , natural = require('natural')
    , express = require('express')
    , parser = require('./parser.js')
    , redis = new Redis()
    , saver = new Redis()
    , app = express()
    , http = require('http').Server(app)
    , io = require('socket.io')(http)
    , fs = require('fs')
    , classifier
    ;

//Express server and socket
app.use(express.static(__dirname + '/frontend/build'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/frontend/build/index.html');
});

http.listen(8080, function(){
    console.log('listening on *:8080');
});

//Stream of all tweets, published to redis channel
redis.subscribe('tweets');

//See if classifier-backup.json exists, if so load it, if not create a new classifier
fs.access('./classifier-backup.json', fs.F_OK, function(err){
    if (!err){
        console.log('Loading stored classifier');
        classifier = natural.BayesClassifier.restore(require('./classifier-backup.json'));
    } else {
        console.log('New classifier created');
        classifier = new natural.BayesClassifier();
    }
});

//Socket and a few events
io.on('connection', function(socket){
    //Classify emitted string and round trip it back to frontend
    socket.on('request-results', function(testString){
        io.emit('results', classifier.getClassifications(testString).slice(0, 6));
    });
    //Error handler
    socket.on('error', function(err){
        console.log(err);
    });
});

redis.on('message', function(channel, tweetText){
    //Prep the tweet for the classifier. Returns false if not viable
    var parsedTweet = parser(tweetText);
    if (parsedTweet){
        //For each viable emoji
        parsedTweet.emojis.map(function(emoji){
            saver.zincrby('emojis', 1, emoji);
            //Used to see if the combo being added to classifier is new
            var currentTotal = classifier.classifier.totalExamples;
            saver.zscore('emojis', emoji, function(err, response){
                //If at least 5 instances of that combo are logged, classify
                if (response >= 5){
                    classifier.addDocument(tweetText, emoji);
                    classifier.train();
                    //Used the combo is new, update ticker
                    if (currentTotal < classifier.classifier.totalExamples) {
                        io.emit('tickerupdate', classifier.classifier.totalExamples);
                    }
                }
            });
        });
    }
});

//Save the classifier when the server is shut down
var dumpClassifier = function(event){
    classifier.save('./classifier-backup.json', function(err, classifier){
        if (err){
            console.log(err);
        }
        if (classifier){
            console.log('\nsaving classifier in ./classifier-backup.json...', event);
        } else {
            console.log('no classifier to save');
        }
        process.exit(); 
    });
};

//Overwrite the default sigint behavior. I'm not sure why this has to be specified
process.on('SIGINT', function(){
    //
});

process.on('SIGTERM', function(){
    dumpClassifier('SIGTERM');
});

process.on('uncaughtException', function(){
    dumpClassifier('uncaughtException');
});