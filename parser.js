/**
 * Function that handles the emoji parsing. Takes a string that represents a
 * tweet and either returns false (no valid emoji combinations or emoji at all)
 * or an object representing the scrubbed tweet text and combinations to 
 * classify with.
 */

'use strict';

var _ = require('lodash');

//Common noise that is in the raw tweet text
var noise = [
    'RT', //present when retweeting
    /@[\S]*(:|\b)/g, //usernames (might be too broad),
    /(http:\/\/|https:\/\/)[\S]*\b/g, //links
    /#[\S]*\b/g //hashtags
];

var parseEmoji = function(text){
    //Match any emoji/grouping of emoji
    var emojis = text.match(/(\ud83c[\udf00-\udfff]+|\ud83d[\udc00-\ude4f]+|\ud83d[\ude80-\udeff]+|\u2702+|\u2705+|[\u2708-\u270f]+|\u2712+|\u2714+|\u2716+|\u2728+|\u2733+|\u2734+|\u2744+|\u2747+|\u274c+|\u274e+|[\u2753-\u2775]+|\u2764+|[\u2795-\u2797]+|\u27A1+|\u27b0+)+/g);

    //If no emojis were found, exit
    if (!emojis){
        return false;
    }

    //Remove all emoji from the text for the classifier
    emojis.map(function(emoji){
        text = text.replace(emoji, '');
    });

    //Remove all designtated noise substrings
    noise.map(function(filter){
        text = text.replace(filter, '');
    });

    //Remove all duplicate emojis
    emojis = _.uniq(emojis);

    //Test all emoji to see if they are viable combos to classify with
    var viableCombos = [];
    emojis.map(function(emoji){
        //split combo into individual tokens, 😜👙🌴 -> 😜,👙,🌴
        var tokens = emoji.match(/(\ud83c[\udf00-\udfff]+|\ud83d[\udc00-\ude4f]+|\ud83d[\ude80-\udeff]+|\u2702+|\u2705+|[\u2708-\u270f]+|\u2712+|\u2714+|\u2716+|\u2728+|\u2733+|\u2734+|\u2744+|\u2747+|\u274c+|\u274e+|[\u2753-\u2775]+|\u2764+|[\u2795-\u2797]+|\u27A1+|\u27b0+){1}/g)
            , comboLength = tokens.length
            ;
        //If the emoji is a combo and does not start with adjacent emoji (no 😂😂s allowed)
        if (comboLength >= 2 && tokens[0] != tokens[1] && tokens[1].codePointAt(0)){
            //eliminate skintone modifiers like 🏻 on single emoji, which masquerades as a combo
            if (comboLength == 2 && tokens[1].codePointAt(0) <= 127999 && tokens[1].codePointAt(0) >= 127995){
                return;
            }
            viableCombos.push(emoji);
        }
    });

    //If there are no viable combos, exit
    if (!viableCombos.length){
        return false;
    }

    return {
        text: text,
        emojis: viableCombos 
    };
};

module.exports = parseEmoji;