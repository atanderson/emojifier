/**
 * Connects to twitter's streaming api and publishes tweets to the redis channel.
 */

'use strict';

var request = require('request')
    , Redis = require('ioredis')
    , redis = new Redis()
    , crypto = require('crypto')
    , cryptoJS = require('crypto-js')
    , secrets = require('./secrets')
    ;

//Seconds since unix epoch
var timeStamp = Math.floor(new Date().getTime() / 1000);

//32 random pieces of 32bit data turned into base 64, no non-word characters
var nonce = crypto.randomBytes(32).toString('base64').replace(/\W/g, 0).slice(0, 32);

//Used for hash generation
var signingKey = encodeURIComponent(secrets.consumerSecret) + '&' + encodeURIComponent(secrets.tokenSecret);

//Used for hash generation
var signatureBase = 'GET&https%3A%2F%2Fstream.twitter.com%2F1.1%2Fstatuses%2Fsample.json&language%3Den' +
                    '%26oauth_consumer_key%3D' + secrets.consumerKey +
                    '%26oauth_nonce%3D' + nonce + 
                    '%26oauth_signature_method%3DHMAC-SHA1' + 
                    '%26oauth_timestamp%3D' + timeStamp + 
                    '%26oauth_token%3D' + secrets.token + 
                    '%26oauth_version%3D1.0'
                    ;

//Create HmacSHA1 using key and base, turn into base64 string and uri encode
var signature = encodeURIComponent(cryptoJS.enc.Base64.stringify(cryptoJS.HmacSHA1(signatureBase, signingKey)));

//Used to generate request heder
var auth = {
    oauth_consumer_key: secrets.consumerKey,
    oauth_nonce: nonce,
    oauth_signature: signature,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timeStamp,
    oauth_token: secrets.token,
    oauth_version: '1.0'
};

//Take the above object and squish it together for the request header
var getAuthString = function(){
    var output = '';
    for (var prop in auth){
        if (auth.hasOwnProperty(prop)){
            output += prop + '="' + auth[prop] + '", ';
        }
    }
    return output.slice(0, -2); //remove trailing characters
};

//Construct stream options
var options = {
    url: 'https://stream.twitter.com/1.1/statuses/sample.json?language=en',
    headers: {
        Authorization: 'OAuth ' + getAuthString(),
    }
};

//Start the stream with twitter's sample data
var stream = request(options);

//Empty buffer to build string upon
var buffer = '';

stream.on('response', function(response){   
    response.on('data', function(chunk){
        //Start building tweet onto buffer
        buffer += chunk.toString('utf8');
        //Designated 'end of tweet' string
        var endpoint = buffer.indexOf('\r\n');
        //If we are at the end of a tweet
        if(endpoint > -1){
            //Extract the tweet (cuts off anything after the 'end of tweet')
            var slice = buffer.slice(0, endpoint);
            //On slower streams twitter will send empty chunks for keep-alive
            if (slice.length > 0){
                var tweet = JSON.parse(slice);
                //used to make sure stream is working
                //console.log(tweet.text || '');
                //If the tweet is an actual tweet and not a status change, publish
                if (tweet.id_str){
                    redis.publish('tweets', tweet.text);                
                }
            }
            //Begin the buffer with anything after 'end of tweet' (2 ch long)
            buffer = buffer.slice(endpoint + 2);
        } 
    });
});
