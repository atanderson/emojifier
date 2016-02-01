require('../tags/results-callout.tag');
require('../tags/results-table.tag');
require('../tags/ticker.tag');

var $ = require('jquery')
    , io = require('socket.io-client')
    , riot = require('riot')
    , socket = io.connect('http://localhost:8080')
    ;

socket.on('message', function(message){
    console.log(message);
});

socket.on('results', function(results){
    riot.mount('results-table', {
        results: results
    });
});

socket.on('tickerupdate', function(total){
    riot.mount('ticker', {
        total: total
    });
});

$('form').on('submit', function(e){
    var input = $('#string')
        , inputVal = input.val()
        ;
    if (inputVal != ''){
        riot.mount('results-callout', {
            message: inputVal
        });
        socket.emit('request-results', inputVal);
        input.val('');
    }
    return false;
});

window.showClassifier = function(){
    socket.emit('log');
    return false;
}